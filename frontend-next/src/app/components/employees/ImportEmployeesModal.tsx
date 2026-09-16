"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import type { Employee } from "@/components/employees/EmployeeModal";

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employees: Employee[]) => void;
  existingEmployees?: Employee[];
}

interface ImportedRow {
  rowNumber: number;
  name: string;
  lastName: string;
  email: string;
  country: string;
  workCenter: string;
  area: string;
  team: string;
  position: string;
  gender: string;
  hireDate: string;
  birthDate: string;
  nationality: string;
  campaign: string;
  valid: boolean;
  error?: string;
}

const countryMap: Record<
  string,
  {
    code: "CO" | "MX" | "ES" | "UY" | "PE";
    name: string;
  }
> = {
  co: {
    code: "CO",
    name: "Colombia",
  },
  colombia: {
    code: "CO",
    name: "Colombia",
  },
  mx: {
    code: "MX",
    name: "México",
  },
  mexico: {
    code: "MX",
    name: "México",
  },
  méxico: {
    code: "MX",
    name: "México",
  },
  es: {
    code: "ES",
    name: "España",
  },
  españa: {
    code: "ES",
    name: "España",
  },
  espana: {
    code: "ES",
    name: "España",
  },
  uy: {
    code: "UY",
    name: "Uruguay",
  },
  uruguay: {
    code: "UY",
    name: "Uruguay",
  },
  pe: {
    code: "PE",
    name: "Perú",
  },
  peru: {
    code: "PE",
    name: "Perú",
  },
  perú: {
    code: "PE",
    name: "Perú",
  },
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function isEmptyRow(
  row: Record<string, unknown>,
) {
  return Object.values(row).every(
    (value) =>
      String(value ?? "").trim() === "",
  );
}

function getValue(
  row: Record<string, unknown>,
  aliases: string[],
) {
  for (const alias of aliases) {
    const key = Object.keys(row).find(
      (item) =>
        normalizeHeader(item) ===
        normalizeHeader(alias),
    );

    if (key) {
      return String(
        row[key] ?? "",
      ).trim();
    }
  }

  return "";
}

function ImportEmployeesModal({
  isOpen,
  onClose,
  onImport,
  existingEmployees = [],
}: ImportEmployeesModalProps) {
  const [rows, setRows] = useState<
    ImportedRow[]
  >([]);

  const [fileName, setFileName] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const resetImport = () => {
    setRows([]);
    setFileName("");
    setError("");
    setIsLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setRows([]);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const XLSX = await import("xlsx");

      const buffer =
        await file.arrayBuffer();

      const workbook = XLSX.read(
        buffer,
        {
          type: "array",
        },
      );

      const firstSheetName =
        workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error(
          "El archivo no contiene hojas.",
        );
      }

      const worksheet =
        workbook.Sheets[
          firstSheetName
        ];

      const data =
        XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(worksheet, {
          defval: "",
          raw: false,
        });

      if (data.length === 0) {
        throw new Error(
          "El archivo no contiene registros.",
        );
      }

      const existingEmails =
        new Set(
          existingEmployees.map(
            (employee) =>
              normalizeEmail(
                employee.email,
              ),
          ),
        );

      const importedEmails =
        new Set<string>();

      const importedRows: ImportedRow[] =
        [];

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (isEmptyRow(row)) {
          return;
        }

        const name = getValue(
          row,
          ["name", "nombre"],
        );

        const lastName = getValue(
          row,
          [
            "lastname",
            "last name",
            "apellido",
          ],
        );

        const email = getValue(
          row,
          [
            "email",
            "correo",
            "correo electronico",
            "correo electrónico",
          ],
        );

        const country = getValue(
          row,
          [
            "country",
            "pais",
            "país",
            "country name",
          ],
        );

        const workCenter =
          getValue(
            row,
            [
              "work center",
              "workcenter",
              "centro de trabajo",
              "centro trabajo",
            ],
          );

        const area = getValue(
          row,
          [
            "area",
            "área",
            "departamento",
          ],
        );

        const team = getValue(
          row,
          ["team", "equipo"],
        );

        const position =
          getValue(
            row,
            [
              "position",
              "puesto",
              "cargo",
            ],
          );

        const gender = getValue(
          row,
          [
            "gender",
            "genero",
            "género",
            "sexo",
          ],
        );

        const hireDate =
          getValue(
            row,
            [
              "hire date",
              "hiredate",
              "fecha de contratación",
              "fecha contratacion",
              "fecha de contratacion",
            ],
          );

        const birthDate =
          getValue(
            row,
            [
              "birth date",
              "birthdate",
              "fecha de nacimiento",
            ],
          );

        const nationality =
          getValue(
            row,
            [
              "nationality",
              "nacionalidad",
            ],
          );

        const campaign =
          getValue(
            row,
            [
              "campaign",
              "campana",
              "campaña",
            ],
          );

        let rowError = "";

        if (!name) {
          rowError =
            "Falta el nombre.";
        } else if (!lastName) {
          rowError =
            "Falta el apellido.";
        } else if (!email) {
          rowError =
            "Falta el correo.";
        } else if (
          !isValidEmail(email)
        ) {
          rowError =
            "El correo no tiene un formato válido.";
        } else if (
          !countryMap[
            normalizeHeader(country)
          ]
        ) {
          rowError =
            "País no reconocido.";
        } else if (!workCenter) {
          rowError =
            "Falta el centro de trabajo.";
        } else if (!area) {
          rowError =
            "Falta el departamento.";
        } else if (!team) {
          rowError =
            "Falta el equipo.";
        } else if (!position) {
          rowError =
            "Falta el puesto.";
        } else if (!gender) {
          rowError =
            "Falta el género.";
        } else if (!hireDate) {
          rowError =
            "Falta la fecha de contratación.";
        } else if (!birthDate) {
          rowError =
            "Falta la fecha de nacimiento.";
        } else if (!nationality) {
          rowError =
            "Falta la nacionalidad.";
        } else {
          const normalizedEmail =
            normalizeEmail(email);

          if (
            existingEmails.has(
              normalizedEmail,
            )
          ) {
            rowError =
              "Este correo ya existe en empleados.";
          } else if (
            importedEmails.has(
              normalizedEmail,
            )
          ) {
            rowError =
              "Este correo está duplicado dentro del archivo.";
          } else {
            importedEmails.add(
              normalizedEmail,
            );
          }
        }

        importedRows.push({
          rowNumber,
          name,
          lastName,
          email,
          country,
          workCenter,
          area,
          team,
          position,
          gender,
          hireDate,
          birthDate,
          nationality,
          campaign,
          valid: !rowError,
          error:
            rowError || undefined,
        });
      });

      if (
        importedRows.length ===
        0
      ) {
        throw new Error(
          "El archivo no contiene registros válidos para revisar.",
        );
      }

      setRows(importedRows);
    } catch (importError) {
      console.error(
        "Error importando empleados:",
        importError,
      );

      setError(
        importError instanceof Error
          ? importError.message
          : "No fue posible leer el archivo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validRows =
    rows.filter(
      (row) => row.valid,
    );

  const invalidRows =
    rows.filter(
      (row) => !row.valid,
    );

  const handleImport = () => {
    if (validRows.length === 0) {
      return;
    }

    const employees: Employee[] =
      validRows.map(
        (row, index) => {
          const country =
            countryMap[
              normalizeHeader(
                row.country,
              )
            ];

          return {
            id:
              Date.now() + index,

            name: row.name,
            lastName:
              row.lastName,

            email: row.email,

            countryCode:
              country.code,
            countryName:
              country.name,

            workCenter:
              row.workCenter,

            area: row.area,

            team: row.team,

            position:
              row.position,

            gender: row.gender,

            hireDate:
              row.hireDate,

            birthDate:
              row.birthDate,

            nationality:
              row.nationality,

            campaign:
              row.campaign,

            image: "",

            active: true,
          };
        },
      );

    onImport(employees);

    resetImport();
  };

  return (
    <div
      className="employee-import-modal__overlay"
      onClick={handleClose}
    >
      <div
        className="employee-import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-import-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="employee-import-modal__header">
          <div>
            <span>
              Talento & Cultura
            </span>

            <h2 id="employee-import-title">
              Importar empleados
            </h2>
          </div>

          <button
            type="button"
            className="employee-import-modal__close"
            onClick={handleClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="employee-import-modal__body">
          <div className="employee-import-modal__upload">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={
                handleFileChange
              }
            />

            <button
              type="button"
              className="employee-import-modal__upload-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="employee-import-modal__loader" />
                  Procesando archivo...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Seleccionar archivo
                </>
              )}
            </button>

            <div className="employee-import-modal__formats">
              <FileSpreadsheet
                size={16}
              />

              <span>
                Excel (.xlsx, .xls) o CSV
              </span>
            </div>
          </div>

          {fileName &&
            !isLoading && (
              <div className="employee-import-modal__file">
                <FileSpreadsheet
                  size={18}
                />

                <div>
                  <strong>
                    {fileName}
                  </strong>

                  <span>
                    {rows.length}{" "}
                    registros encontrados
                  </span>
                </div>
              </div>
            )}

          {error && (
            <div className="employee-import-modal__error">
              <AlertCircle
                size={18}
              />

              <span>{error}</span>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="employee-import-modal__summary">
                <div className="employee-import-modal__summary-item employee-import-modal__summary-item--valid">
                  <CheckCircle2
                    size={17}
                  />

                  <div>
                    <strong>
                      {
                        validRows.length
                      }
                    </strong>

                    <span>
                      válidos
                    </span>
                  </div>
                </div>

                <div className="employee-import-modal__summary-item employee-import-modal__summary-item--invalid">
                  <AlertCircle
                    size={17}
                  />

                  <div>
                    <strong>
                      {
                        invalidRows.length
                      }
                    </strong>

                    <span>
                      con errores
                    </span>
                  </div>
                </div>
              </div>

              <div className="employee-import-modal__preview">
                <div className="employee-import-modal__table-wrapper">
                  <table className="employee-import-modal__table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo</th>
                        <th>País</th>
                        <th>
                          Centro de trabajo
                        </th>
                        <th>
                          Departamento
                        </th>
                        <th>
                          Equipo
                        </th>
                        <th>
                          Puesto
                        </th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map(
                        (
                          row,
                          index,
                        ) => (
                          <tr
                            key={`${row.email}-${index}`}
                            className={
                              row.valid
                                ? ""
                                : "employee-import-modal__row--invalid"
                            }
                          >
                            <td>
                              {
                                row.rowNumber
                              }
                            </td>

                            <td>
                              {row.name ||
                                "—"}
                            </td>

                            <td>
                              {row.lastName ||
                                "—"}
                            </td>

                            <td>
                              {row.email ||
                                "—"}
                            </td>

                            <td>
                              {row.country ||
                                "—"}
                            </td>

                            <td>
                              {row.workCenter ||
                                "—"}
                            </td>

                            <td>
                              {row.area ||
                                "—"}
                            </td>

                            <td>
                              {row.team ||
                                "—"}
                            </td>

                            <td>
                              {row.position ||
                                "—"}
                            </td>

                            <td>
                              {row.valid ? (
                                <span className="employee-import-modal__valid">
                                  <CheckCircle2
                                    size={
                                      14
                                    }
                                  />
                                  Válido
                                </span>
                              ) : (
                                <span className="employee-import-modal__invalid">
                                  <AlertCircle
                                    size={
                                      14
                                    }
                                  />
                                  {
                                    row.error
                                  }
                                </span>
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="employee-import-modal__footer">
          <button
            type="button"
            className="employee-import-modal__cancel"
            onClick={handleClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="employee-import-modal__import"
            onClick={handleImport}
            disabled={
              isLoading ||
              validRows.length ===
                0
            }
          >
            Importar{" "}
            {validRows.length > 0
              ? validRows.length
              : ""}{" "}
            empleados
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportEmployeesModal;