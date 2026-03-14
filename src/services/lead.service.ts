// src/services/lead.service.ts

import { AppDataSource } from "../config/database";
import { Lead } from "../entities/Lead";
import { Document } from "../entities/Document";
import { successWithData } from "../config/ApiResponse";

// Numbers that bypass the +1 prefix rule (test / non-US numbers).
const PHONE_EXEMPT = new Set([
  "+919348558063",
  "+919662080370",
  "+918490008633",
  "+447353303364",
]);

/**
 * Normalises an incoming phone number:
 *  - Strips spaces, dashes, parentheses
 *  - If the number is in the exempt list → returned as-is
 *  - If it already starts with +1          → returned as-is
 *  - Otherwise                             → +1 is prepended
 *    (any leading + is removed first so we never get ++1...)
 */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (PHONE_EXEMPT.has(cleaned)) return cleaned;
  if (cleaned === "9662080370") return "+919662080370";
  if (cleaned.startsWith("+1"))  return cleaned;
  // Strip a stray leading + before adding +1
  return "+1" + cleaned.replace(/^\+/, "");
}

export class LeadService {
  private leadRepository = AppDataSource.getRepository(Lead);

async createLead(data: {
  fullName: string;
  phone: string;
  email?: string;
  fundingAmount?: number;
  promoCode?: string;
}) {
  const phone = normalizePhone(data.phone);

  const leadData: Partial<Lead> = {
    fullName: data.fullName,
    phone,
    email: data.email,
    fundingAmount: data.fundingAmount,
    promoCode: data.promoCode,
    source: "website",
    status: "need_to_call",
  };

  const lead = this.leadRepository.create(leadData);
  const savedLead = await this.leadRepository.save(lead);

  return savedLead;
}

  async getAllLeads() {
    return await this.leadRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async deleteLead(id: string) {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) throw new Error("Lead not found");
    await this.leadRepository.remove(lead);
    return { deleted: true, id };
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
      homeAddress: lead.homeAddress || null,
      homeNumber: lead.homeNumber || null,
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

    // Qualified = positive or neutral sentiment (skip negative)
    // + all required business/owner fields must be filled
    const qualifiedCondition = `
      lead.sentiment IN ('positive', 'neutral')
      AND lead.businessType     IS NOT NULL AND lead.businessType     != ''
      AND lead.ownershipPercentage IS NOT NULL AND lead.ownershipPercentage != ''
      AND lead.ownerDob         IS NOT NULL AND lead.ownerDob         != ''
      AND lead.businessEin      IS NOT NULL AND lead.businessEin      != ''
      AND lead.ownerSsnLast4    IS NOT NULL AND lead.ownerSsnLast4    != ''
      AND lead.homeAddress      IS NOT NULL AND lead.homeAddress      != ''
      AND lead.businessAddress  IS NOT NULL AND lead.businessAddress  != ''
    `;

    const [leads, totalItems] = await this.leadRepository
      .createQueryBuilder("lead")
      .leftJoinAndSelect("lead.documents", "documents")
      .where(qualifiedCondition)
      .orderBy("lead.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / pageSize);
    const totalLeads = totalItems;

    const fundsResult = await this.leadRepository
      .createQueryBuilder("lead")
      .select("SUM(lead.fundingAmount)", "total")
      .where(qualifiedCondition)
      .getRawOne();
    const totalFundsRequested = Number(fundsResult?.total) || 0;

    const withDocuments = await documentRepository
      .createQueryBuilder("doc")
      .innerJoin("doc.lead", "lead")
      .select("COUNT(DISTINCT doc.leadId)", "count")
      .where(qualifiedCondition)
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
      homeAddress: lead.homeAddress || null,
      homeNumber: lead.homeNumber || null,
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