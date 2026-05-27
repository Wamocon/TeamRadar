'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import Image from 'next/image';
import {
  MessageSquare, Send, Search, Plus, Hash, Users, Smile, Paperclip,
  MoreHorizontal, X, Check, CheckCheck,
  Loader, BellOff,
} from 'lucide-react';

/* ── Typen ─────────────────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string; // ISO
  read: boolean;
  edited?: boolean;
}

interface ChatChannel {
  id: string;
  type: 'dm' | 'channel';
  name: string;         // Kanal-Name oder Member-ID für DMs
  memberId?: string;    // für DMs
  muted?: boolean;
  unread?: number;
  lastMessage?: string;
  lastTs?: string;
}

/* ── Seed-Daten (Demo) ─────────────────────────────────────────────── */
const CHANNEL_SEEDS: Omit<ChatChannel, 'id'>[] = [
  { type: 'channel', name: 'allgemein', unread: 0 },
  { type: 'channel', name: 'projekte', unread: 2 },
  { type: 'channel', name: 'ankündigungen', unread: 0, muted: false },
  { type: 'channel', name: 'random', unread: 0 },
];

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  allgemein: [
    { id: '1', senderId: '__system__', text: '👋 Willkommen im Team-Chat!', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), read: true },
    { id: '2', senderId: '__other__', text: 'Hallo zusammen! Wer ist heute im Büro?', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), read: true },
    { id: '3', senderId: '__other2__', text: 'Ich komme gegen 10 Uhr.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
  ],
  projekte: [
    { id: '4', senderId: '__other__', text: 'Status-Update Projekt Alpha: läuft gut!', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
    { id: '5', senderId: '__other2__', text: 'Kickoff Termin ist Donnerstag 14 Uhr.', timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  ],
};

/* ── Helfer ────────────────────────────────────────────────────────── */
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Gestern';
  return d.toLocaleDateString('de', { day: '2-digit', month: 'short' });
}

function groupByDate(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const d = new Date(msg.timestamp);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Heute';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Gestern';
    else label = d.toLocaleDateString('de', { weekday: 'long', day: '2-digit', month: 'long' });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.messages.push(msg);
    else groups.push({ label, messages: [msg] });
  });
  return groups;
}

/* ── Haupt-Komponente ──────────────────────────────────────────────── */
export default function ChatPage() {
  const members = useAppStore((s) => s.members);
  const userProfile = useAppStore((s) => s.userProfile);

  /* Kanäle & DMs */
  const [channels] = useState<ChatChannel[]>([
    ...CHANNEL_SEEDS.map((c, i) => ({ ...c, id: `ch-${i}` })),
    ...members.slice(0, 6).map((m) => ({
      id: `dm-${m.id}`, type: 'dm' as const, name: m.name, memberId: m.id,
      unread: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
      lastMessage: 'Wir sprechen gleich.',
      lastTs: new Date(Date.now() - Math.random() * 7200000).toISOString(),
    })),
  ]);

  const [activeChannelId, setActiveChannelId] = useState<string>('ch-0');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeMessages = messages[activeChannel?.name ?? ''] ?? [];
  const messageGroups = useMemo(() => groupByDate(activeMessages), [activeMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );
  const channelList = filteredChannels.filter((c) => c.type === 'channel');
  const dmList = filteredChannels.filter((c) => c.type === 'dm');

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChannel) return;
    setSending(true);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: userProfile?.id ?? '__me__',
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => ({
      ...prev,
      [activeChannel.name]: [...(prev[activeChannel.name] ?? []), msg],
    }));
    setInput('');
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMine = (senderId: string) =>
    senderId === (userProfile?.id ?? '__me__') || senderId === 'me';

  const getMemberById = (id: string) => members.find((m) => m.id === id);

  const getSenderName = (senderId: string) => {
    if (senderId === '__system__') return 'System';
    if (senderId === '__other__') return members[0]?.name ?? 'Mitarbeiter';
    if (senderId === '__other2__') return members[1]?.name ?? 'Mitarbeiter';
    return getMemberById(senderId)?.name ?? userProfile?.displayName ?? 'Ich';
  };

  const totalUnread = channels.reduce((s, c) => s + (c.unread ?? 0), 0);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-white dark:bg-gray-950">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r dark:border-white/[0.06] border-gray-200 bg-gray-50 dark:bg-gray-900/50">
        {/* Header */}
        <div className="px-4 py-3 border-b dark:border-white/[0.06] border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[var(--primary)]" />
            <span className="font-black text-sm dark:text-white text-gray-900">Chat</span>
            {totalUnread > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">{totalUnread}</span>
            )}
          </div>
          <button className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors border-none bg-transparent cursor-pointer dark:text-white/40 text-gray-500">
            <Plus size={14} />
          </button>
        </div>

        {/* Suche */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Suchen..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black/[0.04] dark:bg-white/[0.04] border-none outline-none dark:text-white text-gray-900 dark:placeholder-white/30 placeholder-gray-400" />
          </div>
        </div>

        {/* Kanäle */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-2 py-2">
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest dark:text-white/30 text-gray-500">Kanäle</span>
              <Plus size={10} className="dark:text-white/30 text-gray-400 cursor-pointer" />
            </div>
            {channelList.map((ch) => (
              <button key={ch.id} onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all border-none cursor-pointer ${activeChannelId === ch.id ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-transparent dark:text-white/60 text-gray-600 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'}`}>
                <Hash size={13} className="shrink-0" />
                <span className="text-xs font-semibold truncate flex-1">{ch.name}</span>
                {(ch.unread ?? 0) > 0 && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white shrink-0">{ch.unread}</span>
                )}
                {ch.muted && <BellOff size={10} className="shrink-0 opacity-40" />}
              </button>
            ))}
          </div>

          {/* DMs */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest dark:text-white/30 text-gray-500">Direktnachrichten</span>
              <Plus size={10} className="dark:text-white/30 text-gray-400 cursor-pointer" />
            </div>
            {dmList.map((dm) => {
              const member = dm.memberId ? getMemberById(dm.memberId) : null;
              return (
                <button key={dm.id} onClick={() => setActiveChannelId(dm.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all border-none cursor-pointer ${activeChannelId === dm.id ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-transparent dark:text-white/60 text-gray-600 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'}`}>
                  <div className="relative w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0 overflow-hidden">
                    {member?.avatarUrl ? (
                      <Image src={member.avatarUrl} alt="" fill className="object-cover" sizes="20px" />
                    ) : (
                      <span className="text-[8px] font-black text-[var(--primary)]">{dm.name.charAt(0)}</span>
                    )}
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500 border border-white dark:border-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{dm.name}</div>
                    {dm.lastMessage && (
                      <div className="text-[9px] truncate opacity-50">{dm.lastMessage}</div>
                    )}
                  </div>
                  {(dm.unread ?? 0) > 0 && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white shrink-0">{dm.unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Me */}
        <div className="p-3 border-t dark:border-white/[0.06] border-gray-200 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-xs shrink-0">
            {(userProfile?.displayName || userProfile?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold dark:text-white text-gray-900 truncate">{userProfile?.displayName || 'Ich'}</div>
            <div className="text-[9px] dark:text-white/30 text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b dark:border-white/[0.06] border-gray-200 bg-white dark:bg-gray-950 shrink-0">
          <div className="flex items-center gap-3">
            {activeChannel?.type === 'channel' ? (
              <Hash size={18} className="text-[var(--primary)]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-sm">
                {activeChannel?.name.charAt(0) ?? '?'}
              </div>
            )}
            <div>
              <div className="font-black text-sm dark:text-white text-gray-900">
                {activeChannel?.type === 'channel' ? `#${activeChannel.name}` : activeChannel?.name}
              </div>
              <div className="text-[9px] dark:text-white/30 text-gray-500">
                {activeChannel?.type === 'channel' ? `${members.length} Mitglieder` : 'Direktnachricht'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowMembers(v => !v)}
              className={`p-2 rounded-lg border-none cursor-pointer transition-colors ${showMembers ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-transparent dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'}`} title="Mitglieder">
              <Users size={16} />
            </button>
            <button className="p-2 rounded-lg border-none cursor-pointer transition-colors bg-transparent dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" title="Suchen">
              <Search size={16} />
            </button>
            <button className="p-2 rounded-lg border-none cursor-pointer transition-colors bg-transparent dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" title="Weitere Optionen">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* ── Messages ──────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
              {activeMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mb-4">
                    {activeChannel?.type === 'channel' ? (
                      <Hash size={28} className="text-[var(--primary)]" />
                    ) : (
                      <MessageSquare size={28} className="text-[var(--primary)]" />
                    )}
                  </div>
                  <div className="font-black text-lg dark:text-white text-gray-900 mb-1">
                    {activeChannel?.type === 'channel' ? `#${activeChannel?.name}` : activeChannel?.name}
                  </div>
                  <div className="text-sm dark:text-white/40 text-gray-500">
                    {activeChannel?.type === 'channel' ? 'Das ist der Anfang dieses Kanals.' : 'Starte deine Unterhaltung!'}
                  </div>
                </div>
              )}

              {messageGroups.map((group) => (
                <div key={group.label}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px dark:bg-white/[0.06] bg-gray-200" />
                    <span className="text-[9px] font-bold uppercase tracking-widest dark:text-white/30 text-gray-500 px-2">{group.label}</span>
                    <div className="flex-1 h-px dark:bg-white/[0.06] bg-gray-200" />
                  </div>

                  {/* Messages */}
                  <div className="space-y-1">
                    {group.messages.map((msg, idx) => {
                      const mine = isMine(msg.senderId);
                      const isSystem = msg.senderId === '__system__';
                      const prevMsg = group.messages[idx - 1];
                      const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <span className="text-[10px] px-3 py-1 rounded-full dark:bg-white/[0.04] bg-gray-100 dark:text-white/40 text-gray-500">{msg.text}</span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''} ${showSender ? 'mt-3' : 'mt-0.5'} group`}>
                          {/* Avatar */}
                          {showSender && !mine && (
                            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-xs shrink-0 mt-1">
                              {getSenderName(msg.senderId).charAt(0)}
                            </div>
                          )}
                          {!showSender && !mine && <div className="w-8 shrink-0" />}

                          <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                            {showSender && (
                              <div className={`flex items-baseline gap-2 mb-0.5 ${mine ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] font-black dark:text-white/70 text-gray-700">{getSenderName(msg.senderId)}</span>
                                <span className="text-[9px] dark:text-white/30 text-gray-400">{formatTime(msg.timestamp)}</span>
                              </div>
                            )}
                            <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${mine
                              ? 'bg-[var(--primary)] text-white rounded-tr-sm'
                              : 'dark:bg-white/[0.06] bg-gray-100 dark:text-white text-gray-900 rounded-tl-sm'}`}>
                              {msg.text}
                              {mine && (
                                <div className="absolute -bottom-3.5 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {msg.read ? <CheckCheck size={10} className="text-[var(--primary)]" /> : <Check size={10} className="text-gray-400" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* ── Input ──────────────────────────────── */}
            <div className="px-5 py-3 border-t dark:border-white/[0.06] border-gray-200 bg-white dark:bg-gray-950 shrink-0">
              <div className="flex items-end gap-3 p-3 rounded-2xl border dark:border-white/[0.08] border-gray-200 dark:bg-white/[0.02] bg-gray-50 transition-colors focus-within:border-[var(--primary)]">
                <button className="p-1 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/30 text-gray-400 hover:text-[var(--primary)] transition-colors shrink-0 mb-0.5">
                  <Plus size={18} />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nachricht an ${activeChannel?.type === 'channel' ? '#' + activeChannel.name : activeChannel?.name ?? '...'}`}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm dark:text-white text-gray-900 dark:placeholder-white/30 placeholder-gray-400 leading-relaxed max-h-32 overflow-y-auto"
                  style={{ height: 'auto' }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                  }}
                />
                <div className="flex items-center gap-1 shrink-0 mb-0.5">
                  <button className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/30 text-gray-400 hover:text-[var(--primary)] transition-colors">
                    <Smile size={16} />
                  </button>
                  <button className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/30 text-gray-400 hover:text-[var(--primary)] transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <button onClick={sendMessage} disabled={!input.trim() || sending}
                    className="p-1.5 rounded-lg border-none cursor-pointer transition-all disabled:opacity-30 bg-[var(--primary)] text-white hover:opacity-90 disabled:cursor-not-allowed">
                    {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
              <div className="mt-1.5 text-[9px] dark:text-white/20 text-gray-400 text-center">
                <kbd className="px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.06] font-mono">Enter</kbd> senden &nbsp;·&nbsp;
                <kbd className="px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.06] font-mono">Shift+Enter</kbd> neue Zeile
              </div>
            </div>
          </div>

          {/* ── Members Panel ─────────────────────────── */}
          {showMembers && (
            <aside className="w-56 shrink-0 border-l dark:border-white/[0.06] border-gray-200 bg-gray-50 dark:bg-gray-900/50 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] border-gray-200 flex items-center justify-between">
                <span className="text-xs font-black dark:text-white text-gray-900">Mitglieder</span>
                <button onClick={() => setShowMembers(false)} className="p-1 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                  <X size={13} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-0.5">
                {/* Online */}
                <div className="text-[9px] font-black uppercase tracking-widest dark:text-white/30 text-gray-500 px-2 mb-1">Online — {Math.min(members.length, 3)}</div>
                {members.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer">
                    <div className="relative w-6 h-6 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-[9px] shrink-0 overflow-hidden">
                      {m.avatarUrl ? <Image src={m.avatarUrl} alt="" fill className="object-cover" sizes="24px" /> : m.name.charAt(0)}
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500 border border-white dark:border-gray-900" />
                    </div>
                    <span className="text-xs dark:text-white/70 text-gray-700 truncate">{m.name}</span>
                  </div>
                ))}
                {/* Offline */}
                {members.length > 3 && (
                  <>
                    <div className="text-[9px] font-black uppercase tracking-widest dark:text-white/30 text-gray-500 px-2 mb-1 mt-3">Offline — {members.length - 3}</div>
                    {members.slice(3).map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer opacity-50">
                        <div className="relative w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/30 font-black text-[9px] shrink-0">
                          {m.name.charAt(0)}
                          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-gray-400 border border-white dark:border-gray-900" />
                        </div>
                        <span className="text-xs dark:text-white/50 text-gray-500 truncate">{m.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
