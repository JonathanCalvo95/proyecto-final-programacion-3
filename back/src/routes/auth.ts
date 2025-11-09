import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../schemas/user";
import { env } from "../config/env";
import authentication from "../middlewares/authentication";

const router = Router();

const cookieOpts = {
  httpOnly: true,
  secure: (env as any).cookieSecure ?? false,
  sameSite: ((env as any).cookieSecure ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// Registro de usuario (cliente por defecto)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "El email ya está registrado" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: name,
      email,
      password: hashed,
      role: "client",
    });

    res.status(201).json({
      id: user._id,
      name: user.firstName,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el registro" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password)
      return res.status(400).json({ error: "Email y password requeridos" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { _id: user._id.toString(), role: user.role, email: user.email } as any,
      env.jwtSecret,
      { expiresIn: "7d", issuer: env.jwtIssuer }
    );

    res.cookie("token", token, cookieOpts);
    res.json({
      id: user._id,
      name: user.firstName || user.email,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el login" });
  }
});

// Perfil
router.get(
  "/me",
  authentication,
  async (req, res) => {
    try {
      const user = await User.findById((req.user as any)?._id).select(
        "firstName email role"
      );
      if (!user) return res.status(401).json({ error: "No autenticado" });
      res.json({
        id: user._id,
        name: user.firstName || user.email,
        email: user.email,
        role: user.role,
      });
    } catch (e) {
      res.status(500).json({ error: "Error obteniendo perfil" });
    }
  }
);

// Logout
router.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

export default router;
