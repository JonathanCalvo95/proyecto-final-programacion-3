import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

import User from "../schemas/user";
import Role from "../schemas/role";
import { CreateUserRequest } from "../types/index";
import authentication from "../middlewares/authentication";

const router = express.Router();

function isAdmin(req: Request): boolean {
  return (req.user as any)?.role === "admin";
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
  const self = req.params.id === (req.user as any)?._id;
  if (self || isAdmin(req)) return next();
  res.status(403).send("Unauthorized");
}

router.get("/", authentication, ensureAdmin, getAllUsers);
router.get("/:id", authentication, ensureSelfOrAdmin, getUserById);
router.post("/", authentication, ensureAdmin, createUser);
router.put("/:id", authentication, ensureSelfOrAdmin, updateUser);
router.delete("/:id", authentication, ensureAdmin, deleteUser);

function toDate(input: string): Date {
  const parts = input.split("/");
  if (parts.length !== 3) {
    throw new Error("Invalid date format. Expected DD/MM/YYYY");
  }
  const [day, month, year] = parts;
  if (!day || !month || !year) {
    throw new Error("Invalid date format. Expected DD/MM/YYYY");
  }
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  console.log("getAllUsers by user ", (req.user as any)?._id);
  try {
    const users = await User.find({ isActive: true }).populate("role");
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
  console.log("getUser with id: ", req.params.id);

  if (!req.params.id) {
    res.status(500).send("The param id is not defined");
    return;
  }

  try {
    const user = await User.findById(req.params.id).populate("role");

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
  console.log("createUser: ", req.body);

  const user = req.body;

  try {
    if (!user.email || !user.password || !user.role) {
      res.status(400).send("Missing required fields: email, password, role");
      return;
    }

    const emailExists = await User.findOne({ email: user.email });
    if (emailExists) {
      res.status(409).send("Email already registered");
      return;
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      res.status(404).send("Role not found");
      return;
    }

    const passEncrypted = await bcrypt.hash(user.password, 10);

    const userCreated = await User.create({
      ...user,
      bornDate: user.bornDate ? toDate(user.bornDate.toString()) : undefined,
      password: passEncrypted,
      role: role._id,
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
  console.log("updateUser with id: ", req.params.id);

  if (!req.params.id) {
    res.status(404).send("Parameter id not found");
    return;
  }

  const isUserAdmin = isAdmin(req);
  if (!isUserAdmin && req.params.id !== (req.user as any)?._id) {
    res.status(403).send("Unauthorized");
    return;
  }

  // The email can't be updated
  delete (req.body as any).email;

  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      console.error("User not found");
      res.status(404).send("User not found");
      return;
    }

    if (req.body.role) {
      const newRole =
        (await Role.findById(req.body.role)) ||
        (await Role.findOne({ name: req.body.role as any }));
      if (!newRole) {
        console.info("New role not found. Sending 400 to client");
        res.status(400).end();
        return;
      }
      (req.body as any).role = newRole._id.toString();
    }

    if (req.body.password) {
      const passEncrypted = await bcrypt.hash(req.body.password, 10);
      req.body.password = passEncrypted;
    }

    await userToUpdate.updateOne(req.body);
    res.send(userToUpdate);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  console.log("deleteUser with id: ", req.params.id);

  if (!req.params.id) {
    res.status(500).send("The param id is not defined");
    return;
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    await User.deleteOne({ _id: user._id });

    res.send(`User deleted :  ${req.params.id}`);
  } catch (err) {
    next(err);
  }
}

export default router;
