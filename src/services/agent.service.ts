import axios from "axios";
import { Agent } from "../entities/AgentEntity";

interface RetailAgent {
  agent_id: string;
  agent_name: string;
  channel: string;
  version: number;
  last_modification_timestamp: number;
  response_engine: any;
  webhook_url: string;
  language: string;
  voice_id: string;
  is_active?: boolean;
}

export class AgentService {

  // Save selected agents to DB
  static async saveAgents(agents: any[]): Promise<any> {
    const savedAgents = [];

    for (const a of agents) {
      let agent = await Agent.findOne({ where: { agent_id: a.agent_id } });

      if (!agent) {
        agent = new Agent();
        agent.agent_id = a.agent_id;
      }

      agent.agent_name = a.agent_name;
      agent.is_active = true;
      agent.channel = a.channel;
      agent.version = a.version;
      agent.last_modification_timestamp = a.last_modification_timestamp;
      agent.response_engine = a.response_engine;
      agent.webhook_url = a.webhook_url;
      agent.language = a.language;
      agent.voice_id = a.voice_id;

      await agent.save();
      savedAgents.push(agent);
    }

    return savedAgents;
  }

  // Fetch all agents with is_active flag merged
  // static async getAgentsWithActiveFlag(): Promise<RetailAgent[]> {
  //   try {
  //     const url = "https://api.retellai.com/list-agents";
  //     const headers = { Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2" };

  //     // 1️⃣ Fetch all agents from RetellAI
  //     const response = await axios.get(url, { headers });
  //     const allAgents: RetailAgent[] = response.data?.data || [];
  //     console.log("RetellAI agents count:", allAgents.length);

  //     // 2️⃣ Fetch active agents from DB
  //     const activeAgents = await Agent.find({ where: { is_active: true } }) || [];
  //     console.log("Active agents in DB:", activeAgents.map(a => a.agent_id));

  //     const activeIds = new Set(activeAgents.map(a => a.agent_id.toLowerCase()));

  //     // 3️⃣ Merge is_active flag into RetellAI agents
  //     const mergedAgents = allAgents.map(agent => ({
  //       ...agent,
  //       is_active: activeIds.has(agent.agent_id.toLowerCase()),
  //     }));

  //     // 4️⃣ Remove duplicates, keep highest version
  //     const uniqueAgentsMap = new Map<string, RetailAgent>();
  //     for (const agent of mergedAgents) {
  //       const existing = uniqueAgentsMap.get(agent.agent_id);
  //       if (!existing || agent.version > existing.version) {
  //         uniqueAgentsMap.set(agent.agent_id, agent);
  //       }
  //     }

  //     // 5️⃣ Add DB-only active agents not in RetellAI
  //     for (const dbAgent of activeAgents) {
  //       if (!uniqueAgentsMap.has(dbAgent.agent_id)) {
  //         uniqueAgentsMap.set(dbAgent.agent_id, {
  //           agent_id: dbAgent.agent_id,
  //           agent_name: dbAgent.agent_name,
  //           channel: dbAgent.channel,
  //           version: dbAgent.version,
  //           last_modification_timestamp: dbAgent.last_modification_timestamp,
  //           response_engine: dbAgent.response_engine,
  //           webhook_url: dbAgent.webhook_url,
  //           language: dbAgent.language,
  //           voice_id: dbAgent.voice_id,
  //           is_active: true,
  //         });
  //       }
  //     }

  //     const finalAgents = Array.from(uniqueAgentsMap.values());
  //     console.log("Final merged agents count:", finalAgents.length);

  //     return finalAgents;
  //   } catch (error) {
  //     console.error("Error fetching agents with active flag:", error);
  //     throw new Error("Failed to fetch agents with active flag");
  //   }
  // }

 // Fetch all agents with is_active merged from DB
//  static async getAgentsActive(payload: any): Promise<any> {
//     const url = "https://api.retellai.com/list-agents";
//     const headers = {
//       Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
//       "Content-Type": "application/json",
//     };

//     try {
//       const response = await axios.get(url, { headers, params: payload });
//       return response.data;
//     } catch (error: any) {
//       console.error("Error fetching agents from RetellAI:", error);
//       throw new Error("Failed to fetch agents from RetellAI");
//     }
//   }

 static async getAgentsActive(payload: any): Promise<any> {
    const url = "https://api.retellai.com/list-agents";
    const headers = {
      Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
      "Content-Type": "application/json",
    };

    try {
      // 1️⃣ Fetch all agents from RetellAI
      const response = await axios.get(url, { headers, params: payload });
      const retailAgents: RetailAgent[] = response.data?.data || [];

      // 2️⃣ Fetch all active agents from DB
      const dbAgents = await Agent.find({ where: { is_active: true } });

      // Map DB agents for quick lookup
      const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

      // 3️⃣ Merge is_active flag and keep highest version
      const mergedAgentsMap = new Map<string, RetailAgent>();

      for (const agent of retailAgents) {
        const isActive = dbAgentIds.has(agent.agent_id);
        const existing = mergedAgentsMap.get(agent.agent_id);

        if (!existing || agent.version > existing.version) {
          mergedAgentsMap.set(agent.agent_id, {
            ...agent,
            is_active: isActive
          });
        }
      }

      // 4️⃣ Add DB-only active agents not in RetellAI
      for (const dbAgent of dbAgents) {
        if (!mergedAgentsMap.has(dbAgent.agent_id)) {
          mergedAgentsMap.set(dbAgent.agent_id, {
            agent_id: dbAgent.agent_id,
            agent_name: dbAgent.agent_name,
            channel: dbAgent.channel,
            version: dbAgent.version,
            last_modification_timestamp: dbAgent.last_modification_timestamp,
            response_engine: dbAgent.response_engine,
            webhook_url: dbAgent.webhook_url,
            language: dbAgent.language,
            voice_id: dbAgent.voice_id,
            is_active: true
          });
        }
      }

      const finalAgents = Array.from(mergedAgentsMap.values());

      return {
        result: true,
        statuscode: 200,
        message: "All agents fetched successfully with is_active flag",
        data: finalAgents
      };

    } catch (error: any) {
      console.error("Error fetching agents from RetellAI:", error);
      throw new Error("Failed to fetch agents from RetellAI");
    }
  }
}
