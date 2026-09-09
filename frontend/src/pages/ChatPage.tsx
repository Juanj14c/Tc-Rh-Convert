import ChatLayout from "../components/chat/ChatLayout";
import type { ChatMode } from "../components/chat/conversationData";
interface ChatPageProps {
  isAdmin: boolean;
  chatMode: ChatMode;
}

function ChatPage({
  isAdmin,
  chatMode,
}: ChatPageProps){
  return(
    <section className="chat-page">
      <ChatLayout
      isAdmin={isAdmin}
      chatMode = {chatMode}
      />
    </section>
  )
}

export default ChatPage;