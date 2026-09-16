"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";

export interface Employee {
  id: number;

  // Identificación
  name: string;
  lastName?: string;

  // Contacto
  email: string;

  // Organización
  countryCode: "CO" | "MX" | "ES" | "UY" | "PE";
  countryName: string;
  workCenter?: string;
  area: string;
  team?: string;
  position?: string;

  // Información personal
  gender?: string;
  hireDate?: string;
  birthDate?: string;
  nationality: string;

  // Operación
  campaign?: string;

  // Sistema
  image?: string;
  active: boolean;
}

interface EmployeeModalProps {
  isOpen: boolean;
  employee?: Employee | null;
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
  nationality: "",
  campaign: "",
  image: "",
  active: true,
};

const countries = [
  {
    code: "CO" as const,
    name: "Colombia",
  },
  {
    code: "MX" as const,
    name: "México",
  },
  {
    code: "ES" as const,
    name: "España",
  },
];

const genderOptions = [
  "Femenino",
  "Masculino",
  "No especificado",
];

function EmployeeModal({
  isOpen,
  employee = null,
  onClose,
  onSave,
}: EmployeeModalProps) {
  const [formData, setFormData] =
    useState<Employee>(() => {
      if (employee) {
        return {
          ...emptyEmployee,
          ...employee,
          lastName: employee.lastName ?? "",
          workCenter: employee.workCenter ?? "",
          team: employee.team ?? "",
          position: employee.position ?? "",
          gender: employee.gender ?? "",
          hireDate: employee.hireDate ?? "",
          birthDate: employee.birthDate ?? "",
          nationality: employee.nationality ?? "",
          campaign: employee.campaign ?? "",
          image: employee.image ?? "",
        };
      }

      return {
        ...emptyEmployee,
      };
    });

  const [imagePreview, setImagePreview] =
    useState(employee?.image ?? "");

  const [error, setError] =
    useState("");

  const [isCountryOpen, setIsCountryOpen] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const isEditing = Boolean(employee);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    field: keyof Employee,
    value: string | boolean,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCountryChange = (
    value: string,
  ) => {
    const country = countries.find(
      (item) => item.name === value,
    );

    if (!country) {
      return;
    }

    setFormData((current) => ({
      ...current,
      countryCode: country.code,
      countryName: country.name,
    }));

    setIsCountryOpen(false);
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Selecciona una imagen válida.",
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "La imagen no puede superar los 5 MB.",
      );

      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError(
          "No fue posible cargar la imagen.",
        );

        return;
      }

      setImagePreview(reader.result);

      setFormData((current) => ({
        ...current,
        image: reader.result as string,
      }));
    };

    reader.onerror = () => {
      setError(
        "No fue posible cargar la imagen.",
      );
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");

    setFormData((current) => ({
      ...current,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    const cleanName =
      formData.name.trim();

    const cleanLastName =
      formData.lastName?.trim() ?? "";

    const cleanEmail =
      formData.email.trim();

    const cleanWorkCenter =
      formData.workCenter?.trim() ?? "";

    const cleanArea =
      formData.area.trim();

    const cleanTeam =
      formData.team?.trim() ?? "";

    const cleanPosition =
      formData.position?.trim() ?? "";

    const cleanGender =
      formData.gender?.trim() ?? "";

    const cleanNationality =
      formData.nationality.trim();

    const cleanCampaign =
      formData.campaign?.trim() ?? "";

    if (!cleanName) {
      setError(
        "El nombre es obligatorio.",
      );

      return;
    }

    if (!cleanEmail) {
      setError(
        "El correo es obligatorio.",
      );

      return;
    }

    if (!cleanArea) {
      setError(
        "El departamento es obligatorio.",
      );

      return;
    }

    const savedEmployee: Employee = {
      ...formData,
      name: cleanName,
      lastName: cleanLastName,
      email: cleanEmail,
      workCenter: cleanWorkCenter,
      area: cleanArea,
      team: cleanTeam,
      position: cleanPosition,
      gender: cleanGender,
      nationality: cleanNationality,
      campaign: cleanCampaign,
      image: imagePreview,
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
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="employee-modal__header">
          <div>
            <span>
              Talento & Cultura
            </span>

            <h2 id="employee-modal-title">
              {isEditing
                ? "Editar empleado"
                : "Nuevo empleado"}
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
          <div className="employee-modal__photo-section">
            <div className="employee-modal__photo">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={
                    formData.name ||
                    "Empleado"
                  }
                />
              ) : (
                <span>
                  {formData.name
                    .charAt(0)
                    .toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="employee-modal__photo-actions">
              <strong>
                Foto de perfil
              </strong>

              <p>
                JPG, PNG o WEBP. Máximo
                5 MB.
              </p>

              <div className="employee-modal__photo-buttons">
                <button
                  type="button"
                  className="employee-modal__photo-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Camera size={16} />

                  {imagePreview
                    ? "Cambiar foto"
                    : "Subir foto"}
                </button>

                {imagePreview && (
                  <button
                    type="button"
                    className="employee-modal__photo-remove"
                    onClick={
                      handleRemoveImage
                    }
                  >
                    Quitar
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleImageChange
                }
              />
            </div>
          </div>

          <div className="employee-modal__grid">
            <label className="employee-modal__field">
              Nombre

              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleChange(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="Ej. Juan"
              />
            </label>

            <label className="employee-modal__field">
              Apellido

              <input
                type="text"
                value={
                  formData.lastName ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "lastName",
                    event.target.value,
                  )
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
                  handleChange(
                    "email",
                    event.target.value,
                  )
                }
                placeholder="correo@empresa.com"
              />
            </label>

            <label className="employee-modal__field">
              País

              <CustomSelect
                options={countries.map(
                  (country) =>
                    country.name,
                )}
                value={
                  formData.countryName
                }
                placeholder="Selecciona un país"
                isOpen={isCountryOpen}
                onChange={
                  handleCountryChange
                }
                onToggle={() =>
                  setIsCountryOpen(
                    (current) =>
                      !current,
                  )
                }
                onClose={() =>
                  setIsCountryOpen(false)
                }
              />
            </label>

            <label className="employee-modal__field">
              Centro de trabajo

              <input
                type="text"
                value={
                  formData.workCenter ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "workCenter",
                    event.target.value,
                  )
                }
                placeholder="Ej. Bogotá"
              />
            </label>

            <label className="employee-modal__field">
              Departamento

              <input
                type="text"
                value={formData.area}
                onChange={(event) =>
                  handleChange(
                    "area",
                    event.target.value,
                  )
                }
                placeholder="Ej. Recursos Humanos"
              />
            </label>

            <label className="employee-modal__field">
              Equipo

              <input
                type="text"
                value={
                  formData.team ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "team",
                    event.target.value,
                  )
                }
                placeholder="Ej. Equipo Norte"
              />
            </label>

            <label className="employee-modal__field">
              Puesto

              <input
                type="text"
                value={
                  formData.position ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "position",
                    event.target.value,
                  )
                }
                placeholder="Ej. Analista"
              />
            </label>

            <label className="employee-modal__field">
              Género

              <select
                value={
                  formData.gender ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "gender",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Selecciona una opción
                </option>

                {genderOptions.map(
                  (gender) => (
                    <option
                      key={gender}
                      value={gender}
                    >
                      {gender}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="employee-modal__field">
              Nacionalidad

              <input
                type="text"
                value={
                  formData.nationality
                }
                onChange={(event) =>
                  handleChange(
                    "nationality",
                    event.target.value,
                  )
                }
                placeholder="Ej. Colombiana"
              />
            </label>

            <label className="employee-modal__field">
              Fecha de contratación

              <input
                type="date"
                value={
                  formData.hireDate ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "hireDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="employee-modal__field">
              Fecha de nacimiento

              <input
                type="date"
                value={
                  formData.birthDate ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "birthDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="employee-modal__field">
              Campaña

              <input
                type="text"
                value={
                  formData.campaign ?? ""
                }
                onChange={(event) =>
                  handleChange(
                    "campaign",
                    event.target.value,
                  )
                }
                placeholder="Ej. WOM"
              />
            </label>

            {isEditing && (
              <label className="employee-modal__field">
                Estado

                <select
                  value={
                    formData.active
                      ? "active"
                      : "inactive"
                  }
                  onChange={(event) =>
                    handleChange(
                      "active",
                      event.target.value ===
                        "active",
                    )
                  }
                >
                  <option value="active">
                    Activo
                  </option>

                  <option value="inactive">
                    Inactivo
                  </option>
                </select>
              </label>
            )}
          </div>

          {error && (
            <div
              className="employee-modal__error"
              role="alert"
            >
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
              {isEditing
                ? "Guardar cambios"
                : "Crear empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeModal;