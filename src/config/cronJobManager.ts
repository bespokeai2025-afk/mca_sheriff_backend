import cron from "node-cron";
import { DataSource } from "typeorm";

import { User } from '../entities/User';
// import { NotificationType } from '../entities/NotificationType';
// import { Notification } from '../entities/Notification'; // Adjust the import path as necessary

import { AppDataSource } from "../config/database";
// import { NotificationService } from "../services/notification.service";
// import { TomorrowEvent } from "../entities/Tomorrow_events";

// import { PushNotification } from '../entities/PushNotification';
import { LessThan } from 'typeorm';
// import { PushNotificationService } from "../services/pushNotification.service";


// const notificationService = new NotificationService();
// const pushNotificationService = new PushNotificationService();

export class CronJobManager {
  constructor(private dataSource: DataSource) { }
  // private eventRepository = AppDataSource.getRepository(Event);
  // private notificationRepository = AppDataSource.getRepository(Notification);
  // private registrationRepository = AppDataSource.getRepository(EventRegistration);
  // private notificationTypeRepository = AppDataSource.getRepository(NotificationType);
  // ✅ 1️⃣ Update completed events
  async updateCompletedEvents(): Promise<void> {
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS
    console.log(currentDate, currentTime)

    try {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const currentTime = now.toTimeString().split(" ")[0]; // "HH:mm:ss"

      // ✅ 1. Mark events as Completed
      // const eventsToUpdate = await this.eventRepository
      //   .createQueryBuilder("event")
      //   .andWhere(
      //     `(event.to_date < :currentDate OR (event.to_date = :currentDate AND event.to_time < CAST(:currentTime AS time)))`,
      //     { currentDate, currentTime }
      //   )
      //   .getMany();
      // console.log("eventsToUpdate :", eventsToUpdate.length)
      // // console.log(eventsToUpdate, "eventsToUpdate")
      // if (eventsToUpdate.length > 0) {
      //   await this.dataSource
      //     .createQueryBuilder()
      //     .update(Event)
      //     .set({ status: "Completed" })
      //     .where("id IN (:...eventIds)", { eventIds: eventsToUpdate.map(event => event.id) })
      //     .execute();

      //   console.log(`✅ Updated ${eventsToUpdate.length} events to "Completed" status.`);

      //   await this.notificationRepository
      //     .createQueryBuilder()
      //     .delete()
      //     .where("event_id IN (:...eventIds)", { eventIds: eventsToUpdate.map(event => event.id) })
      //     .execute();
      //   console.log(`✅ Deleted notifications for completed events.`);
      // }

      // ✅ 2. Mark events as Running
      const runningEventsToUpdate = await this.dataSource
        .getRepository("Event")
        .createQueryBuilder("event")
        .where("event.status NOT IN (:...statuses)", { statuses: ["Completed", "Running"] })
        .andWhere(
          `(event.from_date < :currentDate OR (event.from_date = :currentDate AND event.from_time <= CAST(:currentTime AS time)))`,
          { currentDate, currentTime }
        )
        .andWhere(
          `(event.to_date > :currentDate OR (event.to_date = :currentDate AND event.to_time > CAST(:currentTime AS time)))`,
          { currentDate, currentTime }
        )
        .getMany();

      if (runningEventsToUpdate.length > 0) {
        await this.dataSource
          .createQueryBuilder()
          .update(Event)
          .set({ status: "Running" })
          .where("id IN (:...eventIds)", { eventIds: runningEventsToUpdate.map(event => event.id) })
          .execute();

        console.log(`✅ Updated ${runningEventsToUpdate.length} events to "Running" status.`);
      } else {
        console.log("⏳ No events to update to 'Running' status.");
      }
    } catch (error) {
      console.error("❌ Error updating event statuses:", error);
    }

  }


  // async fetchDailyPushNotifications(): Promise<any> {
  //   const pushNotification = AppDataSource.getRepository(PushNotification);
  //   const today = new Date();
  //   // today.setHours(0, 0, 0, 0);

  //   const notifications = await pushNotification.find({
  //     where: {
  //       scheduledTime: today, // Fetch today's notifications
  //     },
  //   });

  //   for (const notif of notifications) {
  //     if (notif.topic != "" && notif.topic.length > 2) {

  //       const jobId = await createTopicNotificationJob(notif.title, notif.message, notif.payload, notif.topic, notif.delay)

  //       await pushNotification.update(notif.id, { job_id: jobId });
  //     } else {
  //       createBatchNotificationJob(notif.title, notif.message, notif.payload, notif.tokens, parseInt(notif.delay))
  //     }
  //   }

  //   console.log(`✅ Loaded ${notifications.length} notifications into Redis.`);
  // };
  async cleanupOldNotifications(): Promise<any> {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const oldNotifications = await notificationRepo.find({
      // where: {
      //   createdAt: LessThan(fifteenDaysAgo)
      // }
    });

    if (oldNotifications.length > 0) {
      await notificationRepo.remove(oldNotifications);
      console.log(`🧹 Deleted ${oldNotifications.length} old notifications.`);
    } else {
      console.log(`ℹ️ No old notifications to delete.`);
    }
  };

  // ✅ Start all cron jobs
  startAllCronJobs(): void {
    console.log("🚀 Starting all cron jobs...");

    // 🔄 Run every 15 minutes - Update event statuses


    // // 🚀 Check every minute if an event starts in 10 minutes
    // cron.schedule("01 16 * * *", async () => {
    //   const currentTime = new Date().toLocaleTimeString(); // Get current time
    //   console.log(`⏳ Checking for events starting in 10 minutes... [${currentTime}]`);
    // });

    // Schedule cron job to run every day at midnight
    cron.schedule('56 11 * * *', () => {
      console.log('⏳ Running daily Push notification scheduler...');
      // this.fetchDailyPushNotifications();
      this.updateCompletedEvents();
      this.cleanupOldNotifications();

    });



    console.log("✅ All cron jobs are scheduled!");
  }
}
