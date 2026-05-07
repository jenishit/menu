import type { CategoryValue } from '../../../types';

interface Props {
  id: string;
  name: string;
  index: number;
  value: CategoryValue;
}

// ── Hukka data (hardcoded to match the sheesha menu design) ────────────────
const SHEESHA_ITEMS = [
  {
    name: 'Regular Sheesha',
    price: 'Rs. 500/-',
    description:
      'Served with regular chillum with coconut coil, and a variety of Aago Aroma special flavors.',
  },
  {
    name: 'Chilled Sheesha',
    price: 'Rs. 700/- (Launching soon)',
    description:
      'Served with iced pot with crushed ice, mint leaves, lemon and flavor of tea, coconut coil, ice pipe, and diverse Aago Aroma special flavours.',
  },
  {
    name: 'Aago Aromaa Premium Sheesha',
    price: 'Rs. 999/-',
    description:
      'Served with matching fruit-based chillum to its alternate flavors (pineapple, watermelon/ tea flavors/ crushed ice/ mint/ etc.) with crushed ice, coconut coil, iced pipe, and a range of special single/mix of any available flavors with free change of the coil.',
  },
];

const FLAVOURS_LEFT = ['Aago Love', 'Mint', 'Double Melon', 'Aago Special Mix'];

const FLAVOURS_RIGHT = ['Lady Killer', 'Eskimo Paan', 'Love 66', 'And Many More'];

export default function HukkaSection({ id }: Props) {
  return (
    <div
      id={id}
      className="relative mt-24 rounded-lg overflow-hidden min-h-125
                 bg-linear-to-br from-[#4a7c7e] via-[#2d5255] via-55% to-[#141f25]
                 pl-5 pr-5 py-9
                 md:pl-50 md:pr-10 md:py-12"
    >
      {/* Hookah image */}
      <div
        className="relative mx-auto mb-5 w-40
                   md:absolute md:left-[-5px] md:top-1/2 md:-translate-y-1/2
                   md:w-50 md:h-250 md:z-2 md:mb-0 md:mx-0
                   pointer-events-none md:drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      >
        <img
          src="/hookka.png"
          alt="Sheesha hookah"
          className="w-full h-full object-fill"
        />
      </div>

      {/* Content */}
      <div className="relative z-3">
        {/* Title */}
        <h2
          className="font-display text-[clamp(36px,6vw,54px)] font-bold text-white
                     uppercase tracking-[0.06em] mb-8 leading-tight
                     [text-shadow:2px_3px_8px_rgba(0,0,0,0.4)]
                     after:content-[''] after:block after:w-22.5 after:h-0.75
                     after:mt-3 after:bg-linear-to-r after:from-white/70 after:to-transparent
                     after:rounded-sm"
        >
          Sheesha Menu
        </h2>

        {/* Product listings */}
        <div className="flex flex-col gap-6 mb-9">
          {SHEESHA_ITEMS.map((item, i) => (
            <div
              key={i}
              className={[
                'pb-5',
                i < SHEESHA_ITEMS.length - 1
                  ? 'border-b border-white/10'
                  : '',
              ].join(' ')}
            >
              <h3 className="font-body text-[clamp(15px,2.5vw,19px)] font-bold text-white uppercase tracking-[0.04em] mb-1.5">
                {item.name}
                <span className="text-white/40 mx-1.5 font-light">|</span>
                <span className="text-white font-bold">{item.price}</span>
              </h3>
              <p className="font-body text-[13px] font-light text-white/65 leading-relaxed max-w-130 tracking-[0.01em]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Flavours */}
        <div
          className="bg-white/6 border border-white/10 rounded-md
                     px-5 py-5 md:px-8 md:py-7 mb-9 backdrop-blur-[6px]"
        >
          <h3 className="font-display text-[clamp(26px,4vw,36px)] font-bold text-white uppercase tracking-[0.06em] mb-4.5 leading-none">
            Flavours
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <ul className="list-none p-0 m-0">
              {FLAVOURS_LEFT.map((f, i) => (
                <li
                  key={i}
                  className="font-body text-[14.5px] font-normal text-white/88
                             py-1.5 pl-4 relative tracking-[0.01em]
                             before:content-['•'] before:absolute before:left-0
                             before:text-white/50 before:text-base"
                >
                  {f}
                </li>
              ))}
            </ul>
            <ul className="list-none p-0 m-0">
              {FLAVOURS_RIGHT.map((f, i) => (
                <li
                  key={i}
                  className="font-body text-[14.5px] font-normal text-white/88
                             py-1.5 pl-4 relative tracking-[0.01em]
                             before:content-['•'] before:absolute before:left-0
                             before:text-white/50 before:text-base"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-display text-[clamp(18px,3vw,24px)] font-bold italic text-white/85 leading-snug max-w-110 tracking-[0.01em]">
          Undoubtedly the finest sheesha experience you'll find in town.
        </p>
      </div>

      {/* Bottom accent gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-30 z-1 pointer-events-none
                   bg-linear-to-t from-[rgba(140,70,100,0.35)] via-[rgba(100,60,90,0.15)] via-40% to-transparent"
      />
    </div>
  );
}
