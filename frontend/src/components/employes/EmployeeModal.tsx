import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export interface Employee {
  id: number;
  name: string;
  email: string;
  countryCode: "CO" | "MX" | "ES";
  countryName: string;
  area: string;
  campaign?: string;
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
  email: "",
  countryCode: "CO",
  countryName: "Colombia",
  area: "",
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
        ...employee,
        campaign: employee.campaign ?? "",
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
    value: "CO" | "MX" | "ES",
  ) => {
    const country = countries.find(
      (item) => item.code === value,
    );

    setFormData((current) => ({
      ...current,
      countryCode: value,
      countryName:
        country?.name ?? "",
    }));
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

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
      if (
        typeof reader.result !==
        "string"
      ) {
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

    const cleanName =
      formData.name.trim();

    const cleanEmail =
      formData.email.trim();

    const cleanArea =
      formData.area.trim();

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
        "El área es obligatoria.",
      );

      return;
    }

    const savedEmployee: Employee = {
      ...formData,
      name: cleanName,
      email: cleanEmail,
      area: cleanArea,
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
                  alt={formData.name}
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
                JPG, PNG o WEBP. Máximo 5 MB.
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
            <label className="employee-modal__field employee-modal__field--full">
              Nombre completo
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleChange(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="Ej. Juan Pérez"
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
              <select
                value={
                  formData.countryCode
                }
                onChange={(event) =>
                  handleCountryChange(
                    event.target
                      .value as
                      | "CO"
                      | "MX"
                      | "ES",
                  )
                }
              >
                {countries.map(
                  (country) => (
                    <option
                      key={country.code}
                      value={country.code}
                    >
                      {country.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="employee-modal__field">
              Área
              <input
                type="text"
                value={formData.area}
                onChange={(event) =>
                  handleChange(
                    "area",
                    event.target.value,
                  )
                }
                placeholder="Ej. Comercial"
              />
            </label>

            <label className="employee-modal__field">
              Campaña
              <input
                type="text"
                value={
                  formData.campaign ??
                  ""
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
                      event.target
                        .value === "active",
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