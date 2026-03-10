import { AppDataSource } from "../config/database";
import { Document } from "../entities/Document";
import { Lead } from "../entities/Lead";
import { Call } from "../entities/Call";
import { successWithData, errorWithoutData } from "../config/ApiResponse";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DocumentService {
  private documentRepository = AppDataSource.getRepository(Document);
  private leadRepository     = AppDataSource.getRepository(Lead);
  private callRepository     = AppDataSource.getRepository(Call);

  // Resolve a leadId that might actually be a Retell call_id
  private async resolveLeadId(leadId: string): Promise<string | null> {
    if (UUID_REGEX.test(leadId)) return leadId;

    // Looks like a Retell call ID — look up the lead via the Call table
    const call = await this.callRepository.findOne({
      where: { retellCallId: leadId },
      relations: ["lead"],
    });

    return call?.lead?.id ?? null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD BANK STATEMENTS
  // Saves up to 4 uploaded files into the Document table for a given lead.
  // month labels come from req.body.months (array) or individual month_0..3 fields
  // ─────────────────────────────────────────────────────────────────────────
  async uploadStatements(
    leadId: string,
    files: Express.MulterS3.File[],
    months: string[]
  ) {
    const resolvedId = await this.resolveLeadId(leadId);
    if (!resolvedId) return errorWithoutData("Invalid leadId — not a UUID or known call ID");

    const lead = await this.leadRepository.findOneBy({ id: resolvedId });
    if (!lead) return errorWithoutData("Lead not found");

    if (!files || files.length === 0) return errorWithoutData("No files uploaded");

    const saved: Document[] = [];

    for (let i = 0; i < files.length; i++) {
      const file       = files[i] as any;
      const monthLabel = (months[i] || `Statement ${i + 1}`).trim();
      const s3Url      = file.location || file.path || file.key || "";

      const doc = this.documentRepository.create({
        lead,
        documentType: "bank_statement",
        fileName:     monthLabel,   // used as the month label in the UI
        s3Key:        s3Url,        // full S3 URL — directly linkable
        uploadedVia:  "portal",
      });

      saved.push(await this.documentRepository.save(doc));
    }

    // Mark lead statements as uploaded
    lead.bankStatementsUploaded = true;
    lead.statementStatus        = "uploaded";
    await this.leadRepository.save(lead);

    return successWithData("Bank statements uploaded successfully", {
      leadId: resolvedId,
      uploaded: saved.map((d) => ({
        id:         d.id,
        month:      d.fileName,
        url:        d.s3Key,
        uploadedAt: d.createdAt,
      })),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET STATEMENTS FOR A LEAD
  // ─────────────────────────────────────────────────────────────────────────
  async getStatements(leadId: string) {
    const resolvedId = await this.resolveLeadId(leadId);
    if (!resolvedId) return errorWithoutData("Invalid leadId — not a UUID or known call ID");
    leadId = resolvedId;

    const lead = await this.leadRepository.findOneBy({ id: leadId });
    if (!lead) return errorWithoutData("Lead not found");

    const docs = await this.documentRepository.find({
      where: { lead: { id: leadId }, documentType: "bank_statement" },
      order: { createdAt: "ASC" },
    });

    return successWithData("Statements fetched successfully", {
      leadId,
      leadName: lead.fullName || "—",
      statements: docs.map((d) => ({
        id:         d.id,
        month:      d.fileName,
        url:        d.s3Key,
        uploadedAt: d.createdAt,
      })),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE A SINGLE STATEMENT
  // ─────────────────────────────────────────────────────────────────────────
  async deleteStatement(documentId: string, leadId: string) {
    const resolvedId = await this.resolveLeadId(leadId);
    if (!resolvedId) return errorWithoutData("Invalid leadId — not a UUID or known call ID");
    leadId = resolvedId;

    const doc = await this.documentRepository.findOne({
      where: { id: documentId, lead: { id: leadId } },
    });

    if (!doc) return errorWithoutData("Statement not found");

    await this.documentRepository.remove(doc);

    // If no more statements remain, reset lead flag
    const remaining = await this.documentRepository.count({
      where: { lead: { id: leadId }, documentType: "bank_statement" },
    });

    if (remaining === 0) {
      await this.leadRepository.update(leadId, {
        bankStatementsUploaded: false,
        statementStatus: "pending",
      });
    }

    return successWithData("Statement deleted successfully", { documentId });
  }
}
