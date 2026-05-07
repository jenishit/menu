import { useState } from 'react';
import type { FormEvent } from 'react';
import ModalShell from './ModalShell';

interface AddSubCatModalProps {
  parent: string;
  existing: string[];
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export default function AddSubCatModal({
  parent,
  existing,
  onClose,
  onSave,
}: AddSubCatModalProps) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Please enter a name.');
      return;
    }
    if (existing.includes(name.trim())) {
      setErr('That sub-category already exists.');
      return;
    }
    setBusy(true);
    await onSave(name.trim());
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-1">
        New Sub-category
      </h3>
      <p className="text-[10px] tracking-[0.22em] uppercase text-muted mb-6">
        inside <span className="text-gold">{parent}</span>
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Prawn"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors"
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
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
