import colombiaFlag from "../../assets/flags/colombia.svg";
import mexicoFlag from "../../assets/flags/mexico.svg";
import spainFlag from "../../assets/flags/spain.svg";

import type {
  Conversation,
  ChatMode,
} from "./conversationData";

interface ChatHeaderProps {
  conversation: Conversation | null;
  chatMode: ChatMode;
}

const countryFlags = {
  CO: colombiaFlag,
  MX: mexicoFlag,
  ES: spainFlag,
} as const;

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function ChatHeader({
  conversation,
  chatMode,
}: ChatHeaderProps) {
  if (!conversation) {
    return (
      <header className="chat-header">
        <div className="chat-header__identity">
          <div className="chat-header__details">
            <span className="chat-header__eyebrow">
              {chatMode === "anonymous"
                ? "Talento & Cultura"
                : "Comunicación interna"}
            </span>

            <h2>
              {chatMode === "anonymous"
                ? "Centro T&C"
                : "Mensajes"}
            </h2>

            <p className="chat-header__context">
              {chatMode === "anonymous"
                ? "Panel de atención de casos"
                : "Selecciona una conversación para comenzar"}
            </p>
          </div>
        </div>

        <span className="chat-header__status">
          {chatMode === "anonymous"
            ? "Sin caso activo"
            : "Sin conversación"}
        </span>
      </header>
    );
  }

  const flagSrc = conversation.countryCode
    ? countryFlags[conversation.countryCode]
    : null;

  const contextParts = [
    conversation.countryName,
    conversation.area,
    conversation.campaign,
  ].filter(Boolean);

  const anonymousStatus =
    conversation.status ?? "En atención";

  const statusClass = anonymousStatus
    .toLowerCase()
    .replace(" ", "-");

  return (
    <header className="chat-header">
      <div className="chat-header__identity">
        <div
          className="chat-header__avatar"
          aria-hidden="true"
        >
          {chatMode === "internal" ? (
            conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt=""
                className="chat-header__flag"
              />
            ) : (
              <span>
                {getInitial(
                  conversation.name,
                )}
              </span>
            )
          ) : flagSrc ? (
            <img
              src={flagSrc}
              alt=""
              className="chat-header__flag"
            />
          ) : (
            <span>🌎</span>
          )}
        </div>

        <div className="chat-header__details">
          <span className="chat-header__eyebrow">
            {chatMode === "anonymous"
              ? "Caso anónimo · T&C"
              : "Comunicación interna"}
          </span>

          <h2>{conversation.name}</h2>

          {contextParts.length > 0 && (
            <p className="chat-header__context">
              {contextParts.join(" · ")}
            </p>
          )}
        </div>
      </div>

      {chatMode === "anonymous" ? (
        <span
          className={`chat-header__status chat-header__status--${statusClass}`}
        >
          <span className="chat-header__status-dot" />
          {anonymousStatus}
        </span>
      ) : (
        <span className="chat-header__status">
          Comunicación interna
        </span>
      )}
    </header>
  );
}

export default ChatHeader;