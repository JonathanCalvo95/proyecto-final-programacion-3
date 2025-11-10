import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorHandler } from "./middlewares/error";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import { spaceRouter } from "./routes/space";
import bookingsRoutes from "./routes/booking";
import adminRoutes from "./routes/admin";

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api", routes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/spaces", spaceRouter);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
