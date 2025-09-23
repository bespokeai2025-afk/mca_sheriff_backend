import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { AppDataSource } from "../config/database";
import { RefreshToken } from "../entities/RefreshToken";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import dotenv from 'dotenv'
import { errorWithoutData } from "../config/ApiResponse";
dotenv.config()

const ACCESS_TOKEN_EXPIRY: string = process.env.ACCESS_TOKEN_EXPIRY || "5h";
const REFRESH_TOKEN_EXPIRY: string = process.env.REFRESH_TOKEN_EXPIRY || "30d";

export const generateTokens = async (user: User | Admin) => {

    const is_Admin = user instanceof Admin;
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions // ✅ Explicit type assertion
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_SECRET as string,
        { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions // ✅ Explicit type assertion
    );
    await redisClient.setex(`jwt_${user.id}`, 18000, accessToken); // Store JWT in Redis for 1 min


    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

    if (is_Admin) {

        await refreshTokenRepo.delete({ admin_id: { id: user.id } }); // Remove old refresh token
        const newRefreshToken = refreshTokenRepo.create({ token: refreshToken, admin_id: { id: user.id } });
        await refreshTokenRepo.save(newRefreshToken);
    } else {
        await refreshTokenRepo.delete({ user_id: { id: user.id } }); // Remove old refresh token
        const newRefreshToken = refreshTokenRepo.create({ token: refreshToken, user_id: { id: user.id } });
        await refreshTokenRepo.save(newRefreshToken);
    }

    return { accessToken, refreshToken };
};

export const verifyToken = async (token: string, secret: string) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

export const deleteUserToken = async (user_id: string) => {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    await refreshTokenRepo.delete({ user_id: { id: user_id } });
    await redisClient.del(`jwt_${user_id}`);
};



