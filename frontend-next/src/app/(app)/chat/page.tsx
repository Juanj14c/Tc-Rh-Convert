"use client";

import ChatLayout from "@/components/chat/ChatLayout";
import { useProfile } from "@/hooks/useProfile";

export default function ChatPage() {
  const {
    isAdmin,
    isProfileLoading,
  } = useProfile();

  if (isProfileLoading) {
    return (
      <section className="chat-page">
        <div className="chat-page__loading">
          Cargando...
        </div>
      </section>
    );
  }

  return (
    <section className="chat-page">
      <ChatLayout
        isAdmin={isAdmin}
        chatMode="anonymous"
      />
    </section>
  );
}