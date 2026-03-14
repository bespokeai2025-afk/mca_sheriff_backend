import axios from "axios";
import { AppDataSource } from "../config/database";
import { Lead } from "../entities/Lead";
import { Call } from "../entities/Call";
import { Document } from "../entities/Document";
import {
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { sendCallCompletedNotification } from "../config/sendgridMailer";
import { normalizePhone } from "./lead.service";

// Hardcoded agent / caller details — set these in .env
const HARDCODED_AGENT_ID   = process.env.OUTBOUND_AGENT_ID   || "";
const HARDCODED_AGENT_NAME = process.env.OUTBOUND_AGENT_NAME || "MCA Sheriff Agent";
const HARDCODED_FROM_NUMBER = process.env.OUTBOUND_FROM_NUMBER || process.env.RETELL_FROM_NUMBER || "";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class OutboundCallService {
  private leadRepository   = AppDataSource.getRepository(Lead);
  private callRepository   = AppDataSource.getRepository(Call);
  private documentRepository = AppDataSource.getRepository(Document);

  // Prevents overlapping cron executions when cron runs every 3 seconds
  private static cronRunning = false;

  // ─────────────────────────────────────────────────────────────────────────
  // START BATCH CALLING
  // Called when admin clicks "Start Calling" button.
  // Loops through every lead that:
  //   1. Does NOT have status = "completed"
  //   2. Does NOT already have a completed outbound Call record
  // ─────────────────────────────────────────────────────────────────────────
async startBatchCalling() {
  const apiKey = process.env.API_KEY_RETELL;

  if (!apiKey) {
    return errorWithoutData("Missing API_KEY_RETELL in environment variables");
  }

  if (!HARDCODED_FROM_NUMBER) {
    return errorWithoutData("Missing OUTBOUND_FROM_NUMBER in environment variables");
  }

  if (!HARDCODED_AGENT_ID) {
    return errorWithoutData("Missing OUTBOUND_AGENT_ID in environment variables");
  }

  // Fetch all leads that have no completed outbound call
  const leadsToCall = await this.leadRepository
    .createQueryBuilder("lead")
    .leftJoin(
      "lead.calls",
      "completedCall",
      "completedCall.callType = 'outbound' AND completedCall.callStatus = 'completed'"
    )
    .where("lead.status != :completed", { completed: "completed" })
    .andWhere("lead.status != :doNotCall", { doNotCall: "do_not_call" })
    .andWhere("completedCall.id IS NULL")
    .getMany();

  if (!leadsToCall.length) {
    return successWithoutData("No leads available for outbound calling");
  }

  const initiated: any[] = [];
  const skipped: any[] = [];
  const failed: any[] = [];

  for (const lead of leadsToCall) {
    try {
      // Skip if already initiated
      const activeCall = await this.callRepository.findOne({
        where: {
          lead: { id: lead.id },
          callType: "outbound",
          callStatus: "initiated",
        },
      });

      if (activeCall) {
        skipped.push({ lead_id: lead.id, reason: "already initiated" });
        continue;
      }

      // Validate phone
      if (!lead.phone) {
        failed.push({ lead_id: lead.id, error: "Missing phone number" });
        continue;
      }

      // Normalize phone number
      const toNumber = lead.phone.startsWith("+")
        ? lead.phone
        : `+${lead.phone}`;

      // Extract first name safely
      const firstName = lead.fullName
        ? lead.fullName.trim().split(" ")[0]
        : "";

      // Format funding amount
      const formattedAmount = lead.fundingAmount
        ? `$${Number(lead.fundingAmount).toLocaleString()}`
        : "";

      // Prepare Retell payload
      const payload = {
        from_number: HARDCODED_FROM_NUMBER,
        to_number: toNumber,
        agent_id: HARDCODED_AGENT_ID,
        retell_llm_dynamic_variables: {
          First_name: firstName,
          phone_number: toNumber,
          email: lead.email || "",
          ammount_requested: formattedAmount,
        },
      };
     console.log("the paylolad is",payload);
      let retellResponse: any = null;

      try {
        const response = await axios.post(
          "https://api.retellai.com/v2/create-phone-call",
          payload,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        retellResponse = response.data;

        console.log(
          `Retell call created for lead ${lead.id}:`,
          retellResponse?.call_id
        );
      } catch (error: any) {
        console.error(
          `Retell API error for lead ${lead.id}:`,
          error.response?.data || error.message
        );

        failed.push({
          lead_id: lead.id,
          error: error.response?.data || error.message,
        });

        continue;
      }

      // Save call record
      const call = this.callRepository.create({
        lead,
        callType: "outbound",
        callStatus: "initiated",
        retellCallId: retellResponse?.call_id || null,
        fromNumber: HARDCODED_FROM_NUMBER,
        toNumber,
        agentId: HARDCODED_AGENT_ID,
        agentName: HARDCODED_AGENT_NAME,
        startedAt: new Date(),
      });

      await this.callRepository.save(call);

      // Update lead
      lead.status = "calling";
      lead.attemptCount = (lead.attemptCount || 0) + 1;
      lead.lastCalledAt = new Date();

      await this.leadRepository.save(lead);

      initiated.push({
        lead_id: lead.id,
        call_id: retellResponse?.call_id,
      });

      // Small delay between calls (avoid API throttling)
      await new Promise((resolve) => setTimeout(resolve, 500));

    } catch (outerError: any) {
      console.error(
        `Unexpected error for lead ${lead.id}:`,
        outerError.message
      );

      failed.push({
        lead_id: lead.id,
        error: outerError.message,
      });
    }
  }

  return successWithData("Batch calling completed", {
    totalLeads: leadsToCall.length,
    initiated: initiated.length,
    skipped: skipped.length,
    failed: failed.length,
    details: { initiated, skipped, failed },
  });
}

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-CALL NEW LEADS (cron — runs every minute)
  // Finds leads created in the last 30 minutes that have never been called
  // and initiates an outbound call for each of them.
  // ─────────────────────────────────────────────────────────────────────────
  async callNewLeads(): Promise<void> {
    // Skip if a previous cron tick is still running (prevents duplicate calls at 3s interval)
    if (OutboundCallService.cronRunning) return;
    OutboundCallService.cronRunning = true;

    try {
      await this._callNewLeadsInternal();
    } finally {
      OutboundCallService.cronRunning = false;
    }
  }

  private async _callNewLeadsInternal(): Promise<void> {
    const apiKey = process.env.API_KEY_RETELL;
    if (!apiKey || !HARDCODED_FROM_NUMBER || !HARDCODED_AGENT_ID) return;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Leads added within the last 30 min that are safe to auto-call:
    //   1. status must still be "need_to_call" — excludes "calling" (manual or
    //      previous cron run), "completed", "not_interested", "do_not_call", etc.
    //   2. No outbound call record in ANY terminal/active status — second safety
    //      net in case lead.status was not updated (e.g. mid-flight crash).
    const newLeads = await this.leadRepository
      .createQueryBuilder("lead")
      .leftJoin(
        "lead.calls",
        "existingCall",
        "existingCall.callType = 'outbound' AND existingCall.callStatus IN ('initiated','completed','no_answer','busy','failed')"
      )
      .where("lead.createdAt >= :since", { since: thirtyMinutesAgo })
      .andWhere("lead.status = :status", { status: "need_to_call" })
      .andWhere("existingCall.id IS NULL")
      .getMany();

    if (!newLeads.length) return;

    console.log(`[AutoCall] Found ${newLeads.length} new lead(s) to call.`);

    for (const lead of newLeads) {
      try {
        if (!lead.phone) continue;

        const toNumber = lead.phone.startsWith("+") ? lead.phone : `+${lead.phone}`;
        const firstName = lead.fullName ? lead.fullName.trim().split(" ")[0] : "";
        const formattedAmount = lead.fundingAmount
          ? `$${Number(lead.fundingAmount).toLocaleString()}`
          : "";

        const payload = {
          from_number: HARDCODED_FROM_NUMBER,
          to_number: toNumber,
          agent_id: HARDCODED_AGENT_ID,
          retell_llm_dynamic_variables: {
            First_name: firstName,
            phone_number: toNumber,
            email: lead.email || "",
            ammount_requested: formattedAmount,
          },
        };

        // Mark as "calling" in DB BEFORE the API call so concurrent cron ticks skip this lead
        lead.status = "calling";
        lead.attemptCount = (lead.attemptCount || 0) + 1;
        lead.lastCalledAt = new Date();
        await this.leadRepository.save(lead);

        let retellResponse: any = null;
        try {
          const response = await axios.post(
            "https://api.retellai.com/v2/create-phone-call",
            payload,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          );
          retellResponse = response.data;
          console.log(`[AutoCall] Call created for lead ${lead.id}:`, retellResponse?.call_id);
        } catch (err: any) {
          // Revert status so it can be retried on next cron tick
          lead.status = "need_to_call";
          await this.leadRepository.save(lead);
          console.error(`[AutoCall] Retell API error for lead ${lead.id}:`, err.response?.data || err.message);
          continue;
        }

        const call = this.callRepository.create({
          lead,
          callType: "outbound",
          callStatus: "initiated",
          retellCallId: retellResponse?.call_id || null,
          fromNumber: HARDCODED_FROM_NUMBER,
          toNumber,
          agentId: HARDCODED_AGENT_ID,
          agentName: HARDCODED_AGENT_NAME,
          startedAt: new Date(),
        });
        await this.callRepository.save(call);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err: any) {
        console.error(`[AutoCall] Unexpected error for lead ${lead.id}:`, err.message);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET OUTBOUND CALLS LIST + STATS
  // Queries from Lead (so ALL leads appear, even uncalled ones).
  // Each lead shows its latest outbound Call record if one exists.
  // ─────────────────────────────────────────────────────────────────────────
  async getOutboundCallsWithStats(page: number = 1, pageSize: number = 10) {

    // ── Stats (across full Call table, not per-page) ──────────────────────
    const totalOutbound = await this.leadRepository.count();

    const completedCalls = await this.callRepository.count({
      where: { callType: "outbound", callStatus: "completed" },
    });

    const failedOrNoAnswer = await this.callRepository
      .createQueryBuilder("call")
      .where("call.callType = :type", { type: "outbound" })
      .andWhere("call.callStatus IN (:...statuses)", {
        statuses: ["failed", "no_answer", "busy"],
      })
      .getCount();

    const positiveSentiment = await this.callRepository.count({
      where: { callType: "outbound", sentiment: "positive" },
    });

    // ── Paginated leads with their latest outbound call ───────────────────
    const [leads, totalItems] = await this.leadRepository.findAndCount({
      relations: ["calls"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    const formattedCalls = leads.map((lead, index) => {
      // Pick the most recent outbound call for this lead (if any)
      const outboundCalls = (lead.calls || [])
        .filter((c) => c.callType === "outbound")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestCall = outboundCalls[0] || null;

      const durSec = latestCall?.durationSeconds || 0;
      const mins   = Math.floor(durSec / 60);
      const secs   = durSec % 60;
      const duration = durSec > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : "—";

      return {
        srNo:        (page - 1) * pageSize + index + 1,
        leadId:      lead.id,
        callId:      latestCall?.id || null,
        retellCallId: latestCall?.retellCallId || null,
        name:        lead.fullName || "—",
        contact:     lead.phone   || "—",
        lastCalledAt: lead.lastCalledAt || latestCall?.startedAt || null,
        callStatus:  latestCall?.callStatus || "not_called",
        duration,
        sentiment:   latestCall?.sentiment || lead.sentiment || null,
        recording:   latestCall?.recordingS3Key || null,
        attemptCount: lead.attemptCount || 0,
        leadStatus:  lead.status,
      };
    });

    return successWithData(
      "Outbound calls fetched successfully",
      {
        stats: {
          totalOutbound,
          completedCalls,
          failedOrNoAnswer,
          positiveSentiment,
        },
        calls: formattedCalls,
      },
      { totalItems, totalPages, currentPage: page, pageSize }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WEBHOOK — Retell sends call result here when the call ends
  // Updates callStatus on the Call record and lead.status if completed
  // ─────────────────────────────────────────────────────────────────────────
  async handleCallWebhook(rawBody: any) {
    try {
      const event: string        = rawBody?.event || "";
      const callData: any        = rawBody?.call  || {};
      const retellCallId: string = callData?.call_id || "";

      if (!retellCallId) {
        return errorWithoutData("Missing call_id in webhook payload");
      }

      const call = await this.callRepository.findOne({
        where: { retellCallId },
        relations: ["lead"],
      });

      if (!call) {
        // Not one of our tracked outbound calls — ignore silently
        return { result: true, statuscode: 200, message: "Call not tracked", data: null };
      }

      // Map Retell event/status → our callStatus
      const retellCallStatus: string    = callData?.call_status          || "";
      const disconnectionReason: string = callData?.disconnection_reason || "";

      let newStatus: Call["callStatus"] = call.callStatus;

      // Handle call_ended (immediate) and call_analyzed (post-analysis) events
      if (
        (event === "call_ended" || event === "call_analyzed") &&
        retellCallStatus === "ended"
      ) {
        newStatus = "completed";
      } else if (retellCallStatus === "not_connected" || disconnectionReason === "no_answer") {
        newStatus = "no_answer";
      } else if (disconnectionReason === "user_busy") {
        newStatus = "busy";
      } else if (event === "call_ended" || event === "call_analyzed") {
        newStatus = "failed";
      }

      const durationMs: number = callData?.duration_ms || 0;

      call.callStatus      = newStatus;
      call.endedAt         = new Date();
      call.durationSeconds = durationMs ? Math.floor(durationMs / 1000) : 0;
      call.durationMs      = durationMs;

      // Set completedAt timestamp when call reaches a terminal status
      if (
        newStatus === "completed" ||
        newStatus === "no_answer"  ||
        newStatus === "busy"       ||
        newStatus === "failed"
      ) {
        call.completedAt = new Date();
      }

      // Enrich from call_analyzed event (analysis data only comes with this event)
      call.transcript      = callData?.transcript    || call.transcript;
      call.callSummary     = callData?.call_summary  || call.callSummary;
      call.recordingS3Key  = callData?.recording_url || call.recordingS3Key;
      call.recordingMultiChannelUrl = callData?.recording_multi_channel_url || call.recordingMultiChannelUrl;
      call.publicLogUrl    = callData?.public_log_url || call.publicLogUrl;
      call.disconnectionReason = callData?.disconnection_reason || call.disconnectionReason;
      call.callSuccessful  = callData?.call_successful ?? call.callSuccessful;
      call.inVoicemail     = callData?.in_voicemail   ?? call.inVoicemail;
      call.callCostTotal   = callData?.call_cost_total ?? call.callCostTotal;
      call.callCostDurationSeconds = callData?.call_cost_duration_seconds ?? call.callCostDurationSeconds;
      call.lastNode        = callData?.last_node   || call.lastNode;
      call.callOutcome     = callData?.call_outcome || call.callOutcome;

      const rawSentiment: string = (callData?.user_sentiment || callData?.call_analysis?.user_sentiment || "").toLowerCase();
      if (rawSentiment) {
        call.sentiment = rawSentiment === "positive" || rawSentiment === "neutral" || rawSentiment === "negative"
          ? rawSentiment as any
          : call.sentiment;
      }

      await this.callRepository.save(call);

      // Sync lead status based on final call status
      if (newStatus === "completed" && call.lead) {
        call.lead.status = "completed";
        await this.leadRepository.save(call.lead);
      } else if (
        (newStatus === "no_answer" || newStatus === "failed" || newStatus === "busy") &&
        call.lead && call.lead.status === "calling"
      ) {
        call.lead.status = "not_connected";
        await this.leadRepository.save(call.lead);
      }

      return successWithData("Call webhook processed", call);
    } catch (error: any) {
      console.error("Error processing outbound call webhook:", error.message);
      return errorWithoutData("Failed to process call webhook");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE OUTBOUND CALL FROM N8N
  // n8n forwards the full Retell call_analyzed payload here after a call ends.
  // Finds or creates the lead, updates business info, upserts the call record.
  // ─────────────────────────────────────────────────────────────────────────
async saveOutboundCallFromN8n(payload: any) {
    try {
      // Support both flat payload and n8n-wrapped array payload
      const data = Array.isArray(payload) ? payload[0] : payload;

      const retellCallId: string = data?.call_id || "";
      const rawPhone: string =
        data?.phone_number ||
        data?.custom_analysis_data?.phone_number ||
        data?.to_number ||
        "";
      const phoneNumber: string = rawPhone ? normalizePhone(rawPhone) : "";

      if (!phoneNumber) return errorWithoutData("Missing phone_number in payload");
      if (!retellCallId) return errorWithoutData("Missing call_id in payload");

      // Check for existing call — upsert instead of skip
      const existingCall = await this.callRepository.findOne({
        where: { retellCallId },
        relations: ["lead"],
      });

      // ── Resolve lead (find or create) ───────────────────────────────────
      const analysis = data?.custom_analysis_data || {};

      const firstName: string = analysis.first_name || data?.first_name || "";
      const email: string     = analysis.email       || data?.email       || "";
      const stateName: string = analysis.state_name  || data?.state_name  || "";

      const amountRaw: string = analysis.amount_requested || data?.amount_requested || "";
      const fundingAmount: number | null = amountRaw
        ? parseFloat(String(amountRaw).replace(/[^0-9.]/g, "")) || null
        : null;

      let lead = existingCall?.lead
        || await this.leadRepository.findOne({ where: { phone: phoneNumber } });

      if (!lead) {
        lead = this.leadRepository.create({
          fullName: firstName,
          phone: phoneNumber,
          email,
          source: "outbound",
          status: "need_to_call",
        });
      } else {
        if (firstName && !lead.fullName) lead.fullName = firstName;
        if (email && !lead.email)       lead.email = email;
      }

      // ── Update lead with business info ───────────────────────────────────
      if (stateName)     lead.stateName     = stateName;
      if (fundingAmount) lead.fundingAmount = fundingAmount;

      const businessStartDate = analysis.business_start_date || data?.business_start_date || "";
      if (businessStartDate) lead.businessStartDate = businessStartDate;

      const businessType = analysis.business_type || data?.business_type || "";
      if (businessType) lead.businessType = businessType;

      const monthlyRevenueRaw = analysis.monthly_revenue || data?.monthly_revenue || "";
      const monthlyRevenue = parseFloat(String(monthlyRevenueRaw).replace(/[^0-9.]/g, "")) || null;
      if (monthlyRevenue) lead.monthlyRevenue = monthlyRevenue;

      const businessAddress = analysis.business_address || data?.business_address || "";
      if (businessAddress) lead.businessAddress = businessAddress;

      const businessEin = analysis.business_ein || data?.business_ein || "";
      if (businessEin) lead.businessEin = businessEin;

      const ownershipPercentage = String(analysis.ownership_percentage || data?.ownership_percentage || "");
      if (ownershipPercentage) lead.ownershipPercentage = ownershipPercentage;

      const ownerDob = analysis.owner_dob || data?.owner_dob || "";
      if (ownerDob) lead.ownerDob = ownerDob;

      const ownerSsnLast4 = analysis.owner_ssn_last4 || data?.owner_ssn_last4 || "";
      if (ownerSsnLast4) lead.ownerSsnLast4 = ownerSsnLast4;

      // ✅ ADDED — Home address
      const homeAddress = analysis.home_address || data?.home_address || "";
      if (homeAddress) lead.homeAddress = homeAddress;

        const homeNumber = analysis.home_number || data?.home_number || "";
      if (homeNumber) lead.homeNumber = homeNumber;

      const bankStatementsUploaded =
        analysis.bank_statements_uploaded ?? data?.bank_statements_uploaded ?? null;
      if (bankStatementsUploaded !== null) {
        lead.bankStatementsUploaded = bankStatementsUploaded;
        lead.statementStatus = bankStatementsUploaded ? "uploaded" : "pending";
      }

      const bankStatementsStatus = analysis.bank_statements_status || data?.bank_statements_status || "";
      if (bankStatementsStatus) lead.bankStatementsStatus = bankStatementsStatus;

      const sentToUnderwriting = analysis.sent_to_underwriting ?? null;
      if (sentToUnderwriting !== null) lead.sentToUnderwriting = sentToUnderwriting;

      lead.callbackRequested = analysis.callback_requested ?? data?.callback_requested ?? false;

      const missingInformation = analysis.missing_information || "";
      if (missingInformation) lead.missingInformation = missingInformation;

      const callOutcome = analysis.call_outcome || data?.call_outcome || "";
      if (callOutcome) lead.callOutcome = callOutcome;

      const rawSentiment = (data?.user_sentiment || "").toLowerCase();
      if (rawSentiment === "positive" || rawSentiment === "neutral" || rawSentiment === "negative") {
        lead.sentiment = rawSentiment as Lead["sentiment"];
      }

      // Map call outcome → lead status
      if (callOutcome === "qualified_complete") {
        lead.status = "completed";
      } else if (callOutcome === "not_qualified") {
        lead.status = "not_interested";
      } else if (callOutcome === "callback_requested") {
        lead.status = "need_to_call";
      }

      lead.attemptCount = (lead.attemptCount || 0) + 1;
      lead.lastCalledAt = new Date();

      // ── Resolve call status ──────────────────────────────────────────────
      const retellCallStatus    = (data?.call_status          || "").toLowerCase();
      const disconnectionReason = (data?.disconnection_reason || "").toLowerCase();

      let resolvedCallStatus: Call["callStatus"] = "failed";
      if (retellCallStatus === "ended") {
        resolvedCallStatus = "completed";
      } else if (retellCallStatus === "not_connected" || disconnectionReason === "no_answer") {
        resolvedCallStatus = "no_answer";
      } else if (disconnectionReason === "user_busy") {
        resolvedCallStatus = "busy";
      }

      if (resolvedCallStatus !== "completed" && !callOutcome) {
        lead.status = "not_connected";
      }

      await this.leadRepository.save(lead);

      // ── Build call fields ────────────────────────────────────────────────
      const startTs     = data?.start_timestamp || 0;
      const endTs       = data?.end_timestamp   || 0;
      const durationMs  = data?.duration_ms     || 0;
      const durationSeconds = data?.duration_seconds || Math.floor(durationMs / 1000);

      const callFields = {
        lead,
        callType:                "outbound" as Call["callType"],
        direction:               (data?.direction as "inbound" | "outbound") || "outbound",
        callStatus:              resolvedCallStatus,
        retellCallId,
        agentId:                 data?.agent_id                   || "",
        agentName:               data?.agent_name                 || "",
        agentVersion:            data?.agent_version              ?? null,
        fromNumber:              data?.from_number                || "",
        toNumber:                data?.to_number                  || phoneNumber,
        durationSeconds,
        durationMs,
        startedAt:               startTs ? new Date(startTs)      : undefined,
        endedAt:                 endTs   ? new Date(endTs)        : new Date(),
        disconnectionReason:     data?.disconnection_reason       || null,
        callOutcome,
        callSuccessful:          data?.call_successful            ?? null,
        inVoicemail:             data?.in_voicemail               ?? null,
        lastNode:                data?.last_node                  || null,
        sentiment:               (rawSentiment || null)           as Call["sentiment"],
        transcript:              data?.transcript                  || null,
        callSummary:             data?.call_summary               || null,
        recordingS3Key:          data?.recording_url              || null,
        recordingMultiChannelUrl: data?.recording_multi_channel_url || null,
        publicLogUrl:            data?.public_log_url             || null,
        callCostTotal:           data?.call_cost_total            ?? null,
        callCostDurationSeconds: data?.call_cost_duration_seconds ?? null,
        rawPayload:              data,
      };

      let callRecord: Call;
      if (existingCall) {
        Object.assign(existingCall, callFields);
        callRecord = await this.callRepository.save(existingCall);
      } else {
        callRecord = await this.callRepository.save(this.callRepository.create(callFields));
      }

      // ── Send admin notification only when qualified AND bank statements uploaded ──
      if (callOutcome === "qualified_complete") {
        try {
          const documents = await this.documentRepository.find({
            where: { lead: { id: lead.id }, documentType: "bank_statement" },
            order: { createdAt: "ASC" },
          });

          if (!documents.length) {
            console.log(`[Email] Skipped — lead ${lead.id} has no bank statements uploaded.`);
          } else {
            await sendCallCompletedNotification({
              fullName:            lead.fullName,
              phone:               lead.phone,
              email:               lead.email,
              companyName:         lead.companyName,
              businessEin:         lead.businessEin,
              ownerSsnLast4:       lead.ownerSsnLast4,
              homeNumber:          lead.homeNumber,
              homeAddress:         lead.homeAddress,
              businessStartDate:   lead.businessStartDate,
              monthlyRevenue:      lead.monthlyRevenue ? Number(lead.monthlyRevenue) : undefined,
              fundingAmount:       lead.fundingAmount  ? Number(lead.fundingAmount)  : undefined,
              businessType:        lead.businessType,
              businessAddress:     lead.businessAddress,
              stateName:           lead.stateName,
              ownerDob:            lead.ownerDob,
              ownershipPercentage: lead.ownershipPercentage,
              callSummary:         callRecord.callSummary ?? undefined,
              bankStatements:      documents.map((d) => ({ fileName: d.fileName, s3Key: d.s3Key })),
            });
          }
        } catch (emailErr: any) {
          console.error("[Email] Failed to trigger call completed notification:", emailErr.message);
        }
      }

      return successWithData("Outbound call saved successfully", {
        leadId:      lead.id,
        callId:      callRecord.id,
        retellCallId,
        callOutcome,
        leadStatus:  lead.status,
      });
    } catch (error: any) {
      console.error("Error saving outbound call from n8n:", error.message);
      return errorWithoutData("Failed to save outbound call");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MARK LEAD AS DO NOT CALL
  // Sets lead.status = "do_not_call" so it is skipped in future batch calling.
  // ─────────────────────────────────────────────────────────────────────────
  async markLeadDoNotCall(leadId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) return errorWithoutData("Lead not found", 404);

    lead.status = "do_not_call";
    await this.leadRepository.save(lead);
    return successWithoutData("Lead marked as do not call");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE LEAD
  // Permanently removes the lead and all its related calls and documents.
  // ─────────────────────────────────────────────────────────────────────────
  async deleteLead(leadId: string) {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ["calls", "documents"],
    });
    if (!lead) return errorWithoutData("Lead not found", 404);

    if (lead.calls?.length) {
      await this.callRepository.remove(lead.calls);
    }
    if (lead.documents?.length) {
      await this.documentRepository.remove(lead.documents);
    }
    await this.leadRepository.remove(lead);

    return successWithoutData("Lead deleted successfully");
  }
}
