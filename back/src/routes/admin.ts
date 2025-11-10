import { Router, Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import Space from "../schemas/space";
import Booking from "../schemas/booking";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Forbidden" });
}

// GET /api/admin/metrics
router.get(
  "/metrics",
  authentication,
  requireAdmin,
  async (_req, res, next) => {
    try {
      const [totalSpaces, totalBookings] = await Promise.all([
        Space.countDocuments(),
        Booking.countDocuments({ status: { $ne: "cancelada" } }),
      ]);

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentBookings = await Booking.countDocuments({
        start: { $gte: since },
        status: { $ne: "cancelada" },
      });

      const occupancyRate = totalSpaces > 0 ? recentBookings / totalSpaces : 0;

      res.json({
        totalSpaces,
        totalBookings,
        occupancyRate,
      });
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
        { $match: { status: { $ne: "cancelada" } } },
        { $group: { _id: "$space", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const ids = top.map((t) => t._id);
      const spaces = await Space.find(
        { _id: { $in: ids } },
        { title: 1, name: 1 }
      );

      const map = new Map(
        spaces.map((s) => [s._id.toString(), (s as any).name || ""])
      );

      res.json(
        top.map((t) => ({
          _id: t._id,
          title: map.get(t._id.toString()) || "",
          count: t.count,
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

export default router;
