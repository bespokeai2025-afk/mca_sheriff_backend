// import { Queue } from 'bullmq';
// import { redisConfig } from './config/redis';

import { AppDataSource } from "./config/database";
// import { PushNotificationService } from "./services/pushNotification.service";
// import { createBatchNotificationJob, createTopicNotificationJob } from "./workers/notification.worker";
// import { PushNotification } from "./entities/PushNotification";

// const pushNotificationService = new PushNotificationService();

// Add test jobs for demonstration
const addTestJobs = async () => {
    const title = "New Feature Alert!"
    const body = "Check out our new feature now!"
    const data = { feature: "Fast Delivery" }
    const topic = "all_users"
    const tokens = [
        "dVxs7Hf4Q6mOO05pD52Db1:APA91bFlJKSogB-hEfPy0stmoGHwn9iy2_yP--ptd37ljOGNgs7loJzaqxuq2DgoIWC9nZMHlJ7CoO79D61mq3TLENJpj8YTHuPEySlU65p2V9m35oHHV8o"
    ]
    const duration = 10

    try {
       
    } catch (error) {
        console.log(error)
    }

    console.log('✅ Test jobs added successfully!');
};

addTestJobs().catch(console.error);

