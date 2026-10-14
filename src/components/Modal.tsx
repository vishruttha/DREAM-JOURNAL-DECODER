// ==========================================
// REUSABLE GLASSMORPHIC CELESTIAL MODAL
// Accessible, responsive, with smooth backdrop
// ==========================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClasses} celestial-card border border-violet-500/30 p-6 md:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-violet-500/20 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-serif text-slate-100 font-semibold tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-violet-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
};
