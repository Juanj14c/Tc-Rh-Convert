"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  MessageCircle,
  Megaphone,
  ClipboardList,
  Info,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import type { AppNotification } from "@/types/notifications";

import {
  initialNotifications,
} from "@/data/notifications";

interface NotificationBellProps {
  className?: string;
}

function getNotificationIcon(
  type: AppNotification["type"],
) {
  switch (type) {
    case "evaluation":
      return <ClipboardList size={17} />;

    case "chat":
      return <MessageCircle size={17} />;

    case "mural":
      return <Megaphone size={17} />;

    case "announcement":
      return <Megaphone size={17} />;

    default:
      return <Info size={17} />;
  }
}

export default function NotificationBell({
  className = "",
}: NotificationBellProps) {
  const router = useRouter();

  const [
    notifications,
    setNotifications,
  ] = useState<AppNotification[]>(
    initialNotifications,
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read,
    ).length;

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  const handleMarkAsRead = (
    notificationId: number,
  ) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id ===
        notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const handleNotificationClick = (
    notification: AppNotification,
  ) => {
    handleMarkAsRead(
      notification.id,
    );

    if (notification.href) {
      setIsOpen(false);
      router.push(
        notification.href,
      );
    }
  };

  return (
    <div
      className={`notification-bell ${className}`}
    >
      <button
        type="button"
        className="notification-bell__button"
        onClick={handleToggle}
        aria-label="Notificaciones"
        aria-expanded={isOpen}
        title="Notificaciones"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-bell__panel"
          role="dialog"
          aria-label="Notificaciones"
        >
          <div className="notification-bell__header">
            <div>
              <strong>
                Notificaciones
              </strong>

              <span>
                {unreadCount > 0
                  ? `${unreadCount} sin leer`
                  : "Todo leído"}
              </span>
            </div>

            <div className="notification-bell__header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-bell__mark-all"
                  onClick={
                    handleMarkAllAsRead
                  }
                  title="Marcar todo como leído"
                >
                  <CheckCheck
                    size={16}
                  />
                </button>
              )}

              <button
                type="button"
                className="notification-bell__close"
                onClick={() =>
                  setIsOpen(false)
                }
                aria-label="Cerrar notificaciones"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-bell__list">
            {notifications.length ===
            0 ? (
              <div className="notification-bell__empty">
                <Bell size={24} />

                <strong>
                  No tienes notificaciones
                </strong>

                <span>
                  Aquí aparecerán tus
                  novedades.
                </span>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`notification-bell__item ${
                      notification.read
                        ? ""
                        : "notification-bell__item--unread"
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification,
                      )
                    }
                  >
                    <div className="notification-bell__item-icon">
                      {
                        getNotificationIcon(
                          notification.type,
                        )
                      }
                    </div>

                    <div className="notification-bell__item-content">
                      <div className="notification-bell__item-title">
                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        {!notification.read && (
                          <span className="notification-bell__item-dot" />
                        )}
                      </div>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <span>
                        {
                          notification.createdAt
                        }
                      </span>
                    </div>

                    {notification.read && (
                      <Check
                        size={15}
                        className="notification-bell__item-read"
                      />
                    )}
                  </button>
                ),
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}