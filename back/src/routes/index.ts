import { Router } from "express";
import { spaceRouter } from "./space";
import adminRouter from "./admin";
import authRouter from "./auth";
import bookingRouter from "./booking";
import userRouter from "./user";
import ratingRouter from "./rating";
import authentication from "../middlewares/authentication";

const router = Router();

// Public auth endpoints first
router.use("/auth", authRouter);

router.use(authentication);

router.use("/spaces", spaceRouter);
router.use("/admin", adminRouter);
router.use("/bookings", bookingRouter);
router.use("/user", userRouter);
router.use("/ratings", ratingRouter);

export default router;
