import type { ReactNode } from 'react';

export default function ModalShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-gold/20 p-8 w-full max-w-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ember/60 via-gold/40 to-transparent" />
      {children}
    </div>
  );
}
