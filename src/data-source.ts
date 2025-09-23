import { DataSource } from 'typeorm';
import { User } from './entities/User'; // adjust the path
import * as path from 'path';
import dotenv from "dotenv"; // Import dotenv to manage environment variables

dotenv.config();


const env = process.env.NODE_ENV || "dev"; // Default to 'dev' if undefined

const isStaging = env === "staging";
const isLocal = env === "local";

// Select the correct database configuration based on the environment
const HOST = isStaging ? process.env.STAGING_DB_HOST :
    isLocal ? process.env.LOCAL_DB_HOST :
        process.env.DEV_DB_HOST;

const PORT = isStaging ? process.env.STAGING_DB_PORT :
    isLocal ? process.env.LOCAL_DB_PORT :
        process.env.DEV_DB_PORT;

const USER = isStaging ? process.env.STAGING_DB_USER :
    isLocal ? process.env.LOCAL_DB_USER :
        process.env.DEV_DB_USER;

const PASSWORD = isStaging ? process.env.STAGING_DB_PASSWORD :
    isLocal ? process.env.LOCAL_DB_PASSWORD :
        process.env.DEV_DB_PASSWORD;

const DB_NAME = isStaging ? process.env.STAGING_DB_NAME :
    isLocal ? process.env.LOCAL_DB_NAME :
        process.env.DEV_DB_NAME;


// Set the path for entities based on the environment
const entitiesPath = isStaging ? "dist/entities/*.js" : "src/entities/*.ts";

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: USER, // Database username
    password: PASSWORD, // Database password
    database: DB_NAME,
    entities: [User],
    migrations: [path.join(__dirname, './migrations/*.ts')],
    synchronize: true, // important: we are using migrations, not auto-sync
    logging: true,

});
