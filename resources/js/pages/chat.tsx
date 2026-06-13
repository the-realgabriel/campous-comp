import React, { useState, useEffect, useRef, JSX } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChartBlock from "@/components/chart-block";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

function renderText(text: string) {
  const chartRegex = /```chart\s*\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = chartRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <ReactMarkdown key={`md-${lastIndex}`} remarkPlugins={[remarkGfm]}>
          {before}
        </ReactMarkdown>
      );
    }

    try {
      const config = JSON.parse(match[1].trim());
      parts.push(<ChartBlock key={`chart-${match.index}`} config={config} />);
    } catch {
      parts.push(
        <p key={`err-${match.index}`} className="text-red-500 text-xs">
          Invalid chart data
        </p>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const after = text.slice(lastIndex);
  if (after) {
    parts.push(
      <ReactMarkdown key={`md-end`} remarkPlugins={[remarkGfm]}>
        {after}
      </ReactMarkdown>
    );
  }

  return parts.length ? parts : text;
}

export default function Chat(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/chat/history", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setMessages(Array.isArray(data) ? data : []);
        }
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();

      const botMessage: Message = {
        id: data?.id || `${Date.now()}-bot`,
        text: data?.reply || "I'm not sure how to respond to that",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error chatting:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: "Something went wrong. Please try again later.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function clearHistory() {
    if (!confirm("Clear all chat messages?")) return;
    try {
      const res = await fetch("/api/chat/history", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) setMessages([]);
    } catch {
      // silent
    }
  }

  return (
    <AppLayout>
      <Head title="Chat Assistant" />

      <div className="flex flex-col h-full w-full mx-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600">Chat History</h2>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
        >
          {loading && (
            <div className="text-sm text-gray-400 text-center py-8">
              Loading messages...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              No messages yet. Start a conversation!
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-3 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md px-3 py-2 rounded-lg text-sm shadow ${
                  msg.sender === "user"
                    ? "bg-amber-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                }`}
              >
                {msg.sender === "bot" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {renderText(msg.text)}
                  </div>
                ) : (
                  msg.text
                )}
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
            onChange={(e) => setInput(e.target.value)}
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
  );
}
