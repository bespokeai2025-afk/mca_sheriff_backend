// import axios from "axios";

// Generate a 6-digit OTP
export const generateOtp = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};


// // Send OTP via SMS API
// export const sendOtpSms = async (mobile: string, otp: string): Promise<boolean> => {
//     try {
//         const smsApiUrl = "https://sms-provider.com/api/send";
//         const apiKey = "YOUR_SMS_API_KEY"; // Replace with actual API key

//         const response = await axios.post(smsApiUrl, {
//             apiKey,
//             mobile,
//             message: `Your OTP is ${otp}. Do not share it with anyone.`,
//         });

//         return response.data.success;
//     } catch (error) {
//         console.error("SMS sending failed:", error);
//         return false;
//     }
// };
