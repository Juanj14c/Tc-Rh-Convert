
"use client";

import { useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";
import {
  EMPLOYEE_COUNTRIES,
  EmployeeType,
  type EmployeeCountryCode,
  type EmployeeType as EmployeeTypeValue,
} from "@/components/employees/employee-countries";

export type { EmployeeType } from "@/components/employees/employee-countries";

export interface Employee {
  id: number;
  name: string;
  lastName?: string;
  email: string;
  countryCode: EmployeeCountryCode;
  countryName: string;
  workCenter?: string;
  area: string;
  team?: string;
  position?: string;
  gender?: string;
  hireDate?: string;
  birthDate?: string;
  nationality: string;
  campaign?: string;
  employeeType?: EmployeeTypeValue | null;
  image?: string;
  active: boolean;
}

interface EmployeeModalProps {
  isOpen: boolean;
  employee?: Employee | null;
  defaultEmployeeType?: EmployeeType;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

const emptyEmployee: Employee = {
  id: 0,
  name: "",
  lastName: "",
  email: "",
  countryCode: "CO",
  countryName: "Colombia",
  workCenter: "",
  area: "",
  team: "",
  position: "",
  gender: "",
  hireDate: "",
  birthDate: "",
  nationality: "Colombiana",
  campaign: "",
  employeeType: "planta",
  image: "",
  active: true,
};

const countries = EMPLOYEE_COUNTRIES;
const genderOptions = ["Femenino", "Masculino", "No especificado"];

function cleanOptional(value: string | null | undefined) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");

  return /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(normalized)
    ? ""
    : normalized;
}

function normalizeDisplayText(value: string | null | undefined) {
  const normalized = cleanOptional(value);

  if (!normalized) return "";

  return normalized
    .toLocaleLowerCase("es")
    .replace(
      /(^|[\s\-'’])(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        separator + letter.toLocaleUpperCase("es"),
    );
}

function normalizeGender(value: string | null | undefined) {
  const normalized = cleanOptional(value)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    ["f", "femenino", "femenina", "mujer", "female"].includes(
      normalized,
    )
  ) {
    return "Femenino";
  }

  if (
    ["m", "masculino", "hombre", "male"].includes(normalized)
  ) {
    return "Masculino";
  }

  if (
    [
      "no especificado",
      "no especificada",
      "prefiero no decir",
    ].includes(normalized)
  ) {
    return "No especificado";
  }

  return normalizeDisplayText(value);
}

export default function EmployeeModal({
  isOpen,
  employee = null,
  defaultEmployeeType = "planta",
  onClose,
  onSave,
}: EmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>(() => {
    if (employee) {
      return {
        ...emptyEmployee,
        ...employee,
        name: normalizeDisplayText(employee.name),
        lastName: normalizeDisplayText(employee.lastName),
        workCenter: normalizeDisplayText(employee.workCenter),
        team: normalizeDisplayText(employee.team),
        position: normalizeDisplayText(employee.position),
        gender: normalizeGender(employee.gender),
        hireDate: employee.hireDate ?? "",
        birthDate: employee.birthDate ?? "",
        nationality: normalizeDisplayText(employee.nationality),
        campaign: (employee.campaign ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .toLocaleUpperCase("es"),
        employeeType: employee.employeeType ?? null,
        image: employee.image ?? "",
      };
    }

    return {
      ...emptyEmployee,
      employeeType: defaultEmployeeType,
    };
  });

  const [error, setError] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const isEditing = Boolean(employee);
  const selectedEmployeeType = formData.employeeType ?? "";

  if (!isOpen) return null;

  const handleChange = (
    field: keyof Employee,
    value: string | boolean,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCountryChange = (value: string) => {
    const country = countries.find(
      (item) =>
        item.nationality === value || item.name === value,
    );

    if (!country) return;

    setFormData((current) => ({
      ...current,
      countryCode: country.code,
      countryName: country.name,
      nationality: country.nationality,
    }));

    setIsCountryOpen(false);
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const cleanName = normalizeDisplayText(formData.name);
    const cleanLastName = normalizeDisplayText(formData.lastName);
    const cleanEmail = cleanOptional(formData.email).toLowerCase();
    const cleanWorkCenter = normalizeDisplayText(formData.workCenter);

    const cleanArea = cleanOptional(formData.area)
      .replace(/\s+/g, " ")
      .toLocaleUpperCase("es");

    const cleanTeam = normalizeDisplayText(formData.team);
    const cleanPosition = normalizeDisplayText(formData.position);
    const cleanGender = normalizeGender(formData.gender);

    const cleanCampaign = cleanOptional(formData.campaign)
      .replace(/\s+/g, " ")
      .toLocaleUpperCase("es");

    const employeeType = formData.employeeType;

    if (!cleanName) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (!employeeType) {
      setError(
        "Selecciona si el empleado pertenece a Planta o Campañas.",
      );
      return;
    }

    if (!cleanWorkCenter) {
      setError("El país de trabajo es obligatorio.");
      return;
    }

    if (employeeType === "planta" && !cleanArea) {
      setError("El área es obligatoria para empleados de Planta.");
      return;
    }

    if (employeeType === "campana" && !cleanCampaign) {
      setError(
        "La campaña es obligatoria para empleados de Campañas.",
      );
      return;
    }

    const selectedCountry =
      countries.find(
        (item) => item.code === formData.countryCode,
      ) ?? countries[0];

    const savedEmployee: Employee = {
      ...formData,
      name: cleanName,
      lastName: cleanLastName,
      email: cleanEmail,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      nationality: selectedCountry.nationality,
      workCenter: cleanWorkCenter,
      area: cleanArea,
      team: employeeType === "campana" ? "" : cleanTeam,
      position: cleanPosition,
      gender: cleanGender,
      campaign: cleanCampaign,
      employeeType,

      // La imagen se conserva como dato de visualización.
      // Este formulario ya no permite subirla, cambiarla ni quitarla.
      image: formData.image ?? "",
    };

    onSave(savedEmployee);
  };

  return (
    <div
      className="employee-modal__overlay"
      onClick={onClose}
    >
      <div
        className="employee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="employee-modal__header">
          <div>
            <span>Talento &amp; Cultura</span>
            <h2 id="employee-modal-title">
              {isEditing ? "Editar empleado" : "Nuevo empleado"}
            </h2>
          </div>

          <button
            type="button"
            className="employee-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="employee-modal__form"
          onSubmit={handleSubmit}
        >
          {/* FOTO: SOLO VISUALIZACIÓN */}

          <div className="employee-modal__photo-section">
            <div className="employee-modal__photo">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt={formData.name || "Empleado"}
                />
              ) : (
                <span>
                  {formData.name.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="employee-modal__photo-actions">
              <strong>Foto de perfil</strong>
              <p>
                La fotografía la gestiona cada empleado
                desde Configuración.
              </p>
            </div>
          </div>

          <div className="employee-modal__grid">
            <label className="employee-modal__field">
              Tipo de empleado

              <select
                value={selectedEmployeeType}
                onChange={(event) => {
                  const nextType = (
                    event.target.value || null
                  ) as EmployeeTypeValue | null;

                  setFormData((current) => ({
                    ...current,
                    employeeType: nextType,
                    ...(nextType === "campana"
                      ? { team: "" }
                      : {}),
                  }));
                }}
                required
              >
                <option value="">Selecciona una opción</option>
                <option value="planta">Planta</option>
                <option value="campana">Campañas</option>
              </select>
            </label>

            <label className="employee-modal__field">
              Nombre
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleChange("name", event.target.value)
                }
                placeholder="Ej. Juan"
                required
              />
            </label>

            <label className="employee-modal__field">
              Apellido
              <input
                type="text"
                value={formData.lastName ?? ""}
                onChange={(event) =>
                  handleChange("lastName", event.target.value)
                }
                placeholder="Ej. Pérez"
              />
            </label>

            <label className="employee-modal__field">
              Correo electrónico
              <input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  handleChange("email", event.target.value)
                }
                placeholder="correo@empresa.com"
                required
              />
            </label>

            <label className="employee-modal__field">
              Nacionalidad
              <CustomSelect
                options={countries.map(
                  (country) => country.nationality,
                )}
                value={
                  countries.find(
                    (country) =>
                      country.code === formData.countryCode,
                  )?.nationality ?? ""
                }
                placeholder="Selecciona una nacionalidad"
                isOpen={isCountryOpen}
                onChange={handleCountryChange}
                onToggle={() =>
                  setIsCountryOpen((current) => !current)
                }
                onClose={() => setIsCountryOpen(false)}
              />
            </label>

            <label className="employee-modal__field">
              País de trabajo
              <input
                type="text"
                value={formData.workCenter ?? ""}
                onChange={(event) =>
                  handleChange("workCenter", event.target.value)
                }
                placeholder="Ej. Colombia"
                required
              />
            </label>

            {selectedEmployeeType !== "campana" && (
              <label className="employee-modal__field">
                Área / departamento
                {selectedEmployeeType === "planta" ? " *" : ""}
                <input
                  type="text"
                  value={formData.area}
                  onChange={(event) =>
                    handleChange("area", event.target.value)
                  }
                  placeholder="Ej. Recursos Humanos"
                  required={selectedEmployeeType === "planta"}
                />
              </label>
            )}

            {selectedEmployeeType !== "campana" && (
              <label className="employee-modal__field">
                Equipo
                <input
                  type="text"
                  value={formData.team ?? ""}
                  onChange={(event) =>
                    handleChange("team", event.target.value)
                  }
                  placeholder="Ej. Equipo Norte"
                />
              </label>
            )}

            <label className="employee-modal__field">
              Puesto
              <input
                type="text"
                value={formData.position ?? ""}
                onChange={(event) =>
                  handleChange("position", event.target.value)
                }
                placeholder="Ej. Analista"
              />
            </label>

            <label className="employee-modal__field">
              Género
              <select
                value={formData.gender ?? ""}
                onChange={(event) =>
                  handleChange("gender", event.target.value)
                }
              >
                <option value="">Selecciona una opción</option>
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </label>

            <label className="employee-modal__field">
              Fecha de contratación
              <input
                type="date"
                value={formData.hireDate ?? ""}
                onChange={(event) =>
                  handleChange("hireDate", event.target.value)
                }
              />
            </label>

            <label className="employee-modal__field">
              Fecha de nacimiento
              <input
                type="date"
                value={formData.birthDate ?? ""}
                onChange={(event) =>
                  handleChange("birthDate", event.target.value)
                }
              />
            </label>

            {selectedEmployeeType === "campana" && (
              <label className="employee-modal__field">
                Campaña *
                <input
                  type="text"
                  value={formData.campaign ?? ""}
                  onChange={(event) =>
                    handleChange(
                      "campaign",
                      event.target.value.toLocaleUpperCase("es"),
                    )
                  }
                  placeholder="Ej. WOM"
                  required
                />
              </label>
            )}

            {isEditing && (
              <label className="employee-modal__field">
                Estado
                <select
                  value={formData.active ? "active" : "inactive"}
                  onChange={(event) =>
                    handleChange(
                      "active",
                      event.target.value === "active",
                    )
                  }
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
            )}
          </div>

          {error && (
            <div className="employee-modal__error" role="alert">
              {error}
            </div>
          )}

          <div className="employee-modal__footer">
            <button
              type="button"
              className="employee-modal__cancel"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="employee-modal__save"
            >
              {isEditing ? "Guardar cambios" : "Crear empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
