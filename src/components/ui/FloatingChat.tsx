'use client';

import { useState } from 'react';
import { MessageSquare, Minimize2, Maximize2, X } from 'lucide-react';
import { ChatWorkspace } from '@/components/chat/ChatWorkspace';

type ChatSize = 's' | 'm' | 'l';

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<ChatSize>('m');

  const panelSizeClass =
    size === 's'
      ? 'w-[380px] h-[520px]'
      : size === 'm'
        ? 'w-[760px] h-[78vh] max-h-[920px]'
        : 'w-screen h-screen rounded-none';

  return (
    <>
      {open && (
        <div className={`fixed ${size === 'l' ? 'inset-0' : 'bottom-6 right-6'} z-100`} onClick={() => setOpen(false)}>
          {size === 'l' && <div className="absolute inset-0 bg-black/45" />}

          <div
            className={`relative ${size === 'l' ? 'inset-0' : ''} ${panelSizeClass} ${size === 'l' ? '' : 'rounded-2xl'} overflow-hidden border dark:border-white/10 border-black/10 bg-white dark:bg-gray-950 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-11 px-3 border-b dark:border-white/8 border-black/8 bg-black/2 dark:bg-white/3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black dark:bg-white/5 flex items-center justify-center border border-red-500/40">
                  <span className="text-[10px] font-black tracking-[0.2em] text-red-500">WMC</span>
                </div>
                <div>
                  <div className="text-[11px] font-black dark:text-white text-gray-900">WAMOCON Chat</div>
                  <div className="text-[9px] dark:text-white/30 text-gray-400">Popup Workspace</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  title="Größe S"
                  onClick={() => setSize('s')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border-none cursor-pointer transition-colors ${size === 's' ? 'bg-(--primary) text-white' : 'bg-transparent dark:text-white/50 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  S
                </button>
                <button
                  title="Größe M"
                  onClick={() => setSize('m')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border-none cursor-pointer transition-colors ${size === 'm' ? 'bg-(--primary) text-white' : 'bg-transparent dark:text-white/50 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  M
                </button>
                <button
                  title="Größe L (Vollfenster)"
                  onClick={() => setSize('l')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border-none cursor-pointer transition-colors ${size === 'l' ? 'bg-(--primary) text-white' : 'bg-transparent dark:text-white/50 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  L
                </button>
                <button
                  title={size === 'l' ? 'Aus Vollfenster zurück' : 'Vollfenster'}
                  onClick={() => setSize((v) => (v === 'l' ? 'm' : 'l'))}
                  className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/40 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {size === 'l' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  title="Chat schließen"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer dark:text-white/40 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="h-[calc(100%-44px)]">
              <ChatWorkspace embedded />
            </div>
          </div>
        </div>
      )}

      {!open && (
        <div className="fixed bottom-6 right-6 z-100">
          <button
            onClick={() => {
              setSize('m');
              setOpen(true);
            }}
            title="WMC Chat öffnen"
            className="group h-14 px-4 rounded-2xl border-none cursor-pointer shadow-2xl transition-all hover:scale-[1.03] active:scale-95 bg-linear-to-r from-black to-gray-900 dark:from-black dark:to-gray-950 flex items-center gap-2"
          >
            <span className="text-red-500 font-black text-base tracking-[0.24em]">WMC</span>
            <span className="w-px h-5 bg-red-500/35" />
            <MessageSquare size={16} className="text-red-500" />
          </button>
        </div>
      )}
    </>
  );
}
