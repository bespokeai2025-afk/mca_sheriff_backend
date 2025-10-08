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


static async saveSelectedPhoneNumber(req: Request, res: Response): Promise<void> {
    try {
      const { phonenumber } = req.body;

      // Validation: phonenumber array required
      if (!phonenumber || !Array.isArray(phonenumber) || phonenumber.length === 0) {
        res.status(400).json(errorWithData("phonenumber array is required", null));
        return;
      }

      const savedphonenumber = await PhoneNumberService.savePhoneNumber(phonenumber);

      res.status(200).json(successWithData("Phone Number saved successfully", savedphonenumber));
    } catch (error) {
      console.error("Controller error in saveSelectedPhoneNumber:", error);
      res.status(500).json(errorWithData("Failed to save phone numbers", error, 500));
    }
  } 
  static async getPhoneNumberActive(req: Request, res: Response): Promise<void> {
  try {
    // No need to take body for GET
    const data = await PhoneNumberService.getPhoneNumbers();

    res.status(200).json(data);
  } catch (error: any) {
    console.error("Controller error in getPhoneNumbers:", error.response?.data || error.message);
    res.status(500).json(errorWithData("Failed to fetch phone numbers", error.message, 500));
  }
}


}
