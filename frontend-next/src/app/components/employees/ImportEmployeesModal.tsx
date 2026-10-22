"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";

import type { Employee } from "@/components/employees/EmployeeModal";
import { EMPLOYEE_COUNTRIES, type EmployeeCountryCode, type EmployeeType } from "@/components/employees/employee-countries";

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employees: Employee[]) => void;
  existingEmployees?: Employee[];
  employeeType: EmployeeType;
}

interface ImportedRow {
  rowNumber: number;
  name: string;
  lastName: string;
  email: string;
  country: string;
  countryCode?: EmployeeCountryCode;
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

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isUnavailablePlaceholder(value: string) {
  return /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(value.trim());
}

function normalizePersonName(value: string) {
  const compacted = value.trim().replace(/\s+/g, " ");
  if (!compacted || isUnavailablePlaceholder(compacted)) return "";

  return compacted
    .toLocaleLowerCase("es")
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_match, separator: string, letter: string) =>
      separator + letter.toLocaleUpperCase("es"),
    );
}

function findCountry(value: string) {
  const normalized = normalizeHeader(value);
  if (!normalized || isUnavailablePlaceholder(normalized)) return undefined;

  return EMPLOYEE_COUNTRIES.find((country) =>
    normalizeHeader(country.code) === normalized ||
    normalizeHeader(country.name) === normalized ||
    normalizeHeader(country.nationality) === normalized ||
    country.aliases.some((alias) => normalizeHeader(alias) === normalized),
  );
}

function normalizeEmail(value: string) {
  return isUnavailablePlaceholder(value) ? "" : value.trim().toLowerCase();
}

function normalizeCampaign(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return !normalized || isUnavailablePlaceholder(normalized)
    ? ""
    : normalized.toLocaleUpperCase("es");
}

function normalizeGender(value: string) {
  const normalized = normalizeHeader(value);
  if (["f", "femenino", "femenina", "mujer", "female"].includes(normalized)) return "Femenino";
  if (["m", "masculino", "hombre", "male"].includes(normalized)) return "Masculino";
  if (["no especificado", "no especificada", "prefiero no decir"].includes(normalized)) return "No especificado";
  return normalizePersonName(value);
}

function normalizeExcelDate(value: string): string {
  const input = value.trim();
  if (!input || isUnavailablePlaceholder(input)) return "";

  let year = 0;
  let month = 0;
  let day = 0;
  const isoMatch = input.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const localMatch = input.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (localMatch) {
    day = Number(localMatch[1]);
    month = Number(localMatch[2]);
    year = Number(localMatch[3]);
  } else if (/^\d{5}(?:\.0+)?$/.test(input)) {
    const serial = Number(input);
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    day = date.getUTCDate();
  } else {
    return "";
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isFinite(date.getTime()) || year < 1900 || year > 2200 ||
      date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEmptyRow(row: Record<string, unknown>) {
  return Object.values(row).every((value) => String(value ?? "").trim() === "");
}

function getValue(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const key = Object.keys(row).find((item) => normalizeHeader(item) === normalizeHeader(alias));
    if (key) {
      const value = String(row[key] ?? "").trim();
      if (value) return value;
    }
  }
  return "";
}

function ImportEmployeesModal({
  isOpen,
  onClose,
  onImport,
  existingEmployees = [],
  employeeType,
}: ImportEmployeesModalProps) {
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetImport = () => {
    setRows([]);
    setFileName("");
    setError("");
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("El archivo no contiene hojas.");

      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], {
        defval: "",
        raw: false,
      });
      if (data.length === 0) throw new Error("El archivo no contiene registros.");

      const existingEmails = new Set(existingEmployees.map((employee) => normalizeEmail(employee.email)));
      const importedEmails = new Set<string>();
      const importedRows: ImportedRow[] = [];

      data.forEach((row, index) => {
        if (isEmptyRow(row)) return;
        const rowNumber = index + 2;
        const name = normalizePersonName(getValue(row, ["name", "nombre"]));
        const lastName = normalizePersonName(getValue(row, ["lastname", "last name", "apellido", "apellidos"]));
        const email = normalizeEmail(getValue(row, ["email", "correo", "correo electronico"]));

        const rawCountry = normalizePersonName(getValue(row, ["country", "pais", "country name"]));
        const explicitNationality = normalizePersonName(getValue(row, ["nationality", "nacionalidad"]));
        const mappedCountry = findCountry(rawCountry || explicitNationality) ?? findCountry(explicitNationality);
        const country = mappedCountry?.nationality ?? (rawCountry || explicitNationality);
        const countryCode = mappedCountry?.code;
        const nationality = findCountry(explicitNationality)?.nationality ?? explicitNationality ?? mappedCountry?.nationality ?? "";

        const workCenter = normalizePersonName(getValue(row, [
          "work center", "workcenter", "centro de trabajo", "centro trabajo", "pais de trabajo", "país de trabajo", "ubicacion", "sede",
        ]));
        const rawArea = getValue(row, ["area", "área", "departamento", "department"]);
        const area = isUnavailablePlaceholder(rawArea) ? "" : rawArea.trim().replace(/\s+/g, " ").toLocaleUpperCase("es");
        // Campañas no maneja equipos: ignoramos esa columna aunque venga en Excel.
        const team = employeeType === "campana"
          ? ""
          : normalizePersonName(getValue(row, ["team", "equipo"]));
        const position = normalizePersonName(getValue(row, ["position", "puesto", "cargo"]));
        const gender = normalizeGender(getValue(row, ["gender", "genero", "sexo"]));
        const rawHireDate = getValue(row, ["hire date", "hiredate", "fecha de contratación", "fecha contratacion", "fecha ingreso"]);
        const rawBirthDate = getValue(row, ["birth date", "birthdate", "fecha de nacimiento"]);
        const hireDate = normalizeExcelDate(rawHireDate);
        const birthDate = normalizeExcelDate(rawBirthDate);
        const campaign = normalizeCampaign(getValue(row, ["campaign", "campana", "campaña"]));

        let rowError = "";
        if (!name) rowError = "Falta el nombre.";
        else if (!lastName) rowError = "Falta el apellido.";
        else if (!email) rowError = "Falta el correo.";
        else if (!isValidEmail(email)) rowError = "El correo no tiene un formato válido.";
        else if (!mappedCountry) rowError = "País/nacionalidad no reconocido. Usa Colombia, México, España, Perú o Uruguay.";
        else if (!workCenter) rowError = "Falta el país de trabajo.";
        else if (employeeType === "planta" && !area) rowError = "Falta el área/departamento para Planta.";
        else if (employeeType === "campana" && !campaign) rowError = "Falta la campaña para este registro.";
        else if (existingEmails.has(email)) rowError = "Este correo ya existe en empleados.";
        else if (importedEmails.has(email)) rowError = "Este correo está duplicado dentro del archivo.";
        else if (employeeType === "planta" && !team) rowError = "Falta el equipo para empleados de Planta.";
        else if (!position) rowError = "Falta el puesto.";
        else if (!gender) rowError = "Falta el género.";
        else if (!rawHireDate) rowError = "Falta la fecha de contratación.";
        else if (!hireDate) rowError = "La fecha de contratación no es válida. Usa DD/MM/AAAA o AAAA-MM-DD.";
        else if (!rawBirthDate) rowError = "Falta la fecha de nacimiento.";
        else if (!birthDate) rowError = "La fecha de nacimiento no es válida. Usa DD/MM/AAAA o AAAA-MM-DD.";

        if (!rowError) importedEmails.add(email);
        importedRows.push({
          rowNumber, name, lastName, email, country, countryCode, workCenter, area, team,
          position, gender, hireDate: hireDate || rawHireDate, birthDate: birthDate || rawBirthDate,
          nationality: nationality || mappedCountry?.nationality || "", campaign,
          valid: !rowError, error: rowError || undefined,
        });
      });

      if (importedRows.length === 0) throw new Error("El archivo no contiene registros válidos para revisar.");
      setRows(importedRows);
    } catch (importError) {
      console.error("Error importando empleados:", importError);
      setError(importError instanceof Error ? importError.message : "No fue posible leer el archivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const validRows = rows.filter((row) => row.valid);
  const invalidRows = rows.filter((row) => !row.valid);

  const handleImport = () => {
    if (rows.length === 0 || invalidRows.length > 0 || validRows.length === 0) return;

    const employees: Employee[] = [];
    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      const country = EMPLOYEE_COUNTRIES.find((item) => item.code === row.countryCode);
      if (!country) {
        setError(`No se pudo reconocer el país de la fila ${row.rowNumber}. Revisa el archivo y vuelve a cargarlo.`);
        return;
      }

      employees.push({
        id: Date.now() + index,
        name: normalizePersonName(row.name),
        lastName: normalizePersonName(row.lastName),
        email: normalizeEmail(row.email),
        countryCode: country.code,
        countryName: country.name,
        nationality: country.nationality,
        workCenter: normalizePersonName(row.workCenter),
        area: row.area.trim().replace(/\s+/g, " ").toLocaleUpperCase("es"),
        team: employeeType === "campana" ? "" : normalizePersonName(row.team),
        position: normalizePersonName(row.position),
        gender: normalizeGender(row.gender),
        hireDate: normalizeExcelDate(row.hireDate),
        birthDate: normalizeExcelDate(row.birthDate),
        campaign: normalizeCampaign(row.campaign),
        employeeType,
        image: "",
        active: true,
      });
    }

    onImport(employees);
    resetImport();
  };

  const viewLabel = employeeType === "planta" ? "Planta" : "Campañas";

  return (
    <div className="employee-import-modal__overlay" onClick={handleClose}>
      <div className="employee-import-modal" role="dialog" aria-modal="true" aria-labelledby="employee-import-title" onClick={(event) => event.stopPropagation()}>
        <div className="employee-import-modal__header">
          <div>
            <span>Importación dirigida a {viewLabel}</span>
            <h2 id="employee-import-title">Importar empleados</h2>
          </div>
          <button type="button" className="employee-import-modal__close" onClick={handleClose} aria-label="Cerrar" title="Cerrar"><X size={20} /></button>
        </div>

        <div className="employee-import-modal__body">
          <div className="employee-import-modal__upload">
            <input ref={fileInputRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            <button type="button" className="employee-import-modal__upload-button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? <><span className="employee-import-modal__loader" /> Procesando archivo...</> : <><Upload size={18} /> Seleccionar archivo</>}
            </button>
            <div className="employee-import-modal__formats"><FileSpreadsheet size={16} /><span>Excel (.xlsx, .xls) o CSV</span></div>
          </div>

          {fileName && !isLoading && (
            <div className="employee-import-modal__file"><FileSpreadsheet size={18} /><div><strong>{fileName}</strong><span>{rows.length} registros encontrados · Tipo: {viewLabel}</span></div></div>
          )}
          {error && <div className="employee-import-modal__error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}

          {rows.length > 0 && <>
            <div className="employee-import-modal__summary">
              <div className="employee-import-modal__summary-item employee-import-modal__summary-item--valid"><CheckCircle2 size={17} /><div><strong>{validRows.length}</strong><span>válidos</span></div></div>
              <div className="employee-import-modal__summary-item employee-import-modal__summary-item--invalid"><AlertCircle size={17} /><div><strong>{invalidRows.length}</strong><span>con errores</span></div></div>
            </div>
            {invalidRows.length > 0 && <div className="employee-import-modal__error" role="alert"><AlertCircle size={18} /><span>Importación bloqueada: corrige las {invalidRows.length} fila(s) con errores. No se guardará ningún empleado hasta que todas las filas sean válidas.</span></div>}
            <div className="employee-import-modal__preview"><div className="employee-import-modal__table-wrapper">
              <table className="employee-import-modal__table">
                <thead><tr><th>Fila</th><th>Nombre</th><th>Apellido</th><th>Correo</th><th>Nacionalidad</th><th>País de trabajo</th><th>Área</th>{employeeType !== "campana" && <th>Equipo</th>}<th>Campaña</th><th>Contratación</th><th>Puesto</th><th>Estado</th></tr></thead>
                <tbody>{rows.map((row, index) => <tr key={`${row.email}-${index}`} className={row.valid ? "" : "employee-import-modal__row--invalid"}>
                  <td>{row.rowNumber}</td><td>{row.name || "N/A"}</td><td>{row.lastName || "N/A"}</td><td>{row.email || "N/A"}</td><td>{row.country || "N/A"}</td><td>{row.workCenter || "N/A"}</td><td>{row.area || "N/A"}</td>{employeeType !== "campana" && <td>{row.team || "N/A"}</td>}<td>{row.campaign || "N/A"}</td><td>{row.hireDate || "N/A"}</td><td>{row.position || "N/A"}</td>
                  <td>{row.valid ? <span className="employee-import-modal__valid"><CheckCircle2 size={14} /> Válido</span> : <span className="employee-import-modal__invalid"><AlertCircle size={14} /> {row.error}</span>}</td>
                </tr>)}</tbody>
              </table>
            </div></div>
          </>}
        </div>

        <div className="employee-import-modal__footer">
          <button type="button" className="employee-import-modal__cancel" onClick={handleClose}>Cancelar</button>
          <button type="button" className="employee-import-modal__import" onClick={handleImport} disabled={isLoading || validRows.length === 0 || invalidRows.length > 0}>
            {invalidRows.length > 0 ? "Corrige los errores para importar" : `Importar ${validRows.length > 0 ? validRows.length : ""} empleados a ${viewLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportEmployeesModal;
