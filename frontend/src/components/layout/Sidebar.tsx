import {
  BarChart3,
  ClipboardList,
  Home,
  MessageCircle,
  Settings,
  Sun,
  Users,
} from "lucide-react";

import logoClaro from "../../assets/brand/logo_horizontal_oscuro.png";
import logoOscuro from "../../assets/brand/logo_horizontal_blanco.png";
import { useTheme } from "../../contexts/useTheme";

type AppPage = "mural" | "chat" | "settings";

interface SidebarProps {
  isAdmin?: boolean;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

function Sidebar({
  isAdmin = false,
  activePage,
  onNavigate,
}: SidebarProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img
          src={isDarkMode ? logoOscuro : logoClaro}
          alt="Convertia"
          className="sidebar__logo-image"
        />
      </div>

      <nav className="sidebar__nav">
        <button
          type="button"
          className={`sidebar__item ${
            activePage === "mural"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() => onNavigate("mural")}
        >
          <Home size={20} />
          <span>Mural</span>
        </button>

        <button
          type="button"
          className={`sidebar__item ${
            activePage === "chat"
              ? "sidebar__item--active"
              : ""
          }`}
          onClick={() => onNavigate("chat")}
        >
          <MessageCircle size={20} />
          <span>T&C</span>
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              className="sidebar__item"
            >
              <ClipboardList size={20} />
              <span>Evaluaciones</span>
            </button>

            <button
              type="button"
              className="sidebar__item"
            >
              <BarChart3 size={20} />
              <span>Reportes</span>
            </button>

            <button
              type="button"
              className="sidebar__item"
            >
              <Users size={20} />
              <span>Empleados</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar__bottom">
        <button
    type="button"
   className={`sidebar__item ${
      activePage === "settings"
        ? "sidebar__item--active"
        : ""
      }`}
      onClick={() => onNavigate("settings")}
    >
  <Settings size={20} />
  <span>Configuración</span>
</button>
        <button
          type="button"
          className="sidebar__item"
          onClick={toggleTheme}
        >
          <Sun size={20} />

          <span>
            {isDarkMode ? "Modo claro" : "Modo oscuro"}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;