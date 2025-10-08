import express from 'express';
import { DataSource } from "typeorm";
// Import required middleware and utilities
import cors from 'cors';
import dotenv from 'dotenv'
import path from 'path';
// Database configuration
import { AppDataSource } from './config/database';
// import { CronJobManager } from "./config/cronJobManager";
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import authRoutes from './routes/auth.routes'
import otpRoutes from './routes/otp.routes'
import adminRoutes from './routes/admin.routes'
import emailVerificationRoutes from './routes/EmailVerification.routes'
import multerErrorHandler from "./middlewares/multerErrorHandler"; // ✅ Import the middleware
import viewsRoutes from './routes/viewPages.routes'
// import cron from "node-cron";
import cookieParser from "cookie-parser";
import limiter from './config/rate-limit';
import callOutputDataRoutes from './routes/callOutputDataUser.routes'
import CRMDataRoutes from './routes/crmdata.routes'
import DashboardRoutes from './routes/dashboard.routes'
import CenterStage from './routes/centerstagedcall.routes'
import CallFrequency from './routes/callFrequencySetting.routes'
import Agent from './routes/agent.routes'
import PhoneNumbers from './routes/phoneNumber.routes'
import LeadFiltermaster from './routes/leadFilterMaster.routes'
import { CallScheduler } from "./utils/scheduler";
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
app.use('/admin', adminRoutes) // Admin routes

app.use('/call-output-data', callOutputDataRoutes)
app.use('/crm-data', CRMDataRoutes)
app.use('/leadfiltermaster',LeadFiltermaster)

app.use('/dashboard', DashboardRoutes)
app.use('/center-stage', CenterStage)
app.use('/frquency-setting', CallFrequency)
app.use('/agent', Agent)
app.use('/phoneNumber', PhoneNumbers)
app.use(multerErrorHandler);

app.use('/', viewsRoutes)
const istDateTimeString = new Date();
const currentUTC = new Date().toISOString();
console.log("Current UTC:", istDateTimeString.toISOString());
console.log("Current IST:", istDateTimeString.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
// Initialize database connection and start server
AppDataSource.initialize()
   .then(async () => { 
        app.listen(parseInt(PORT), "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
            console.log(new Date())
            console.log(currentUTC)
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
        // const cronJobManager = new CronJobManager(AppDataSource);
        // cronJobManager.startAllCronJobs();

           // This now works fine
        await CallScheduler.initialize();
        console.log("All call frequency schedulers initialized!");
    })
    .catch((err) => {
        console.error("Error Connecting Database", err);
        process.exit(1);
    });
app.use(logError);
