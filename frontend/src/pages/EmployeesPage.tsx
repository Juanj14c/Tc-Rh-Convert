import { useState } from "react";
import {
  Search,
  Upload,
  UserPlus,
} from "lucide-react";

import EmployeeModal, {
  type Employee,
} from "../components/employes/EmployeeModal";

import ConfirmModal from "../components/common/confirmModa";

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Juan Pérez",
    email: "juan.perez@empresa.com",
    countryCode: "CO",
    countryName: "Colombia",
    area: "Comercial",
    campaign: "WOM",
    image: "",
    active: true,
  },
  {
    id: 2,
    name: "María López",
    email: "maria.lopez@empresa.com",
    countryCode: "MX",
    countryName: "México",
    area: "Recursos Humanos",
    campaign: "Campaña A",
    image: "",
    active: true,
  },
  {
    id: 3,
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@empresa.com",
    countryCode: "ES",
    countryName: "España",
    area: "Desarrollo",
    campaign: "Campaña B",
    image: "",
    active: false,
  },
  {
    id: 4,
    name: "Laura Gómez",
    email: "laura.gomez@empresa.com",
    countryCode: "CO",
    countryName: "Colombia",
    area: "Operaciones",
    campaign: "WOM",
    image: "",
    active: true,
  },
];

function EmployeesPage() {
  const [employeeList, setEmployeeList] =
    useState<Employee[]>(initialEmployees);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [employeeToToggle, setEmployeeToToggle] =
    useState<Employee | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [countryFilter, setCountryFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

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

      return (
        matchesSearch &&
        matchesCountry &&
        matchesStatus
      );
    });

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (
    employee: Employee,
  ) => {
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

  return (
    <section className="employees-page">
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

      <div className="employees-page__toolbar">
        <div className="employees-page__search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="Buscar por nombre o correo..."
            aria-label="Buscar empleado"
          />
        </div>

        <select
          className="employees-page__filter"
          value={countryFilter}
          onChange={(event) =>
            setCountryFilter(
              event.target.value,
            )
          }
          aria-label="Filtrar por país"
        >
          <option value="">
            Todos los países
          </option>

          <option value="CO">
            Colombia
          </option>

          <option value="MX">
            México
          </option>

          <option value="ES">
            España
          </option>
        </select>

        <select
          className="employees-page__filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          aria-label="Filtrar por estado"
        >
          <option value="">
            Todos los estados
          </option>

          <option value="active">
            Activos
          </option>

          <option value="inactive">
            Inactivos
          </option>
        </select>
      </div>

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
              {filteredEmployees.map(
                (employee) => (
                  <tr key={employee.id}
                  className={
                    employee.active
                    ?""
                    :"employees-page__row--inactive"
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
                                .charAt(
                                  0,
                                )
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
                            handleEditEmployee(employee)
                            }
                            disabled ={!employee.active}
                            title={
                                employee.active
                                ?"Editar empleado"
                                :"El empleado esta inactivo"
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
                correo, país o estado.
              </p>
            </div>
          )}
        </div>
      </div>

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

      <ConfirmModal
        isOpen={Boolean(
          employeeToToggle,
        )}
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
    </section>
  );
}

export default EmployeesPage;