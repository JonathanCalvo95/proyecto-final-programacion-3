import { Router, Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import Space from "../schemas/space";
import Booking from "../schemas/booking";
import { USER_ROLE } from "../enums";
import { BOOKING_STATUS } from "../enums/booking";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === USER_ROLE.ADMIN) return next();
  return res.status(403).json({ message: "Forbidden" });
}

const WORKING_HOURS_PER_DAY = 8;
const WORKDAY_START_HOUR = 9;
const WORKDAY_END_HOUR = 17;

function isWeekend(d: Date) {
  const w = d.getDay();
  return w === 0 || w === 6;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function countWorkdaysBetween(start: Date, end: Date) {
  let count = 0;
  let cursor = startOfDay(start);
  const endDay = startOfDay(end);
  while (cursor < endDay) {
    if (!isWeekend(cursor)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}
function workdayBounds(d: Date) {
  const s = startOfDay(d);
  s.setHours(WORKDAY_START_HOUR, 0, 0, 0);
  const e = startOfDay(d);
  e.setHours(WORKDAY_END_HOUR, 0, 0, 0);
  return { s, e };
}
function overlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return Math.max(0, e - s);
}
function bookedBusinessHoursInWindow(
  booking: { start: Date; end: Date },
  winStart: Date,
  winEnd: Date
) {
  let s = new Date(
    Math.max(new Date(booking.start).getTime(), winStart.getTime())
  );
  const e = new Date(
    Math.min(new Date(booking.end).getTime(), winEnd.getTime())
  );
  if (e <= s) return 0;

  let hours = 0;
  while (s < e) {
    if (!isWeekend(s)) {
      const { s: dayS, e: dayE } = workdayBounds(s);
      const ms = overlapMs(
        dayS.getTime(),
        dayE.getTime(),
        s.getTime(),
        e.getTime()
      );
      hours += ms / 3_600_000;
    }
    s = addDays(startOfDay(s), 1);
  }
  return hours;
}

// GET /api/admin/metrics
router.get(
  "/metrics",
  authentication,
  requireAdmin,
  async (_req, res, next) => {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalSpaces = await Space.countDocuments({ active: true });

      const totalBookings = await Booking.countDocuments({
        status: { $ne: BOOKING_STATUS.CANCELED },
        start: { $lt: now },
        end: { $gt: since },
      });

      const bookings = await Booking.find(
        {
          status: { $ne: BOOKING_STATUS.CANCELED },
          start: { $lt: now },
          end: { $gt: since },
        },
        { start: 1, end: 1 }
      ).lean();

      let reservedHours = 0;
      for (const b of bookings) {
        reservedHours += bookedBusinessHoursInWindow(
          { start: (b as any).start, end: (b as any).end },
          since,
          now
        );
      }

      const workdays = countWorkdaysBetween(since, now);
      const denom =
        totalSpaces > 0 ? totalSpaces * WORKING_HOURS_PER_DAY * workdays : 0;

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
      const now = new Date();
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const top = await Booking.aggregate([
        {
          $match: {
            status: { $ne: BOOKING_STATUS.CANCELED },
            start: { $lt: now },
            end: { $gt: since },
          },
        },
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
