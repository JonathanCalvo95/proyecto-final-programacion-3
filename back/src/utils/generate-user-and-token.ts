import jwt from "jsonwebtoken";
// import fs from 'fs'
// import path from 'path'

import Role from "../schemas/role";
import { IUser, JWTPayload } from "../types/index";

interface UserResponse {
  _id: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface TokenResponse {
  token: string;
  user: UserResponse;
}

async function generateUserToken(
  req: unknown,
  user: IUser
): Promise<TokenResponse> {
  const role = await Role.findById(user.role).exec();

  if (!role) {
    throw new Error("Role not found");
  }

  const payload: JWTPayload = {
    _id: user._id.toString(),
    email: user.email,
    role: role.name,
  };

  const userResponse: UserResponse = {
    _id: user._id.toString(),
    role: role.name,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // const privateKey = fs.readFileSync(path.join(__dirname, `../keys/base-api-express-generator.pem`))

  // Unsecure alternative
  const token = jwt.sign(payload, "base-api-express-generator", {
    subject: user._id.toString(),
    issuer: "base-api-express-generator",
  });

  // const token = jwt.sign(payload, privateKey, {
  //   subject: user._id.toString(),
  //   issuer: 'base-api-express-generator',
  //   algorithm: 'RS256',
  // })

  return { token, user: userResponse };
}

export default generateUserToken;
