"use client";

import { LogOut, Search, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "../notifications/NotificationBell";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  role?: string;
}

interface HeaderProps {
  onLogout: () => void | Promise<void>;
  onSettings: () => void;
  profile: UserProfile;
  isProfileLoading?: boolean;
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({
  onLogout,
  onSettings,
  profile,
  isProfileLoading = false,
  showSearch = false,
  searchTerm = "",
  onSearchChange,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [isUserMenuOpen]);

  const roleLabel = isProfileLoading
  ?""
  :profile.role ==="admin"
  ? "Admin T&C"
  : "Empleado";
   
  

  const handleUserToggle = () => {
    setIsUserMenuOpen((current) => !current);
  };

  const handleSettings = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsUserMenuOpen(false);
    onSettings();
  };

  const handleLogout = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsUserMenuOpen(false);

    await onLogout();
  };

  return (
    <header className="header">
      {showSearch && (
        <div className="header__search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              onSearchChange?.(event.target.value)
            }
            placeholder="Buscar..."
            aria-label="Buscar"
          />

          {searchTerm && (
            <button
              type="button"
              className="mural-page__search-clear"
              onClick={() => onSearchChange?.("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="header__actions">
        <NotificationBell />

        <div
          ref={userMenuRef}
          className="header__user"
        >
          {/* PERFIL */}
          <button
            type="button"
            className="header__company"
            onClick={handleUserToggle}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            {profile.image ? (
              <img
                src={profile.image}
                alt={`Foto de ${profile.name}`}
                className="header__company-avatar-image"
              />
            ) : (
              <div className="header__company-avatar">
                {profile.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div className="header__company-info">
              <strong>{profile.name}</strong>
              <span>{roleLabel}</span>
            </div>
          </button>

          {/* MENÚ */}
          {isUserMenuOpen && (
            <div
              className="header__user-menu"
              role="menu"
            >
              <div className="header__user-menu-info">
                <strong>{profile.name}</strong>
                <span>{roleLabel}</span>
              </div>

              <div className="header__user-menu-divider" />

              {/* CONFIGURACIÓN */}
              <button
                type="button"
                className="header__user-menu-item"
                role="menuitem"
                onClick={handleSettings}
              >
                <Settings size={17} />
                <span>Configuración</span>
              </button>

              {/* CERRAR SESIÓN */}
              <button
                type="button"
                className="header__user-menu-item header__user-menu-item--logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}