import { Request, Response, NextFunction } from "express";
import { errorWithoutData } from "../config/ApiResponse";

export const verifyStaticToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response = errorWithoutData("Missing or invalid token", 401);
      res.status(response.statuscode).json(response);
      return;
    }

    const token = authHeader.split(" ")[1];
    const staticToken = process.env.STATIC_API_TOKEN;
    console.log(staticToken, "staticTokenstaticTokenstaticToken");
    

    // ❌ Token mismatch
    if (token !== staticToken) {
      const response = errorWithoutData("Unauthorized static token", 403);
      res.status(response.statuscode).json(response);
      return;
    }

    // ✅ Token valid → proceed
    next();
  } catch (error: any) {
    const response = errorWithoutData(
      "Static token verification failed",
      500
    );
    res.status(response.statuscode).json(response);
  }
};
