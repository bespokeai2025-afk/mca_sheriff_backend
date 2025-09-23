// event-reminder.queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis();

export const eventReminderQueue = new Queue('event-reminder-queue', {
  connection,
});
