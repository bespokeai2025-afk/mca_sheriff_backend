import { OTPVerification } from "../entities/OtpVerification";
import { AppDataSource } from "../config/database";
import { LessThan } from "typeorm";

export async function deleteOldOTPs() {
    const otpRepository = AppDataSource.getRepository(OTPVerification);

    await otpRepository.createQueryBuilder()
        .delete()
        .from(OTPVerification)
        .where("createdAt < CURRENT_DATE") // Deletes records before today
        .execute();

    console.log("Old OTP records deleted.");
}
