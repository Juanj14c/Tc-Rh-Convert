"use client";

import {
  BarChart3,
  ClipboardList,
  Home,
  Lightbulb,
  MessageCircle,
  Menu,
  Settings,
  Sun,
  Users,
  X,
  Megaphone,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useTheme } from "@/contexts/useTheme";

interface MobileMenuProps {
  isOpen: boolean;
  isAdmin?: boolean;
  onToggle: () => void;
}

export default function MobileMenu({
  isOpen,
  isAdmin = false,
  onToggle,
}: MobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isDarkMode,
    toggleTheme,
  } = useTheme();

  const getActivePage = () => {
    if (pathname.startsWith("/mural")) {
      return "mural";
    }

    /* IMPORTANTE:
       /chat/internal debe revisarse ANTES de /chat */
    if (pathname.startsWith("/chat/internal")) {
      return "chat-internal";
    }

    if (pathname.startsWith("/chat")) {
      return "chat";
    }

    if (pathname.startsWith("/employees")) {
      return "employees";
    }

    if (pathname.startsWith("/quick-tips")) {
      return "quick-tips";
    }

    if (pathname.startsWith("/settings")) {
      return "settings";
    }

    if (pathname.startsWith("/reports")) {
      return "reports";
    }

    if (pathname.startsWith("/evaluations")) {
      return "evaluations";
    }

    return "";
  };

  const activePage = getActivePage();

  const handleNavigate = (path: string) => {
    router.push(path);
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
                      ? "/assets/brand/logo_horizontal_blanco.png"
                      : "/assets/brand/logo_horizontal_oscuro.png"
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

              {/* =========================
                  MURAL
                 ========================= */}
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "mural"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate("/mural")
                }
              >
                <Home size={20} />
                <span>Mural</span>
              </button>

              {/* =========================
                  T&C
                  /chat
                 ========================= */}
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "chat"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate("/chat")
                }
              >
                <Megaphone size={20} />
                <span>T&C</span>
              </button>

              {/* =========================
                  CyC
                  /chat/internal
                 ========================= */}
              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "chat-internal"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate(
                    "/chat/internal",
                  )
                }
              >
                <MessageCircle size={20} />
                <span>CyC</span>
              </button>

              {/* =========================
                  ADMIN
                 ========================= */}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage === "quick-tips"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate("/quick-tips")
                    }
                  >
                    <Lightbulb size={20} />
                    <span>Consejos</span>
                  </button>

                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage === "evaluations"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate(
                        "/evaluations",
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
                      handleNavigate(
                        "/reports",
                      )
                    }
                  >
                    <BarChart3 size={20} />
                    <span>Reportes</span>
                  </button>

                  <button
                    type="button"
                    className={`mobile-menu__item ${
                      activePage === "employees"
                        ? "mobile-menu__item--active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigate(
                        "/employees",
                      )
                    }
                  >
                    <Users size={20} />
                    <span>Empleados</span>
                  </button>
                </>
              )}
            </nav>

            {/* =========================
                BOTTOM
               ========================= */}
            <div className="mobile-menu__bottom">

              <button
                type="button"
                className={`mobile-menu__item ${
                  activePage === "settings"
                    ? "mobile-menu__item--active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigate("/settings")
                }
              >
                <Settings size={20} />
                <span>Configuración</span>
              </button>

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