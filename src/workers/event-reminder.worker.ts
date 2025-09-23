// // event-reminder.worker.ts
// import { Worker } from 'bullmq';
// import IORedis from 'ioredis';
// import { NotificationEntity } from './entities/notification.entity';
// import { AppDataSource } from './data-source';

// const connection = new IORedis();

// const eventReminderWorker = new Worker('event-reminder-queue', async job => {
//     const { eventId, message } = job.data;

//     const notificationRepo = AppDataSource.getRepository(NotificationEntity);

//     const notification = notificationRepo.create({
//         eventId,
//         message,
//         createdAt: new Date(),
//     });

//     await notificationRepo.save(notification);

// }, { connection });


import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Notification } from '../entities/Notification'; // Adjust the import path as necessary
import { AppDataSource } from '../config/database';

const connection = new IORedis();

const eventReminderWorker = new Worker('event-reminder-queue', async job => {
    console.log("✅ Notification saved successfully");

    const { eventId, message } = job.data;

    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = notificationRepo.create({
        // eventId,
        message,
        event: eventId || null, // Set to null if eventId is not provided
        // user: null, // Set to null for global notifications
        // type: "InApp",
        notificationcategory: "temp",

        is_read: false,
        is_actioned: false,
        is_global: true, // ✅ Directly setting as global
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)// Expires in 7 days
    });

    await notificationRepo.save(notification);

}, { connection });
