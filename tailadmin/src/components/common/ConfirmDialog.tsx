import AppModal from './AppModal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmColors =
    variant === 'danger'
      ? 'bg-[#E85050] hover:bg-[#C93636] text-white'
      : variant === 'warning'
        ? 'bg-[#FF9800] hover:bg-[#D76301] text-white'
        : 'bg-brand-500 hover:bg-brand-600 text-white';

  return (
    <AppModal open={open} onClose={onClose} size="sm" showClose={false} closeOnEsc={!loading}>
      <div className="text-center py-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#FFF0F0] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[#E85050]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#540F00] mb-2">{title}</h3>
        <p className="text-sm text-[#7A6548]">{message}</p>
      </div>
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-semibold text-[#540F00] bg-[#FFF8C8] rounded-xl hover:bg-[#FFE7A3] disabled:opacity-50 transition-all"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all ${confirmColors}`}
        >
          {loading ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </AppModal>
  );
}
