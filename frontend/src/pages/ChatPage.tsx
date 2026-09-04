import ChatLayout from "../components/chat/ChatLayout";

interface ChatPageProps {
  isAdmin: boolean;
}

function ChatPage({ isAdmin }: ChatPageProps) {
  return (
    <section className="chat-page">
      <ChatLayout isAdmin={isAdmin} />
    </section>
  );
}

export default ChatPage;