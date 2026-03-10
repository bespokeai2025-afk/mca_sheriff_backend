// src/services/lead.service.ts

import { AppDataSource } from "../config/database";
import { Lead } from "../entities/Lead";
import { Document } from "../entities/Document";
import { successWithData } from "../config/ApiResponse";
import { sendNewLeadNotification } from "../config/sendgridMailer";

export class LeadService {
  private leadRepository = AppDataSource.getRepository(Lead);

async createLead(data: {
  fullName: string;
  phone: string;
  email?: string;
  fundingAmount?: number;
  promoCode?: string;
}) {
  const existingLead = await this.leadRepository.findOne({
    where: { phone: data.phone },
  });

  if (existingLead) {
    throw new Error("Lead with this phone number already exists");
  }

  const leadData: Partial<Lead> = {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    fundingAmount: data.fundingAmount,
    promoCode: data.promoCode,
    source: "website",
    status: "need_to_call",
  };

  const lead = this.leadRepository.create(leadData);
  const savedLead = await this.leadRepository.save(lead);

  // Fire email notification to admin
  sendNewLeadNotification({
    fullName: savedLead.fullName,
    phone: savedLead.phone,
    email: savedLead.email,
    fundingAmount: savedLead.fundingAmount ? Number(savedLead.fundingAmount) : undefined,
    promoCode: savedLead.promoCode,
    createdAt: savedLead.createdAt,
  });

  return savedLead;
}

  async getAllLeads() {
    return await this.leadRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async getLeadById(id: string) {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: ["documents", "calls"],
    });

    if (!lead) throw new Error("Lead not found");

    return {
      id: lead.id,
      // Personal
      name: lead.fullName,
      fullName: lead.fullName,
      mobile: lead.phone,
      phone: lead.phone,
      email: lead.email,
      // Business
      companyName: lead.companyName,
      businessName: lead.companyName || lead.businessType,
      businessType: lead.businessType,
      businessAddress: lead.businessAddress,
      businessEin: lead.businessEin,
      stateName: lead.stateName,
      businessStartDate: lead.businessStartDate,
      // Owner
      ownerDob: lead.ownerDob,
      ownerSsnLast4: lead.ownerSsnLast4,
      ownershipPercentage: lead.ownershipPercentage,
      // Financial
      fundingAmount: lead.fundingAmount ? Number(lead.fundingAmount) : null,
      monthlyRevenue: lead.monthlyRevenue ? Number(lead.monthlyRevenue) : null,
      promoCode: lead.promoCode,
      // Qualification
      callOutcome: lead.callOutcome,
      bankStatementsUploaded: lead.bankStatementsUploaded,
      bankStatementsStatus: lead.bankStatementsStatus,
      sentToUnderwriting: lead.sentToUnderwriting,
      callbackRequested: lead.callbackRequested,
      missingInformation: lead.missingInformation,
      // Lead info
      source: lead.source,
      status: lead.status,
      sentiment: lead.sentiment,
      attemptCount: lead.attemptCount,
      lastCalledAt: lead.lastCalledAt,
      statementStatus: lead.statementStatus,
      // Metadata
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      // Documents (bank statements)
      statements: (lead.documents || []).map((doc, i) => ({
        id: doc.id,
        month: doc.fileName || `Statement ${i + 1}`,
        url: doc.s3Key,
        documentType: doc.documentType,
        uploadedVia: doc.uploadedVia,
        uploadedAt: doc.createdAt,
      })),
      // Calls summary
      calls: (lead.calls || []).map((call: any) => ({
        id: call.id,
        status: call.status,
        outcome: call.outcome,
        duration: call.duration,
        createdAt: call.createdAt,
      })),
    };
  }

  async getLeadsDashboard(page: number = 1, pageSize: number = 10) {
    const documentRepository = AppDataSource.getRepository(Document);

    // Paginated leads with documents
    const [leads, totalItems] = await this.leadRepository.findAndCount({
      relations: ["documents"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    // Stats — run across full table, not just current page
    const totalLeads = totalItems;

    const fundsResult = await this.leadRepository
      .createQueryBuilder("lead")
      .select("SUM(lead.fundingAmount)", "total")
      .getRawOne();
    const totalFundsRequested = Number(fundsResult?.total) || 0;

    const withDocuments = await documentRepository
      .createQueryBuilder("doc")
      .select("COUNT(DISTINCT doc.leadId)", "count")
      .getRawOne();
    const withDocsCount = Number(withDocuments?.count) || 0;
    const withoutDocsCount = totalLeads - withDocsCount;

    // Format leads for frontend
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      name: lead.fullName || "—",
      mobile: lead.phone || "—",
      email: lead.email || null,
      businessName: lead.businessType || lead.companyName || "—",
      fundingAmount: lead.fundingAmount ? Number(lead.fundingAmount) : null,
      status: lead.status,
      callOutcome: lead.callOutcome || null,
      sentiment: lead.sentiment || null,
      attemptCount: lead.attemptCount,
      lastCalledAt: lead.lastCalledAt,
      createdAt: lead.createdAt,
      statements: (lead.documents || []).map((doc, i) => ({
        month: doc.fileName || `Statement ${i + 1}`,
        url: doc.s3Key,
        uploadedAt: doc.createdAt,
      })),
    }));

    return successWithData(
      "Leads fetched successfully",
      {
        stats: {
          totalLeads,
          totalFundsRequested,
          withDocuments: withDocsCount,
          withoutDocuments: withoutDocsCount,
        },
        leads: formattedLeads,
      },
      { totalItems, totalPages, currentPage: page, pageSize }
    );
  }
}