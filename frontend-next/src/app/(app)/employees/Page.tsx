import { useState } from "react";
import {
  Search,
  Upload,
  UserPlus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import EmployeeModal, {
  type Employee,
} from "@/components/employees/EmployeeModal";

import ConfirmModal from "@/components/common/ConfirmModal";
import ImportEmployeesModal from "@/components/employees/ImportEmployeesModal";
import CustomSelect from "@/components/common/CustomSelect";

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Juan Pérez",
    lastName: "Pérez",
    email: "juan.perez@empresa.com",
    countryCode: "CO",
    countryName: "Colombia",
    workCenter:"Bogotá",
    area: "Comercial",
    team: "Ventas",
    position:"Asesor",
    gender:"Masculino",
    hireDate:"2025-01-15",
    birthDate: "1998-06-20",
    nationality: "Colombiana",
    campaign: "WOM",
    image: "",
    active: true,
  },
  {
    id: 2,
    name: "María López",
    lastName: "López",
    email: "maria.lopez@empresa.com",
    countryCode: "MX",
    countryName: "México",
    workCenter : "Tijuana",
    area: "Recursos Humanos",
    team: "Desarrollo y innovación",
    position: "Desarrollador",
    gender : "femenina",
    hireDate: "2025-02-16",
    birthDate : "1999-07-21",
    nationality : "Mexicana",
    campaign: "",
    image: "",
    active: true,
  },
  {
    id: 3,
    name: "Carlos Rodríguez",
    lastName: "Rogríguez",
    email: "carlos.rodriguez@empresa.com",
    countryCode: "ES",
    countryName: "España",
    workCenter: "Madrid",
    area: "Ventas",
    team: "BackOffice",
    position : "Supervisor",
    gender :"Masculino",
    hireDate: "2025-03-17",
    birthDate : "2000-08-22",
    nationality: "Española",
    campaign: "Tigo",
    image: "",
    active: false,
  },
  {
    id: 4,
    name: "Laura Gómez",
    lastName: "Gómez",
    email: "laura.gomez@empresa.com",
    countryCode: "CO",
    countryName: "Colombia",
    workCenter: "Cali",
    area: "BI",
    team : "BI",
    position: "BI Specialist",
    gender : "Femenina",
    hireDate :"2025-04-18",
    birthDate : "2001-09-23",
    nationality :"Colombiana",
    campaign: "WOM",
    image: "",
    active: true,
  },
];

const countryOptions = [
  "Colombia",
  "México",
  "España",
];

const statusOptions = [
  "Activos",
  "Inactivos",
];

const EMPLOYEES_PER_PAGE = 7;

function EmployeesPage() {
  const [employeeList, setEmployeeList] =
    useState<Employee[]>(initialEmployees);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [employeeToToggle, setEmployeeToToggle] =
    useState<Employee | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [countryFilter, setCountryFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  /*
   * Solo puede estar abierto
   * un CustomSelect a la vez.
   */
  const [openSelect, setOpenSelect] =
    useState("");

  /*
   * Página actual.
   */
  const [currentPage, setCurrentPage] =
    useState(1);

  /*
   * =========================
   * DEPARTAMENTOS
   * =========================
   *
   * Se generan automáticamente
   * a partir de los empleados actuales.
   *
   * Así, cuando llegue el Excel real,
   * aparecerán automáticamente los
   * departamentos nuevos.
   */
  const departmentOptions = Array.from(
    new Set(
      employeeList
        .map((employee) => employee.area.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  /*
   * =========================
   * SELECTS
   * =========================
   */

  const toggleSelect = (
    selectName: string,
  ) => {
    setOpenSelect((current) =>
      current === selectName
        ? ""
        : selectName,
    );
  };

  /*
   * =========================
   * FILTRAR EMPLEADOS
   * =========================
   */

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const filteredEmployees =
    employeeList.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        employee.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        employee.email
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCountry =
        !countryFilter ||
        employee.countryCode ===
          countryFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active"
          ? employee.active
          : !employee.active);

      const matchesDepartment =
        !departmentFilter ||
        employee.area === departmentFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesStatus &&
        matchesDepartment
      );
    });

  /*
   * =========================
   * PAGINACIÓN
   * =========================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEmployees.length /
        EMPLOYEES_PER_PAGE,
    ),
  );

  /*
   * Si por algún cambio la página
   * actual queda por encima de las
   * páginas disponibles, usamos la
   * última página disponible.
   */
  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const startIndex =
    (safeCurrentPage - 1) *
    EMPLOYEES_PER_PAGE;

  const paginatedEmployees =
    filteredEmployees.slice(
      startIndex,
      startIndex + EMPLOYEES_PER_PAGE,
    );

  /*
   * =========================
   * FILTROS
   * =========================
   */

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(countryFilter) ||
    Boolean(statusFilter) ||
    Boolean(departmentFilter);

  const handleClearFilters = () => {
    setSearchTerm("");
    setCountryFilter("");
    setStatusFilter("");
    setDepartmentFilter("");
    setOpenSelect("");
    setCurrentPage(1);
  };

  const handleSearchChange = (
    value: string,
  ) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCountryChange = (
    value: string,
  ) => {
    const countryMap: Record<
      string,
      string
    > = {
      Colombia: "CO",
      México: "MX",
      España: "ES",
    };

    setCountryFilter(
      countryMap[value] ?? "",
    );

    setCurrentPage(1);
    setOpenSelect("");
  };

  const handleStatusChange = (
    value: string,
  ) => {
    const statusMap: Record<
      string,
      string
    > = {
      Activos: "active",
      Inactivos: "inactive",
    };

    setStatusFilter(
      statusMap[value] ?? "",
    );

    setCurrentPage(1);
    setOpenSelect("");
  };

  const handleDepartmentChange = (
    value: string,
  ) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
    setOpenSelect("");
  };

  /*
   * =========================
   * EMPLEADOS
   * =========================
   */

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (
    employee: Employee,
  ) => {
    if (!employee.active) {
      return;
    }

    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (
    employee: Employee,
  ) => {
    setEmployeeList((current) => {
      const exists = current.some(
        (item) => item.id === employee.id,
      );

      if (exists) {
        return current.map((item) =>
          item.id === employee.id
            ? employee
            : item,
        );
      }

      const nextId =
        Math.max(
          0,
          ...current.map(
            (item) => item.id,
          ),
        ) + 1;

      return [
        ...current,
        {
          ...employee,
          id: nextId,
        },
      ];
    });

    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);

    setCurrentPage(1);
  };

  const handleToggleEmployee = (
    employee: Employee,
  ) => {
    setEmployeeList((current) =>
      current.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );

    setEmployeeToToggle(null);
  };

  /*
   * =========================
   * IMPORTAR
   * =========================
   */

  const handleImportEmployees = (
    importedEmployees: Employee[],
  ) => {
    setEmployeeList((current) => [
      ...current,
      ...importedEmployees,
    ]);

    setIsImportModalOpen(false);
    setCurrentPage(1);
  };

  /*
   * =========================
   * PAGINACIÓN
   * =========================
   */

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(page - 1, 1),
    );
  };

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(page + 1, totalPages),
    );
  };

  return (
    <section className="employees-page">
      {/* =========================
          HEADER
         ========================= */}

      <div className="employees-page__header">
        <div>
          <span className="employees-page__eyebrow">
            Talento & Cultura
          </span>

          <h1>Empleados</h1>

          <p>
            Gestiona los colaboradores de la
            organización.
          </p>
        </div>

        <div className="employees-page__actions">
          <button
            type="button"
            className="employees-page__secondary-button"
            onClick={() =>
              setIsImportModalOpen(true)
            }
          >
            <Upload size={18} />
            Importar
          </button>

          <button
            type="button"
            className="employees-page__primary-button"
            onClick={
              handleCreateEmployee
            }
          >
            <UserPlus size={18} />
            Nuevo empleado
          </button>
        </div>
      </div>

      {/* =========================
          FILTROS
         ========================= */}

      <div className="employees-page__toolbar">
        <div className="employees-page__search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              handleSearchChange(
                event.target.value,
              )
            }
            placeholder="Buscar por nombre o correo..."
            aria-label="Buscar empleado"
          />
        </div>

        <div className="employees-page__filter-group">
          <SlidersHorizontal size={17} />

          {/* PAÍS */}

          <CustomSelect
            options={countryOptions}
            value={
              countryFilter === "CO"
                ? "Colombia"
                : countryFilter === "MX"
                  ? "México"
                  : countryFilter === "ES"
                    ? "España"
                    : ""
            }
            placeholder="Todos los países"
            isOpen={
              openSelect === "country"
            }
            onChange={
              handleCountryChange
            }
            onToggle={() =>
              toggleSelect("country")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

          {/* DEPARTAMENTO */}

          <CustomSelect
            options={departmentOptions}
            value={departmentFilter}
            placeholder="Todos los departamentos"
            isOpen={
              openSelect === "department"
            }
            onChange={
              handleDepartmentChange
            }
            onToggle={() =>
              toggleSelect("department")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

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
            isOpen={
              openSelect === "status"
            }
            onChange={
              handleStatusChange
            }
            onToggle={() =>
              toggleSelect("status")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

          {/* LIMPIAR */}

          {hasActiveFilters && (
            <button
              type="button"
              className="employees-page__clear-filters"
              onClick={
                handleClearFilters
              }
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <X size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================
          TABLA
         ========================= */}

      <div className="employees-page__card">
        <div className="employees-page__table-wrapper">
          <table className="employees-page__table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>País</th>
                <th>Área</th>
                <th>Campaña</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.map(
                (employee) => (
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
                              src={
                                employee.image
                              }
                              alt={
                                employee.name
                              }
                            />
                          ) : (
                            <span>
                              {employee.name
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="employees-page__employee-info">
                          <strong>
                            {
                              employee.name
                            }
                          </strong>

                          <span>
                            {
                              employee.email
                            }
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {
                        employee.countryName
                      }
                    </td>

                    <td>
                      {employee.area}
                    </td>

                    <td>
                      {employee.campaign ||
                        "—"}
                    </td>

                    <td>
                      <span
                        className={`employees-page__status ${
                          employee.active
                            ? "employees-page__status--active"
                            : "employees-page__status--inactive"
                        }`}
                      >
                        {employee.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="employees-page__actions-cell">
                        <button
                          type="button"
                          className="employees-page__action"
                          onClick={() =>
                            handleEditEmployee(
                              employee,
                            )
                          }
                          disabled={
                            !employee.active
                          }
                          title={
                            employee.active
                              ? "Editar empleado"
                              : "El empleado está inactivo"
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={`employees-page__toggle ${
                            employee.active
                              ? "employees-page__toggle--active"
                              : ""
                          }`}
                          onClick={() =>
                            setEmployeeToToggle(
                              employee,
                            )
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
                          aria-pressed={
                            employee.active
                          }
                        >
                          <span className="employees-page__toggle-thumb" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {filteredEmployees.length ===
            0 && (
            <div className="employees-page__empty">
              <h3>
                No encontramos empleados
              </h3>

              <p>
                Prueba con otro nombre,
                correo, país, departamento
                o estado.
              </p>
            </div>
          )}
        </div>

        {/* =========================
            PAGINACIÓN
           ========================= */}

        {filteredEmployees.length > 0 &&
          totalPages > 1 && (
            <div className="employees-page__pagination">
              <button
                type="button"
                className="employees-page__pagination-button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  safeCurrentPage === 1
                }
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="employees-page__pagination-info">
                Página{" "}
                {safeCurrentPage} de{" "}
                {totalPages}
              </span>

              <button
                type="button"
                className="employees-page__pagination-button"
                onClick={
                  handleNextPage
                }
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
      </div>

      {/* =========================
          EMPLOYEE MODAL
         ========================= */}

      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={true}
          employee={editingEmployee}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={handleSaveEmployee}
        />
      )}

      {/* =========================
          CONFIRMAR ACTIVAR/DESACTIVAR
         ========================= */}

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
            handleToggleEmployee(
              employeeToToggle,
            );
          }
        }}
        onCancel={() =>
          setEmployeeToToggle(null)
        }
      />

      {/* =========================
          IMPORTAR EMPLEADOS
         ========================= */}

      {isImportModalOpen && (
        <ImportEmployeesModal
          isOpen={true}
          onClose={() =>
            setIsImportModalOpen(false)
          }
          onImport={
            handleImportEmployees
          }
          existingEmployees={employeeList}
        />
      )}
    </section>
  );
}

export default EmployeesPage; 