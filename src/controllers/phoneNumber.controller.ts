import { Request, Response } from "express";
import { PhoneNumberService } from "../services/phoneNumber.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

export class PhoneNumberController {
  static async getPhoneNumbers(req: Request, res: Response): Promise<void> {
    try {
      const data = await PhoneNumberService.getPhoneNumbers();
      res.status(200).json(successWithData("Phone numbers fetched successfully", data));
    } catch (error: any) {
      console.error("Controller error in getPhoneNumbers:", error.response?.data || error.message);
      res.status(500).json(errorWithData("Failed to fetch phone numbers", error.message, 500));
    }
  }
}
