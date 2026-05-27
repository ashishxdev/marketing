'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function AnimatedBg() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="orb-animate absolute w-[500px] h-[500px] rounded-full bg-purple-600 -top-48 -left-24 blur-[100px] opacity-15" />
      <div className="orb-animate-2 absolute w-[400px] h-[400px] rounded-full bg-cyan-400 -bottom-36 -right-24 blur-[100px] opacity-15" />
      <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
    </div>
  );
}

function InputField({ label, id, type = 'text', placeholder, value, onChange, required }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-white/50">{label}</label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 transition-all focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 focus:shadow-[0_0_0_3px_rgba(124,106,247,0.15)] w-full"
      />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', companyName: '', description: '' });

  useEffect(() => {
    // If already logged in, redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError('Please enter your company name'); return; }
    setLoading(true); setError('');
    try {
      // 1. Create auth user
      const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authErr) throw authErr;

      // 2. Create company row via backend
      const session = data.session;
      if (session) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/company`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ company_name: form.companyName, company_description: form.description }),
        });
        if (!res.ok) throw new Error('Failed to create company profile');
        router.push('/dashboard');
      } else {
        setError('Account created! Please check your email to confirm, then sign in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-6 relative">
      <AnimatedBg />
      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>⚡</div>
            <h1 className="text-2xl font-black text-white">AdPulse <span className="gradient-text">AI</span></h1>
            <p className="text-sm text-white/40">{mode === 'login' ? 'Welcome back 👋' : 'Start your free trial'}</p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/4 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-7">
            {[['login','Sign In'],['signup','Sign Up']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                style={mode === m ? {background:'linear-gradient(135deg,#7c6af7,#00d4ff)'} : {}}>
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Forms */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <InputField id="email" label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              <InputField id="password" label="Password" type="password" placeholder="Your password" value={form.password} onChange={set('password')} required />
              <button type="submit" disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,106,247,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
                {loading ? <span className="spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full inline-block" /> : '🔑 Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <InputField id="companyName" label="Company Name" placeholder="Acme Inc." value={form.companyName} onChange={set('companyName')} required />
              <InputField id="signupEmail" label="Work Email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              <InputField id="signupPassword" label="Password" type="password" placeholder="Create a strong password" value={form.password} onChange={set('password')} required />
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-medium text-white/50">
                  What does your company do? <span className="text-white/25">(helps AI tailor reports)</span>
                </label>
                <textarea id="description" rows={3} placeholder="e.g. We sell handmade skincare products targeting women aged 25-40 in the US..."
                  value={form.description} onChange={set('description')}
                  className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 focus:shadow-[0_0_0_3px_rgba(124,106,247,0.15)] transition-all"
                />
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,106,247,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
                {loading ? <span className="spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full inline-block" /> : '🚀 Create Account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 text-white/20 text-xs">
            <div className="flex-1 h-px bg-white/8" />
            <span>secure & encrypted</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <p className="text-center text-xs text-white/30">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
        <p className="text-center text-xs text-white/20 mt-6">
          By signing up you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080d] flex items-center justify-center"><div className="spin w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
