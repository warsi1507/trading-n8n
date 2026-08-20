import mongoose from "mongoose";
import { createLogger } from "@trading-n8n/logger";
const logger = createLogger("DB");
export const connectDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error) {
        throw error;
    }
};
