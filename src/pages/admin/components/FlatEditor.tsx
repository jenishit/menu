import type { MenuItem } from '../../../types';
import ItemRows from './ItemRows';

interface FlatEditorProps {
  items: MenuItem[];
  onAddItem: () => void;
  onEditItem: (idx: number) => void;
  onDeleteItem: (idx: number, name: string) => void;
  onReorderItem: (fromIdx: number, toIdx: number) => void;
}

export default function FlatEditor({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItem,
}: FlatEditorProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.28em] uppercase text-muted/60">
          {items.length} item{items.length !== 1 ? 's' : ''}
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
