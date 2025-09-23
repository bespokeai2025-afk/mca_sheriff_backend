// services/NotificationService.ts
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification'; // Adjust the import path as necessary
import { errorWithoutData, errorWithData, successWithData, successWithoutData, successWithData2 } from '../config/ApiResponse';
import { NotificationType } from '../entities/NotificationType';
import { User } from '../entities/User';
import { Event } from '../entities/Event';
import { In } from "typeorm";

import { createBatchNotificationJob, createTopicNotificationJob } from '../workers/notification.worker';
import { PushNotificationService } from './pushNotification.service';
import { schedule } from 'node-cron';
import { NotificationReadReceipt } from '../entities/NotificationReadReceipt';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const IST = 'Asia/Kolkata';
const pushNotificationService = new PushNotificationService();

export class NotificationService {
    private notificationRepository = AppDataSource.getRepository(Notification);
    private notificationTypeRepository = AppDataSource.getRepository(NotificationType);
    private userRepository = AppDataSource.getRepository(User);
    private eventRepository = AppDataSource.getRepository(Event);
    private readreceiptRepository = AppDataSource.getRepository(NotificationReadReceipt); // Assuming NotificationReadReceipt is the same as Notification for this example
    // ✅ Fix 1: Import In
    public async sendNotificationevent(
        eventId: string | null,
        message: string,
        type: "InApp" | "Push" | "both",
        notificationcategory: string
    ) {
        try {
            // Fetch Notification Type
            console.log("✅ Global notification saved successfully----", notificationcategory);

            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type, isActive: true, isDeleted: false }
            });

            if (!notificationType) {
                return errorWithoutData("Notification Type not found");
            }
            // Fetch Event if applicable
            let event = null;
            if (eventId) {
                event = await this.eventRepository.findOne({
                    where: { id: eventId, isActive: true, isDeleted: false }
                });

                if (!event) {
                    return errorWithoutData("Event not found");
                }
            }

            // ✅ Always create a single global notification
            const globalNotification = this.notificationRepository.create({
                event: event || undefined,
                type: notificationType,
                notificationcategory: notificationcategory,
                message,
                title: 'New Event Added',
                is_read: false,
                is_actioned: false,
                is_global: true, // ✅ Directly setting as global
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
            });

            await this.notificationRepository.save(globalNotification);
            console.log("✅ Global notification saved successfully----", globalNotification);
            return successWithData("Global notification sent", globalNotification);

        } catch (err) {
            console.error("❌ Error sending global notification:", err);
            return errorWithoutData("Error sending global notification");
        }
    }

    public async sendNotification(
        userIds: string[],
        eventId: string | null,
        message: string,
        type: "InApp" | "Push" | "both",
        isGlobal: boolean = false,
        notificationcategory: string

    ) {
        try {
            if (userIds.length === 0) {
                return errorWithoutData("No users provided for notification");
            }

            // Fetch users
            const users = await this.userRepository.find({
                where: { id: In(userIds), isActive: true, isDeleted: false } // ✅ Fix 1: Now 'In' is recognized
            });
            if (!users.length) {
                return errorWithoutData("No active users found for notifications");
            }

            // Fetch Notification Type
            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type, isActive: true, isDeleted: false }
            });

            if (!notificationType) {
                return errorWithoutData("Notification Type not found");
            }
            // Fetch Event if applicable
            let event = null;
            if (eventId) {
                event = await this.eventRepository.findOne({
                    where: { id: eventId, isActive: true, isDeleted: false }
                });

                if (!event) {
                    return errorWithoutData("Event not found");
                }
            }

            // Create notifications for all users
            const notifications = users.map(user => ({
                user,
                event: event || undefined,  // ✅ Fix 2: Avoid null values
                type: notificationType,
                message,
                is_read: false,
                is_actioned: false,
                is_global: isGlobal,
                notificationcategory: notificationcategory,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
            }));
            const savedNotifications = await this.notificationRepository.save(notifications);

            return successWithData(`${savedNotifications.length} notifications sent`, savedNotifications);
        } catch (err) {
            return errorWithoutData("Error sending notifications"); // ✅ Fix 3: Use errorWithoutData
        }
    }

    public async sendRewardNotification(
        userId: string,
        eventId: string,
        message: string
    ) {
        try {
            // Fetch user
            const user = await this.userRepository.findOne({
                where: { id: userId, isActive: true, isDeleted: false }
            });
            if (!user) {
                return errorWithoutData("User not found");
            }

            // Fetch event
            const event = await this.eventRepository.findOne({
                where: { id: eventId, isActive: true, isDeleted: false }
            });
            if (!event) {
                return errorWithoutData("Event not found");
            }

            // Fetch notification type
            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type: "both", isActive: true, isDeleted: false }
            });
            if (!notificationType) {
                return errorWithoutData("Notification Type not found");
            }

            // Create notification payload
            const notificationPayload = this.notificationRepository.create({
                user,
                event,
                type: notificationType,
                message,
                is_read: false,
                is_actioned: false,
                is_global: false,
                notificationcategory: "reward_earned",
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Save notification
            const savedNotification = await this.notificationRepository.save(notificationPayload);

            return successWithData("Reward notification sent successfully", savedNotification);
        } catch (err) {
            return errorWithoutData("Error sending reward notification");
        }
    }

    public async sendGeneralNotification(
        userId: string,
        message: string,
        eventId?: string // Make eventId optional
    ) {
        try {
            // Fetch user

            const user = await this.userRepository.findOne({
                where: { id: userId, isActive: true, isDeleted: false }
            });
            if (!user) {
                return errorWithoutData("User not found");
            }

            // Fetch notification type
            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type: "both", isActive: true, isDeleted: false }
            });
            if (!notificationType) {
                return errorWithoutData("Notification Type not found");
            }

            // If eventId is provided, fetch event
            let event = null;
            if (eventId) {
                event = await this.eventRepository.findOne({
                    where: { id: eventId, isActive: true, isDeleted: false }
                });
                if (!event) {
                    return errorWithoutData("Event not found");
                }
            }

            // Create notification payload
            const notificationPayload = this.notificationRepository.create({
                user,
                event: event || undefined, // Pass event or null
                type: notificationType,
                message,
                notificationcategory: "reward_earned",
                is_read: false,
                is_actioned: false,
                is_global: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Save notification
            const savedNotification = await this.notificationRepository.save(notificationPayload);

            return successWithData("Notification sent successfully", savedNotification);
        } catch (err) {
            return errorWithoutData("Error sending notification");
        }
    }

    public async sendProfileupdate(
        userId: string,
        message: string,
        eventId?: string // Make eventId optional
    ) {
        try {
            // Fetch user
            console.log("📥 sendProfileupdate called with userId: before 30s");

            await new Promise((resolve) => setTimeout(resolve, 30000));
            console.log("📥 sendProfileupdate called with userId: aftere 30s");
            const user = await this.userRepository.findOne({
                where: { id: userId, isActive: true, isDeleted: false }
            });
            if (!user) {
                return errorWithoutData("User not found");
            }

            // Fetch notification type
            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type: "both", isActive: true, isDeleted: false }
            });
            if (!notificationType) {
                return errorWithoutData("Notification Type not found");
            }

            // If eventId is provided, fetch event
            let event = null;
            if (eventId) {
                event = await this.eventRepository.findOne({
                    where: { id: eventId, isActive: true, isDeleted: false }
                });
                if (!event) {
                    return errorWithoutData("Event not found");
                }
            }

            // Create notification payload
            const notificationPayload = this.notificationRepository.create({
                user,
                event: event || undefined, // Pass event or null
                type: notificationType,
                message,
                notificationcategory: "reward_earned",
                is_read: false,
                is_actioned: false,
                is_global: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Save notification
            const savedNotification = await this.notificationRepository.save(notificationPayload);

            return successWithData("Notification sent successfully", savedNotification);
        } catch (err) {
            return errorWithoutData("Error sending notification");
        }
    }

    public async sendsystemupdate(message: string) {
        try {
            console.log("📥 sendsystemupdate called with message:", message);

            // Fetch notification type
            const notificationType = await this.notificationTypeRepository.findOne({
                where: { type: "both", isActive: true, isDeleted: false }
            });

            if (!notificationType) {
                console.error("❌ Notification Type not found");
                return errorWithoutData("Notification Type not found");
            }

            console.log("🔍 Fetched notificationType:", notificationType);

            // Create notification payload
            const notificationPayload = this.notificationRepository.create({
                type: notificationType,
                title: "System Update", // Required by entity
                message,
                notificationcategory: "app_version_update",
                is_read: false,
                is_actioned: false,
                is_global: true,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            console.log("📦 Notification payload to save:", notificationPayload);

            // Save notification
            const savedNotification = await this.notificationRepository.save(notificationPayload).catch(err => {
                console.error("❌ Error while saving notification:", err);
                throw err;
            });

            console.log("✅ Global notification saved successfully:", savedNotification);

            return successWithData("Notification sent successfully", savedNotification);
        } catch (err) {
            console.error("❌ Error sending notification:", err);
            return errorWithoutData("Error sending notification");
        }
    }

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('Only admin can use this service.'); // Admin only access
        // }

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'event', 'type']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All notifications", notifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findById(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }
        const notification = await this.notificationRepository.findOne({
            where: { id }, relations: ['user', 'event', 'type']
        });
        if (!notification) {
            return errorWithoutData('Notification not found');
        }
        return successWithData("Notification found", notification);
    }

    public async findByUserId(
        id: string,
        verifyUser: any,
        pageSize: number,
        currentPage: number
    ) {
        const user: any = await this.userRepository.findOne({
            where: { id: id, isActive: true, isDeleted: false },
        });

        if (!user) return errorWithoutData('User not found');

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: [
                { user: { id: id }, isActive: true, isDeleted: false },  // User-specific notifications
                { is_global: true, isActive: true, isDeleted: false }    // Global notifications
            ],
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['event', 'type', 'event.event_type_id']
        });
        let readCount = 0;

        const formattedNotifications = await Promise.all(
            notifications.map(async (notification) => {
                let isRead: boolean;

                if (notification.is_global) {
                    // For global notifications, check NotificationReadReceipt for user
                    const readReceipt = await this.readreceiptRepository.findOne({
                        where: {
                            user: { id: id },
                            notification: { id: notification.id }
                        }
                    });
                    isRead = !!readReceipt;
                } else {
                    // For user-specific, use the notification's is_read value
                    isRead = notification.is_read;
                }
                if (isRead) readCount++;

                return {
                    id: notification.id,
                    isActive: notification.isActive,
                    isDeleted: notification.isDeleted,
                    createdAt: notification.createdAt,
                    updatedAt: notification.updatedAt,
                    message: notification.message,
                    is_read: isRead,
                    is_actioned: notification.is_actioned,
                    expires_at: notification.expires_at,
                    is_global: notification.is_global,
                    notificationcategory: notification.notificationcategory,
                    notificationType: notification.type?.type || '',
                    notificationTitle: notification.event?.title || '',
                    notificationMessage: notification.message || '',
                    notificationPayload: {
                        eventId: notification.event?.id || '',
                        eventTypeId: notification.event?.event_type_id?.id || '',
                        eventName: notification.event?.title || '',
                    }
                };
            })
        );

        const totalPages = Math.ceil(totalItems / pageSize);
        const unreadCount = totalItems - readCount;

        return successWithData2(`All notifications of user`, formattedNotifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize,

        }, unreadCount);
    }

    public async findByEventId(id: string, verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const event: any = await this.eventRepository.findOne({
            where: {
                id: id, isActive: true, isDeleted: false
            }
        })
        if (!event) return errorWithoutData('event not found');

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: { event: { id: id }, isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'event', 'type']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData(`All notifications of event ${event.id}`, notifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }
    public async findByTypeId(id: string, verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const type: any = await this.notificationTypeRepository.findOne({
            where: {
                id: id, isActive: true, isDeleted: false
            }
        })
        if (!type) return errorWithoutData('type not found');

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: { type: { id: type.id }, isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'event', 'type']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData(`All notifications of notification type ${type.type}`, notifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }

    public async findByUserIdEventId(user_id: string, event_id: string, verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const user: any = await this.userRepository.findOne({
            where: {
                id: user_id, isActive: true, isDeleted: false
            }
        })
        const event: any = await this.eventRepository.findOne({
            where: {
                id: event_id, isActive: true, isDeleted: false
            }
        })
        if (!user) return errorWithoutData('user not found');
        if (!event) return errorWithoutData('event not found');

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: { user: { id: user.id }, event: { id: event.id }, isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'event', 'type']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData(`All notifications of event ${event.id} of user ${user.id}`, notifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }
    public async findByUserIdEventIdTypeId(user_id: string, event_id: string, type_id: string, verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const user: any = await this.userRepository.findOne({
            where: {
                id: user_id, isActive: true, isDeleted: false
            }
        })
        const event: any = await this.eventRepository.findOne({
            where: {
                id: event_id, isActive: true, isDeleted: false
            }
        })
        const type: any = await this.notificationTypeRepository.findOne({
            where: {
                id: type_id, isActive: true, isDeleted: false
            }
        })
        if (!user) return errorWithoutData('user not found');
        if (!event) return errorWithoutData('event not found');
        if (!type) return errorWithoutData('type not found');

        const [notifications, totalItems] = await this.notificationRepository.findAndCount({
            where: { user: { id: user.id }, event: { id: event.id }, type: { id: type.id }, isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'event', 'type']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData(`All notifications of event ${event.id} of user ${user.id}`, notifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }

    public async create(data: any, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const user: any = await this.userRepository.findOne({
            where: {
                id: data.user, isActive: true, isDeleted: false
            }
        })
        const event: any = await this.eventRepository.findOne({
            where: {
                id: data.event, isActive: true, isDeleted: false
            }
        })
        const type: any = await this.notificationTypeRepository.findOne({
            where: {
                id: data.type, isActive: true, isDeleted: false
            }
        })

        if (!user) return errorWithoutData('User not found')
        if (!event) return errorWithoutData('Event not found')
        if (!type) return errorWithoutData('Notification Type not found')


        const newNotification = this.notificationRepository.create(data);

        const savedNotification = await this.notificationRepository.save(newNotification);


        return successWithData('Notification created successfully', savedNotification);
    }

    public async update(id: string, data: any, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }

        const notification = await this.notificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!notification) {
            return errorWithoutData('Notification not found');
        }
        await this.notificationRepository.update(id, data);
        return successWithoutData('Notification updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.'); // Admin only access
        }
        const notification = await this.notificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!notification) {
            return errorWithoutData('Notification not found');
        }

        notification.isDeleted = true;
        notification.isActive = false;

        await this.notificationRepository.save(notification);
        return successWithoutData('Notification deleted successfully');
    }



    public async scheduleEventNotifications(eventId: string, eventName: string, event_start_time_utc: Date) {

        const now = new Date();
        const eventDateTime = event_start_time_utc;

        const eventMorning8IST = new Date(new Date(eventDateTime).setHours(8, 0, 0, 0));
        const oneHourBeforeIST = new Date(eventDateTime.getTime() - 60 * 60 * 1000);
        const tenMinutesBeforeIST = new Date(eventDateTime.getTime() - 10 * 60 * 1000);
        const eventStartIST = eventDateTime;
        const midnight = new Date(new Date(eventDateTime).setHours(0, 0, 0, 0)); // Midnight (12 AM) on the same day


        console.log(now)
        console.log(eventDateTime)
        console.log(oneHourBeforeIST)
        console.log(midnight)

        const notifications = [
            {
                title: `Event Created`,
                message: `Event "${eventName}" has been created!`,
                delay: 0,
                topic: "all_users",
                scheduledTime: now,
                payload: {
                    notificationType: "event_created",
                    notificationTitle: "New Event Added",
                    notificationMessage: `Event "${eventName}" has been created!`,
                    eventId,
                    eventName,
                },
                ttl: 3600 * 24
            },
            {
                title: `Reminder`,
                message: `Good morning! Event "${eventName}" is happening today.`,
                delay: (eventMorning8IST.toDateString() === now.toDateString())
                    ? (eventMorning8IST.getTime() - now.getTime()) / 1000 // in seconds
                    : 32857,
                topic: "all_users",

                scheduledTime: eventMorning8IST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: "Event Reminder",
                    notificationMessage: `Good morning! Event "${eventName}" is happening today.`,
                    eventId,
                    eventName,
                },
                ttl: (3600 * 2)
            },
            {
                title: `Upcoming Event`,
                message: `Reminder: Event "${eventName}" starts in 1 hour.`,
                delay: (oneHourBeforeIST.getTime() - ((oneHourBeforeIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: oneHourBeforeIST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Upcoming Event`,
                    notificationMessage: `Reminder: Event "${eventName}" starts in 1 hour.`,
                    eventId,
                    eventName,
                },
                ttl: 3600 - 600
            },
            {
                title: `Upcoming Event`,
                message: `Reminder: Event "${eventName}" starting in 10 minutes.`,
                delay: (tenMinutesBeforeIST.getTime() - ((tenMinutesBeforeIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: tenMinutesBeforeIST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Upcoming Event`,
                    notificationMessage: `Reminder: Event "${eventName}" starting in 10 minutes.`,
                    eventId,
                    eventName,
                },
                ttl: 3600 - 3000
            },
            {
                title: `Event Starting`,
                message: `Event "${eventName}" is starting now!`,
                delay: (eventDateTime.getTime() - ((eventStartIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: eventDateTime,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Event Starting`,
                    notificationMessage: `Event "${eventName}" is starting now!`,
                    eventId,
                    eventName,
                },
                ttl: 0
            }
        ];


        console.log(notifications)

        for (const notif of notifications) {
            if (notif.scheduledTime.toDateString() == now.toDateString() && notif.delay >= 0) {
                const jobId = await createTopicNotificationJob(
                    notif.title,
                    notif.message,
                    notif.payload,
                    notif.topic,
                    notif.delay.toString(),
                    notif.ttl
                );

                const saved_noti = await pushNotificationService.create({
                    event_id: { id: eventId },
                    title: notif.title,
                    message: notif.message,
                    payload: notif.payload,
                    topic: notif.topic,
                    delay: notif.delay,
                    scheduledTime: notif.scheduledTime,
                    ttl: notif.ttl,
                    job_id: jobId // ✨ SAVE the job id
                });
            }
        }

        const timeDiff = eventDateTime.getTime() - now.getTime();
        const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        let numberOfNotifications = 0;
        if (totalDays <= 0) {
            numberOfNotifications = 0;
        } else if (totalDays <= 2) {
            numberOfNotifications = 1;
        } else if (totalDays <= 7) {
            numberOfNotifications = 2 + Math.floor(Math.random() * 2); // 2–3
        } else if (totalDays <= 21) {
            numberOfNotifications = 3 + Math.floor(Math.random() * 2); // 3–4
        } else {
            numberOfNotifications = 4 + Math.floor(Math.random() * 2); // 4–5
        }

        const interval = timeDiff / (numberOfNotifications + 1);

        for (let i = 1; i <= numberOfNotifications; i++) {
            const notifyAt = new Date(now.getTime() + interval * i);
            const notifyAtIST = notifyAt;

            // Calculate days remaining at the time of notification
            const remainingDays = Math.ceil((eventDateTime.getTime() - notifyAtIST.getTime()) / (1000 * 60 * 60 * 24));

            if (notifyAtIST < eventDateTime) {
                notifications.push({
                    title: `Reminder: ${eventName} in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`,
                    message: `The event "${eventName}" is happening in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}! Get ready.`,
                    // delay: (notifyAtIST.getTime() - now.getTime()) / 1000,
                    delay: 32857,
                    topic: "all_users",
                    scheduledTime: notifyAtIST,
                    payload: {
                        notificationType: "event_reminder",
                        notificationTitle: `Reminder: ${eventName} in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`,
                        notificationMessage: `The event "${eventName}" is happening in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}! Get ready.`,
                        eventId: eventId,
                        eventName: eventName,
                    },
                    ttl: 3600 * 24
                });
            }
        }

        // Save all notifications
        for (const notif of notifications) {
            if (notif.scheduledTime.toDateString() != now.toDateString() && notif.delay >= 0) {
                const saved_noti = await pushNotificationService.create({
                    event_id: { id: eventId },
                    title: notif.title,
                    message: notif.message,
                    payload: notif.payload,
                    topic: notif.topic,
                    delay: notif.delay,
                    scheduledTime: notif.scheduledTime, // ✅ FIXED FORMAT
                    ttl: notif.ttl
                });
                console.log(saved_noti)
            }
        }
    }

    public async RescheduledEventNotifications(eventId: string, eventName: string, event_start_time_utc: Date) {

        const now = new Date();
        const eventDateTime = event_start_time_utc;

        const eventMorning8IST = new Date(new Date(eventDateTime).setHours(8, 0, 0, 0));
        const oneHourBeforeIST = new Date(eventDateTime.getTime() - 60 * 60 * 1000);
        const tenMinutesBeforeIST = new Date(eventDateTime.getTime() - 10 * 60 * 1000);
        const eventStartIST = eventDateTime;
        const midnight = new Date(new Date(eventDateTime).setHours(0, 0, 0, 0)); // Midnight (12 AM) on the same day       

        const notifications = [
            {
                title: `${eventName} Event Rescheduled`,
                message: `🔄 The ${eventName} has been rescheduled.`,
                delay: 0,
                topic: "all_users",
                scheduledTime: now,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `${eventName} Event Rescheduled`,
                    notificationMessage: `🔄 The ${eventName} has been rescheduled.`,
                    eventId: eventId,
                    eventName: eventName,
                },
                ttl: 3600 * 24

            },
            {
                title: `Reminder`,
                message: `Good morning! Event "${eventName}" is happening today.`,
                delay: (eventMorning8IST.toDateString() === now.toDateString())
                    ? (eventMorning8IST.getTime() - now.getTime()) / 1000 // in seconds
                    : 32857,
                topic: "all_users",
                scheduledTime: eventMorning8IST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: "Event Reminder",
                    notificationMessage: `Good morning! Event "${eventName}" is happening today.`,
                    eventId: eventId,
                    eventName: eventName,
                },
                ttl: (3600 * 2)

            },
            {
                title: `Upcoming Event`,
                message: `Reminder: Event "${eventName}" starts in 1 hour.`,
                delay: (oneHourBeforeIST.getTime() - ((oneHourBeforeIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: oneHourBeforeIST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Upcoming Event`,
                    notificationMessage: `Reminder: Event "${eventName}" starts in 1 hour.`,
                    eventId: eventId,
                    eventName: eventName,
                },
                ttl: 3600 - 600

            },
            {
                title: `Upcoming Event`,
                message: `Reminder: Event "${eventName}" starting in 10 minutes.`,
                delay: (tenMinutesBeforeIST.getTime() - ((tenMinutesBeforeIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: oneHourBeforeIST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Upcoming Event`,
                    notificationMessage: `Reminder: Event "${eventName}" starting in 10 minutes.`,
                    eventId,
                    eventName,
                },
                ttl: 3600 - 3000
            },
            {
                title: `Event Starting`,
                message: `Event "${eventName}" is starting now!`,
                delay: (eventDateTime.getTime() - ((eventStartIST.toDateString() == now.toDateString()) ? now.getTime() : midnight.getTime())) / 1000,
                topic: "all_users",
                scheduledTime: eventStartIST,
                payload: {
                    notificationType: "event_reminder",
                    notificationTitle: `Event Starting`,
                    notificationMessage: `Event "${eventName}" is starting now!`,
                    eventId: eventId,
                    eventName: eventName,
                },
                ttl: 0

            }
        ];

        for (const notif of notifications) {
            if (notif.scheduledTime.toDateString() == now.toDateString() && notif.delay >= 0) {
                const jobId = await createTopicNotificationJob(
                    notif.title,
                    notif.message,
                    notif.payload,
                    notif.topic,
                    notif.delay.toString(),
                    notif.ttl
                );

                await pushNotificationService.create({
                    event_id: { id: eventId },
                    title: notif.title,
                    message: notif.message,
                    payload: notif.payload,
                    topic: notif.topic,
                    delay: notif.delay,
                    scheduledTime: notif.scheduledTime,
                    ttl: notif.ttl,
                    job_id: jobId // ✨ SAVE the job id
                });
            }
        }

        const timeDiff = eventDateTime.getTime() - now.getTime();
        const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        let numberOfNotifications = 0;
        if (totalDays == 0) {
            numberOfNotifications = 0; // Just 1 reminder if event is very near
        } else if (totalDays <= 2) {
            numberOfNotifications = 1; // Just 1 reminder if event is very near
        } else if (totalDays <= 7) {
            numberOfNotifications = 2 + Math.floor(Math.random() * 2); // 2–3
        } else if (totalDays <= 21) {
            numberOfNotifications = 3 + Math.floor(Math.random() * 2); // 3–4
        } else {
            numberOfNotifications = 4 + Math.floor(Math.random() * 2); // 4–5
        }

        // Interval between each notification in milliseconds
        const interval = timeDiff / (numberOfNotifications + 1);

        for (let i = 1; i <= numberOfNotifications; i++) {
            const notifyAt = new Date(now.getTime() + interval * i);
            const notifyAtIST = notifyAt;

            // Calculate days remaining at the time of notification
            const remainingDays = Math.ceil((eventDateTime.getTime() - notifyAtIST.getTime()) / (1000 * 60 * 60 * 24));

            // Only push notifications that are before the event time
            if (notifyAtIST < eventDateTime) {
                notifications.push({
                    title: `Reminder: ${eventName} in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`,
                    message: `The event "${eventName}" is happening in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}! Get ready.`,
                    // delay: (notifyAtIST.getTime() - now.getTime()) / 1000,
                    delay: 32857,
                    topic: "all_users",
                    scheduledTime: notifyAtIST,
                    payload: {
                        notificationType: "event_reminder",
                        notificationTitle: `Reminder: ${eventName} in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`,
                        notificationMessage: `The event "${eventName}" is happening in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}! Get ready.`,
                        eventId: eventId,
                        eventName: eventName,
                    },
                    ttl: 3600 * 24
                });
            }
        }

        // Save all valid future notifications
        for (const notif of notifications) {
            if (notif.scheduledTime.toDateString() != now.toDateString() && notif.delay >= 0) {
                await pushNotificationService.create({
                    event_id: { id: eventId },
                    title: notif.title,
                    message: notif.message,
                    payload: notif.payload,
                    topic: notif.topic,
                    delay: notif.delay,
                    scheduledTime: notif.scheduledTime,
                    ttl: notif.ttl
                });
            }
        }
    }

    public async CancelledEventNotifications(eventId: string, eventName: string, eventDate: string, eventTime: string) {

        const now = new Date();
        const notifications = [
            {
                title: `${eventName} Event Cancelled`,
                message: `⚠️ The ${eventName} scheduled for ${eventDate} has been canceled. Refunds (if applicable) will be processed soon.`,
                delay: 0, // Send immediately
                topic: "all_users",
                scheduledTime: now,
                payload: {
                    notificationType: "event_cancelled",
                    notificationTitle: `${eventName} Event Cancelled`,
                    notificationMessage: `⚠️ The ${eventName} scheduled for ${eventDate} has been canceled. Refunds (if applicable) will be processed soon.`,
                    eventId: eventId,
                    eventName: eventName,
                },
            },
        ];

        createTopicNotificationJob(notifications[0].title, notifications[0].message, notifications[0].payload, notifications[0].topic, notifications[0].delay.toString())

        //put the code for store the notificaion in entity (we have 2 seperate entity for push and in app notification)

        // Save notifications in the database

        for (const notif of notifications) {
            if (notif.delay >= 0) {
                await pushNotificationService.create({
                    event_id: { id: eventId },
                    title: notif.title,
                    message: notif.message,
                    payload: notif.payload,
                    topic: notif.topic,
                    delay: notif.delay,
                    scheduledTime: notif.scheduledTime.toISOString().split('T')[0]
                });
            }
        }


    };

}
