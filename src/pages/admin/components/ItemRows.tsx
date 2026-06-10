import { useState } from 'react';
import type { MenuItem } from '../../../types';

interface ItemRowsProps {
  items: MenuItem[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number, name: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onToggleHide: (idx: number) => void;
}

export default function ItemRows({ items, onEdit, onDelete, onReorder, onToggleHide }: ItemRowsProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-muted/50 text-sm tracking-wide py-8 text-center italic">
        No items yet. Add one above.
      </p>
    );
  }

  return (
    <div className="border border-gold/8 rounded-sm overflow-hidden">
      {items.map((item, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => setDraggedIdx(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedIdx !== null && draggedIdx !== idx) {
              onReorder(draggedIdx, idx);
            }
            setDraggedIdx(null);
          }}
          onDragEnd={() => setDraggedIdx(null)}
          className={[
            'group flex items-center py-3.5 px-4 border-b border-gold/8',
            'last:border-0 hover:bg-white/2.5 transition-colors cursor-move',
            draggedIdx === idx ? 'opacity-50 bg-gold/10' : '',
            item.hidden ? 'opacity-45' : '',
          ].join(' ')}
        >
          <span className="text-lg text-gold/60 mr-3 font-light">⋮⋮</span>
          <span
            className={[
              'flex-1 text-cream/85 text-sm font-light tracking-wide leading-snug pr-4',
              item.hidden ? 'line-through text-muted/60' : '',
            ].join(' ')}
          >
            {item.name}
            {item.hidden && (
              <span className="ml-2 text-[8px] tracking-[0.2em] uppercase text-amber-500/80 border border-amber-500/30 px-1.5 py-0.5 rounded-sm no-underline" style={{ textDecoration: 'none' }}>
                Hidden
              </span>
            )}
          </span>
          <span className="font-display text-lg text-gold shrink-0 mr-4">
            <span className="text-[11px] font-body font-light opacity-60 mr-0.5">
              Rs.
            </span>
            {item.price}
          </span>
          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title={item.hidden ? 'Show item' : 'Hide item'}
              onClick={() => onToggleHide(idx)}
              className={[
                'text-[9px] tracking-[0.22em] uppercase border px-2.5 py-1 transition-colors',
                item.hidden
                  ? 'text-amber-400 border-amber-500/40 hover:text-amber-300 hover:border-amber-400/60'
                  : 'text-muted/70 border-gold/10 hover:text-amber-400 hover:border-amber-500/30',
              ].join(' ')}
            >
              {item.hidden ? '👁 Show' : '🚫 Hide'}
            </button>
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
