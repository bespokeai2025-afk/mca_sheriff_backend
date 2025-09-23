import { AppDataSource } from '../config/database';
import { NotificationReadReceipt } from '../entities/NotificationReadReceipt'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from '../config/ApiResponse';
import { User } from '../entities/User';
import { Notification } from '../entities/Notification';
import { TenantAwareAuth } from 'firebase-admin/lib/auth/tenant-manager';

export class NotificationReadReceiptService {
    private NotificationReadReceiptRepository = AppDataSource.getRepository(NotificationReadReceipt);
    private userRepository = AppDataSource.getRepository(User);
    private notificationRepository = AppDataSource.getRepository(Notification);

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.'); // Admin only access
        // }

        const [NotificationReadReceipts, totalItems] = await this.NotificationReadReceiptRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user', 'notification']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All notifications read receipts", NotificationReadReceipts, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findById(id: string, verifyUser: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.'); // Admin only access
        // }
        const NotificationReadReceipt = await this.NotificationReadReceiptRepository.findOne({
            where: { id }, relations: ['user', 'notification']
        });
        if (!NotificationReadReceipt) {
            return errorWithoutData('Notification read Receipt not found');
        }
        return successWithData("Notification read Receipt found", NotificationReadReceipt);
    }

    public async create(data: any, verifyUser: any) {
        if (verifyUser.admin_exist) {
            return errorWithoutData('only user can use this service.'); // Admin only access
        }

        const user: any = await this.userRepository.findOne({
            where: {
                id: data.user, isActive: true, isDeleted: false
            }
        })
        const notification: any = await this.notificationRepository.findOne({
            where: {
                id: data.notification, isActive: true, isDeleted: false
            }
        });
        
        if (!user) return errorWithoutData('User not found');
        if (!notification) return errorWithoutData('notification not found');


        const readReceipt = await this.NotificationReadReceiptRepository.findOne({
            where: {
                user: { id: user.id },
                notification: { id: notification.id },
                isActive: true,
                isDeleted: false
            }
        })


        // Fetch the updated notification
        const updatedNotification = await this.notificationRepository.findOne({
            where: { id: notification.id }
        });

        if (!updatedNotification) {
            return errorWithoutData('Notification not found');
        }

        updatedNotification.is_read = true;
        await this.notificationRepository.save(updatedNotification);

        console.log("Updated Notification:", updatedNotification);

        if (readReceipt) return errorWithoutData('read receipt already created');

        const newNotificationReadReceipt = this.NotificationReadReceiptRepository.create(data);
        const savedNotificationReadReceipt = await this.NotificationReadReceiptRepository.save(newNotificationReadReceipt);
        return successWithData('notification read receipt created successfully', savedNotificationReadReceipt);
    }

    public async update(id: string, data: Partial<NotificationReadReceipt>, verifyUser: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.'); // Admin only access
        // }

        const NotificationReadReceipt = await this.NotificationReadReceiptRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!NotificationReadReceipt) {
            return errorWithoutData('Notification read Receipt not found');
        }
        await this.NotificationReadReceiptRepository.update(id, data);
        return successWithoutData('Notification read Receipt updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        // if (verifyUser.admin_exist) {
        //     return errorWithoutData('only user can use this service.'); // Admin only access
        // }
        const NotificationReadReceipt = await this.NotificationReadReceiptRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!NotificationReadReceipt) {
            return errorWithoutData('Notification read Receipt not found');
        }

        NotificationReadReceipt.isDeleted = true;
        NotificationReadReceipt.isActive = false;

        await this.NotificationReadReceiptRepository.save(NotificationReadReceipt);
        return successWithoutData('Notification read Receipt deleted successfully');
    }
}