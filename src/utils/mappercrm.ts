export const mapIncomingCRMData = (rawData: any) => {
  return {
    name: rawData.fullname || rawData.name || "",
    email: rawData.emailaddress1 || rawData.email || "",
    mobile_number: rawData.mobilephone || rawData.mobile_number || "",
    lead_id: rawData.leadid || rawData.lead_id || "",
    unique_id: rawData["@odata.etag"] || null,
    need_to_call: true,
    isActive: true,
    isDeleted: false
  };
};
