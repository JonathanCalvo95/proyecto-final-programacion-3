export const GOVERNMENT_ID_TYPES = [
  "cuil",
  "cuit",
  "dni",
  "lc",
  "le",
  "pas",
] as const;

export type GovernmentIdType = (typeof GOVERNMENT_ID_TYPES)[number];

export const GOVERNMENT_ID_TYPE = {
  CUIL: "cuil",
  CUIT: "cuit",
  DNI: "dni",
  LC: "lc",
  LE: "le",
  PAS: "pas",
} as const satisfies Record<Uppercase<GovernmentIdType>, GovernmentIdType>;
