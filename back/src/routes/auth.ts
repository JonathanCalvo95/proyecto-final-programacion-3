import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../schemas/user";
import { env } from "../config/env";
import { USER_ROLES } from "../enums/role";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    if (!USER_ROLES.includes(role as any)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: name,
      email,
      password: hashed,
      role, // string ('admin' | 'client')
      isActive: true,
    });

    return res.status(201).json({ message: "Usuario creado", id: user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en el registro" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password requeridos" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const payload = {
      _id: user.id.toString(),
      email: user.email,
      role: user.role, // string
    };

    const secret = env.jwtSecret || "base-api-express-generator";
    const token = jwt.sign(payload, secret, {
      expiresIn: "7d",
      issuer: env.jwtIssuer || "base-api-express-generator",
      subject: user.id.toString(),
    });

    return res.json({
      token,
      user: {
        _id: user.id.toString(),
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en el login" });
  }
});

export default router;
