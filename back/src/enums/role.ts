export const USER_ROLES = ["admin", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE = {
  ADMIN: "admin",
  CLIENT: "client",
} as const satisfies Record<Uppercase<UserRole>, UserRole>;
