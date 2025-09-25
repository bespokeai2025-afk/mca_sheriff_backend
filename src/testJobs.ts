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

    // await createTopicNotificationJob(title, body, data, topic, "10");
    // await createBatchNotificationJob(title, body, data, tokens, 10);


    // const result = await pushNotificationService.create({
    //     title: "New Reward Earned",
    //     message: body,
    //     payload: data,
    //     tokens,
    //     delay: 10,
    //     scheduledTime: new Date().toISOString().split('T')[0]
    // });
    // console.log(result)

    try {
        // const pushNotificationRepo = AppDataSource.getRepository(PushNotification);
        // await pushNotificationRepo.save({
        //     title: "New Reward Earned",
        //     message: "Congratulations! You earned a new reward.",
        //     payload: { data },
        //     tokens,
        //     scheduledTime: new Date().toISOString().split('T')[0],
        // });
    } catch (error) {
        console.log(error)
    }

    console.log('✅ Test jobs added successfully!');
};

addTestJobs().catch(console.error);

