import ChatLayout from "@/components/chat/ChatLayout";

export default function InternalChatPage() {
  return (
    <section className="chat-page">
      <ChatLayout
        isAdmin={true}
        chatMode="internal"
      />
    </section>
  );
}