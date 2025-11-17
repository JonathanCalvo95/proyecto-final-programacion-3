import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import User from "../schemas/user";
import { CreateUserRequest, UserRole } from "../types/index";
import { USER_ROLE, USER_ROLES } from "../enums/role";
import authentication from "../middlewares/authentication";

const router = express.Router();

function reqUser(req: Request) {
  return req.user as { _id?: string; role?: UserRole } | undefined;
}

function isAdmin(req: Request): boolean {
  return reqUser(req)?.role === USER_ROLE.ADMIN;
}

function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  res.status(403).send("Unauthorized");
}

function ensureSelfOrAdmin(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  const u = reqUser(req);
  if (u?.role === USER_ROLE.ADMIN || (u?._id && req.params.id === u._id))
    return next();
  res.status(403).send("Unauthorized");
}

router.get("/", authentication, ensureAdmin, getAllUsers);
router.get("/:id", authentication, ensureSelfOrAdmin, getUserById);
router.post("/", authentication, ensureAdmin, createUser);
router.put("/:id", authentication, ensureSelfOrAdmin, updateUser);
router.delete("/:id", authentication, ensureAdmin, deleteUser);

function toDate(input: string): Date {
  const parts = input.split("/");
  if (parts.length !== 3)
    throw new Error("Invalid date format. Expected DD/MM/YYYY");
  const [day, month, year] = parts;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10)
  );
}

async function getAllUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find({ isActive: true }).lean();
    res.send(users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    res.send(user);
  } catch (err) {
    next(err);
  }
}

async function createUser(
  req: Request<Record<string, never>, unknown, CreateUserRequest>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body;
    if (!body.email || !body.password || !body.role) {
      res.status(400).send("Missing required fields: email, password, role");
      return;
    }
    if (!USER_ROLES.includes(body.role as UserRole)) {
      res.status(400).send("Invalid role");
      return;
    }

    const emailExists = await User.findOne({ email: body.email }).lean();
    if (emailExists) {
      res.status(409).send("Email already registered");
      return;
    }

    const passEncrypted = await bcrypt.hash(body.password, 10);

    const userCreated = await User.create({
      ...body,
      password: passEncrypted,
      role: body.role as UserRole,
    });

    res.status(201).send(userCreated);
  } catch (err) {
    next(err);
  }
}

async function updateUser(
  req: Request<{ id: string }, unknown, Partial<CreateUserRequest>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.id) {
      res.status(404).send("Parameter id not found");
      return;
    }

    const requester = reqUser(req);
    if (
      !(requester?.role === USER_ROLE.ADMIN || requester?._id === req.params.id)
    ) {
      res.status(403).send("Unauthorized");
      return;
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      res.status(404).send("User not found");
      return;
    }

    const update: Partial<CreateUserRequest> = { ...req.body };

    delete (update as any).email;

    if (update.role) {
      if (!USER_ROLES.includes(update.role as UserRole)) {
        res.status(400).send("Invalid role");
        return;
      }
    }

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }

    await userToUpdate.updateOne(update);
    const fresh = await User.findById(req.params.id).lean();
    res.send(fresh);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.id) {
      res.status(500).send("The param id is not defined");
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    user.isActive = false;
    await user.save();
    res.send({ id: req.params.id, isActive: false });
  } catch (err) {
    next(err);
  }
}

export default router;
