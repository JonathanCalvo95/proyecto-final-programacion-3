import express from "express";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import { spaceRouter } from "./routes/space";
import bookingsRoutes from "./routes/booking";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/spaces", spaceRouter);
app.use("/api/bookings", bookingsRoutes);

export default app;
