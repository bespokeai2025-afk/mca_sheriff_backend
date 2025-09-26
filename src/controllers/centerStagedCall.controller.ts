import { Request, Response } from "express";
import { CenterStagedCallService } from "../services/centerStagedCall.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

export class CenterStagedCallController {

  // Fetch filtered call data
 static async callFilterCenterStage(req: Request, res: Response): Promise<void> {
  try {
    const { from_date, to_date, from_time, to_time } = req.body;

    if (!from_date || !to_date) {
      res.status(400).json(
        errorWithData("from_date and to_date are required", null, 400)
      );
      return;
    }

    const data = await CenterStagedCallService.callFilterCenterStage(
      from_date,
      to_date,
      from_time,
      to_time
    );

    res.status(200).json(
      successWithData("Filtered call data fetched successfully", data, undefined, 200)
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(errorWithData("Failed to fetch call data", error, 500));
  }
}



}
