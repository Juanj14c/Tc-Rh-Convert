/**
 * Catálogo compartido de países admitidos para nacionalidad.
 * Las sedes/países de trabajo se guardan de forma independiente en workCenter.
 */
export const EMPLOYEE_COUNTRIES = [
  {
    code: "CO",
    name: "Colombia",
    nationality: "Colombiana",
    aliases: ["co", "colombia", "colombiano", "colombiana"],
  },
  {
    code: "MX",
    name: "México",
    nationality: "Mexicana",
    aliases: ["mx", "mexico", "méxico", "mexicano", "mexicana"],
  },
  {
    code: "ES",
    name: "España",
    nationality: "Española",
    aliases: ["es", "espana", "españa", "espanol", "español", "española"],
  },
  {
    code: "PE",
    name: "Perú",
    nationality: "Peruana",
    aliases: ["pe", "peru", "perú", "peruano", "peruana"],
  },
  {
    code: "UY",
    name: "Uruguay",
    nationality: "Uruguaya",
    aliases: ["uy", "uruguay", "uruguayo", "uruguaya"],
  },
] as const;

export type EmployeeCountryCode = (typeof EMPLOYEE_COUNTRIES)[number]["code"];
export type EmployeeType = "planta" | "campana";
