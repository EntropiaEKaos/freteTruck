import { Suspense } from "react";
import ChatContent from "./ChatContent";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
