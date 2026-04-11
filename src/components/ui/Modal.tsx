'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  showCloseButton = true 
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 pb-4 relative">
          {showCloseButton && (
            <button 
              onClick={onClose}
              title="Schließen"
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
          
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm font-bold text-blue-400/80 mt-1 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border-none cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
