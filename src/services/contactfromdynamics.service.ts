// import axios from "axios";

// const TENANT_ID = "28eee320-6880-4e85-a2bc-454d92634fec";
// const CLIENT_ID = "efe2b1b4-af5e-42f7-a2b5-7e148da849aa";
// const CLIENT_SECRET = "3-t8Q~amoMmNayEj3vj6DIBJRZ8pxwSRibusda0g";
// const DYNAMICS_RESOURCE = "https://pinnaclemanagementcorporation.crm4.dynamics.com/.default";
// const BASE_URL = "https://pinnaclemanagementcorporation.crm4.dynamics.com/api/data/v9.2";

// //  Get access token
// async function getAccessToken(): Promise<string> {
//     const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

//     const params = new URLSearchParams();
//     params.append("client_id", CLIENT_ID);
//     params.append("client_secret", CLIENT_SECRET);
//     params.append("scope", DYNAMICS_RESOURCE);
//     params.append("grant_type", "client_credentials");

//     const response = await axios.post(tokenUrl, params, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     });

//     return response.data.access_token;
// }

// //  Fetch Contacts from Dynamics
// export async function fetchContacts(pageUrl?: string) {
//   const token = await getAccessToken();
//   const url = pageUrl
//     ? pageUrl
//     : `${BASE_URL}/contacts?$select=fullname,contactid,firstname,lastname,mobilephone,emailaddress1,address1_city&$top=50000`;

//   const response = await axios.get(url, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       Accept: "application/json",
//       "OData-MaxVersion": "4.0",
//       "OData-Version": "4.0",
//     },
//   });

//   const nextLink = response.data["@odata.nextLink"] || null;

//   return {
//     value: response.data.value,
//     nextLink,
//     isNextLink: !!nextLink,
//     totalRecords: response.data.value.length, // only for current batch
//   };
// }



import axios from "axios";
import dotenv from "dotenv";
 
dotenv.config();
 
const TENANT_ID = process.env.DYNAMICS_TENANT_ID!;
const CLIENT_ID = process.env.DYNAMICS_CLIENT_ID!;
const CLIENT_SECRET = process.env.DYNAMICS_CLIENT_SECRET!;
const DYNAMICS_RESOURCE = process.env.DYNAMICS_RESOURCE!;
const BASE_URL = process.env.DYNAMICS_BASE_URL!;
 
// Get access token
async function getAccessToken(): Promise<string> {
  const tokenUrl = process.env.DYNAMICS_TOKEN_URL!.replace("${TENANT_ID}", TENANT_ID);
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("scope", DYNAMICS_RESOURCE);
  params.append("grant_type", "client_credentials");
 
  const response = await axios.post(tokenUrl, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
 
  return response.data.access_token;
}
 
// Fetch Contacts from Dynamics
export async function fetchContacts(pageUrl?: string) {
  const token = await getAccessToken();
 
  // Use pageUrl if provided (for nextLink), else use base URL
  const url = pageUrl
    ? pageUrl
    : `${BASE_URL}/contacts?$select=fullname,contactid,firstname,lastname,mobilephone,emailaddress1,address1_city,createdon&$orderby=createdon desc&$top=50000`;
 
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
  });
 
  const nextLink = response.data["@odata.nextLink"] || null;
 
  return {
    value: response.data.value,
    nextLink,
    isNextLink: !!nextLink,
    totalRecords: response.data.value.length, // current batch length
  };
}