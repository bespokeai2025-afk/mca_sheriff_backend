import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

export class AgentController {

     static async getAgent(req: Request, res: Response): Promise<void> {
    try {
      // You can pass any payload needed for the RetellAI API
      const payload = req.body || {}; 

      const data = await AgentService.getAgents(payload);

      res
        .status(200)
        .json(successWithData("All agents fetched successfully", data));
    } catch (error) {
      console.error("Controller error:", error);
      res
        .status(500)
        .json(errorWithData("Failed to fetch agents", error, 500));
    }
  }

  static async saveSelectedAgents(req: Request, res: Response): Promise<void> {
    try {
      const { agents } = req.body;

      if (!agents || !Array.isArray(agents) || agents.length === 0) {
        res.status(400).json(errorWithData("agents array is required", null));
        return;
      }

      const savedAgents = await AgentService.saveAgents(agents);

      res.status(200).json(successWithData("Agents saved successfully", savedAgents));
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json(errorWithData("Failed to save agents", error, 500));
    }
  }
}







