import colombiaFlag from "../../assets/flags/colombia.svg";
import mexicoFlag from "../../assets/flags/mexico.svg";
import spainFlag from "../../assets/flags/spain.svg";

import type { Conversation } from "./conversationData";

interface ChatHeaderProps {
  conversation: Conversation | null;
}

const countryFlags = {
  CO: colombiaFlag,
  MX: mexicoFlag,
  ES: spainFlag,
} as const;

function ChatHeader({
  conversation,
}: ChatHeaderProps) {
 if (!conversation) {
  return (
    <header className="chat-header">
      <div className="chat-header__identity">
        <div className="chat-header__details">
          <span className="chat-header__eyebrow">
            Talento & Cultura
          </span>

          <h2>Centro T&C</h2>

          <p className="chat-header__context">
            Panel de atención de casos
          </p>
        </div>
      </div>

      <span className="chat-header__status">
        Sin caso activo
      </span>
    </header>
  );
}

  const flagSrc = conversation.countryCode
    ? countryFlags[conversation.countryCode]
    : null;

  const contextParts = [
    conversation.countryName
      ? conversation.countryName
      : null,
    conversation.area
      ? conversation.area
      : null,
    conversation.campaign
      ? conversation.campaign
      : null,
  ].filter(Boolean);

  const status =
    conversation.status ?? "En atención";

  const statusClass = status
    .toLowerCase()
    .replace(" ", "-");

  return (
    <header className="chat-header">
      <div className="chat-header__identity">
        <div
          className="chat-header__avatar"
          aria-hidden="true"
        >
          {flagSrc ? (
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
            Caso anónimo · T&C
          </span>

          <h2>{conversation.name}</h2>

          {contextParts.length > 0 && (
            <p className="chat-header__context">
              {contextParts.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <span
        className={`chat-header__status chat-header__status--${statusClass}`}
      >
        <span className="chat-header__status-dot" />
        {status}
      </span>
    </header>
  );
}

export default ChatHeader;