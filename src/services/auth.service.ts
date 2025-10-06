import { generateTokens, verifyToken } from "../utils/jwtUtils";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { RefreshToken } from "../entities/RefreshToken";

import dotenv from 'dotenv'

dotenv.config()

export class AuthService {
    public async refreshToken(refreshToken: string): Promise<any> {

        if (!refreshToken) return errorWithoutData('Refresh token required');

        const decoded = await verifyToken(refreshToken, process.env.REFRESH_SECRET as string);
        if (!decoded) return errorWithoutData('Invalid or expired refresh token')

        const userId = (decoded as any).id;

        const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
        const storedToken = await refreshTokenRepo.findOne({ where: { token: refreshToken }, relations: ["user_id", "admin_id"] });

        if (!storedToken) return errorWithoutData('Refresh token not found in DataBase')
        if (storedToken.user_id) {
            if (storedToken.user_id.id != userId) {
                return errorWithoutData('Invalid user refresh token')
            }
        } else {
            if (storedToken.admin_id.id != userId) {
                return errorWithoutData('Invalid admin refresh token')
            }
        }

        let newTokens;
        if (storedToken.user_id) {

            newTokens = await generateTokens(storedToken.user_id);
        }else{
            newTokens = await generateTokens(storedToken.admin_id);

        }
      

        return successWithData("Refresh token created successfully", { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken })
    }
}




