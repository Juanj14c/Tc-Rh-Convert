import ChatLayout from "@/components/chat/ChatLayout";

export default function ChatPage() {
  return (
    <section className="chat-page">
      <ChatLayout
        isAdmin={true}
        chatMode="anonymous"
      />
    </section>
  );
}