import { Worker, Job, Queue, delay } from 'bullmq';
import redis, { redisConfig } from '../config/redis';
import admin from 'firebase-admin';
import { Notification } from '../entities/Notification';
import { NotificationType } from '../entities/NotificationType';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { PushNotificationService } from '../services/pushNotification.service';

const pushNotificationService = new PushNotificationService();

import { Event } from '../entities/Event';
(async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Data Source Initialized");
        }
        if (!AppDataSource.hasMetadata(NotificationType)) {
            console.warn("⚠️ NotificationType not registered. Forcing import.");
            require("../entities/NotificationType");
        }


        const eventReminderWorker = new Worker('event-reminder-queue', async job => {
            try {
                const { eventId, message } = job.data;
                console.log("🚀 Event Reminder Worker started for job:", job.id);
                console.log("✅ Notification to JOB:", job.data);

                const notificationRepo = AppDataSource.getRepository(Notification);
                const notificationTypeRepository = AppDataSource.getRepository(NotificationType);

                const notificationType = await notificationTypeRepository.findOne({
                    where: { type: 'both', isActive: true, isDeleted: false }
                });

                if (!notificationType) {
                    console.error("❌ No active NotificationType found for 'both'");
                    return;
                }

                const notification = notificationRepo.create({
                    message,
                    title: "Event Reminder",
                    notificationcategory: 'event_remainder',
                    type: notificationType,
                    is_read: false,
                    is_actioned: false,
                    is_global: true,
                    event: { id: eventId },// ✅ TypeORM accepts this as a shortcut for relation
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });

                console.log("✅ Notification to save:", notification);
                try {
                    await notificationRepo.save(notification);
                    console.log("✅ Notification saved successfully");
                } catch (saveError) {
                    console.error("❌ Error saving notification:", saveError);
                }
                console.log("✅ Notification saved successfully");

            } catch (error) {
                console.error("❌ Error in eventReminderWorker:", error);
            }


        }, { connection: redisConfig });
        console.log('🚀 eventReminderWorker worker is running...');

        console.log('🚀 Workers are running...');

    } catch (err) {
        console.error("❌ Error initializing database or workers:", err);
    }
})();
export const eventReminderQueue = new Queue('event-reminder-queue', {
    connection: redisConfig,
});
const eventStatusUpdateworker = new Worker(
    'event-satus-update-queue',
    async job => {
        const eventRepository = AppDataSource.getRepository(Event);
        const notificationRepository = AppDataSource.getRepository(Notification);

        const { eventId, status } = job.data;

        console.log(`🔄 Updating event ${eventId} status to ${status}`);

        // Find the event and update status
        const event = await eventRepository.findOneBy({ id: eventId });

        if (!event) {
            console.error(`❌ Event not found: ${eventId}`);
            return;
        }

        event.status = status; // Assuming you have a "status" field in your Event entity
        await eventRepository.save(event);
        await notificationRepository.delete({

            event: { id: event.id }
        });
        console.log(`✅ Event ${eventId} status updated to ${status}`);
    },
    {
        connection: redisConfig,
    }
);

export const eventStatusUpdateQueue = new Queue('event-satus-update-queue', {
    connection: redisConfig,
});
// Firebase Admin SDK Initialization
admin.initializeApp({
    // credential: admin.credential.cert(require('../config/app-notification-3c6a3-firebase-adminsdk-fbsvc-3134b19674.json'))
    credential: admin.credential.cert(require('../config/scopeengagement-firebase-adminsdk-fbsvc-22adab8641.json'))
});
AppDataSource.initialize(); // IMPORTANT

// Global function to send notification to a topic
export const sendNotificationToTopic = async (title: string, body: string, data: any, topic: string, ttlSeconds: number) => {
    const expirationTimestamp = Math.floor(Date.now() / 1000) + ttlSeconds; // current time + ttl in seconds
    const payload: admin.messaging.TopicMessage = {
        topic,
        data, // Ensures additional data is sent for custom handling
        android: {
            priority: "high" as "high",
            ttl: ttlSeconds * 1000, // TTL in ms
        },
        apns: {
            headers: {
                "apns-priority": "10",
                "apns-expiration": expirationTimestamp.toString(),
            },
        },
    };

    await admin.messaging().send(payload);

};

// Global function to send batch notifications to multiple tokens
export const sendBatchNotification = async (title: string, body: string, data: any, tokens: string[], ttlSeconds: number) => {

    const expirationTimestamp = Math.floor(Date.now() / 1000) + ttlSeconds; // current time + ttl in seconds

    const payload: admin.messaging.MulticastMessage = {
        tokens, // ✅ Corrected from TopicMessage to MulticastMessage
        data,
        android: {
            priority: "high" as "high",
            ttl: ttlSeconds * 1000, // TTL in ms
        },
        apns: {
            headers: {
                "apns-priority": "10",
                "apns-expiration": expirationTimestamp.toString(),
            },
        },
    };

    await admin.messaging().sendEachForMulticast(payload);
};

// Queue instance
const notificationQueue = new Queue('notificationQueue', {
    connection: redisConfig
});

export const profileCompletionQueue = new Queue('profile-completion-queue', {
    connection: redisConfig,
});

// Function to add a topic notification to the queue
export const createTopicNotificationJob = async (title: string, body: string, data: any, topic: string, duration: string, ttl?: number) => {
    const job = await notificationQueue.add('Topic Notification', { title, body, data, topic, ttl: (ttl != null) ? ttl : 86400 }, {
        delay: parseInt(duration) * 1000,
        removeOnComplete: true,
        removeOnFail: true
    });

    return job.id;       // ✨ RETURN the job id
};

// Function to add batch notifications to the queue (splits tokens into groups of 500)
export const createBatchNotificationJob = async (title: string, body: string, data: any, tokens: string[], duration: number, ttl?: number) => {
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
        const tokenBatch = tokens.slice(i, i + chunkSize);
        await notificationQueue.add('Batch Notification', { title, body, data, tokens: tokenBatch, ttl: (ttl != null) ? ttl : 86400 }, {
            delay: duration * 1000,
            removeOnComplete: true,
            removeOnFail: true
        });
    }
};

export const deleteNotificationFromQueue = async (oldNotifs: any) => {
    console.log(oldNotifs)
    for (const notif of oldNotifs) {
        if (notif.job_id) {
            const job = await notificationQueue.getJob(notif.job_id);
            if (job) {
                await job.remove(); // ✅ Remove job from queue
                console.log(`Removed job with ID: ${notif.job_id}`);
            }
        }
    }

}

class NotificationServicer {
    async sendGeneralNotification(userId: string, message: string) {
        const notificationRepo = AppDataSource.getRepository(Notification);
        const notificationTypeRepository = AppDataSource.getRepository(NotificationType);
        const userRepository = AppDataSource.getRepository(User);

        // Fetch the user, ensure the user exists and is active
        const user = await userRepository.findOne({
            where: { id: userId, isActive: true, isDeleted: false }
        });

        if (!user) {
            console.error(`❌ User with ID ${userId} not found or is inactive.`);
            return;
        }

        // Fetch the notification type, ensure it exists and is active
        const notificationType = await notificationTypeRepository.findOne({
            where: { type: "both", isActive: true, isDeleted: false }
        });

        if (!notificationType) {
            console.error("❌ No active NotificationType found for 'both'");
            return;
        }

        // Create the notification entity
        const notification = notificationRepo.create({
            user,                       // Link to the found user
            type: notificationType,     // Link to the found notification type
            message,
            notificationcategory:'update_profile',
            title: 'update_profile',
            is_read: false,
            is_actioned: false,
            is_global: false,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // Set expiry to 7 days from now
        });

        // Save the notification to the database
        try {
            await notificationRepo.save(notification);
            console.log(`✅ Sent general notification to user ${userId}`);
        } catch (error) {
            console.error(`❌ Error saving notification for user ${userId}:`, error);
        }

        // Optionally, trigger push notifications (e.g., Firebase)
        // Example: sendNotificationToTopic(...);
    }
}

const notificationServicer = new NotificationServicer();

const profileworker = new Worker(
    'profile-completion-queue',
    async job => {
        const { userId, message } = job.data;

        // ✅ Use the instance to call the method
        await notificationServicer.sendGeneralNotification(userId, message);

    },
    {
        connection: redisConfig,
    }
);



// Notification Worker
const notificationWorker = new Worker('notificationQueue', async (job) => {
    const { title, data, body, topic, tokens, ttl } = job.data;

    if (topic) {
        await sendNotificationToTopic(title, body, data, topic, ttl);
    } else if (tokens) {
        await sendBatchNotification(title, body, data, tokens, ttl);
    }

    console.log(`✅ Notification sent successfully for job: ${job.id}`);

    const isDeleted = await redis.del(`notification:${job.id}`);
    console.log(`isdeleted: ${isDeleted}`)
}, {
    connection: redisConfig
});

console.log('🚀 Notification worker is running...');