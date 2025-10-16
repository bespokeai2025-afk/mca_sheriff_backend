import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { DeviceTokenService } from "./deviceToken.service";
const deviceTokenService = new DeviceTokenService();

export class ReferralCodeService {
    private userRepository = AppDataSource.getRepository(User)
}

