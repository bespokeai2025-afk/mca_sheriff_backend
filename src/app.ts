/**
 * Main application file for the backend server.
 * Sets up Express application, middleware, and routes.
 * Initializes database connection and starts the server.
 */

import express from 'express';
import { DataSource } from "typeorm";

// Import required middleware and utilities
import cors from 'cors';
import dotenv from 'dotenv'
import path from 'path';

// Database configuration
import { AppDataSource } from './config/database';
import { CronJobManager } from "./config/cronJobManager";

// Import route handlers
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import authRoutes from './routes/auth.routes'
import otpRoutes from './routes/otp.routes'
import userReferralCodeRoutes from './routes/userReferralCode.routes'
import mainCategoryRoutes from './routes/mainCategory.routes'
import eventtypeRoutes from './routes/eventType.routes'
import eventroutes from './routes/event.routes'
import adminRoutes from './routes/admin.routes'
import skillRoutes from './routes/skill.routes'
import answerRoutes from './routes/answer.routes'
import rewardRoutes from './routes/reward.routes'
import eventAttendanceRouts from './routes/eventAttendance.routes'
import evnetRegistrationRoutes from './routes/eventRegistration.routes'
import deleteAccountRequestRoute from './routes/deleteAccountRequest.routes'
import rewardHistoryRoutes from './routes/rewardHistory.routes'
import coinsRoutes from './routes/coin.routes'
import emailVerificationRoutes from './routes/EmailVerification.routes'
import OnboardingRoute from './routes/onboardingSlider.routes';
import feedbackRoutes from './routes/feedback.routes'

import appversionconfigRoutes from './routes/appConfig.routes'
import multerErrorHandler from "./middlewares/multerErrorHandler"; // ✅ Import the middleware
import faqRoutes from './routes/faq.routes'
import homeSliderRoutes from './routes/homeSlider.routes'
import refrenceSliderRoutes from './routes/refrenceSlider.routes'
import notificationTypesRoutes from './routes/notificationType.routes'
import notificationRoutes from './routes/notification.routes'
import pushNotificationRoutes from './routes/pushNotification.routes'
import notificationReadReceiptRoutes from './routes/notificationReadReceiptService.routes'
import deviceTokenRoutes from './routes/deviceToken.routes'
import surveyRoutes from './routes/survey_questions.routes'
import suerveyanswersRoutes from './routes/survey_answers.routes'
import userseruveryRouters from './routes/user_Survey_Answers.routes'
import attendanceotp from './routes/attendanceotp.routes'
import viewsRoutes from './routes/viewPages.routes'
import cron from "node-cron";
import { deleteOldOTPs } from "./utils/deleteOldOTPs";
import cookieParser from "cookie-parser";
import limiter from './config/rate-limit';
import { DateTime } from "luxon";
import callOutputDataRoutes from './routes/calloutputdata.routes'
import CRMDataRoutes from './routes/crmdata.routes'
// Load environment variables
dotenv.config()
import { logRequest, logResponse, logError } from "./logger";

// Initialize Express application
const app = express()
const PORT =
    process.env.NODE_ENV === "staging" ? process.env.STAGING_PORT as string :
        process.env.NODE_ENV === "local" ? process.env.LOCAL_PORT as string :
            process.env.DEV_PORT as string; // Default to DEV_PORT

// Configure middleware
//app.use(cors()); // Enable CORS for all routes
app.use(express.urlencoded({ extended: true })); // Parse form-data fields
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());

const allowedOrigins = [
    'http://localhost:4173',
    'https://admin.trakify.in',
    'https://devadmin.trakify.in',
    'http://localhost:3003',
    'http://localhost:3000'
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true, // 🔑 Required to send cookies
}));


// app.use(limiter)

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set views folder

app.use(express.static(path.join(__dirname, "public")));
app.use(logRequest);
app.use(logResponse);
app.get("/", (req, res) => {
    res.send("Server is running!");
});

// Serve static files from uploads directory
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configure routes
app.use('/users', userRoutes) // User management routes
app.use('/profile', profileRoutes) // User management routes
app.use("/auth", authRoutes); // Authentication routes
app.use("/auth/email", emailVerificationRoutes); // Keeping email routes separate
app.use('/api/user', otpRoutes) // OTP verification routes
app.use('/user-referral', userReferralCodeRoutes) // Referral code routes
app.use('/category', mainCategoryRoutes) // Main category routes
app.use('/admin', adminRoutes) // Admin routes
app.use('/skill', skillRoutes) // Skill management routes
app.use('/answers', answerRoutes) // Answer routes
app.use('/reward', rewardRoutes) // Reward system routes
app.use('/event-attendance', eventAttendanceRouts) // Event attendance routes
app.use('/event-registration', evnetRegistrationRoutes) // Event attendance routes
app.use('/event-types', eventtypeRoutes)
app.use('/event', eventroutes)
app.use('/reward-history', rewardHistoryRoutes)
app.use('/coins', coinsRoutes)
app.use('/deleteAccountRequestRoute', deleteAccountRequestRoute)
app.use('/reward-history', rewardHistoryRoutes)
app.use('/appversionconfigRoutes', appversionconfigRoutes)
app.use('/onboardingSlider', OnboardingRoute)
app.use('/feedback', feedbackRoutes)
app.use('/faq', faqRoutes)
app.use('/home-slider', homeSliderRoutes)
app.use('/refrence-slider', refrenceSliderRoutes)
app.use('/notification-types', notificationTypesRoutes)
app.use('/device-token', deviceTokenRoutes)
app.use('/notification', notificationRoutes)
app.use('/push-notification', pushNotificationRoutes)
app.use('/notification-read-receipt', notificationReadReceiptRoutes)
app.use('/survey-qustions', surveyRoutes)
app.use('/survey-answers', suerveyanswersRoutes)
app.use('/survey', userseruveryRouters)
app.use('/attendance-otp', attendanceotp) // Event attendance routes
app.use('/call-output-data', callOutputDataRoutes)
app.use('/crm-data', CRMDataRoutes)

app.use(multerErrorHandler);

app.use('/', viewsRoutes)
const fromDate = "2025-04-30";
const fromTime = "12:00:00"
const istDateTimeString = new Date(`${fromDate}T${fromTime}+05:30`);

console.log("UTC time:", istDateTimeString.toISOString()); // shows UTC

 
// Initialize database connection and start server
AppDataSource.initialize()
    .then(() => {
        app.listen(parseInt(PORT), "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
            console.log(new Date())
            console.log(istDateTimeString)
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
        const cronJobManager = new CronJobManager(AppDataSource);
        cronJobManager.startAllCronJobs();
    })
    .catch((err) => {
        console.error("Error Connecting Database", err);
        process.exit(1);
    });

cron.schedule("0 0 * * *", async () => {
    console.log("Running OTP cleanup job...");
    await deleteOldOTPs();
});

app.use(logError);
