export const SPACE_TYPES = ['meeting_room', 'desk', 'private_office'] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];
