import { useState } from 'react';
import type { FormEvent } from 'react';
import ModalShell from './ModalShell';

interface RenameCategoryModalProps {
  currentName: string;
  existingNames: string[];
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

export default function RenameCategoryModal({
  currentName,
  existingNames,
  onClose,
  onSave,
}: RenameCategoryModalProps) {
  const [name, setName] = useState(currentName);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErr('Category name cannot be empty.');
      return;
    }
    if (trimmed === currentName) {
      onClose();
      return;
    }
    if (existingNames.includes(trimmed)) {
      setErr('A category with that name already exists.');
      return;
    }
    setBusy(true);
    await onSave(trimmed);
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-1 leading-tight">
        Rename Category
      </h3>
      <p className="text-[10px] tracking-[0.22em] uppercase text-muted mb-6">
        Current: <span className="text-gold">{currentName}</span>
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            New Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setErr(''); }}
            placeholder="e.g. Beverages"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors tracking-wide"
          />
        </div>

        {err && <p className="text-red-400 text-xs tracking-wide">{err}</p>}

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
          <button
            type="button"
            onClick={onClose}
            className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                       tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream
                       transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="bg-ember text-cream px-6 py-2.5 text-[10px] tracking-[0.28em]
                       uppercase hover:bg-ember/85 transition-colors disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Rename'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
