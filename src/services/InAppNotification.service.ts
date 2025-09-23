import { AppDataSource } from '../config/database';
import { inappNotification } from '../entities/InAppNotification'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from '../config/ApiResponse';
import { User } from '../entities/User';
import { Notification } from '../entities/Notification';
import { createBatchNotificationJob, createTopicNotificationJob } from '../workers/notification.worker';
import { createNotification } from 'controllers/notification.controller';

export class InappNotificationService {
    private inappNotificationRepository = AppDataSource.getRepository(inappNotification);
    private userRepository = AppDataSource.getRepository(User);
    private notificationRepository = AppDataSource.getRepository(Notification);

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }

        const [inappNotifications, totalItems] = await this.inappNotificationRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'notification']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All inapp notifications", inappNotifications, {
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
        const inappNotification = await this.inappNotificationRepository.findOne({
            where: { id }, relations: ['user', 'notification']
        });
        if (!inappNotification) {
            return errorWithoutData('inapp notification not found');
        }
        return successWithData("inapp notification found", inappNotification);
    }

    public async create(data: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.'); // Admin only access
        // }

        const newinappNotification = this.inappNotificationRepository.create(data);
        const savedinappNotification = await this.inappNotificationRepository.save(newinappNotification);
        return successWithData('inapp notification created successfully', savedinappNotification);
    }


    public async update(id: string, data: Partial<inappNotification>, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const inappNotification = await this.inappNotificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!inappNotification) {
            return errorWithoutData('inapp notification not found');
        }
        await this.inappNotificationRepository.update(id, data);
        return successWithoutData('inapp notification updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.'); // Admin only access
        }
        const inappNotification = await this.inappNotificationRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!inappNotification) {
            return errorWithoutData('inapp notification not found');
        }

        inappNotification.isDeleted = true;
        inappNotification.isActive = false;

        await this.inappNotificationRepository.save(inappNotification);
        return successWithoutData('inapp notification deleted successfully');
    }

    public async createTopicinappNotification(data: any, verifyUser: any): Promise<any> {

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

        if (date.getDate() == now.getDate()) {
            createTopicNotificationJob(title, message, stringifiedPayload, topic, delay.toString())
        }


        const newNotification = await this.create({
            title,
            message,
            payload: stringifiedPayload,
            topic,
            delay,
            scheduledTime: date.toISOString().split('T')[0]
        });

        return successWithData('Topic inapp Notification Created successfully', newNotification);

    }

    public async createBatchinappNotification(data: any, verifyUser: any): Promise<any> {

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
        return successWithData('Batch inapp Notification Created successfully', newNotification);

    }
}