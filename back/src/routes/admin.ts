import { Router, Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import Space from "../schemas/space";
import Booking from "../schemas/booking";
import { BOOKING_STATUS, USER_ROLE } from "../enums";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === USER_ROLE.ADMIN) return next();
  return res.status(403).json({ message: "Forbidden" });
}

const WORKING_HOURS_PER_DAY = 8;

// GET /api/admin/metrics
router.get(
  "/metrics",
  authentication,
  requireAdmin,
  async (_req, res, next) => {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalSpaces = await Space.estimatedDocumentCount();
      const totalBookings = await Booking.countDocuments({
        status: { $ne: BOOKING_STATUS.CANCELED },
      });

      const bookings = await Booking.find(
        {
          status: { $ne: BOOKING_STATUS.CANCELED },
          end: { $gt: since },
          start: { $lt: now },
        },
        { start: 1, end: 1 }
      ).lean();

      let reservedHours = 0;
      const sinceMs = since.getTime();
      const nowMs = now.getTime();

      for (const b of bookings) {
        const s = new Date((b as any).start).getTime();
        const e = new Date((b as any).end).getTime();
        const clipStart = Math.max(s, sinceMs);
        const clipEnd = Math.min(e, nowMs);
        if (clipEnd > clipStart) {
          reservedHours += (clipEnd - clipStart) / (1000 * 60 * 60);
        }
      }

      const denom =
        totalSpaces > 0 ? totalSpaces * WORKING_HOURS_PER_DAY * 30 : 0;
      const rate = denom > 0 ? reservedHours / denom : 0;
      const occupancyRate = Math.max(0, Math.min(1, rate));

      res.json({ totalSpaces, totalBookings, occupancyRate });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/admin/top-spaces
router.get(
  "/top-spaces",
  authentication,
  requireAdmin,
  async (_req, res, next) => {
    try {
      const top = await Booking.aggregate([
        { $match: { status: { $ne: BOOKING_STATUS.CANCELED } } },
        { $group: { _id: "$space", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const ids = top.map((t) => t._id);
      const spaces = await Space.find({ _id: { $in: ids } }, { name: 1 });

      const map = new Map(
        spaces.map((s) => [s._id.toString(), (s as any).name || ""])
      );

      res.json(
        top.map((t) => ({
          _id: t._id,
          name: map.get(t._id.toString()) || "",
          count: t.count,
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

export default router;
