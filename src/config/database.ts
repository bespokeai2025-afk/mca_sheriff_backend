// database.ts

import "reflect-metadata"; // Import reflect-metadata for TypeORM
import { DataSource } from "typeorm"; // Import DataSource from TypeORM
import dotenv from "dotenv"; // Import dotenv to manage environment variables
import { DatabaseSync } from "node:sqlite"; // Import DatabaseSync for SQLite

// Load environment variables from .env file
dotenv.config();

// Destructure environment variables for database configuration
const { DEV_DB_HOST, DEV_DB_PORT, DEV_DB_USER, DEV_DB_PASSWORD, DEV_DB_NAME } = process.env;
const { PROD_DB_HOST, PROD_DB_PORT, PROD_DB_USER, PROD_DB_PASSWORD, PROD_DB_NAME } = process.env;

// Determine if the environment is production

const env = process.env.NODE_ENV || "dev"; // Default to 'dev' if undefined
console.log("env : " + env);

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
const isCompiledJs = __filename.endsWith(".js");
const entitiesPath = isCompiledJs ? "dist/entities/*.js" : "src/entities/*.ts";

// Create a new DataSource instance for connecting to the database
export const AppDataSource = new DataSource({
    type: "postgres", // Database type
    host: HOST, // Database host
    port: Number(PORT), // Database port
    username: USER, // Database username
    password: PASSWORD, // Database password
    database: DB_NAME, // Database name
    synchronize: true, // Set to false in production (use migrations instead)
    logging: false, // Disable logging
    entities: [entitiesPath] // Path to entity files
});