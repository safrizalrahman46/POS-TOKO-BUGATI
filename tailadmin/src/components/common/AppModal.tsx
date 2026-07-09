import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  'full': 'max-w-[95vw]',
};

export default function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
  showClose = true,
  closeOnBackdrop = false,
  closeOnEsc = true,
}: AppModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') onClose();
    },
    [closeOnEsc, onClose],
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 z-[90] bg-[rgba(84,15,0,0.28)] backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={modalRef}
        className={[
          'relative z-[100] w-full',
          sizeClasses[size],
          'max-h-[calc(100vh-48px)] overflow-hidden',
          'rounded-[22px] border border-[#F2D98D] bg-[#FFFDF2]',
          'shadow-[0_20px_60px_-12px_rgba(84,15,0,0.25),0_8px_24px_-6px_rgba(84,15,0,0.12)]',
          'flex flex-col',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2D98D] bg-[#FFFDF2] shrink-0 rounded-t-[22px]">
            <h2 className="text-lg font-semibold text-[#540F00]">
              {title}
            </h2>
            {showClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7A6548] hover:bg-[#FFF8C8] hover:text-[#540F00] transition-colors text-lg leading-none"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
        {footer && (
          <div className="sticky bottom-0 border-t border-[#F2D98D] bg-[#FFFDF2] px-6 py-4 flex items-center justify-end gap-3 shrink-0 rounded-b-[22px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
