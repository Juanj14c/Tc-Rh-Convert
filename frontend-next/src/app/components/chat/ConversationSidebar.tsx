"use client";

import { useState } from "react";
import {
  Search,
  SquarePen,
  X,
} from "lucide-react";

import type { Conversation } from "./conversationData";

const countryFlags = {
  CO: "/assets/flags/colombia.svg",
  MX: "/assets/flags/mexico.svg",
  ES: "/assets/flags/spain.svg",
} as const;

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (
    conversation: Conversation,
  ) => void;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    return "👤";
  }

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const [conversationList, setConversationList] =
    useState<Conversation[]>(conversations);

  const [isNewConversationOpen, setIsNewConversationOpen] =
    useState(false);

  const [newConversationSearch, setNewConversationSearch] =
    useState("");

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const filteredConversations =
    conversationList.filter((conversation) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        conversation.name,
        conversation.preview,
        conversation.countryName,
        conversation.area,
        conversation.campaign,
      ]
        .filter(Boolean)
        .some((value) =>
          value!.toLowerCase().includes(normalizedSearch),
        );
    });

  const normalizedNewConversationSearch =
    newConversationSearch.trim().toLowerCase();

  const availableEmployees =
    conversationList.filter((conversation) => {
      if (conversation.type !== "internal") {
        return false;
      }

      if (!normalizedNewConversationSearch) {
        return true;
      }

      return [
        conversation.name,
        conversation.countryName,
        conversation.area,
        conversation.campaign,
      ]
        .filter(Boolean)
        .some((value) =>
          value!
            .toLowerCase()
            .includes(normalizedNewConversationSearch),
        );
    });

  const isInternal =
    conversations.length > 0 &&
    conversations.every(
      (conversation) =>
        conversation.type === "internal",
    );

  const handleSelectConversation = (
    conversation: Conversation,
  ) => {
    const updatedConversation: Conversation = {
      ...conversation,
      unread: 0,
    };

    setConversationList((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? updatedConversation
          : item,
      ),
    );

    onSelectConversation(updatedConversation);
  };

  const handleNewConversation = (
    conversation: Conversation,
  ) => {
    handleSelectConversation(conversation);
    setIsNewConversationOpen(false);
    setNewConversationSearch("");
  };

  return (
    <>
      <aside className="conversation-sidebar">
        <div className="conversation-sidebar__header">
          <div>
            <span>
              {isInternal ? "Comunicación" : "T&C"}
            </span>

            <h2>Conversaciones</h2>
          </div>

          {isInternal && (
            <button
              type="button"
              className="conversation-sidebar__new"
              aria-label="Nueva conversación"
              title="Nueva conversación"
              onClick={() =>
                setIsNewConversationOpen(true)
              }
            >
              <SquarePen size={18} />
            </button>
          )}
        </div>

        <div className="conversation-sidebar__search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Buscar conversación..."
            aria-label="Buscar conversación"
          />
        </div>

        <div className="conversation-sidebar__list">
          {filteredConversations.map((conversation) => {
            const isConversationInternal =
              conversation.type === "internal";

            return (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${
                  selectedConversationId === conversation.id
                    ? "conversation-item--active"
                    : ""
                }`}
                onClick={() =>
                  handleSelectConversation(conversation)
                }
              >
                <div className="conversation-item__avatar">
                  {isConversationInternal ? (
                    conversation.avatar ? (
                      <img
                        src={conversation.avatar}
                        alt={conversation.name}
                        className="conversation-item__profile"
                      />
                    ) : (
                      <span>
                        {getInitials(conversation.name)}
                      </span>
                    )
                  ) : conversation.countryCode &&
                    countryFlags[conversation.countryCode] ? (
                    <img
                      src={countryFlags[conversation.countryCode]}
                      alt={
                        conversation.countryName ?? "País"
                      }
                      className="conversation-item__flag"
                    />
                  ) : (
                    <span>🌎</span>
                  )}
                </div>

                <div className="conversation-item__content">
                  <div className="conversation-item__top">
                    <strong>{conversation.name}</strong>

                    <span>{conversation.time}</span>
                  </div>

                  <div className="conversation-item__bottom">
                    <p>
                      {!isConversationInternal &&
                        conversation.countryName &&
                        `${conversation.countryName} · `}

                      {conversation.area}

                      {conversation.campaign &&
                        ` · ${conversation.campaign}`}
                    </p>

                    {conversation.unread > 0 && (
                      <span
                        className="conversation-item__unread"
                        aria-label={`${conversation.unread} mensajes no leídos`}
                      >
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <p className="conversation-sidebar__empty">
              No encontramos conversaciones.
            </p>
          )}
        </div>
      </aside>

      {isNewConversationOpen && (
        <div
          className="new-conversation-modal__overlay"
          onClick={() =>
            setIsNewConversationOpen(false)
          }
        >
          <div
            className="new-conversation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="new-conversation-modal__header">
              <div>
                <span>Comunicación interna</span>

                <h3>Nueva conversación</h3>
              </div>

              <button
                type="button"
                className="new-conversation-modal__close"
                onClick={() => {
                  setIsNewConversationOpen(false);
                  setNewConversationSearch("");
                }}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            <div className="new-conversation-modal__search">
              <Search size={18} />

              <input
                type="text"
                value={newConversationSearch}
                onChange={(event) =>
                  setNewConversationSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar empleado..."
                aria-label="Buscar empleado"
                autoFocus
              />
            </div>

            <div className="new-conversation-modal__list">
              {availableEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  className="new-conversation-modal__employee"
                  onClick={() =>
                    handleNewConversation(employee)
                  }
                >
                  <div className="new-conversation-modal__avatar">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employee.name}
                      />
                    ) : (
                      <span>
                        {getInitials(employee.name)}
                      </span>
                    )}
                  </div>

                  <div className="new-conversation-modal__employee-info">
                    <strong>{employee.name}</strong>

                    <span>
                      {employee.countryName}

                      {employee.area &&
                        ` · ${employee.area}`}
                    </span>

                    {employee.campaign && (
                      <small>{employee.campaign}</small>
                    )}
                  </div>
                </button>
              ))}

              {availableEmployees.length === 0 && (
                <p className="new-conversation-modal__empty">
                  No encontramos empleados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}