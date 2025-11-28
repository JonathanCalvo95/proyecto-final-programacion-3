export const AMENITIES = [
  "WiFi",
  "Proyector",
  "Pizarrón",
  "Café",
  "Aire acondicionado",
  "Calefacción",
] as const;

export type Amenity = (typeof AMENITIES)[number];
