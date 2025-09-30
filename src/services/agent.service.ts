import axios from "axios";
import { Agent } from "../entities/AgentEntity";
export class AgentService {
  static async getAgents(payload: any): Promise<any> {
    const url = "https://api.retellai.com/list-agents";
    const headers = {
      Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
      "Content-Type": "application/json",
    };

    console.log("🚀 Sending request to RetellAI API");
    console.log("URL:", url);
    console.log("Headers:", headers);
    console.log("Payload:", payload);

    try {
      // NOTE: RetellAI List Agents API uses GET, not POST
      const response = await axios.get(url, {
        headers,
        params: payload, // Use params for GET query parameters
      });

      console.log("✅ Response received from RetellAI API:");
      console.log("Status:", response.status);
      console.log("Data:", response.data);

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error("❌ RetellAI API Error:", {
          status: error.response.status,
          data: error.response.data,
        });
        throw new Error(
          `RetellAI API Error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else if (error.request) {
        console.error("❌ No response received from RetellAI:", error.request);
        throw new Error("No response received from RetellAI API");
      } else {
        console.error("❌ Error sending request:", error.message);
        throw new Error(`Error sending request: ${error.message}`);
      }
    }
  }

   static async saveAgents(agents: any[]): Promise<any> {
    try {
      const savedAgents = [];

      for (const a of agents) {
        // Use agent_id from RetellAI to find existing record
        let agent = await Agent.findOne({ where: { agent_id: a.agent_id } });

        if (!agent) {
          // New record — UUID will be generated automatically
          agent = new Agent();
          agent.agent_id = a.agent_id;
        }

        agent.agent_name = a.agent_name;
        agent.is_active = true; // mark as active when selected
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
    } catch (error) {
      console.error("Error saving agents:", error);
      throw new Error("Failed to save agents");
    }
  }
}
