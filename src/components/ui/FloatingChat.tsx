'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface FloatMsg {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const DEMO_MSGS: FloatMsg[] = [
  { id: '1', senderId: '__other__', text: '👋 Hallo! Wer ist heute online?', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', senderId: '__other2__', text: 'Ich bin im HO bis 15 Uhr.', timestamp: new Date(Date.now() - 1800000).toISOString() },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
}

export function FloatingChat() {
  const userProfile = useAppStore((s) => s.userProfile);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<FloatMsg[]>(DEMO_MSGS);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(2);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: userProfile?.id || '__me__',
      text,
      timestamp: new Date().toISOString(),
    }]);
    setInput('');
  };

  const isMe = (senderId: string) =>
    senderId === (userProfile?.id || '__me__') || senderId === '__me__';

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Chat Panel */}
        {open && (
          <div
            className="w-[360px] h-[480px] rounded-2xl shadow-2xl border dark:border-white/10 border-black/8 bg-white dark:bg-[#0f172a] flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/8 border-black/6 bg-black/1 dark:bg-white/2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-(--primary-light) flex items-center justify-center">
                  <MessageSquare size={14} className="text-(--primary)" />
                </div>
                <div>
                  <div className="text-[11px] font-black dark:text-white text-gray-900">#allgemein</div>
                  <div className="text-[9px] dark:text-white/30 text-gray-400">Team-Chat</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                title="Chat schließen"
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer dark:text-white/40 text-gray-400 transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => {
                const mine = isMe(msg.senderId);
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                          mine
                            ? 'bg-(--primary) text-white rounded-br-sm'
                            : 'bg-black/5 dark:bg-white/6 dark:text-white text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] dark:text-white/20 text-gray-400 px-1">{fmt(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t dark:border-white/6 border-black/6 p-3 flex gap-2 items-end bg-white dark:bg-[#0f172a]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Nachricht schreiben…"
                title="Nachricht"
                rows={1}
                className="flex-1 resize-none bg-black/3 dark:bg-white/5 border dark:border-white/8 border-black/8 rounded-xl px-3 py-2 text-[12px] dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all"
              />
              <button
                onClick={send}
                title="Senden"
                className="p-2 rounded-xl bg-(--primary) text-white border-none cursor-pointer hover:opacity-80 transition-opacity shrink-0 disabled:opacity-40"
                disabled={!input.trim()}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setOpen((v) => !v)}
          title={open ? 'Chat schließen' : 'Chat öffnen'}
          className="w-12 h-12 rounded-full bg-(--primary) text-white shadow-xl border-none cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center relative"
        >
          {open ? <X size={20} /> : <MessageSquare size={20} />}
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow">
              {unread}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
