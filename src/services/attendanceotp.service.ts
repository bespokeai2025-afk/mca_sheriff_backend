import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { OTPVerification } from "../entities/OtpVerification";
import { MoreThan } from "typeorm";
import { generateOtp } from "../utils/otpHelper"; // Assume a function to generate OTP
import { errorWithoutData, successWithData } from "../config/ApiResponse"; // Assume response helpers
import { generateTokens } from "../utils/jwtUtils";
import { Admin } from "../entities/Admin";
import dotenv from "dotenv";
import axios from 'axios';
import { AttendanceOtpVerification } from "../entities/AttendanceOtpVerification";
dotenv.config();
export class AttendanceOTPService {
  private userRepository = AppDataSource.getRepository(User);
  private AttendanceOtpVerification = AppDataSource.getRepository(AttendanceOtpVerification);
  private adminRepository = AppDataSource.getRepository(Admin);
  private otpLimit: number = parseInt(process.env.DAILY_OTP_MAX_LIMIT || "20", 10) || 20;

  public async sendAttendanceOtp(mobile: string) {
    try {
      // Check if user exists
      let user = await this.userRepository.findOne({ where: { mobile, isDeleted: false } });

      let admin = await this.adminRepository.findOne({ where: { mobile, isDeleted: false } });

      if (admin) return errorWithoutData("mobile number already exists");

      if (!user) {
        user = await this.userRepository.save(
          this.userRepository.create({ mobile })
        );
      }

      // Check if user is blocked or deleted
      if (user.isDeleted || !user.isActive) {
        return errorWithoutData("User is not allowed to receive OTPs");
      }

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );

      // Count OTPs sent today
      const otpCount = await this.AttendanceOtpVerification.count({
        where: {
          user_id: { id: user.id },
          createdAt: MoreThan(startOfDay),
        },
      });

      if (otpCount >= this.otpLimit) {
        return errorWithoutData(
          "Daily OTP request limit exceeded. Try again tomorrow."
        );
      }

      // Check last OTP timestamp (within 1 minute)
      const lastOtp = await this.AttendanceOtpVerification.findOne({
        where: { user_id: { id: user.id } },
        relations: ["user_id"],
        order: { createdAt: "DESC" },
      });

      if (lastOtp) {
        const timeDiff =
          (lastOtp.expiry_time.getTime() - new Date().getTime()) / 1000;
        console.log(lastOtp.expiry_time);
        console.log(lastOtp.createdAt);
        console.log(timeDiff);
        if (timeDiff > 0) {
          return errorWithoutData("OTP already sent. Try after 1 minute.");
        }
      }

      // Generate new OTP
      const otpCode = generateOtp();
      const expiryTime = new Date(Date.now() + 3 * 60 * 1000); // 1-minute expiry

      console.log(`Generated OTP:`, otpCode);

          // Construct the message
    const msg = `Your OTP for login is ${otpCode}. It is valid for 03 minutes. Do not share it with anyone.\n\nTeam Sumago Infotech`;

    const sender = 'SMGTCH';
    const dltTemplateId = '1207174427425038676';
    const authKey = '240394A0j2u3FiF6800cf90P1';

    // Encode message to use in URL
    const encodedMessage = encodeURIComponent(msg);

    // Construct final URL
    const apiUrl = `http://sms.happysms.in/api/sendhttp.php?authkey=${authKey}&mobiles=${mobile}&message=${encodedMessage}&sender=${sender}&route=4&country=91&DLT_TE_ID=${dltTemplateId}`;

    // Send the request
    const smsSent = await axios.get(apiUrl);

    if (!smsSent) return errorWithoutData("Failed to send OTP");

      // Save OTP to database
      const newOtp = this.AttendanceOtpVerification.create({
        otp: otpCode,
        user_id: { id: user.id },
        expiry_time: expiryTime,
        todays_count: otpCount + 1,
      });
      await this.AttendanceOtpVerification.save(newOtp);

      // Send OTP via SMS API (assuming a function sendOtpSms)
      // const smsSent = await sendOtpSms(mobile, otpCode);
      // if (!smsSent) return errorWithoutData("Failed to send OTP");

      return successWithData("OTP sent successfully", { mobile, otpCode });
    } catch (err) {
      return errorWithoutData(`${err} Internal Server Error`,);
    }
  }

  public async sendAttendanceOTPToAdmin(mobile: string) {
    try {
      // Check if user exists
      let user = await this.adminRepository.findOne({ where: { mobile } });

      if (!user) {
        return errorWithoutData(
          "You are not authorized to register as an admin."
        );
      }

      // Check if user is blocked or deleted
      if (user.isDeleted || !user.isActive) {
        return errorWithoutData("User is not allowed to receive OTPs");
      }

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );

      // Count OTPs sent today
      const otpCount = await this.AttendanceOtpVerification.count({
        where: {
          user_id: { id: user.id },
          createdAt: MoreThan(startOfDay),
        },
      });

      if (otpCount >= this.otpLimit) {
        return errorWithoutData(
          "Daily OTP request limit exceeded. Try again tomorrow."
        );
      }

      // Check last OTP timestamp (within 1 minute)
      const lastOtp = await this.AttendanceOtpVerification.findOne({
        where: { admin_id: { id: user.id } },
        relations: ["admin_id"],
        order: { createdAt: "DESC" },
      });

      if (lastOtp) {
        const timeDiff =
          (lastOtp.expiry_time.getTime() - new Date().getTime()) / 1000;
        console.log(lastOtp.expiry_time);
        console.log(lastOtp.createdAt);
        console.log(timeDiff);
        if (timeDiff > 0) {
          return errorWithoutData("OTP already sent. Try after 1 minute.");
        }
      }

      // Generate new OTP
      const otpCode = generateOtp();
      const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 1-minute expiry

      console.log(`Generated OTP:`, otpCode);

      // Construct the message
    const msg = `Your OTP for login is ${otpCode}. It is valid for 02 minutes. Do not share it with anyone.\n\nTeam Sumago Infotech`;

    const sender = 'SMGTCH';
    const dltTemplateId = '1207174427425038676';
    const authKey = '240394A0j2u3FiF6800cf90P1';

    // Encode message to use in URL
    const encodedMessage = encodeURIComponent(msg);

    // Construct final URL
    const apiUrl = `http://sms.happysms.in/api/sendhttp.php?authkey=${authKey}&mobiles=${mobile}&message=${encodedMessage}&sender=${sender}&route=4&country=91&DLT_TE_ID=${dltTemplateId}`;

    // Send the request
    const smsSent = await axios.get(apiUrl);

    if (!smsSent) return errorWithoutData("Failed to send OTP");

      // Save OTP to database
      const newOtp = this.AttendanceOtpVerification.create({
        otp: otpCode,
        admin_id: { id: user.id },
        expiry_time: expiryTime,
        todays_count: otpCount + 1,
      });
      await this.AttendanceOtpVerification.save(newOtp);

      // Send OTP via SMS API (assuming a function sendOtpSms)
      // const smsSent = await sendOtpSms(mobile, otpCode);
      // if (!smsSent) return errorWithoutData("Failed to send OTP");

      return successWithData("OTP sent successfully", { mobile, otpCode });
    } catch (err) {
      return errorWithoutData("Internal Server Error");
    }
  }

  public async verifyAttendanceOtp(mobile: string, otp: string) {
    // Validate user existence
    const user = await this.userRepository.findOneBy({
      mobile: mobile.toString(),
      isDeleted: false
    });
    if (!user) return errorWithoutData("User does not exist");

    if (!user.isActive || user.isDeleted) {
      return errorWithoutData("User is not allowed to receive OTPs");
    }

    // Fetch the latest OTP
    const otpRecord = await this.AttendanceOtpVerification.findOne({
      where: { user_id: { id: user.id } },
      relations: ["user_id"],
      order: { createdAt: "DESC" },
    });

    if (!otpRecord) return errorWithoutData("OTP not found");

    if (otpRecord.otp !== otp) return errorWithoutData("Invalid OTP");

    if (otpRecord.is_verified) {
      return errorWithoutData("OTP is already used");
    }

    const otpAge =
      (new Date().getTime() - otpRecord.expiry_time.getTime()) / 1000;
    if (otpAge > 60) return errorWithoutData("OTP has expired");

    await this.userRepository.update(
      { id: user.id },
      { isActive: true, is_otp_verified: true }
    );

    await this.AttendanceOtpVerification.update(
      { id: otpRecord.id },
      { is_verified: true }
    );

    const { accessToken, refreshToken } = await generateTokens(user);

    const data = {
      id: user.id,
      mobile: user.mobile,
      accessToken,
      refreshToken,
      isProfileCompleted: user.isProfileCompleted,
      is_answer_submitted: user.is_answer_submitted
    };
    return successWithData("OTP verified successfully", data);
  }

  public async verifyAttendanceOTPForAdmin(mobile: string, otp: string) {
    // Validate user existence
    const user = await this.adminRepository.findOneBy({
      mobile: mobile.toString(),
    });
    if (!user) return errorWithoutData("User does not exist");

    if (!user.isActive || user.isDeleted) {
      return errorWithoutData("User is not allowed to receive OTPs");
    }

    // Fetch the latest OTP
    const otpRecord = await this.AttendanceOtpVerification.findOne({
      where: { admin_id: { id: user.id } },
      relations: ["admin_id"],
      order: { createdAt: "DESC" },
    });

    if (!otpRecord) return errorWithoutData("OTP not found");

    if (otpRecord.otp !== otp) return errorWithoutData("Invalid OTP");

    if (otpRecord.is_verified) {
      return errorWithoutData("OTP is already used");
    }

    const otpAge =
      (new Date().getTime() - otpRecord.expiry_time.getTime()) / 1000;
    if (otpAge > 60) return errorWithoutData("OTP has expired");

    await this.adminRepository.update(
      { id: user.id },
      { isActive: true, is_otp_verified: true }
    );

    await this.AttendanceOtpVerification.update(
      { id: otpRecord.id },
      { is_verified: true }
    );



    const data = {
      id: user.id,
      mobile: user.mobile,
     
    };
    return successWithData("OTP verified successfully", data);
  }

  public async getAllAttendanceOtps() {
    try {
      const otpList = await this.AttendanceOtpVerification.find({
        order: { createdAt: "DESC" }
      });

      return successWithData("OTP list fetched successfully", otpList);
    } catch (error) {
      return errorWithoutData("Error fetching OTP list");
    }
  }

}
