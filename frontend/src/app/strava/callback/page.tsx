'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function StravaCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(`Strava authorization was declined: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('Missing authorization code from Strava.');
      return;
    }

    const exchangeCode = async () => {
      try {
        await fetchWithAuth(`/strava/exchange-token?code=${encodeURIComponent(code)}`, {
          method: 'POST',
        });
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1800);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to exchange authorization token with Strava.');
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-md p-8 rounded-xl border border-[#eae8e4] bg-[#ffffff] text-center space-y-6 shadow-sm">
      {status === 'processing' && (
        <>
          <div className="w-12 h-12 rounded-full bg-[#f4f3ef] border border-[#eae8e4] text-[#c84b31] mx-auto flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1c1c1a]">Connecting Strava</h2>
            <p className="text-xs text-[#73726d] mt-1.5">Exchanging authorization tokens and securing athlete profile...</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1c1c1a]">Strava Account Linked</h2>
            <p className="text-xs text-[#73726d] mt-1.5">Redirecting to your training cockpit...</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1c1c1a]">Connection Could Not Be Completed</h2>
            <p className="text-xs text-rose-700 mt-2 leading-relaxed">{errorMessage}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1c1c1a] text-xs font-medium text-white hover:bg-[#333330] transition-colors"
          >
            Return to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-xs font-mono text-[#73726d]">
          Loading Strava callback...
        </div>
      }>
        <StravaCallbackContent />
      </Suspense>
    </div>
  );
}
