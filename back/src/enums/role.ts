export const USER_ROLES = ['admin', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];
