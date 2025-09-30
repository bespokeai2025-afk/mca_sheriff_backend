import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

/**
 * AgentController handles all agent-related API endpoints:
 * - Fetch all agents from RetellAI
 * - Save selected agents and mark them as active
 * - Fetch all agents with active status merged from DB
 */
export class AgentController {

  /**
   * GET /agent
   * Fetch all agents from RetellAI API (raw data)
   */
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

  /**
   * POST /agent/save
   * Save selected agents into DB and mark them as active
   */
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

  /**
   * GET /agent/active
   * Fetch all agents from RetellAI and merge 'is_active' flag from DB
   * Returns all agents, marking those stored as active in DB.
   */
  static async getAgentsActive(req: Request, res: Response): Promise<void> {
  try {
    const agents = await AgentService.getAgentsWithActiveFlag();
    res.status(200).json(
      successWithData("All agents fetched with active status", agents)
    );
  } catch (error) {
    console.error("Controller error in getAgentsActive:", error);
    res.status(500).json(
      errorWithData("Failed to fetch agents with active status", error, 500)
    );
  }
}

}
