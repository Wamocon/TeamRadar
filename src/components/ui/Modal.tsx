'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';

type ModalSize = 'S' | 'M' | 'L';

const SIZE_CONFIG: Record<ModalSize, { label: string; maxWidth: string; icon: React.ElementType }> = {
  S: { label: 'Klein',  maxWidth: 'max-w-md',   icon: Minimize2 },
  M: { label: 'Mittel', maxWidth: 'max-w-2xl',   icon: Maximize2 },
  L: { label: 'Groß',   maxWidth: 'max-w-[95vw]', icon: Maximize2 },
};

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  defaultSize?: ModalSize;
  footer?: React.ReactNode;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  showCloseButton = true,
  defaultSize = 'M',
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState<ModalSize>(defaultSize);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || isOpen === false) return null;

  const sizeClass = SIZE_CONFIG[size].maxWidth;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className={`relative w-full ${sizeClass} bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh] transition-all duration-300`}>
        {/* Header */}
        <div className="p-6 pb-4 relative flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs font-bold text-blue-400/80 mt-1 uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>
          {/* Size controls */}
          <div className="flex items-center gap-1 shrink-0">
            {(['S', 'M', 'L'] as ModalSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                title={`Größe: ${SIZE_CONFIG[s].label}`}
                className={`w-6 h-6 rounded-md text-[9px] font-black transition-all border-none cursor-pointer ${
                  size === s
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {showCloseButton && (
            <button 
              onClick={onClose}
              title="Schließen"
              className="w-8 h-8 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer flex items-center justify-center"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white/[0.02] border-t border-white/5 flex justify-end gap-2">
          {footer}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border-none cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

