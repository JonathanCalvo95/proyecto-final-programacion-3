import { Document, Types } from "mongoose";

/* ===== User / Roles ===== */
export type UserRole = "admin" | "client";

export type GovernmentIdType = "cuil" | "cuit" | "dni" | "lc" | "le" | "pas";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole; // ← string (no ObjectId)
  firstName: string;
  lastName: string;
  phone?: string;
  governmentId?: { type: GovernmentIdType; number: string };
  bornDate?: Date;
  isActive: boolean;
  checkPassword(
    potentialPassword: string
  ): Promise<{ isOk: boolean; isLocked: boolean }>;
}

/* ===== JWT ===== */
export interface JWTPayload {
  _id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
}

/* ===== Express Request Augmentation ===== */
declare module "express-serve-static-core" {
  interface Request {
    user?: JWTPayload;
    isAdmin?(): boolean;
    isClient?(): boolean;
  }
}

/* ===== API helpers ===== */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  governmentId?: { type: GovernmentIdType; number: string };
  bornDate?: Date;
}

/* ===== Environment vars ===== */
export interface EnvironmentVariables {
  NODE_ENV?: string;
  PORT?: string;
  MONGODB_URI?: string; // ← alinea con tu .env actual
  JWT_SECRET?: string;
  JWT_ISSUER?: string;
}
