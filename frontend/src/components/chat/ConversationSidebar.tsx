import { useState } from "react";
import { Search, SquarePen } from "lucide-react";
import colombiaFlag from "../../assets/flags/colombia.svg";
import mexicoFlag from "../../assets/flags/mexico.svg";
import spainFlag from "../../assets/flags/spain.svg";
import {
  conversations,
  type Conversation,
} from "./conversationData";

const countryFlags = {
  CO: colombiaFlag,
  MX: mexicoFlag,
  ES: spainFlag, 
} as const;

interface ConversationSidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (
    conversation: Conversation,
  ) => void;
}

function ConversationSidebar({
  selectedConversationId,
  onSelectConversation,
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const [conversationList, setConversationList] =
    useState<Conversation[]>(conversations);

  const normalizedSearch = searchTerm
    .trim()
    .toLowerCase();

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

  return (
    <aside className="conversation-sidebar">
      <div className="conversation-sidebar__header">
        <div>
          <span>T&C</span>

          <h2>Conversaciones</h2>
        </div>

        <button
          type="button"
          className="conversation-sidebar__new"
          aria-label="Nueva conversación"
          title="Nueva conversación"
        >
          <SquarePen size={18} />
        </button>
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
        {filteredConversations.map(
          (conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`conversation-item ${
                selectedConversationId ===
                conversation.id
                  ? "conversation-item--active"
                  : ""
              }`}
              onClick={() =>
                handleSelectConversation(
                  conversation,
                )
              }
            >
         <div className="conversation-item__avatar">
  {conversation.countryCode &&
  countryFlags[conversation.countryCode] ? (
    <img
      src={countryFlags[conversation.countryCode]}
      alt={conversation.countryName ?? "País"}
      className="conversation-item__flag"
    />
  ) : (
    <span>🌎</span>
  )}
</div>

              <div className="conversation-item__content">
                <div className="conversation-item__top">
                  <strong>
                    {conversation.name}
                  </strong>

                  <span>
                    {conversation.time}
                  </span>
                </div>

                <div className="conversation-item__bottom">
                  <p>
                    {conversation.countryName &&
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
          ),
        )}

        {filteredConversations.length === 0 && (
          <p className="conversation-sidebar__empty">
            No encontramos conversaciones.
          </p>
        )}
      </div>
    </aside>
  );
}

export default ConversationSidebar;