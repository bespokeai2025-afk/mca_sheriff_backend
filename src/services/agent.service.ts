import axios from "axios";
import { Agent } from "../entities/AgentEntity";

interface RetailAgent {
  agent_id: string;
  agent_name: string;
  // channel: string;
  version: number;
  // last_modification_timestamp: number;
  // response_engine: any;
  webhook_url: string;
  // language: string;
  // voice_id: string;
  is_active?: boolean;
}

export class AgentService {
 static async getAgents(payload: any): Promise<any> {
    const url = "https://api.retellai.com/list-agents";
    const headers = {
      Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.get(url, { headers, params: payload });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching agents from RetellAI:", error);
      throw new Error("Failed to fetch agents from RetellAI");
    }
  }
  // Save selected agents to DB
  // static async saveAgents(agents: any[]): Promise<any> {
  //   const savedAgents = [];

  //   for (const a of agents) {
  //     let agent = await Agent.findOne({ where: { agent_id: a.agent_id } });

  //     if (!agent) {
  //       agent = new Agent();
  //       agent.agent_id = a.agent_id;
  //     }

  //     agent.agent_name = a.agent_name;
  //     agent.is_active = true;
  //     agent.channel = a.channel;
  //     agent.version = a.version;
  //     agent.last_modification_timestamp = a.last_modification_timestamp;
  //     agent.response_engine = a.response_engine;
  //     agent.webhook_url = a.webhook_url;
  //     agent.language = a.language;
  //     agent.voice_id = a.voice_id;

  //     await agent.save();
  //     savedAgents.push(agent);
  //   }

  //   return savedAgents;
  // }

  // Service: saveAgents

static async saveAgents(agents: any[]): Promise<any> {
  const savedAgents = [];

  // 1️⃣ Fetch all agents from RetellAI
  const url = "https://api.retellai.com/list-agents";
  const headers = {
    Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
    "Content-Type": "application/json",
  };

  const response = await axios.get(url, { headers });
  
  // ✅ This is the array of agents from RetellAI
  const retailAgents: any[] = response.data?.data || [];

  // Create a map for easy lookup by agent_id
  const retailMap = new Map(retailAgents.map(a => [a.agent_id, a]));

  for (const a of agents) {
    let agent = await Agent.findOne({ where: { agent_id: a.agent_id } });

    if (!agent) {
      agent = new Agent();
      agent.agent_id = a.agent_id;
    }

    // Look up agent_name and other info from RetellAI
    const retailAgent = retailMap.get(a.agent_id);
    if (retailAgent) {
      agent.agent_name = retailAgent.agent_name; // <-- this must exist now
      // agent.channel = retailAgent.channel;
      // agent.webhook_url = retailAgent.webhook_url;
    } else {
      console.warn(`Agent not found in RetellAI: ${a.agent_id}`);
    }

    agent.is_active = true;
    await agent.save();
    savedAgents.push(agent);
  }

  return {
    result: true,
    statuscode: 200,
    message: "Agents saved successfully",
    data: savedAgents
  };
}


// static async getAgentsActive(payload: any): Promise<any> {
//   const url = "https://api.retellai.com/list-agents";
//   const headers = {
//     Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
//     "Content-Type": "application/json",
//   };

//   try {
//     // 1️⃣ Fetch all agents from RetellAI
//     const response = await axios.get(url, { headers, params: payload });
//     console.log(response, "responseresponseresponseresponse")
//     const retailAgents: RetailAgent[] = response.data || []; // data array from RetellAI

//     // 2️⃣ Fetch all active agents from DB
//     const dbAgents = await Agent.find({ where: { is_active: true } });
//     const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

//     // 3️⃣ Merge is_active flag and keep highest version
//     const mergedAgentsMap = new Map<string, RetailAgent>();

//     for (const agent of retailAgents) {
//       const isActive = dbAgentIds.has(agent.agent_id);
//       const existing = mergedAgentsMap.get(agent.agent_id);

//       if (!existing || agent.version > existing.version) {
//         mergedAgentsMap.set(agent.agent_id, { ...agent, is_active: isActive });
//       }
//     }

//     const finalAgents = Array.from(mergedAgentsMap.values());

//     return {
//       result: true,
//       statuscode: 200,
//       message: "All agents fetched successfully with is_active flag",
//       data: finalAgents  // <-- this is now the correct array
//     };

//   } catch (error: any) {
//     console.error("Error fetching agents from RetellAI:", error);
//     throw new Error("Failed to fetch agents from RetellAI");
//   }
// }
static async getAgentsActive(payload: any): Promise<any> {
  const url = "https://api.retellai.com/list-agents";
  const headers = {
    Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
    "Content-Type": "application/json",
  };

  try {
    // 1️⃣ Fetch all agents from RetellAI
    const response = await axios.post(url, { headers, params: payload });
    const retailAgents: RetailAgent[] = response.data || [];

    // 2️⃣ Fetch all active agents from DB
    const dbAgents = await Agent.find({ where: { is_active: true } });
    const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

    // 3️⃣ Merge is_active flag and keep highest version
    const mergedAgentsMap = new Map<string, RetailAgent>();

    for (const agent of retailAgents) {
      const isActive = dbAgentIds.has(agent.agent_id);
      const existing = mergedAgentsMap.get(agent.agent_id);

      // if (!existing || agent.version > existing.version) {
        mergedAgentsMap.set(agent.agent_id, { ...agent, is_active: isActive });
      // }
    }

    const finalAgents = Array.from(mergedAgentsMap.values());

    // 4️⃣ Filter only required fields
    const filteredAgents = finalAgents.map(agent => ({
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      // channel: agent.channel,
      // last_modification_timestamp: agent.last_modification_timestamp,
      webhook_url: agent.webhook_url,
       is_active: agent.is_active
    }));

    return {
      result: true,
      statuscode: 200,
      message: "All agents fetched successfully with selected fields",
      data: filteredAgents
    };

  } catch (error: any) {
    console.error("Error fetching agents from RetellAI:", error);
    throw new Error("Failed to fetch agents from RetellAI");
  }
}

}
