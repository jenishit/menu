import { useEffect, useRef } from 'react';
import { isFlatCategory } from '../../../types';
import type { CategoryValue, MenuItem } from '../../../types';
import HukkaSection from './HukkaSection';

interface Props {
  id: string;
  name: string;
  index: number;
  value: CategoryValue;
}

export default function CategorySection({ id, name, index, value }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-triggered reveal
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('opacity-0', 'translate-y-7');
          el.classList.add('opacity-100', 'translate-y-0');
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Special full-page layout for Hukka
  if (name === 'Hukka') {
    return <HukkaSection id={id} name={name} index={index} value={value} />;
  }

  return (
    <div
      id={id}
      ref={ref}
      className="mt-24 opacity-0 translate-y-7 transition-all duration-700 ease-in-out"
    >
      {/* Category header */}
      <div className="flex items-center gap-4.5 mb-7">
        <h2 className="font-display text-[clamp(28px,5vw,38px)] font-light tracking-[0.04em] text-cream whitespace-nowrap">
          <span className="text-[13px] tracking-[0.2em] text-ember align-super mr-2 font-body font-extralight">
            0{index}
          </span>
          {name}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-line to-transparent" />
      </div>

      {/* Category content */}
      {name === 'Fire Wood Pizza' && !isFlatCategory(value) ? (
        <PizzaSection value={value} />
      ) : name === 'Momo' && !isFlatCategory(value) ? (
        <MomoSection value={value} />
      ) : !isFlatCategory(value) ? (
        <ComboSection value={value} />
      ) : (
        <FlatList items={value} />
      )}
    </div>
  );
}

/* ── Flat list ───────────────────────────────────────────────────────────── */
function FlatList({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className="group flex items-baseline justify-between py-3.5 border-b border-line
                     relative cursor-default transition-all duration-250
                     hover:pl-2.5"
        >
          {/* Left accent bar on hover */}
          <span
            className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-0
                       bg-ember rounded-sm transition-all duration-250
                       group-hover:h-[60%]"
          />
          <span className="text-xl font-light tracking-[0.04em] text-cream max-w-[75%] leading-relaxed">
            {item.name}
          </span>
          <span className="flex-1 border-b border-dotted border-gold/20 mx-3 relative top-[-4px]" />
          <span className="font-display text-xl font-normal text-gold whitespace-nowrap tracking-[0.03em]">
            <span className="text-sm tracking-[0.1em] opacity-70 mr-0.5 font-body font-extralight">
              Rs.
            </span>
            {item.price}
          </span>
        </div>
      ))}
    </>
  );
}

/* ── Pizza ───────────────────────────────────────────────────────────────── */
function PizzaSection({ value }: { value: Record<string, MenuItem[]> }) {
  const sizes = Object.keys(value);
  const shortLabels = sizes.map((s) => s.match(/large|medium/i)?.[0] ?? s);

  // Build { pizzaName: { sizeLabel: price } }
  const pizzaMap = new Map<string, Record<string, number>>();
  const pizzaOrder: string[] = [];
  sizes.forEach((sizeLabel) => {
    value[sizeLabel].forEach((item) => {
      if (!pizzaMap.has(item.name)) {
        pizzaMap.set(item.name, {});
        pizzaOrder.push(item.name);
      }
      pizzaMap.get(item.name)![sizeLabel] = item.price;
    });
  });

  return (
    <>
      {pizzaOrder.map((pizzaName) => (
        <div
          key={pizzaName}
          className="group flex items-start justify-between py-3.5 border-b border-line
                     relative cursor-default transition-all duration-250
                     hover:pl-2.5"
        >
          <span
            className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-0
                       bg-ember rounded-sm transition-all duration-250
                       group-hover:h-[60%]"
          />
          <span className="text-xl font-light tracking-[0.04em] text-cream max-w-[75%] leading-relaxed">
            {pizzaName}
          </span>
          <span className="flex-1 border-b border-dotted border-gold/20 mx-3 relative top-[-4px]" />
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="flex gap-4.5 justify-end">
              {sizes.map((_, i) => (
                <span
                  key={i}
                  className="font-body text-[0.68rem] font-light tracking-[0.08em]
                             uppercase text-[#a08060] min-w-[52px] text-center"
                >
                  {shortLabels[i]}
                </span>
              ))}
            </div>
            <div className="flex gap-4.5 justify-end">
              {sizes.map((sizeLabel, i) => (
                <span
                  key={i}
                  className="font-display text-xl font-normal text-gold whitespace-nowrap
                             tracking-[0.03em] min-w-[52px] text-center"
                >
                  <span className="text-sm tracking-[0.1em] opacity-70 mr-0.5 font-body font-extralight">
                    Rs.
                  </span>
                  {pizzaMap.get(pizzaName)?.[sizeLabel] ?? '—'}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Momo ────────────────────────────────────────────────────────────────── */
function MomoSection({ value }: { value: Record<string, MenuItem[]> }) {
  return (
    <>
      {Object.entries(value).map(([protein, items]) => {
        const varieties = items.map((item) => ({
          label: item.name
            .replace(new RegExp(protein, 'i'), '')
            .replace(/momo/i, '')
            .trim(),
          price: item.price,
        }));

        return (
          <div key={protein}>
            {/* Sub-heading */}
            <h3 className="font-display italic text-[1.05rem] font-normal text-[#c8a060]
                           tracking-[0.06em] mt-4.5 mb-1.5 border-l-2 border-[#c8a060] pl-2.5">
              {protein}
            </h3>

            <div
              className="group flex items-start justify-between py-3.5 border-b border-line
                         relative cursor-default transition-all duration-250
                         hover:pl-2.5"
            >
              <span
                className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-0
                           bg-ember rounded-sm transition-all duration-250
                           group-hover:h-[60%]"
              />
              <span className="text-xl font-light tracking-[0.04em] text-cream max-w-[75%] leading-relaxed">
                {protein} Momo
              </span>
              <span className="flex-1 border-b border-dotted border-gold/20 mx-3 relative top-[-4px]" />
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <div className="flex gap-4.5 justify-end">
                  {varieties.map((v, i) => (
                    <span
                      key={i}
                      className="font-body text-[0.68rem] font-light tracking-[0.08em]
                                 uppercase text-[#a08060] min-w-[52px] text-center"
                    >
                      {v.label}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4.5 justify-end">
                  {varieties.map((v, i) => (
                    <span
                      key={i}
                      className="font-display text-xl font-normal text-gold whitespace-nowrap
                                 tracking-[0.03em] min-w-[52px] text-center"
                    >
                      <span className="text-sm tracking-[0.1em] opacity-70 mr-0.5 font-body font-extralight">
                        Rs.
                      </span>
                      {v.price}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ── Combos ──────────────────────────────────────────────────────────────── */
const HIGHLIGHT = ['pizza', 'hukka', 'wings', 'sekuwa'];

function ComboSection({ value }: { value: Record<string, MenuItem[]> }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 mt-2 max-[560px]:grid-cols-1">
      {Object.entries(value).flatMap(([sub, items]) =>
        items.map((item, i) => {
          const servesMatch = item.name.match(/for\s+(\d+)/i);
          const servesText = servesMatch ? `For ${servesMatch[1]}` : '';
          const parts = item.name
            .replace(/\+\s*Choice of [Dd]rink for \d+/i, '')
            .replace(/\+\s*Popcorn\/Chiura/i, '+ Popcorn / Chiura')
            .split(/\s*\+\s*/)
            .map((p: string) => p.trim())
            .filter(Boolean) as string[];

          return (
            <div
              key={`${sub}-${i}`}
              className={[
                'group bg-[rgba(28,21,18,0.7)] border border-line rounded-sm',
                'px-5 pt-6 pb-5 relative overflow-hidden flex flex-col',
                'transition-all duration-300',
                'hover:border-gold/30 hover:bg-[rgba(32,24,18,0.85)]',
                sub === 'Jumbo Combo' ? 'col-span-full' : '',
              ].join(' ')}
            >
              {/* Top gradient accent (shows on hover) */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember to-gold
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <h3 className="text-xl tracking-[0.38em] uppercase text-ember mb-4">
                {sub}
              </h3>

              <div className="flex flex-wrap gap-1.5 flex-1">
                {parts.map((part: string, j: number) => (
                  <span
                    key={j}
                    className={[
                      'text-[15px] font-light tracking-[0.03em] bg-white/[0.04]',
                      'border rounded-[1px] px-2.5 py-1 leading-relaxed whitespace-nowrap',
                      HIGHLIGHT.some((k) => part.toLowerCase().includes(k))
                        ? 'text-gold bg-gold/[0.07] border-gold/20'
                        : 'text-cream/75 border-gold/10',
                    ].join(' ')}
                  >
                    {part}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4.5 pt-3.5 border-t border-line">
                <span className="text-[10px] tracking-[0.18em] uppercase text-muted">
                  {servesText}
                </span>
                <div className="font-display text-2xl font-normal text-gold leading-none">
                  <span className="text-[11px] font-body font-extralight tracking-[0.1em] mr-0.5 opacity-65">
                    Rs.
                  </span>
                  {item.price}
                </div>
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}