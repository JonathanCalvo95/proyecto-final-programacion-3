import dotenv from "dotenv";

dotenv.config({ path: ".env" });

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: req("MONGODB_URI"),
  jwtSecret: req("JWT_SECRET"),
  jwtIssuer: process.env.JWT_ISSUER,
  frontendUrl: process.env.FRONTEND_URL,
  logLevel: process.env.LOG_LEVEL,
};
