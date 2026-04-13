'use client';
import { X, ExternalLink, LucideIcon } from 'lucide-react';
import { useEffect } from 'react';

interface AppPortalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  icon: React.ElementType;
  iconColor?: string;
}

export function AppPortal({ isOpen, onClose, url, title, icon: Icon, iconColor = 'text-blue-400' }: AppPortalProps) {
  // Prevent scrolling when portal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-[95vw] h-[90vh] md:w-[90vw] md:h-[85vh] rounded-2xl border dark:border-white/10 border-gray-200 dark:bg-gray-900 bg-white shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-white/5 border-gray-100 dark:bg-gray-800/50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <h2 className="text-base font-bold dark:text-white text-gray-900 leading-tight">
                {title}
              </h2>
              <p className="text-[10px] uppercase tracking-wider dark:text-white/30 text-gray-400 font-semibold">
                Externes Tool-Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white
                bg-gray-200/50 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900
                border-none cursor-pointer"
              title="In neuem Tab öffnen"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">In neuem Tab</span>
            </button>
            <div className="w-px h-6 dark:bg-white/10 bg-gray-200 mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"
              title="Schließen"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Iframe Content */}
        <div className="flex-1 bg-white relative">
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title={title}
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
