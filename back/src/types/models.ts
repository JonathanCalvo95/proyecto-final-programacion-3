import { Document, Types } from "mongoose";
import type { UserRole } from "../enums";

/* ===== Usuario ===== */
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
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
}

/* ===== Env ===== */
export interface EnvironmentVariables {
  NODE_ENV?: string;
  PORT?: string;
  MONGODB_URI?: string;
  JWT_SECRET?: string;
  JWT_ISSUER?: string;
}
