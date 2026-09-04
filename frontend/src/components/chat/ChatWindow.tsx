import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import type { Conversation } from "./conversationData";

import type {
  Message,
  MessageAttachment,
  MessageReply,
} from "./MessageList";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  isAdmin: boolean;
  onSendMessage: (
    text: string,
    attachment?: MessageAttachment,
    replyTo?: MessageReply,
  ) => void;
  onBackToConversations?: () => void;
}

function ChatWindow({
  conversation,
  messages,
  isAdmin,
  onSendMessage,
  onBackToConversations,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] =
    useState<MessageReply | null>(null);

  const handleReply = (
    message: Message,
  ) => {
    const replyText =
      message.text.trim() ||
      (message.attachment?.type ===
      "image"
        ? "Imagen"
        : message.attachment?.name ??
          "Mensaje");

    setReplyTo({
      messageId: message.id,
      text: replyText,
      sender: message.sender,
    });
  };

  return (
    <div className="chat-window">
      {isAdmin &&
        onBackToConversations && (
          <button
            type="button"
            className="chat-window__mobile-back"
            onClick={
              onBackToConversations
            }
            aria-label="Volver a conversaciones"
          >
            <ArrowLeft size={17} />
            <span>
              Conversaciones
            </span>
          </button>
        )}

      <ChatHeader
        conversation={conversation}
      />

      <div className="chat-window__messages-area">
        <MessageList
          conversation={conversation}
          messages={messages}
          isAdmin={isAdmin}
          onReply={handleReply}
        />
      </div>

      <MessageComposer
        disabled={!conversation}
        isAdmin={isAdmin}
        replyTo={replyTo}
        onCancelReply={() =>
          setReplyTo(null)
        }
        onSendMessage={
          onSendMessage
        }
      />
    </div>
  );
}

export default ChatWindow;