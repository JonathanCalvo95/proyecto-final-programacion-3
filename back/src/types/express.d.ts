declare namespace Express {
  interface UserJwt {
    id: string;
    role: UserRole;
    email: string;
  }
  interface Request {
    user?: UserJwt;
  }
}
