"use client";

import {
  Bell,
  LogOut,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import NotificationBell from "../notifications/NotificationBell";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}

interface HeaderProps {
  onLogout: () => void;
  onSettings: () => void;
  profile: UserProfile;
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({
  onLogout,
  onSettings,
  profile,
  showSearch = false,
  searchTerm = "",
  onSearchChange,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);

  const userMenuRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      const target = event.target as Node;

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  const handleSettings = () => {
    setIsUserMenuOpen(false);
    onSettings();
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
              onSearchChange?.(
                event.target.value,
              )
            }
            placeholder="Buscar..."
            aria-label="Buscar"
          />

          {searchTerm && (
            <button
              type="button"
              className="mural-page__search-clear"
              onClick={() =>
                onSearchChange?.("")
              }
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
          <button
            type="button"
            className="header__company"
            onClick={() =>
              setIsUserMenuOpen(
                (current) => !current,
              )
            }
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
              <span>Admin T&C</span>
            </div>
          </button>

          {isUserMenuOpen && (
            <div
              className="header__user-menu"
              role="menu"
            >
              <div className="header__user-menu-info">
                <strong>{profile.name}</strong>
                <span>Admin T&C</span>
              </div>

              <div className="header__user-menu-divider" />

              <button
                type="button"
                className="header__user-menu-item"
                role="menuitem"
                onClick={handleSettings}
              >
                <Settings size={17} />
                <span>Configuración</span>
              </button>

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