import { useState } from 'react';
import type { FormEvent } from 'react';
import type { MenuItem } from '../../../types';
import ModalShell from './ModalShell';

interface ItemModalProps {
  title: string;
  category: string;
  subCat: string | null;
  initial: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
}

export default function ItemModal({
  title,
  category,
  subCat,
  initial,
  onClose,
  onSave,
}: ItemModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const p = parseInt(price, 10);
    if (!name.trim() || isNaN(p) || p < 0) {
      setErr('Please enter a valid name and price.');
      return;
    }
    setBusy(true);
    await onSave({ name: name.trim(), price: p });
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-1 leading-tight">
        {title}
      </h3>

      {subCat && (
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted mb-6">
          {category} › <span className="text-gold">{subCat}</span>
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-5 mt-6">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            Item Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Masala Milk Tea"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors tracking-wide"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            Price (NPR)
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 150"
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
            {busy ? 'Saving…' : title.startsWith('Edit') ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
