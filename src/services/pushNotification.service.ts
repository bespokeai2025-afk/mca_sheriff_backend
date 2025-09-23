import { AppDataSource } from '../config/database';
import { PushNotification } from '../entities/PushNotification'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from '../config/ApiResponse';
import { User } from '../entities/User';
import { Notification } from '../entities/Notification';
import { createBatchNotificationJob, createTopicNotificationJob } from '../workers/notification.worker';
import { createNotification } from 'controllers/notification.controller';

export class PushNotificationService {
    private pushNotificationRepository = AppDataSource.getRepository(PushNotification);
    private userRepository = AppDataSource.getRepository(User);
    private notificationRepository = AppDataSource.getRepository(Notification);

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }

        const [pushNotifications, totalItems] = await this.pushNotificationRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'notification']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All push notifications", pushNotifications, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findById(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const pushNotification = await this.pushNotificationRepository.findOne({
            where: { id }, relations: ['user', 'notification']
        });
        if (!pushNotification) {
            return errorWithoutData('Push notification not found');
        }
        return successWithData("Push notification found", pushNotification);
    }

    public async create(data: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.'); // Admin only access
        // }

        const newPushNotification = this.pushNotificationRepository.create(data);
        const savedPushNotification = await this.pushNotificationRepository.save(newPushNotification);
        return successWithData('Push notification created successfully', savedPushNotification);
    }

    public async update(id: string, data: Partial<PushNotification>, verifyUser?: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const pushNotification = await this.pushNotificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!pushNotification) {
            return errorWithoutData('Push notification not found');
        }
        await this.pushNotificationRepository.update(id, data);
        return successWithoutData('Push notification updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const pushNotification = await this.pushNotificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!pushNotification) {
            return errorWithoutData('Push notification not found');
        }

        pushNotification.isDeleted = true;
        pushNotification.isActive = false;

        await this.pushNotificationRepository.save(pushNotification);
        return successWithoutData('Push notification deleted successfully');
    }

    public async createTopicPushNotification(data: any, verifyUser: any): Promise<any> {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }

        const convertValuesToString = (payload: any): any => {
            return JSON.parse(JSON.stringify(payload, (key, value) =>
                typeof value === "object" && value !== null ? value : String(value)
            ));
        };


        const { title, message, payload, scheduledTime, topic } = data;
        const now = new Date()
        const date = new Date(scheduledTime);

        const stringifiedPayload = convertValuesToString(payload);

        if (date.getTime() < now.getTime()) {
            return errorWithoutData('Scheduled time is in the past');
        }

        const delay = (date.getTime() - now.getTime()) / 1000;



        let newNotification: any;

        if (date.getDate() == now.getDate()) {
            const jobId = await createTopicNotificationJob(title, message, stringifiedPayload, topic, delay.toString())
            await console.log("JOB ID: ", jobId);

            newNotification = await this.create({
                title,
                message,
                payload: stringifiedPayload,
                topic,
                delay,
                scheduledTime: date.toISOString().split('T')[0],
                job_id: jobId
            });
        }

        return successWithData('Topic Push Notification Created successfully', newNotification);

    }

    public async createBatchPushNotification(data: any, verifyUser: any): Promise<any> {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const convertValuesToString = (payload: any): any => {
            return JSON.parse(JSON.stringify(payload, (key, value) =>
                typeof value === "object" && value !== null ? value : String(value)
            ));
        };

        const { title, message, payload, scheduledTime, tokens } = data;
        const now = new Date()
        const date = new Date(scheduledTime);

        const stringifiedPayload = convertValuesToString(payload);

        if (date.getTime() < now.getTime()) {
            return errorWithoutData('Scheduled time is in the past');
        }

        const delay = (date.getTime() - now.getTime()) / 1000;

        if (date.getDate() == now.getDate()) {
            createBatchNotificationJob(title, message, stringifiedPayload, tokens, delay)
        }

        const newNotification = await this.create({
            title,
            message,
            payload: stringifiedPayload,
            tokens,
            delay,
            scheduledTime: date.toISOString().split('T')[0]
        });
        return successWithData('Batch Push Notification Created successfully', newNotification);

    }
}