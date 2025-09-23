import { AppDataSource } from '../config/database';
import { NotificationType } from '../entities/NotificationType'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from '../config/ApiResponse';

export class NotificationTypeService {
    private notificationTypeRepository = AppDataSource.getRepository(NotificationType);

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.')  // Admin only access
        }

        const [notificationTypes, totalItems] = await this.notificationTypeRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All notification types", notificationTypes, {
            totalItems,
            totalPages,
            currentPage,
            pageSize

        })
    }

    public async findById(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.')  // Admin only access
        }
        const notificationType = await this.notificationTypeRepository.findOneBy({ id });
        if (!notificationType) {
            return errorWithoutData('Notification type not found');
        }
        return successWithData("Notification type found", notificationType);
    }

    public async create(data: Partial<NotificationType>, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.')  // Admin only access
        }
        if (data.type) {
            const type_exist = await this.notificationTypeRepository.findOneBy({ type: data.type });
            if (type_exist) return errorWithoutData("Notification Type already Exists")
        }
        const newNotificationType = this.notificationTypeRepository.create(data);
        const savedNotificationType = await this.notificationTypeRepository.save(newNotificationType);
        return successWithData('Notification type created successfully', savedNotificationType);
    }

    public async update(id: string, data: Partial<NotificationType>, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.')  // Admin only access
        }
        const notificationType = await this.notificationTypeRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!notificationType) {
            return errorWithoutData('Notification type not found');
        }
        await this.notificationTypeRepository.update(id, data);
        return successWithoutData('Notification type updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.')  // Admin only access
        }
        const notificationType = await this.notificationTypeRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!notificationType) {
            return errorWithoutData('Notification type not found');
        }

        notificationType.isDeleted = true;
        notificationType.isActive = false;

        await this.notificationTypeRepository.save(notificationType);
        return successWithoutData('Notification type deleted successfully');
    }
}