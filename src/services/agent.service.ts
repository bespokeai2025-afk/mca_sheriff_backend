import axios from "axios";
import { Agent } from "../entities/AgentEntity";

interface RetailAgent {
  agent_id: string;
  agent_name: string;
  version: number;
  webhook_url: string;
  is_active?: boolean;
}
type InputAgent = {
  agent_id: string;
  is_active: boolean | string;
};
export class AgentService {
  static async saveAgents(agents: InputAgent[]): Promise<any> {
    const savedAgents: Agent[] = [];

    try {
      // 1️⃣ Fetch all agents from RetellAI
      let retailAgents: any[] = [];
      try {
        const url = "https://api.retellai.com/list-agents";
        const headers = {
          Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
          "Content-Type": "application/json",
        };
        const response = await axios.get(url, { headers });
        retailAgents = response.data || [];
      } catch (err: any) {
        console.warn("Warning: Could not fetch agents from RetellAI:", err.message);
      }

      // 2️⃣ Deduplicate agents by agent_id (take latest version)
      const retailMap = new Map<string, any>();
      for (const a of retailAgents) {
        const existing = retailMap.get(a.agent_id);
        if (!existing || a.last_modification_timestamp > existing.last_modification_timestamp) {
          retailMap.set(a.agent_id, a);
        }
      }

      // 3️⃣ Loop through input agents
      for (const inputAgent of agents) {
        // Convert string "false"/"true" to boolean
        const isActive = inputAgent.is_active === true || inputAgent.is_active === "true";

        if (!isActive) {
          // Delete agent if exists
          const agentToDelete = await Agent.findOne({ where: { agent_id: inputAgent.agent_id } });
          if (agentToDelete) {
            await Agent.remove(agentToDelete);
          }
          continue; // skip to next agent
        }

        // Create or update agent
        let agent = await Agent.findOne({ where: { agent_id: inputAgent.agent_id } });
        if (!agent) {
          agent = new Agent();
          agent.agent_id = inputAgent.agent_id;
        }

        // Update info from RetellAI if available
        const retailAgent = retailMap.get(inputAgent.agent_id);
        if (retailAgent) {
          agent.agent_name = retailAgent.agent_name;
        }

        agent.is_active = true;
        await agent.save();
        savedAgents.push(agent);
      }

      return {
        result: true,
        statuscode: 200,
        message: "Agents saved successfully",
        data: savedAgents,
      };
    } catch (error: any) {
      console.error("Error saving agents:", error.message);
      return {
        result: false,
        statuscode: 500,
        message: "Failed to save agents",
        data: [],
      };
    }
  }

  static async getAgentsActive(): Promise<any> {
    const url = "https://api.retellai.com/list-agents";
    const headers = {
      Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
      "Content-Type": "application/json",
    };
    try {
      //  Fetch all agents from RetellAI
      const response = await axios.get(url, { headers });
      const retailAgents: RetailAgent[] = response.data || [];

      //  Fetch all active agents from DB
      const dbAgents = await Agent.find({ where: { is_active: true } });
      const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

      //  Merge and group by agent_id
      const agentMap = new Map<string, any>();

      retailAgents.forEach(agent => {
        if (!agentMap.has(agent.agent_id)) {
          agentMap.set(agent.agent_id, {
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
            webhook_url: agent.webhook_url,
            is_active: dbAgentIds.has(agent.agent_id)
          });
        } else {
          // Optional: merge webhook_url if empty
          const existing = agentMap.get(agent.agent_id);
          if (!existing.webhook_url) existing.webhook_url = agent.webhook_url;
          agentMap.set(agent.agent_id, existing);
        }
      });

      const mergedAgents = Array.from(agentMap.values());

      return {
        result: true,
        statuscode: 200,
        message: "All agents fetched successfully with selected fields",
        data: mergedAgents,
      };

    } catch (error: any) {
      console.error("Error fetching agents from RetellAI:", error.response?.data || error.message);
      throw new Error("Failed to fetch agents from RetellAI");
    }
  }


  // Enable and disable setting
  static async updateVoicemailById(agent_id: string, enable: boolean, text?: string) {
    //  Fetch agent from DB
    const agent = await Agent.findOne({ where: { agent_id } });
    if (!agent) {
      return {
        result: false,
        statuscode: 404,
        message: "Agent not found",
      };
    }

    if (!process.env.RETELL_API_KEY) {
      throw new Error("Missing RETELL_API_KEY in environment variables");
    }

    const headers = {
      Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
      "Content-Type": "application/json",
    };


    const voicemailText =
      text ?? "Hi, we missed your call. Please leave a message and we’ll get back soon!";

    //  Prepare payload based on enable/disable
    const payload = enable
      ? {
        voicemail_option: {
          action: {
            type: "static_text",
            text: voicemailText,
          },
        },
      }
      : { voicemail_option: null }; // disable voicemail per Retell AI docs

    //  Correct endpoint
    const url = `https://api.retellai.com/update-agent/${agent_id}`;

    try {
      //  Update Retell AI
      const response = await axios.patch(url, payload, { headers });
      if (!response.data) {
        throw new Error("Empty response from Retell AI");
      }

      //  Update local DB only if API succeeded
      agent.voicemail_enabled = enable;
      agent.voicemail_text = enable ? voicemailText : null;
      await agent.save();

      return {
        result: true,
        statuscode: 200,
        message: `Voicemail ${enable ? "enabled" : "disabled"} successfully for agent`,
        data: {
          agent_id,
          voicemail_enabled: enable,
          voicemail_text: enable ? voicemailText : null,
        },
      };
    } catch (err: any) {
      //  Catch API errors and return properly
      return {
        result: false,
        statuscode: err.response?.status || 500,
        message: "Failed to update voicemail on Retell AI",
        data: err.response?.data || err.message,
      };
    }
  }









  // static async getAgentsActive(): Promise<any> {
  // const url = "https://api.retellai.com/list-agents";
  // const headers = {
  //   Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
  //   "Content-Type": "application/json",
  // };

  // try {
  //   // ✅ Fetch all agents without extra params
  //   const response = await axios.get(url, { headers });
  //   const retailAgents: RetailAgent[] = response.data || [];

  //   // ✅ Fetch all active agents from DB
  //   const dbAgents = await Agent.find({ where: { is_active: true } });
  //   const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

  //   // ✅ Merge
  //   const mergedAgents = retailAgents.map(agent => ({
  //     agent_id: agent.agent_id,
  //     agent_name: agent.agent_name,
  //     webhook_url: agent.webhook_url,
  //     is_active: dbAgentIds.has(agent.agent_id),
  //   }));

  //   return {
  //     result: true,
  //     statuscode: 200,
  //     message: "All agents fetched successfully with selected fields",
  //     data: mergedAgents,
  //   };

  // } catch (error: any) {
  //   console.error("Error fetching agents from RetellAI:", error.response?.data || error.message);
  //   throw new Error("Failed to fetch agents from RetellAI");
  // }
  // }

  // static async getAgentsActive(payload: any): Promise<any> {
  //   const url = "https://api.retellai.com/list-agents";
  //   const headers = {
  //     Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
  //     "Content-Type": "application/json",
  //   };

  //   try {
  //     // 1️⃣ Fetch all agents from RetellAI
  //     const response = await axios.get(url, { headers, params: payload });
  //     const retailAgents: RetailAgent[] = response.data || [];

  //     // 2️⃣ Fetch all active agents from DB
  //     const dbAgents = await Agent.find({ where: { is_active: true } });
  //     const dbAgentIds = new Set(dbAgents.map(a => a.agent_id));

  //     // 3️⃣ Merge is_active flag and keep highest version
  //     const mergedAgentsMap = new Map<string, RetailAgent>();

  //     for (const agent of retailAgents) {
  //       const isActive = dbAgentIds.has(agent.agent_id);
  //       const existing = mergedAgentsMap.get(agent.agent_id);

  //       // if (!existing || agent.version > existing.version) {
  //         mergedAgentsMap.set(agent.agent_id, { ...agent, is_active: isActive });
  //       // }
  //     }

  //     const finalAgents = Array.from(mergedAgentsMap.values());

  //     // 4️⃣ Filter only required fields
  //     const filteredAgents = finalAgents.map(agent => ({
  //       agent_id: agent.agent_id,
  //       agent_name: agent.agent_name,
  //       webhook_url: agent.webhook_url,
  //        is_active: agent.is_active
  //     }));

  //     return {
  //       result: true,
  //       statuscode: 200,
  //       message: "All agents fetched successfully with selected fields",
  //       data: filteredAgents
  //     };

  //   } catch (error: any) {
  //     console.error("Error fetching agents from RetellAI:", error);
  //     throw new Error("Failed to fetch agents from RetellAI");
  //   }
  // }

}
