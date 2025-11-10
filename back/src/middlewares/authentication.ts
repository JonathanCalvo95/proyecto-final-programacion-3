import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { JWTPayload } from "../types/index";
import { env } from "../config/env";

function getToken(req: Request, next: NextFunction): string | void {
  const TOKEN_REGEX = /^\s*Bearer\s+(\S+)/g;
  const matches = TOKEN_REGEX.exec(req.headers.authorization || "");
  if (matches) {
    const [, token] = matches;
    return token;
  }
  const cookieToken = (req as any).cookies?.token;
  if (cookieToken) return cookieToken;

  next(createHttpError.Unauthorized());
  return;
}

function authentication(req: Request, res: Response, next: NextFunction): void {
  if (!req.headers.authorization && !(req as any).cookies?.token) {
    console.error("Missing auth header/cookie");
    return next(createHttpError.Unauthorized());
  }

  const token = getToken(req, next);
  if (!token) return;

  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer || undefined,
    }) as JWTPayload;

    if (!decoded || !decoded._id || !decoded.role) {
      console.error("Error authenticating malformed JWT");
      return next(createHttpError.Unauthorized());
    }

    req.user = decoded as any;
    next();
  } catch (err) {
    const error = err as Error;
    if (error.name === "TokenExpiredError") {
      console.error("Expired token, sending 401 to client");
      res.sendStatus(401);
      return;
    }
    next(createHttpError(401, error.message));
  }
}

export default authentication;
