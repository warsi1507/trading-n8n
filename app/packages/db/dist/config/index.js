import mongoose from "mongoose";
export const connectDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error) {
        throw error;
    }
};
