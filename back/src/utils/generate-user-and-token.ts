import jwt from "jsonwebtoken";
import { IUser, JWTPayload } from "../types/index";
import { UserRole } from "../enums";

interface UserResponse {
  _id: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}

interface TokenResponse {
  token: string;
  user: UserResponse;
}

async function generateUserToken(
  _req: unknown,
  user: IUser
): Promise<TokenResponse> {
  const payload: JWTPayload = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const userResponse: UserResponse = {
    _id: user._id.toString(),
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const secret = process.env.JWT_SECRET || "base-api-express-generator";

  const token = jwt.sign(payload, secret, {
    subject: user._id.toString(),
    issuer: process.env.JWT_ISSUER || "base-api-express-generator",
  });

  return { token, user: userResponse };
}

export default generateUserToken;
