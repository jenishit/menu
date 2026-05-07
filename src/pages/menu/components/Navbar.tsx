import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface NavbarProps {
  categories: string[];
}

function toCategoryId(name: string) {
  return `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

export default function Navbar({ categories }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    function measure() {
      const h = navRef.current?.offsetHeight ?? 0;
      if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
      setScrolled(window.scrollY > h * 0.4);
    }
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <>
      <header
        ref={navRef}
        className={[
          'fixed top-0 left-0 right-0 z-100 flex items-center justify-center',
          'text-center transition-all duration-500 ease-in-out',
          scrolled
            ? 'flex-row justify-start py-2.5 px-8 bg-[rgba(17,13,11,0.92)] backdrop-blur-[14px] border-b border-line gap-4'
            : 'flex-col py-10 px-6 pb-12 bg-transparent border-b border-transparent',
        ].join(' ')}
      >
        {/* Logo */}
        <img
          src="/Light-Logo.png"
          alt="Aago Aroma"
          className={[
            'object-contain shrink-0 drop-shadow-[0_0_10px_rgba(212,98,42,0.35)] transition-all duration-500',
            scrolled ? 'w-[52px] mb-0' : 'w-[220px] mb-4',
          ].join(' ')}
        />

        {/* Content wrapper */}
        <div
          className={[
            'flex',
            scrolled
              ? 'flex-1 flex-row items-center justify-between gap-5'
              : 'flex-col items-center',
          ].join(' ')}
        >
          {/* Title block */}
          <div className={scrolled ? '' : 'flex flex-col items-center'}>
            {/* Flame bar (hidden when scrolled) */}
            <div
              className={[
                'flex justify-center items-center gap-3.5 transition-all duration-300',
                scrolled
                  ? 'opacity-0 max-h-0 m-0 pointer-events-none'
                  : 'opacity-100 max-h-[30px] mb-3.5',
              ].join(' ')}
            >
              <span className="block h-px w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <span className="block h-px w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>

            {/* Title */}
            <h1
              className={[
                'font-display font-light tracking-[0.08em] leading-none text-cream transition-all duration-500',
                scrolled ? 'text-2xl' : 'text-[clamp(48px,9vw,88px)]',
              ].join(' ')}
            >
              <em className="italic text-gold">Aago</em> Aroma
            </h1>

            {/* Tagline */}
            <p
              className={[
                'uppercase text-muted transition-all duration-400',
                scrolled
                  ? 'text-[8px] tracking-[0.22em] mt-0.5'
                  : 'text-[11px] tracking-[0.35em] mt-2.5',
              ].join(' ')}
            >
              Where Fire Crafts Flavor
            </p>
          </div>

          {/* Category nav links */}
          {categories.length > 0 && (
            <nav
              aria-label="Menu sections"
              className={[
                'flex flex-wrap gap-2',
                scrolled
                  ? 'mt-0 justify-end max-w-[calc(100vw-220px)] max-[880px]:hidden'
                  : 'mt-3.5 justify-center max-w-[min(920px,calc(100vw-64px))]',
              ].join(' ')}
            >
              {categories.map((category) => (
                <a
                  key={category}
                  href={`#${toCategoryId(category)}`}
                  className="text-[10px] tracking-[0.13em] uppercase text-cream/70
                             no-underline border border-gold/20 bg-white/[0.03]
                             px-2.5 py-1.5 transition-colors duration-250
                             hover:text-gold hover:border-gold/55 hover:bg-gold/[0.08]
                             focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-1"
                >
                  {category}
                </a>
              ))}
            </nav>
          )}

          {/* Auth link */}
          <div
            className={[
              'flex justify-center',
              scrolled ? 'mt-0 max-[880px]:ml-auto' : 'mt-3',
            ].join(' ')}
          >
            <Link
              to={user ? '/admin' : '/login'}
              className="text-[10px] tracking-[0.2em] uppercase no-underline text-gold
                         border border-gold/45 bg-gold/[0.06] px-2.5 py-[7px]
                         transition-colors duration-250
                         hover:text-cream hover:border-gold/75 hover:bg-gold/15
                         focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-1"
            >
              {user ? 'Admin Panel' : 'Login'}
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from jumping under fixed navbar */}
      <div ref={spacerRef} />
    </>
  );
}