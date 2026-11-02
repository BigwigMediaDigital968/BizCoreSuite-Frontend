import React, { useState, useEffect, useRef } from "react";
import { Send, Hash, User, Plus, Search, Shield } from "lucide-react";
import { getMyRooms, getRoomMessages } from "../api/chatApi";
import { useChatSocket } from "../hooks/useChatSocket";
import { type ChatRoom, type ChatMessage } from "../../../types/chat";
import { useAuth } from "@/hooks/useAuth"; // adjust import path to your auth hook

export const ChatPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMyRooms().then((data) => {
      setRooms(data);
      if (data.length > 0) setActiveRoom(data[0]);
    });
  }, []);

  useEffect(() => {
    if (activeRoom) {
      getRoomMessages(activeRoom._id).then(setMessages);
    }
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { sendMessage } = useChatSocket(
    activeRoom?._id || null,
    (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    }
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeRoom) return;

    sendMessage(activeRoom._id, inputMessage.trim());
    setInputMessage("");
  };

  const isHeadOrAdmin = user?.role === "head" || user?.role === "admin";

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar Channels & DMs */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">Internal Chat</h2>
          {isHeadOrAdmin && (
            <button
              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              title="Create Channel (Head Only)"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase px-3 py-1">
            Channels
          </div>
          {rooms
            .filter((r) => r.type !== "DIRECT")
            .map((room) => (
              <button
                key={room._id}
                onClick={() => setActiveRoom(room)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeRoom?._id === room._id
                    ? "bg-purple-100 text-purple-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Hash className="w-4 h-4 text-purple-500" />
                <span className="truncate">{room.name || "General"}</span>
              </button>
            ))}

          <div className="text-xs font-semibold text-slate-400 uppercase px-3 py-1 mt-4">
            Direct Messages
          </div>
          {rooms
            .filter((r) => r.type === "DIRECT")
            .map((room) => {
              const otherUser = room.participants.find(
                (p) => p._id !== user?._id
              );
              return (
                <button
                  key={room._id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeRoom?._id === room._id
                      ? "bg-purple-100 text-purple-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="truncate">
                    {otherUser?.name || "Direct Message"}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Chat Window */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800 text-lg">
                {activeRoom.name || "Direct Message"}
              </h3>
            </div>
            {isHeadOrAdmin && (
              <span className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                <Shield className="w-3.5 h-3.5" /> Head Managed
              </span>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isMe = msg.senderId._id === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-600">
                      {msg.senderId.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input */}
          <form
            onSubmit={handleSend}
            className="p-4 bg-white border-t border-slate-200 flex gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2 font-medium transition shadow-sm"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Select a channel or message to start chatting
        </div>
      )}
    </div>
  );
};