import {
  BarChart3,
  ClipboardList,
  Home,
  MessageCircle,
  Menu,
  Settings,
  Sun,
  Users,
  X,
  Megaphone,
} from "lucide-react";

import logoClaro from "../../assets/brand/logo_horizontal_oscuro.png";
import logoOscuro from "../../assets/brand/logo_horizontal_blanco.png";
import { useTheme } from "../../contexts/useTheme";
import type { AppPage } from "../../types/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  isAdmin?: boolean;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onToggle: () => void;
}

function MobileMenu({
  isOpen,
  isAdmin = false,
  activePage,
  onNavigate,
  onToggle,
}: MobileMenuProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNavigate = (page: AppPage) => {
    onNavigate(page);
    onToggle();
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="mobile-menu__trigger"
          onClick={onToggle}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      )}

      {isOpen && (
        <div
          className="mobile-menu__overlay"
          onClick={onToggle}
        >
          <aside
            className="mobile-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mobile-menu__header">
              <div className="mobile-menu__brand">
                <img
                  src={
                    isDarkMode
                      ? logoOscuro
                      : logoClaro
                  }
                  alt="Convertia"
                  className="sidebar__logo-image"
                />
              </div>

              <button
                type="button"
                className="mobile-menu__close"
                onClick={onToggle}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-menu__nav">
            
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "mural"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate("mural")
                }
              >
                <Home size={20} />
                <span>Mural</span>
              </button>

              
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage ===
                  "anonymous-chat"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate(
                    "anonymous-chat",
                  )
                }
              >
                <Megaphone size={20} />
                <span>T&C</span>
              </button>

              
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage ===
                  "internal-chat"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate(
                    "internal-chat",
                  )
                }
              >
                <MessageCircle size={20} />
                <span>
                  CyC
                </span>
              </button>

              
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage ===
                      "evaluations"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate(
                        "evaluations",
                      )
                    }
                  >
                    <ClipboardList size={20} />
                    <span>Evaluaciones</span>
                  </button>

                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage === "reports"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate("reports")
                    }
                  >
                    <BarChart3 size={20} />
                    <span>Reportes</span>
                  </button>

                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage ===
                      "employees"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate(
                        "employees",
                      )
                    }
                  >
                    <Users size={20} />
                    <span>Empleados</span>
                  </button>
                </>
              )}
            </nav>

            <div className="mobile-menu__bottom">
              
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "settings"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate("settings")
                }
              >
                <Settings size={20} />
                <span>Configuración</span>
              </button>

              {/* TEMA */}
              <button
                type="button"
                className="mobile-menu__item"
                onClick={toggleTheme}
              >
                <Sun size={20} />

                <span>
                  {isDarkMode
                    ? "Modo claro"
                    : "Modo oscuro"}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default MobileMenu;