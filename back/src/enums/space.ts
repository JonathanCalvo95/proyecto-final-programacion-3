export const SPACE_TYPES = ["meeting_room", "desk", "private_office"] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const SPACE_TYPE = {
  MEETING_ROOM: "meeting_room",
  DESK: "desk",
  PRIVATE_OFFICE: "private_office",
} as const satisfies Record<
  "MEETING_ROOM" | "DESK" | "PRIVATE_OFFICE",
  SpaceType
>;
