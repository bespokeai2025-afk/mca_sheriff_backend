export const mapCallOutputData = async (reqBody: any) => {
  const { event, call } = reqBody;

  return {
    event: event || "",
    callId: call?.call_id || "",
    callType: call?.call_type || "",
    agentId: call?.agent_id || "",
    agentVersion: call?.agent_version?.toString() || "",
    agentName: call?.agent_name || "",
    name: call?.retell_llm_dynamic_variables?.name || "",
    callStatus: call?.call_status || "",
    startTimestamp: call?.start_timestamp || null,
    endTimestamp: call?.end_timestamp || null,
    durationMs: call?.duration_ms || null,
    transcript: call?.transcript || "",
    fromNumber: call?.from_number || "",
    toNumber: call?.to_number || "",
    recordingUrl: call?.recording_url || "",
    disconnectionReason: call?.disconnection_reason || "",
    sentimentAnalysis: call?.call_analysis?.user_sentiment || "",
    endReason: call?.disconnection_reason || "",
    email: call?.email || "",
    lead_id: call?.retell_llm_dynamic_variables?.lead_id || "", 
    appointment_date: call?.appointment_date || "",
     appointment_time: call?.appointment_time || "",
      booking_status: call?.booking_status || "",
    calendly_booking_url: call?.calendly_booking_url || "",
    crm_data_id: null as string | null,   // ✅ fix here
  };
};
