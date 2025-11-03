export const mapIncomingCRMData = (rawData: any) => {
  return {
    // unique_id: rawData["@odata.etag"] || null,
    // lead_id: rawData.leadid || "",
     unique_id: rawData.unique_id || rawData["@odata.etag"] || null,
    lead_id: rawData.lead_id || rawData.leadid || "",
    title: rawData.title || "",
    // name: rawData.fullname || "",
    name: rawData.name || rawData.fullname || "",
    firstname: rawData.firstname || "",
    lastname: rawData.lastname || "",
    email: rawData.emailaddress1 || "",
    mobile_number: rawData.mobilephone || "",
    bedrooms: rawData.new_propinfo_numberofbedrooms || "",

    address1_composite: rawData.address1_composite || "",
    yomifullname: rawData.yomifullname || "",


    address1_line1: rawData.address1_line1 || "",
    address1_line2: rawData.address1_line2 || "",
    address1_city: rawData.address1_city || "",
    address1_postalcode: rawData.address1_postalcode || "",
    address1_stateorprovince: rawData.address1_stateorprovince || "",


    new_propinfo_city: rawData.new_propinfo_city || "",
    new_propinfo_postalcode: rawData.new_propinfo_postalcode || "",
    new_propinfo_street2: rawData.new_propinfo_street2 || "",
    new_propinfo_street3: rawData.new_propinfo_street3 || "",
    new_propinfo_stateorprovince: rawData.new_propinfo_stateorprovince || "",

    property_type: rawData["new_propinfo_typeofproperty@OData.Community.Display.V1.FormattedValue"] || "",
    need_to_call: true,
    isActive: true,
    isDeleted: false
  };
};




