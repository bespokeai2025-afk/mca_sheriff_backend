// redis.ts
import { RedisOptions } from 'bullmq';
import Redis from "ioredis"; 
import dotenv from "dotenv";

dotenv.config();

const env = process.env.NODE_ENV || "dev";

const isStaging = env === "staging";
const isLocal = env === "local";

const REDIS_HOST = isStaging ? process.env.STAGING_REDIS_HOST :
    isLocal ? process.env.LOCAL_REDIS_HOST :
        process.env.DEV_REDIS_HOST;

const REDIS_PORT = isStaging ? process.env.STAGING_REDIS_PORT :
    isLocal ? process.env.LOCAL_REDIS_PORT :
        process.env.DEV_REDIS_PORT;

const REDIS_PASSWORD = isStaging ? process.env.STAGING_REDIS_PASSWORD :
    isLocal ? process.env.LOCAL_REDIS_PASSWORD :   // ✅ FIX: use local password
        process.env.DEV_REDIS_PASSWORD;

const redis = new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD || undefined,  // ✅ use password if set
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

export const redisConfig: RedisOptions = {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD || undefined,  // ✅ use password if set
    maxRetriesPerRequest: null,
    enableReadyCheck: false
};

redis.on("connect", () => {
    console.log("✅ Redis connected successfully!");
});

redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

export default redis;
