import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";
import { successWithData, errorWithData } from "../config/ApiResponse";
export class AgentController {

  // static async getAgent(req: Request, res: Response): Promise<void> {
  //   try {
  //     const payload = req.body || {}; // Optional query/filter payload
  //     const data = await AgentService.getAgents(payload);

  //     // Send response (no return, matches Promise<void>)
  //     res.status(200).json(successWithData("All agents fetched successfully", data));
  //   } catch (error) {
  //     console.error("Controller error in getAgent:", error);
  //     res.status(500).json(errorWithData("Failed to fetch agents", error, 500));
  //   }
  // }
  static async saveSelectedAgents(req: Request, res: Response): Promise<void> {
    try {
      const { agents } = req.body;

      // Validation: agents array required
      if (!agents || !Array.isArray(agents) || agents.length === 0) {
        res.status(400).json(errorWithData("agents array is required", null));
        return;
      }

      const savedAgents = await AgentService.saveAgents(agents);

      res.status(200).json(successWithData("Agents saved successfully", savedAgents));
    } catch (error) {
      console.error("Controller error in saveSelectedAgents:", error);
      res.status(500).json(errorWithData("Failed to save agents", error, 500));
    }
  } 
  static async getAgentsActive(req: Request, res: Response): Promise<void> {
  try {
    // No need to take body for GET
    const data = await AgentService.getAgentsActive();

    res.status(200).json(data);
  } catch (error: any) {
    console.error("Controller error in getAgentsActive:", error.response?.data || error.message);
    res.status(500).json(errorWithData("Failed to fetch agents", error.message, 500));
  }
}


}
