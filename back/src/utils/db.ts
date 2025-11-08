import mongoose from "mongoose";

export const connectDB = async (uri: string) => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri);
};
