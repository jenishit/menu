import type { MenuItem } from '../../../types';
import ItemRows from './ItemRows';

interface NestedEditorProps {
  value: Record<string, MenuItem[]>;
  activeSub: string | null;
  onSelectSub: (s: string) => void;
  onAddSubCat: () => void;
  onAddItem: () => void;
  onEditItem: (idx: number) => void;
  onDeleteItem: (idx: number, name: string) => void;
  onReorderItem: (fromIdx: number, toIdx: number) => void;
}

export default function NestedEditor({
  value,
  activeSub,
  onSelectSub,
  onAddSubCat,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItem,
}: NestedEditorProps) {
  const subs = Object.keys(value);
  const items = activeSub ? (value[activeSub] ?? []) : [];

  return (
    <>
      {/* Sub-cat tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {subs.map((sub) => (
          <button
            key={sub}
            onClick={() => onSelectSub(sub)}
            className={[
              'px-4 py-2 text-[10px] tracking-[0.22em] uppercase border transition-colors',
              sub === activeSub
                ? 'border-ember text-ember bg-ember/10'
                : 'border-gold/20 text-muted hover:text-cream hover:border-gold/40',
            ].join(' ')}
          >
            {sub}
          </button>
        ))}
        <button
          onClick={onAddSubCat}
          className="ml-auto border border-gold/20 text-muted/70 px-3 py-1.5
                     text-[9px] tracking-[0.22em] uppercase hover:border-gold/40
                     hover:text-cream transition-colors"
        >
          + Sub-category
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.28em] uppercase text-muted/60">
          {activeSub} · {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onAddItem}
          className="border border-ember/40 text-ember px-4 py-2 text-[10px]
                     tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors"
        >
          + Add Item
        </button>
      </div>

      <ItemRows items={items} onEdit={onEditItem} onDelete={onDeleteItem} onReorder={onReorderItem} />
    </>
  );
}
