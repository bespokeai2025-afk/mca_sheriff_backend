// services/appVersionConfig.service.ts
import { AppDataSource } from "../config/database";
import { AppVersionConfig } from "../entities/AppVersionConfig";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { IntegerType } from "typeorm";
import { NotificationService } from "./notification.service";
const notificationService = new NotificationService();
export class AppVersionConfigService {
    private appVersionConfigRepository = AppDataSource.getRepository(AppVersionConfig);

    // Create a new App Version Config
    public async createAppVersionConfig(data: Partial<AppVersionConfig>) {
        if (!data.app_version) {
            return errorWithoutData("App version is required.");
        }

        // Get the latest app version from the database
        const latestConfig = await this.appVersionConfigRepository
            .createQueryBuilder("appVersionConfig")
            .orderBy("appVersionConfig.app_version", "DESC")
            .getOne();

        // Check if the new version is greater than the latest version
        if (latestConfig && data.app_version <= latestConfig.app_version) {
            return errorWithoutData(`App version must be greater than the existing version (${latestConfig.app_version}).`);
        }

        // Create and save new config
        const newConfig = this.appVersionConfigRepository.create({
            ...data
        });

        await this.appVersionConfigRepository.save(newConfig);
        await notificationService.sendsystemupdate(

            `✨ We’ve rolled out new updates & bug fixes for a smoother experience! Update your app to enjoy the latest features.`
        );
        console.log("New App Version Config Created:", newConfig);
        return successWithData("App version configuration created successfully.", newConfig);
    }




    // Get all App Version Configs
    public async getAllAppVersionConfigs() {
        const configs = await this.appVersionConfigRepository.find({
            where: { isDeleted: false, isActive: true },
            order: { createdAt: "DESC" }, // Sorting in descending order by createdAt

        });

        return successWithData("All app version configurations fetched successfully.", configs);
    }

    public async systemundermaintanace() {
        await notificationService.sendsystemupdate(

            `⚙️ Our platform will be under maintenance on [Date & Time]. Some features may be unavailable.`
            
        );
        return successWithoutData("System under maintanace");

    }

    // Get a single App Version Config by ID
    public async getAppVersionConfigByAppVersion(app_version: number) {
        const config = await this.appVersionConfigRepository.findOne({
            where: {
              isDeleted: false,
              isActive: true,
            },
            order: {
              createdAt: 'DESC', // or 'id' if you don't have createdAt
            },
          });
        if (!config) {
            return errorWithoutData("App version configuration not found.");
        }
        return successWithData("App version configuration found.", config);
    }


    // Update an App Version Config
    public async updateAppVersionConfig(id: string, data: Partial<AppVersionConfig>) {
        // Find the existing record to update
        const currentConfig = await this.appVersionConfigRepository.findOne({ where: { id } });
        if (!currentConfig) {
            return errorWithoutData("App version configuration not found.");
        }

        // Check if the new app_version already exists in another record
        if (data.app_version) {
            const existingConfig = await this.appVersionConfigRepository.findOne({
                where: { app_version: data.app_version },
            });

            if (existingConfig && existingConfig.id !== id) {
                return errorWithoutData(`App version "${data.app_version}" already exists. Choose a different version.`);
            }

            // Get the latest app version from the database
            const latestConfig = await this.appVersionConfigRepository
                .createQueryBuilder("appVersionConfig")
                .orderBy("appVersionConfig.app_version", "DESC")
                .getOne();

            // Ensure the new app_version is greater than the latest version
            if (latestConfig && data.app_version <= latestConfig.app_version) {
                return errorWithoutData(`App version must be greater than the existing version (${latestConfig.app_version}).`);
            }
        }

        // Proceed with update
        await this.appVersionConfigRepository.update(id, data);
        return successWithoutData("App version configuration updated successfully.");
    }



    // Delete an App Version Config
    public async softDeleteConfig(id: string) {
        const config = await this.appVersionConfigRepository.findOneBy({ id });
        if (!config) return errorWithoutData("App version configuration not found.");

        config.isDeleted = true;
        await this.appVersionConfigRepository.save(config);

        return successWithoutData("App version configuration soft deleted successfully.");
    }

    // Toggle isActive status
    public async toggleConfigStatus(id: string) {
        const config = await this.appVersionConfigRepository.findOneBy({ id });
        if (!config) return errorWithoutData("App version configuration not found.");

        config.isActive = !config.isActive; // toggle status
        await this.appVersionConfigRepository.save(config);

        return successWithoutData(`App version configuration is now ${config.isActive ? "active" : "inactive"}.`);
    }

}
