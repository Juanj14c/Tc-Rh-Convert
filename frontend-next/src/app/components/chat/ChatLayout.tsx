"use client";

import { useState } from "react";

import ConversationSidebar from "./ConversationSidebar";

import {
  conversations,
  internalConversations,
  type ChatMode,
  type Conversation,
} from "./conversationData";

import ChatWindow from "./ChatWindow";

import type {
  Message,
  MessageAttachment,
  MessageReply,
} from "./MessageList";

import {
  messagesByConversation,
  internalMessagesByConversation,
} from "@/components/chat/messageData";

interface ChatLayoutProps {
  isAdmin: boolean;
  chatMode: ChatMode;
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ChatLayout({
  isAdmin,
  chatMode,
}: ChatLayoutProps) {
  const availableConversations =
    chatMode === "anonymous"
      ? conversations
      : internalConversations;

  const availableMessages =
    chatMode === "anonymous"
      ? messagesByConversation
      : internalMessagesByConversation;

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(
      isAdmin
        ? null
        : availableConversations[0],
    );

  const [isMobileChatOpen, setIsMobileChatOpen] =
    useState(!isAdmin);

  const [messagesById, setMessagesById] =
    useState<Record<number, Message[]>>(
      availableMessages,
    );

  const handleSendMessage = (
    text: string,
    attachment?: MessageAttachment,
    replyTo?: MessageReply,
  ) => {
    if (!selectedConversation) {
      return;
    }

    const now = new Date();

    const newMessage: Message = {
      id: Date.now(),
      sender: isAdmin ? "tyc" : "employee",
      text,
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: getLocalDateString(now),
      status: "sent",
      attachment,
      replyTo,
    };

    setMessagesById((current) => ({
      ...current,
      [selectedConversation.id]: [
        ...(current[selectedConversation.id] ?? []),
        newMessage,
      ],
    }));
  };

  const handleSelectConversation = (
    conversation: Conversation,
  ) => {
    setSelectedConversation(conversation);

    if (isAdmin) {
      setIsMobileChatOpen(true);
    }
  };

  const handleBackToConversations = () => {
    setIsMobileChatOpen(false);
    setSelectedConversation(null);
  };

  const selectedMessages = selectedConversation
    ? messagesById[selectedConversation.id] ?? []
    : [];

  const layoutClass = [
    "chat-layout",
    !isAdmin ? "chat-layout--employee" : "",
    isAdmin && isMobileChatOpen
      ? "chat-layout--mobile-chat"
      : "",
    isAdmin && !isMobileChatOpen
      ? "chat-layout--mobile-list"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClass}>
      {isAdmin && (
        <ConversationSidebar
          conversations={availableConversations}
          selectedConversationId={
            selectedConversation?.id ?? null
          }
          onSelectConversation={
            handleSelectConversation
          }
        />
      )}

      <ChatWindow
        conversation={selectedConversation}
        messages={selectedMessages}
        isAdmin={isAdmin}
        chatMode={chatMode}
        onSendMessage={handleSendMessage}
        onBackToConversations={
          isAdmin
            ? handleBackToConversations
            : undefined
        }
      />
    </div>
  );
}