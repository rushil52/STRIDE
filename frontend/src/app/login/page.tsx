'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { setStoredToken, formatErrorMessage } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister 
        ? { email, password, full_name: fullName.trim() || undefined } 
        : { email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText = formatErrorMessage(data?.detail || data || 'Authentication failed');
        throw new Error(errorText);
      }

      if (isRegister) {
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json().catch(() => null);
        if (!loginRes.ok) {
          throw new Error(formatErrorMessage(loginData?.detail || 'Account created but automatic login failed. Please sign in.'));
        }
        setStoredToken(loginData.access_token);
      } else {
        setStoredToken(data.access_token);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-xl border border-[#eae8e4] bg-[#ffffff] shadow-sm">
      <div className="flex border-b border-[#eae8e4] mb-6">
        <button
          type="button"
          onClick={() => { setIsRegister(false); setError(null); }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            !isRegister ? 'border-[#c84b31] text-[#1c1c1a]' : 'border-transparent text-[#73726d] hover:text-[#1c1c1a]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsRegister(true); setError(null); }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            isRegister ? 'border-[#c84b31] text-[#1c1c1a]' : 'border-transparent text-[#73726d] hover:text-[#1c1c1a]'
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed break-words">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Full Name (Optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Eliud Kipchoge"
              className="w-full px-3.5 py-2.5 rounded bg-[#ffffff] border border-[#eae8e4] text-[#1c1c1a] placeholder-[#bfbab0] text-sm focus:outline-none focus:border-[#c84b31] transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@domain.com"
            className="w-full px-3.5 py-2.5 rounded bg-[#ffffff] border border-[#eae8e4] text-[#1c1c1a] placeholder-[#bfbab0] text-sm focus:outline-none focus:border-[#c84b31] transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Password (Min 6 Characters)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 rounded bg-[#ffffff] border border-[#eae8e4] text-[#1c1c1a] placeholder-[#bfbab0] text-sm focus:outline-none focus:border-[#c84b31] transition-colors"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded bg-[#c84b31] text-white font-medium text-sm hover:bg-[#b03e26] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {isRegister ? 'Register & Enter STRIDE' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#eae8e4] text-center text-xs text-[#73726d]">
        Enter your athlete credentials to open your training dashboard.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col justify-center items-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <span className="text-2xl font-bold font-serif tracking-tight text-[#1c1c1a]">STRIDE</span>
        <span className="text-xs font-mono uppercase tracking-wider text-[#c84b31] font-semibold">Running</span>
      </Link>

      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-xl border border-[#eae8e4] bg-[#ffffff] text-center text-[#73726d] font-mono text-xs">
          Loading authentication interface...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
