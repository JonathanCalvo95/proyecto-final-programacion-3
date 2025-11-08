import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../schemas/user";
import Role from "../schemas/role";
import { env } from "../config/env";

const router = Router();

// Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "El email ya está registrado" });

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) return res.status(404).json({ error: "Rol inválido" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: name,
      email,
      password: hashed,
      role: roleDoc._id,
    });

    res.status(201).json({ message: "Usuario creado", id: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el registro" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y password requeridos" });

    const user = await User.findOne({ email }).populate("role");
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const payload = {
      id: user.id.toString(),
      role: (user.role as any)?.name || "client",
      email: user.email,
    };
    const token = jwt.sign(payload, env.jwtSecret, {
      expiresIn: "7d",
      issuer: env.jwtIssuer,
    });

    res.json({ token, role: payload.role, name: user.firstName || user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el login" });
  }
});

export default router;
