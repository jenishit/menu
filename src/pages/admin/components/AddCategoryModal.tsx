import { useState } from 'react';
import type { FormEvent } from 'react';
import ModalShell from './ModalShell';

interface AddCategoryModalProps {
  existingNames: string[];
  onClose: () => void;
  onSave: (name: string, type: 'flat' | 'nested') => Promise<void>;
}

export default function AddCategoryModal({
  existingNames,
  onClose,
  onSave,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'flat' | 'nested'>('flat');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Please enter a category name.');
      return;
    }
    if (existingNames.includes(name.trim())) {
      setErr('That category already exists.');
      return;
    }
    setBusy(true);
    await onSave(name.trim(), type);
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-6">
        New Category
      </h3>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            Category Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Desserts"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'flat' | 'nested')}
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 focus:outline-none focus:border-gold/50 transition-colors
                       cursor-pointer"
          >
            <option value="flat">Simple list — items with name & price</option>
            <option value="nested">Grouped — sub-categories (like Momo, Pizza)</option>
          </select>
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
            {busy ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
