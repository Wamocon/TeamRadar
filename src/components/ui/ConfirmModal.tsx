'use client';
import { ReactNode } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info' | 'warning';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="text-red-500" size={24} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={24} />;
      default:
        return <Info className="text-blue-500" size={24} />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 shadow-red-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      default:
        return 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false} // Wir nutzen die Action-Buttons
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 animate-scale-up">
          {getIcon()}
        </div>
        
        <div className="space-y-2 mb-8">
          <p className="text-sm dark:text-white/70 text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold dark:text-white/60 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all bg-transparent cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-black transition-all shadow-lg border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${getButtonClass()}`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
