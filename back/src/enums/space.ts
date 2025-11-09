export const SPACE_TYPES = ["meeting_room", "desk", "private_office"] as const;

export type SpaceType = (typeof SPACE_TYPES)[number];

export const SPACE_TYPE = {
  MEETING_ROOM: "meeting_room",
  DESK: "desk",
  PRIVATE_OFFICE: "private_office",
} as const;

export const isSpaceType = (v: unknown): v is SpaceType =>
  typeof v === "string" && (SPACE_TYPES as readonly string[]).includes(v);
