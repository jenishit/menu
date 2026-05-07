import { useState } from 'react';
import type { ReactNode } from 'react';
import ModalShell from './ModalShell';

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3
        className={`font-display text-3xl font-light tracking-wide mb-4 ${
          danger ? 'text-red-400/90' : 'text-cream'
        }`}
      >
        {title}
      </h3>

      <p className="text-cream/60 text-sm tracking-wide leading-relaxed">
        {message}
      </p>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
        <button
          onClick={onClose}
          className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                     tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream
                     transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={go}
          disabled={busy}
          className={[
            'px-6 py-2.5 text-[10px] tracking-[0.28em] uppercase transition-colors disabled:opacity-40',
            danger
              ? 'bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50'
              : 'bg-ember text-cream hover:bg-ember/85',
          ].join(' ')}
        >
          {busy ? '…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
