import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()

const SECRET_KEY = process.env.JWT_SECRET || "secretKey";

export const generateToken = (email: string): string => {
    return jwt.sign({ email }, SECRET_KEY, { expiresIn: "20m" });
};

export const verifyToken = (token: string): string | null => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as { email: string };
        return decoded.email;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};
