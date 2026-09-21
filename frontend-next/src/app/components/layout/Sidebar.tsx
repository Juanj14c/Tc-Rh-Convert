"use client";

import {
  BarChart3,
  ClipboardList,
  Home,
  MessageCircle,
  Settings,
  Sun,
  Users,
  Megaphone,
  Lightbulb,
  
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useTheme } from "@/contexts/useTheme";

const getActivePage = (
  pathname: string,
) => {
  if (pathname.startsWith("/mural")) {
    return "mural";
  }

  // IMPORTANTE:
  // /chat/internal debe comprobarse
  // antes que /chat.
  if (
    pathname.startsWith("/chat/internal")
  ) {
    return "internal-chat";
  }

  if (pathname.startsWith("/chat")) {
    return "chat";
  }

  if (pathname.startsWith("/employees")) {
    return "employees";
  }

  if (pathname.startsWith("/settings")) {
    return "settings";
  }

  if (pathname.startsWith("/reports")) {
    return "reports";
  }
  if (pathname.startsWith("/quick-tips")
  ){
    return "quick-tips";
  }
  if (
    pathname.startsWith("/evaluations")
  ) {
    return "evaluations";
  }

  return "";
};

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({
  isAdmin = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isDarkMode,
    toggleTheme,
  } = useTheme();

  const activePage =
    getActivePage(pathname);

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
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

      <nav className="sidebar__nav">
        {/* MURAL */}

        <button
          type="button"
          className={`sidebar__item ${
            activePage === "mural"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() =>
            router.push("/mural")
          }
        >
          <Home size={20} />
          <span>Mural</span>
        </button>

        {/* T&C */}

        <button
          type="button"
          className={`sidebar__item ${
            activePage === "chat"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() =>
            router.push("/chat")
          }
        >
          <Megaphone size={20} />
          <span>T&amp;C</span>
        </button>

        {/* CyC */}

        <button
          type="button"
          className={`sidebar__item ${
            activePage === "internal-chat"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() =>
            router.push("/chat/internal")
          }
        >
          <MessageCircle size={20} />
          <span>CyC</span>
        </button>

        {isAdmin && (
          <>
            {/* EVALUACIONES */}

            <button
              type="button"
              className={`sidebar__item ${
                activePage === "evaluations"
                  ? "sidebar__item--active"
                  : ""
              }`}
              onClick={() =>
                router.push(
                  "/evaluations",
                )
              }
            >
              <ClipboardList size={20} />
              <span>Evaluaciones</span>
            </button>

            {/* REPORTES */}

            <button
              type="button"
              className={`sidebar__item ${
                activePage === "reports"
                  ? "sidebar__item--active"
                  : ""
              }`}
              onClick={() =>
                router.push("/reports")
              }
            >
              <BarChart3 size={20} />
              <span>Reportes</span>
            </button>

            {/* EMPLEADOS */}

            <button
              type="button"
              className={`sidebar__item ${
                activePage === "employees"
                  ? "sidebar__item--active"
                  : ""
              }`}
              onClick={() =>
                router.push(
                  "/employees",
                )
              }
            >
              <Users size={20} />
              <span>Empleados</span>
            </button>
          </>
        )}
        <button
        type="button"
        className={`sidebar__item  ${
          activePage  === "quick-tips"
          ?"sidebar__item--active"
          : ""
          }`}
          onClick={()=>
            router.push("/quick-tips")
          }
          >
            <Lightbulb size ={20} />
            <span>Consejos</span>
          </button>
      </nav>

      <div className="sidebar__bottom">
        {/* CONFIGURACIÓN */}

        <button
          type="button"
          className={`sidebar__item ${
            activePage === "settings"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() =>
            router.push("/settings")
          }
        >
          <Settings size={20} />
          <span>Configuración</span>
        </button>

        {/* TEMA */}

        <button
          type="button"
          className="sidebar__item"
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
  );
}