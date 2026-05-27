'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'S' | 'M' | 'L';

const SIZE_CONFIG: Record<ModalSize, { label: string; maxWidth: string; maxHeight: string; icon: React.ElementType }> = {
  S: { label: 'Klein',  maxWidth: 'max-w-lg',      maxHeight: 'max-h-[55vh]',  icon: X },
  M: { label: 'Mittel', maxWidth: 'max-w-2xl',      maxHeight: 'max-h-[75vh]',  icon: X },
  L: { label: 'Groß',   maxWidth: 'max-w-[95vw]',  maxHeight: 'max-h-[92vh]',  icon: X },
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

  const { maxWidth, maxHeight } = SIZE_CONFIG[size];

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Container – Theme-bewusst, proportional skalierend */}
      <div className={`relative w-full ${maxWidth} ${maxHeight} bg-white dark:bg-[#0f172a] rounded-3xl border border-black/8 dark:border-white/5 shadow-2xl overflow-hidden animate-scale-up flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-6 pb-4 relative flex items-start gap-3 border-b border-black/6 dark:border-white/6 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs font-bold text-(--primary) mt-1 uppercase tracking-wider">
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
                    ? 'bg-(--primary-light) text-(--primary)'
                    : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-white/30 hover:bg-black/10 dark:hover:bg-white/10'
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
              className="w-8 h-8 shrink-0 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-all border-none cursor-pointer flex items-center justify-center"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar min-h-0">
          {children}
        </div>

        {/* Footer */}
        {(footer || true) && (
          <div className="px-6 py-4 bg-black/2 dark:bg-white/2 border-t border-black/6 dark:border-white/5 flex justify-end gap-2 shrink-0">
            {footer}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-white text-sm font-bold transition-all border-none cursor-pointer"
            >
              Schließen
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

