import { AppDataSource } from '../config/database';
import { DeviceToken } from '../entities/DeviceToken'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from '../config/ApiResponse';
import { User } from '../entities/User';

export class DeviceTokenService {
    private deviceTokenRepository = AppDataSource.getRepository(DeviceToken);
    private userRepository = AppDataSource.getRepository(User);

    public async findAll(verifyUser: any, pageSize: number, currentPage: number) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');  // Admin only access
        }


        const [deviceTokens, totalItems] = await this.deviceTokenRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user']
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("All device tokens", deviceTokens, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findById(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');  // Admin only access
        }
        const deviceToken = await this.deviceTokenRepository.findOne({ where: { id }, relations: ['user'] });
        if (!deviceToken) {
            return errorWithoutData('Device token not found');
        }
        return successWithData("Device token found", deviceToken);
    }
    public async findByUserId(id: string, verifyUser: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.');  // Admin only access
        // }
        const deviceToken = await this.deviceTokenRepository.findOne({ where: { user: { id } }, relations: ['user'] });
        if (!deviceToken) {
            return errorWithoutData('Device token not found');
        }
        return successWithData("Device token found", deviceToken);
    }

    public async create(data: any, verifyUser: any) {
        if (verifyUser.admin_exist) {
            return errorWithoutData('only user can use this service.');  // Admin only access
        }

        const user: any = await this.userRepository.findOne({
            where: {
                id: verifyUser.user_exist.id, isActive: true, isDeleted: false
            }
        })

        if (!user) return errorWithoutData('user not found');

        const existingDeviceToken = await this.deviceTokenRepository.findOne({
            where: {
                user: { id: verifyUser.user_exist.id }, isActive: true, isDeleted: false
            }
        });

        if (existingDeviceToken) {
            // existingDeviceToken.token = data.token;
           const updatedToken =  await this.update(existingDeviceToken.id, data, verifyUser);
            return successWithData('Device token updated successfully', updatedToken);
        }

        const newDeviceToken = this.deviceTokenRepository.create({...data,user:{id:verifyUser.user_exist.id}});
        const savedDeviceToken = await this.deviceTokenRepository.save(newDeviceToken);
        return successWithData('Device token created successfully', savedDeviceToken);
    }

    public async update(id: string, data: Partial<DeviceToken>, verifyUser: any) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.');  // Admin only access
        // }
        const deviceToken = await this.deviceTokenRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!deviceToken) {
            return errorWithoutData('Device token not found');
        }
        await this.deviceTokenRepository.update(id, data);
        return successWithoutData('Device token updated successfully');
    }

    public async delete(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');  // Admin only access
        }
        const deviceToken = await this.deviceTokenRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!deviceToken) {
            return errorWithoutData('Device token not found');
        }

        deviceToken.isDeleted = true;
        deviceToken.isActive = false;

        await this.deviceTokenRepository.save(deviceToken);
        return successWithoutData('Device token deleted successfully');
    }
}