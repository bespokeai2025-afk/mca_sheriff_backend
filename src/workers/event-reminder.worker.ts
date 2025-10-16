import { Worker } from 'bullmq';
import IORedis from 'ioredis';
// import { Notification } from '../entities/Notification'; // Adjust the import path as necessary
import { AppDataSource } from '../config/database';

const connection = new IORedis();

const eventReminderWorker = new Worker('event-reminder-queue', async job => {
    console.log("✅ Notification saved successfully");

    const { eventId, message } = job.data;
}, { connection });
