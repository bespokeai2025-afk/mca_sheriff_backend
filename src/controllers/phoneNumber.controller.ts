import { Request, Response } from "express";
import { PhoneNumberService } from "../services/phoneNumber.service";
import { successWithData, errorWithData } from "../config/ApiResponse";
import { PhoneNumber } from "entities/PhoneNumberEntity";
import axios from "axios";
import { error } from "console";

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
      const { phonenumbers } = req.body;

      // Validation: phonenumber array required
      if (!phonenumbers || !Array.isArray(phonenumbers) || phonenumbers.length === 0) {
        res.status(400).json(errorWithData("phonenumber array is required", null));
        return;
      }

      const savedphonenumber = await PhoneNumberService.savePhoneNumber(phonenumbers);

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

  // GET all numbers + live voicemail info
  static async getAllPhoneNumbersWithVoicemail(req: Request, res: Response) {
    try {
      const data = await PhoneNumberService.getAllWithVoicemail();
      res.status(200).json({ result: true, data });
    } catch (err: any) {
      console.error("Failed to fetch phone numbers with voicemail:", err.message);
      res.status(500).json({ result: false, message: "Failed to fetch phone numbers", data: err.message });
    }
  }

  static async updateVoicemail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { enable, text } = req.body;

      if (enable === undefined || typeof enable !== "boolean") {
        res.status(400).json({ result: false, message: "`enable` must be boolean" });
        return;
      }

      if (enable && (!text || text.trim() === "")) {
        res.status(400).json({ result: false, message: "Voicemail text is required when enabling" });
        return;
      }

      const result = await PhoneNumberService.updateVoicemailById(id, enable, text);

      if (!result.result) {
        res.status(500).json({ result: false, message: "Failed to update voicemail", data: result.data });
        return;
      }

      res.status(200).json({
        result: true,
        message: `Voicemail ${enable ? "enabled" : "disabled"} successfully`,
        data: result.data,
      });
    } catch (err: any) {
      res.status(500).json({ result: false, message: "Server error", data: err.message });
    }
  }

}
