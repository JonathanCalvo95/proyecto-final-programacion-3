import { Router } from "express";
import { spaceRouter } from "./space";
import adminRouter from "./admin";
import authRouter from "./auth";
import bookingRouter from "./booking";
import userRouter from "./user";

const router = Router();

router.use("/spaces", spaceRouter);
router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/bookings", bookingRouter);
router.use("/user", userRouter);

export default router;
