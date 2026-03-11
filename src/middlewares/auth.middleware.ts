import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { verifyToken } from "../utils/jwtUtils";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import dotenv from 'dotenv'
import { Admin } from "../entities/Admin";
import { AppDataSource } from "../config/database";
dotenv.config()

declare global {
    namespace Express {
        interface Request {
            user?: User;
            verifyUser?: {};
        }
    }
}

export const verifyAccessToken = async (req: Request, res: Response, next: Function): Promise<any> => {
    try {
        const cookie_token = req.cookies?.accessToken; // Get token from cookies

        const bearer_token = req.headers.authorization?.split(" ")[1];
        const token = (cookie_token) ? cookie_token : bearer_token;
        if (!token) {
            const response = errorWithoutData("Authentication required");

            return res.status(response.result ? 200 : 401).json(response)
        }

        const decoded_token = await jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        const decoded = await verifyToken(token, process.env.JWT_SECRET as string);
        if (!decoded) {
            const response = errorWithoutData('Authentication failed');

            return res.status(response.result ? 200 : 401).json(response)
        }
        const userRepository = AppDataSource.getRepository(User);
        const adminRepository = AppDataSource.getRepository(Admin);

        const user_exist = await userRepository.findOneBy({ id: decoded_token.id });
        const admin_exist = await adminRepository.findOneBy({ id: decoded_token.id });

        if (!user_exist && !admin_exist) {
            return errorWithoutData('User not found');
        }

        req.user = decoded as User;
        req.verifyUser = { user_exist, admin_exist }
        next();
    } catch (error) {

        if (error instanceof TokenExpiredError) {
            const response = errorWithData("Authentication failed", { error: error })

            return res.status(response.result ? 200 : 401).json(response)
        } else {
            const response = errorWithData("Authentication failed", { error: error })

            return res.status(response.result ? 200 : 401).json(response)

        }
    }
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): any => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from `Bearer <token>`

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        // req.user = decoded; // Attach decoded data to request object
        next(); // Continue to the next middleware or route
    });
};