"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Upload,
  UserPlus,
  SlidersHorizontal,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mail,
} from "lucide-react";

import EmployeeModal, {
  type Employee,
} from "@/components/employees/EmployeeModal";

import ConfirmModal from "@/components/common/ConfirmModal";
import ImportEmployeesModal from "@/components/employees/ImportEmployeesModal";
import CustomSelect from "@/components/common/CustomSelect";
import { EMPLOYEE_COUNTRIES } from "@/components/employees/employee-countries";

const statusOptions = ["Activos", "Inactivos"];
const EMPLOYEES_PER_PAGE = 7;
type EmployeesView = "planta" | "campana" | "pendientes";

type EmployeeRecord = Employee & {
  profileId?: string | null;
  invitationStatus?: string | null;
};

function getInvitationLabel(employee: EmployeeRecord) {
  const status = (employee.invitationStatus ?? "not_sent").trim().toLowerCase();

  if (status === "accepted") return "Aceptada";
  if (["sent", "invited", "pending"].includes(status)) return "Enviada";
  if (employee.profileId) return "Vinculada";
  return "Invitar";
}

function canInviteEmployee(employee: EmployeeRecord) {
  const status = (employee.invitationStatus ?? "not_sent").trim().toLowerCase();
  return employee.active && !employee.profileId && ["", "not_sent", "failed", "error"].includes(status);
}

function displayValue(value: string | null | undefined) {
  const normalized = value?.trim();

  if (
    !normalized ||
    /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(normalized)
  ) {
    return "N/A";
  }

  return normalized;
}

/** Normaliza valores de registros antiguos al mostrarlos sin cambiar los campos en MAYÚSCULAS. */
function normalizeDisplayText(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  if (!normalized || /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(normalized)) return "";

  return normalized
    .toLocaleLowerCase("es")
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_match, separator: string, letter: string) =>
      separator + letter.toLocaleUpperCase("es"),
    );
}

function displayProperCase(value: string | null | undefined) {
  const normalized = displayValue(value);
  return normalized === "N/A" ? normalized : normalizeDisplayText(normalized);
}

/** Las campañas se muestran siempre normalizadas en mayúsculas. */
function displayCampaign(value: string | null | undefined) {
  const normalized = displayValue(value);
  return normalized === "N/A" ? normalized : normalized.toLocaleUpperCase("es");
}

/** Muestra el gentilicio en la interfaz sin cambiar el país canónico guardado. */
function displayCountryNationality(
  employee: Pick<Employee, "countryCode" | "countryName">,
) {
  const normalizedCountryName = employee.countryName?.trim().toLocaleLowerCase("es");
  const country = EMPLOYEE_COUNTRIES.find(
    (item) =>
      item.code === employee.countryCode ||
      item.name.toLocaleLowerCase("es") === normalizedCountryName ||
      item.nationality.toLocaleLowerCase("es") === normalizedCountryName,
  );

  return country?.nationality ?? displayValue(employee.countryName);
}

function formatEmployeeDate(value: string | null | undefined) {
  if (!value?.trim() || /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(value.trim())) {
    return "N/A";
  }

  const input = value.trim();
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function EmployeesPage() {
  const [employeeList, setEmployeeList] = useState<EmployeeRecord[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [employeeToToggle, setEmployeeToToggle] =
    useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<Employee | null>(null);

  const [employeeDetails, setEmployeeDetails] =
    useState<Employee | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [invitingEmployeeId, setInvitingEmployeeId] = useState<number | null>(null);

  const [activeView, setActiveView] = useState<EmployeesView>("planta");
  const [searchTerm, setSearchTerm] = useState("");
  const [workCenterFilter, setWorkCenterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [openSelect, setOpenSelect] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Solo mostrar la pestaña de pendientes si hay registros sin clasificar.
  const pendingEmployeeCount = employeeList.filter(
    (employee) => !employee.employeeType,
  ).length;
  /*
   * CARGAR EMPLEADOS DESDE LA API
   */

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        setIsLoadingEmployees(true);
        setLoadError("");

        const response = await fetch("/api/employees", {
          cache: "no-store",
        });

        const result = (await response.json()) as {
          employees?: EmployeeRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            result.error || "No se pudieron cargar los empleados.",
          );
        }

        if (!cancelled) {
          setEmployeeList(result.employees ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los empleados.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEmployees(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * VISTA ACTUAL Y OPCIONES DE FILTRO
   * Los registros antiguos sin employeeType aparecen en Por clasificar.
   */

  const scopedEmployees = employeeList.filter((employee) => {
    if (activeView === "pendientes") return !employee.employeeType;
    return employee.employeeType === activeView;
  });

  const uniqueValues = (values: Array<string | null | undefined>) =>
    Array.from(
      new Set(
        values
          .map((value) => value?.trim() ?? "")
          .filter((value) => value && !/^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));

  const workCenterOptions = uniqueValues(scopedEmployees.map((employee) => normalizeDisplayText(employee.workCenter)));
  const departmentOptions = uniqueValues(scopedEmployees.map((employee) => employee.area));
  const campaignOptions = uniqueValues(
    scopedEmployees.map((employee) => employee.campaign?.trim().replace(/\s+/g, " ").toLocaleUpperCase("es")),
  );

  /*
   * SELECTS
   */

  const toggleSelect = (selectName: string) => {
    setOpenSelect((current) =>
      current === selectName ? "" : selectName,
    );
  };

  /*
   * FILTRAR EMPLEADOS
   */

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredEmployees = scopedEmployees.filter((employee) => {
    const fullName = `${employee.name} ${employee.lastName ?? ""}`.toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      employee.name.toLowerCase().includes(normalizedSearch) ||
      (employee.lastName ?? "").toLowerCase().includes(normalizedSearch) ||
      fullName.includes(normalizedSearch) ||
      employee.email.toLowerCase().includes(normalizedSearch);

    const matchesWorkCenter =
      !workCenterFilter || normalizeDisplayText(employee.workCenter) === workCenterFilter;
    const matchesStatus =
      !statusFilter || (statusFilter === "active" ? employee.active : !employee.active);
    const matchesDepartment = !departmentFilter || employee.area === departmentFilter;
    const matchesCampaign =
      activeView !== "campana" ||
      !campaignFilter ||
      (employee.campaign ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("es") === campaignFilter.toLocaleUpperCase("es");

    return matchesSearch && matchesWorkCenter && matchesStatus && matchesDepartment && matchesCampaign;
  });

  /*
   * PAGINACIÓN
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * EMPLOYEES_PER_PAGE;

  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + EMPLOYEES_PER_PAGE,
  );

  /*
   * FILTROS Y CAMBIO DE VISTA
   */

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(workCenterFilter) ||
    Boolean(statusFilter) ||
    Boolean(departmentFilter) ||
    Boolean(campaignFilter);

  const handleClearFilters = () => {
    setSearchTerm("");
    setWorkCenterFilter("");
    setStatusFilter("");
    setDepartmentFilter("");
    setCampaignFilter("");
    setOpenSelect("");
    setCurrentPage(1);
  };

  const handleViewChange = (view: EmployeesView) => {
    setActiveView(view);
    setSearchTerm("");
    setWorkCenterFilter("");
    setStatusFilter("");
    setDepartmentFilter("");
    setCampaignFilter("");
    setOpenSelect("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleWorkCenterChange = (value: string) => {
    setWorkCenterFilter(value);
    setCurrentPage(1);
    setOpenSelect("");
  };

  const handleStatusChange = (value: string) => {
    const statusMap: Record<string, string> = { Activos: "active", Inactivos: "inactive" };
    setStatusFilter(statusMap[value] ?? "");
    setCurrentPage(1);
    setOpenSelect("");
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
    setOpenSelect("");
  };

  const handleCampaignChange = (value: string) => {
    setCampaignFilter(value);
    setCurrentPage(1);
    setOpenSelect("");
  };

  /*
   * CREAR Y EDITAR EMPLEADOS
   */

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    // En la vista de pendientes también se puede editar un empleado inactivo
    // para asignarle su tipo y retirarlo de la cola de clasificación.
    if (!employee.active && activeView !== "pendientes") {
      return;
    }

    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (employee: Employee) => {

    const editingId = editingEmployee?.id;
    const isEditing = editingId !== undefined;
    const employeePayload={...employee};
    delete employeePayload.image;

    try {
      const response = await fetch("/api/employees", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? { id: editingId, employee: employeePayload }
            : { employee: employeePayload },
        ),
      });

      const result = (await response.json()) as {
        employee?: EmployeeRecord;
        employees?: EmployeeRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "No se pudo guardar el empleado.",
        );
      }

      const savedEmployee = isEditing
        ? result.employee
        : result.employees?.[0];

      if (!savedEmployee) {
        throw new Error(
          "No recibimos la confirmación del empleado guardado.",
        );
      }

      setEmployeeList((current) =>
        isEditing
          ? current.map((item) =>
              item.id === editingId ? savedEmployee : item,
            )
          : [savedEmployee, ...current],
      );

      setLoadError("");
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);

      // Si acabamos de clasificar un registro, ir directamente a su vista.
      if (
        activeView === "pendientes" &&
        (savedEmployee.employeeType === "planta" ||
          savedEmployee.employeeType === "campana")
      ) {
        handleViewChange(savedEmployee.employeeType);
      } else {
        setCurrentPage(1);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el empleado.",
      );
    }
  };

  /*
   * ENVIAR INVITACIÓN DE ACCESO
   * La cuenta se crea en Supabase Auth únicamente al pulsar Invitar.
   */
  const handleInviteEmployee = async (employee: EmployeeRecord) => {
    if (!canInviteEmployee(employee)) return;

    setInvitingEmployeeId(employee.id);
    try {
      const response = await fetch(`/api/employees/${employee.id}/invite`, {
        method: "POST",
        cache: "no-store",
      });
      const result = (await response.json()) as {
        employee?: { id: number; profileId?: string | null; invitationStatus?: string | null };
        error?: string;
      };

      if (!response.ok || !result.employee) {
        throw new Error(result.error || "No se pudo enviar la invitación.");
      }

      setEmployeeList((current) => current.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              profileId: result.employee?.profileId ?? item.profileId ?? null,
              invitationStatus: result.employee?.invitationStatus ?? "sent",
            }
          : item,
      ));
      window.alert(`La invitación fue enviada a ${employee.email}.`);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al enviar la invitación.",
      );
    } finally {
      setInvitingEmployeeId(null);
    }
  };

  /*
   * ACTIVAR Y DESACTIVAR EMPLEADOS
   */

  const handleToggleEmployee = async (employee: Employee) => {
    try {
      const response = await fetch("/api/employees", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: employee.id,
          active: !employee.active,
        }),
      });

      const result = (await response.json()) as {
        employee?: EmployeeRecord;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "No se pudo cambiar el estado del empleado.",
        );
      }

      if (!result.employee) {
        throw new Error(
          "No recibimos la confirmación del cambio de estado.",
        );
      }

      setEmployeeList((current) =>
        current.map((item) =>
          item.id === result.employee!.id
            ? result.employee!
            : item,
        ),
      );

      setEmployeeToToggle(null);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del empleado.",
      );
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: employee.id }),
      });
      const result = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo eliminar el empleado.");
      }

      const remainingPendingCount = employeeList.filter(
        (item) => item.id !== employee.id && !item.employeeType,
      ).length;

      setEmployeeList((current) => current.filter((item) => item.id !== employee.id));
      setEmployeeToDelete(null);
      setEmployeeDetails((current) => current?.id === employee.id ? null : current);

      if (activeView === "pendientes" && remainingPendingCount === 0) {
        handleViewChange("planta");
      } else {
        setCurrentPage(1);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar el empleado.");
    }
  };

  /*
   * IMPORTAR EMPLEADOS
   */

  const handleImportEmployees = async (
    importedEmployees: Employee[],
  ) => {
    if (importedEmployees.length === 0) {
      setIsImportModalOpen(false);
      return;
    }

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employees: importedEmployees,
        }),
      });

      const result = (await response.json()) as {
        employees?: EmployeeRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "No se pudieron importar los empleados.",
        );
      }

      setEmployeeList((current) => [
        ...(result.employees ?? []),
        ...current,
      ]);

      setLoadError("");
      setIsImportModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al importar los empleados.",
      );
    }
  };

  /*
   * PAGINACIÓN
   */

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  /*
   * INTERFAZ
   */

  return (
    <section className="employees-page">
      {/* HEADER */}

      <div className="employees-page__header">
        <div>
          <span className="employees-page__eyebrow">
            Talento & Cultura
          </span>

          <h1>{activeView === "planta" ? "Empleados Planta" : activeView === "campana" ? "Empleados Campañas" : "Empleados por clasificar"}</h1>

          <p>
            Gestiona los colaboradores de la organización.
          </p>
        </div>

        <div className="employees-page__actions">
          {activeView !== "pendientes" && (
            <button
              type="button"
              className="employees-page__secondary-button"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload size={18} />
              Importar
            </button>
          )}

          {activeView !== "pendientes" && (
            <button
              type="button"
              className="employees-page__primary-button"
              onClick={handleCreateEmployee}
            >
              <UserPlus size={18} />
              Nuevo empleado
            </button>
          )}
        </div>
      </div>

      {/* VISTAS POR TIPO DE EMPLEADO */}
      <div
        className="employees-page__view-tabs"
        style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" }}
        role="group"
        aria-label="Filtrar por tipo de empleado"
      >
        {[
          {
           id: "planta" as const,
           label:"Planta",
           count : employeeList.filter(
            (employee) => employee.employeeType === "planta",
          ).length
          },
          {
            id: "campana" as const,
            label:"Campaña",
            count: employeeList.filter(
              (employee) => employee.employeeType === "campana",
            ).length,
          },

        ].map((View)=>(
          <button
          key={View.id}
          type="button"
          className={
            activeView === View.id
            ? "employees-page__primary-button"
            : "employees-page__secondary-button"
          }
          onClick={()=> handleViewChange(View.id)}
          aria-pressed={activeView === View.id}
          >
            {View.label} ({View.count})
          </button>

        ))}
        {pendingEmployeeCount > 0 && (
          <button
          type="button"
          className={
            activeView === "pendientes"
            ?"employees-page__primary-button"
            : "employees-page__secondary-button"
          }
          onClick={()=> handleViewChange("pendientes")}
          aria-pressed={activeView === "pendientes"}
          >
            Por clasificar ({pendingEmployeeCount})
          </button>
        )
        }



      </div>

      {/* FILTROS */}

      <div className="employees-page__toolbar">
        <div className="employees-page__search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              handleSearchChange(event.target.value)
            }
            placeholder="Buscar por nombre o correo..."
            aria-label="Buscar empleado"
          />
        </div>

        <div className="employees-page__filter-group">
          <SlidersHorizontal size={17} />

          {/* PAÍS DE TRABAJO (no nacionalidad) */}
          <CustomSelect
            options={workCenterOptions}
            value={workCenterFilter}
            placeholder="Todos los países de trabajo"
            isOpen={openSelect === "workCenter"}
            onChange={handleWorkCenterChange}
            onToggle={() => toggleSelect("workCenter")}
            onClose={() => setOpenSelect("")}
          />

          {/* FILTRO DEPENDIENTE DE LA VISTA */}
          {activeView !== "campana" ? (
            <CustomSelect
              options={departmentOptions}
              value={departmentFilter}
              placeholder="Todas las áreas"
              isOpen={openSelect === "department"}
              onChange={handleDepartmentChange}
              onToggle={() => toggleSelect("department")}
              onClose={() => setOpenSelect("")}
            />
          ) : (
            <CustomSelect
              options={campaignOptions}
              value={campaignFilter}
              placeholder="Todas las campañas"
              isOpen={openSelect === "campaign"}
              onChange={handleCampaignChange}
              onToggle={() => toggleSelect("campaign")}
              onClose={() => setOpenSelect("")}
            />
          )}

          {/* ESTADO */}

          <CustomSelect
            options={statusOptions}
            value={
              statusFilter === "active"
                ? "Activos"
                : statusFilter === "inactive"
                  ? "Inactivos"
                  : ""
            }
            placeholder="Todos los estados"
            isOpen={openSelect === "status"}
            onChange={handleStatusChange}
            onToggle={() => toggleSelect("status")}
            onClose={() => setOpenSelect("")}
          />

          {/* LIMPIAR FILTROS */}

          {hasActiveFilters && (
            <button
              type="button"
              className="employees-page__clear-filters"
              onClick={handleClearFilters}
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <X size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE EMPLEADOS */}

      <div className="employees-page__card">
        <div className="employees-page__table-wrapper">
          <table className="employees-page__table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>País de trabajo</th>
                {activeView !== "campana" && <th>Área</th>}
                {(activeView === "campana" || activeView === "pendientes") && <th>Campaña</th>}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!isLoadingEmployees &&
                !loadError &&
                paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={
                      employee.active
                        ? ""
                        : "employees-page__row--inactive"
                    }
                  >
                    <td>
                      <div className="employees-page__employee">
                        <div className="employees-page__avatar">
                          {employee.image ? (
                            <img
                              src={employee.image}
                              alt={`${employee.name} ${employee.lastName ?? ""}`.trim()}
                            />
                          ) : (
                            <span>
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="employees-page__employee-info">
                          <strong>
                            {displayProperCase(
                              [employee.name, employee.lastName]
                                .filter(Boolean)
                                .join(" "),
                            )}
                          </strong>
                          <span>{displayValue(employee.email)}</span>
                        </div>
                      </div>
                    </td>

                    <td>{displayProperCase(employee.workCenter)}</td>

                    {activeView !== "campana" && <td>{displayValue(employee.area)}</td>}

                    {(activeView === "campana" || activeView === "pendientes") && <td>{displayCampaign(employee.campaign)}</td>}

                    <td>
                      <span
                        className={`employees-page__status ${
                          employee.active
                            ? "employees-page__status--active"
                            : "employees-page__status--inactive"
                        }`}
                      >
                        {employee.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="employees-page__actions-cell">
                        <button
                          type="button"
                          className="employees-page__action"
                          onClick={() => handleEditEmployee(employee)}
                          disabled={!employee.active && activeView !== "pendientes"}
                          title={
                            employee.active || activeView === "pendientes"
                              ? "Editar empleado"
                              : "El empleado está inactivo"
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="employees-page__action"
                          onClick={() => setEmployeeDetails(employee)}
                          title="Ver detalles del empleado"
                          aria-label={`Ver detalles de ${[employee.name, employee.lastName]
                            .filter(Boolean)
                            .join(" ")}`}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="employees-page__action"
                          onClick={() => void handleInviteEmployee(employee)}
                          disabled={
                            invitingEmployeeId === employee.id ||
                            !canInviteEmployee(employee)
                          }
                          title={
                            canInviteEmployee(employee)
                              ? "Enviar invitación de acceso"
                              : getInvitationLabel(employee)
                          }
                          aria-label={`${getInvitationLabel(employee)} para ${[employee.name, employee.lastName].filter(Boolean).join(" ")}`}
                        >
                          <Mail size={16} />
                          {invitingEmployeeId === employee.id
                            ? "Enviando..."
                            : getInvitationLabel(employee)}
                        </button>

                        <button
                          type="button"
                          className="employees-page__action"
                          onClick={() => setEmployeeToDelete(employee)}
                          title="Eliminar registro"
                          aria-label={`Eliminar registro de ${[employee.name, employee.lastName].filter(Boolean).join(" ")}`}
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          type="button"
                          className={`employees-page__toggle ${
                            employee.active
                              ? "employees-page__toggle--active"
                              : ""
                          }`}
                          onClick={() =>
                            setEmployeeToToggle(employee)
                          }
                          aria-label={
                            employee.active
                              ? "Desactivar empleado"
                              : "Activar empleado"
                          }
                          title={
                            employee.active
                              ? "Desactivar empleado"
                              : "Activar empleado"
                          }
                          aria-pressed={employee.active}
                        >
                          <span className="employees-page__toggle-thumb" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* ESTADOS DE CARGA, ERROR Y LISTA VACÍA */}

          {isLoadingEmployees ? (
            <div className="employees-page__empty">
              <p>Cargando empleados...</p>
            </div>
          ) : loadError ? (
            <div className="employees-page__empty">
              <h3>No se pudieron cargar los empleados</h3>
              <p>{loadError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="employees-page__empty">
              <h3>No encontramos empleados</h3>
              <p>
                Prueba con otro nombre, correo, país de trabajo, área, campaña o estado.
              </p>
            </div>
          ) : null}
        </div>

        {/* PAGINACIÓN */}

        {filteredEmployees.length > 0 &&
          !isLoadingEmployees &&
          !loadError &&
          totalPages > 1 && (
            <div className="employees-page__pagination">
              <button
                type="button"
                className="employees-page__pagination-button"
                onClick={handlePreviousPage}
                disabled={safeCurrentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="employees-page__pagination-info">
                Página {safeCurrentPage} de {totalPages}
              </span>

              <button
                type="button"
                className="employees-page__pagination-button"
                onClick={handleNextPage}
                disabled={safeCurrentPage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
      </div>

      {/* MODAL DE DETALLES DEL EMPLEADO */}

      {employeeDetails && (
        <div
          className="employee-import-modal__overlay"
          onClick={() => setEmployeeDetails(null)}
        >
          <div
            className="employee-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-details-title"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "900px" }}
          >
            <div className="employee-import-modal__header">
              <div>
                <span>Ficha del colaborador</span>
                <h2 id="employee-details-title">
                  {[employeeDetails.name, employeeDetails.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </h2>
              </div>

              <button
                type="button"
                className="employee-import-modal__close"
                onClick={() => setEmployeeDetails(null)}
                aria-label="Cerrar detalles"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="employee-import-modal__body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px",
                  marginBottom: "18px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                  background: "var(--color-surface-muted)",
                }}
              >
                <div className="employees-page__avatar" style={{ width: 58, height: 58, flexShrink: 0 }}>
                  {employeeDetails.image ? (
                    <img
                      src={employeeDetails.image}
                      alt={[employeeDetails.name, employeeDetails.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  ) : (
                    <span>{employeeDetails.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: "block", fontSize: "16px", color: "var(--color-text)" }}>
                    {[employeeDetails.name, employeeDetails.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </strong>
                  <span style={{ display: "block", marginTop: "4px", color: "var(--color-text-secondary)", overflowWrap: "anywhere" }}>
                    {displayValue(employeeDetails.email)}
                  </span>
                </div>

                <span
                  className={`employees-page__status ${
                    employeeDetails.active
                      ? "employees-page__status--active"
                      : "employees-page__status--inactive"
                  }`}
                >
                  {employeeDetails.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--color-text)" }}>
                Información laboral
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                {[
                  ["Tipo de empleado", employeeDetails.employeeType === "planta" ? "Planta" : employeeDetails.employeeType === "campana" ? "Campañas" : "Por clasificar"],
                  ["Nacionalidad", displayCountryNationality(employeeDetails)],
                  ["País de trabajo", displayProperCase(employeeDetails.workCenter)],
                  ["Fecha de contratación", formatEmployeeDate(employeeDetails.hireDate)],
                  ...(employeeDetails.employeeType !== "campana"
                    ? [["Área / departamento", displayValue(employeeDetails.area)]]
                    : []),
                  ...(employeeDetails.employeeType !== "campana"
                    ? [["Equipo", displayProperCase(employeeDetails.team)]]
                    : []),
                  ...(employeeDetails.employeeType !== "planta"
                    ? [["Campaña", displayCampaign(employeeDetails.campaign)]]
                    : []),
                  ["Cargo", displayProperCase(employeeDetails.position)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      minWidth: 0,
                      padding: "13px 14px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      background: "var(--color-surface)",
                    }}
                  >
                    <span style={{ display: "block", marginBottom: "6px", color: "var(--color-text-muted)", fontSize: "11px", fontWeight: 700 }}>
                      {label}
                    </span>
                    <strong style={{ display: "block", color: "var(--color-text)", fontSize: "13px", fontWeight: 650, overflowWrap: "anywhere" }}>
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--color-text)" }}>
                Datos personales
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "12px",
                }}
              >
                {[
                  ["Nombre", displayValue(employeeDetails.name)],
                  ["Apellido", displayValue(employeeDetails.lastName)],
                  ["Correo electrónico", displayValue(employeeDetails.email)],
                  ["Género", displayValue(employeeDetails.gender)],
                  ["Fecha de nacimiento", formatEmployeeDate(employeeDetails.birthDate)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      minWidth: 0,
                      padding: "13px 14px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      background: "var(--color-surface)",
                    }}
                  >
                    <span style={{ display: "block", marginBottom: "6px", color: "var(--color-text-muted)", fontSize: "11px", fontWeight: 700 }}>
                      {label}
                    </span>
                    <strong style={{ display: "block", color: "var(--color-text)", fontSize: "13px", fontWeight: 650, overflowWrap: "anywhere" }}>
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="employee-import-modal__footer">
              <button
                type="button"
                className="employee-import-modal__cancel"
                onClick={() => setEmployeeDetails(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREAR Y EDITAR */}

      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={true}
          employee={editingEmployee}
          defaultEmployeeType={activeView === "campana" ? "campana" : "planta"}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={handleSaveEmployee}
        />
      )}

      {/* CONFIRMAR ACTIVACIÓN O DESACTIVACIÓN */}

      <ConfirmModal
        isOpen={Boolean(employeeToToggle)}
        title={
          employeeToToggle?.active
            ? "¿Desactivar empleado?"
            : "¿Activar empleado?"
        }
        message={
          employeeToToggle?.active
            ? `El empleado ${employeeToToggle.name} dejará de estar activo.`
            : `El empleado ${employeeToToggle?.name} volverá a estar activo.`
        }
        confirmText={
          employeeToToggle?.active
            ? "Desactivar"
            : "Activar"
        }
        cancelText="Cancelar"
        onConfirm={() => {
          if (employeeToToggle) {
            void handleToggleEmployee(employeeToToggle);
          }
        }}
        onCancel={() => setEmployeeToToggle(null)}
      />

      {/* CONFIRMAR ELIMINACIÓN DEFINITIVA DEL REGISTRO */}
      <ConfirmModal
        isOpen={Boolean(employeeToDelete)}
        title="¿Eliminar registro de empleado?"
        message={`Se eliminará el registro de ${[employeeToDelete?.name, employeeToDelete?.lastName].filter(Boolean).join(" ") || "este empleado"}. Esta acción no elimina una cuenta de acceso de Supabase y no se puede deshacer.`}
        confirmText="Eliminar registro"
        cancelText="Cancelar"
        onConfirm={() => {
          if (employeeToDelete) {
            void handleDeleteEmployee(employeeToDelete);
          }
        }}
        onCancel={() => setEmployeeToDelete(null)}
      />

      {/* MODAL DE IMPORTACIÓN */}

      {isImportModalOpen && (
        <ImportEmployeesModal
          isOpen={true}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportEmployees}
          existingEmployees={employeeList}
          employeeType={activeView === "campana" ? "campana" : "planta"}
        />
      )}
    </section>
  );
}

export default EmployeesPage;