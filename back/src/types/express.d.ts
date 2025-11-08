declare namespace Express {
  interface UserJwt {
    id: string;
    role: "admin" | "client";
    email: string;
  }
  interface Request {
    user?: UserJwt;
  }
}
