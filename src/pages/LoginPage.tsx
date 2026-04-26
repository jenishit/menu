import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // If already signed in, redirect to admin
  useEffect(() => {
    if (user) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation is handled by the useEffect watching `user` above.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Incorrect email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        default:
          setError('Sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">

      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow */}
      <div className="fixed pointer-events-none z-0"
        style={{
          top: '-30vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '60vh',
          background: 'radial-gradient(ellipse at center, rgba(212,98,42,.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] uppercase text-ember mb-4">Admin Portal</p>
          <h1 className="font-display text-6xl font-light text-cream leading-none">
            <em className="italic text-gold">Aago</em> Aroma
          </h1>
          <div className="flex items-center justify-center gap-4 mt-5">
            <span className="block h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
            <span className="text-gold/40 text-xs">✦</span>
            <span className="block h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-gold/15 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ember/60 via-gold/60 to-transparent" />

          <p className="text-[10px] tracking-[0.35em] uppercase text-muted mb-8">Sign In</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@aagoaroma.com"
                className="w-full mt-2 bg-bg border border-gold/20 text-cream text-sm font-light
                           px-4 py-3 placeholder-muted/50 tracking-wide
                           focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-2 bg-bg border border-gold/20 text-cream text-sm font-light
                           px-4 py-3 placeholder-muted/50 tracking-wide
                           focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs tracking-wide">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-ember text-cream py-3 text-xs tracking-[0.3em] uppercase
                         hover:bg-ember/85 transition-colors
                         disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Back */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="text-[10px] tracking-[0.25em] uppercase text-muted/50 hover:text-muted"
          >
            ← Back to Menu
          </Link>
        </div>

      </div>
    </div>
  );
}