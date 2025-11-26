import mongoose from "mongoose";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI; // artık Atlas URI okunacak

  if (!uri) {
    console.error("MongoDB URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected to Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
