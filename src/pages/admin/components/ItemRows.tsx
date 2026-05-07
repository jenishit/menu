import type { MenuItem } from '../../../types';

interface ItemRowsProps {
  items: MenuItem[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number, name: string) => void;
}

export default function ItemRows({ items, onEdit, onDelete }: ItemRowsProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted/50 text-sm tracking-wide py-8 text-center italic">
        No items yet. Add one above.
      </p>
    );
  }

  return (
    <div className="border border-gold/[0.08] rounded-sm overflow-hidden">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="group flex items-center py-3.5 px-4 border-b border-gold/[0.08]
                     last:border-0 hover:bg-white/[0.025] transition-colors"
        >
          <span className="flex-1 text-cream/85 text-sm font-light tracking-wide leading-snug pr-4">
            {item.name}
          </span>
          <span className="font-display text-lg text-gold shrink-0 mr-4">
            <span className="text-[11px] font-body font-light opacity-60 mr-0.5">
              Rs.
            </span>
            {item.price}
          </span>
          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(idx)}
              className="text-[9px] tracking-[0.22em] uppercase text-muted
                         hover:text-gold border border-gold/15 px-2.5 py-1
                         hover:border-gold/40 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(idx, item.name)}
              className="text-[9px] tracking-[0.22em] uppercase text-muted/60
                         hover:text-red-400 border border-gold/10 px-2.5 py-1
                         hover:border-red-500/30 transition-colors"
            >
              Del
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
