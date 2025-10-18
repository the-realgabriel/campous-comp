import React,{useState, useEffect, useRef, JSX} from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import { chat } from "@/routes";
import { Send } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

const breadcrumbs:BreadcrumbItem[] =[
    {
        title: 'Study bud',
        href: chat().url,
    }
]

export default function Chat(): JSX.Element {

     const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate bot typing delay
    setIsTyping(true);

    try {
      // Here you can replace with your real chatbot API endpoint
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        text: data?.reply || "I'm not sure how to respond to that 🤖",
        sender: 'bot',
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        text: 'Something went wrong. Please try again.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <AppLayout>
      <Head title="🤖 Chatbot Assistant" />

      <div className="flex flex-col h-full w-full mx-auto p-4">
        

        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow
                  ${msg.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600'}
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-3">
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 dark:bg-gray-700 dark:border-gray-600">
                Bot is typing<span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </AppLayout>
  )

}