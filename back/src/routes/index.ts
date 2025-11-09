import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
import { spaceRouter } from "./space";
import bookingRoutes from "./booking";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/spaces", spaceRouter);
router.use("/bookings", bookingRoutes);

export default router;
