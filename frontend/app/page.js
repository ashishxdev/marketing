'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

// Animated Background
function AnimatedBg() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="orb-animate absolute w-[600px] h-[600px] rounded-full bg-purple-600 -top-48 -left-24 blur-[100px] opacity-15" />
      <div className="orb-animate-2 absolute w-[500px] h-[500px] rounded-full bg-cyan-400 -bottom-36 -right-24 blur-[100px] opacity-15" />
      <div className="orb-animate-3 absolute w-[400px] h-[400px] rounded-full bg-violet-500 top-1/2 left-1/2 blur-[100px] opacity-10" />
      {/* Grid */}
      <div className="absolute inset-0"
        style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}}
      />
    </div>
  );
}

// Mock dashboard preview
function MockDashboard() {
  const bars = [45, 60, 38, 75, 55, 90, 68];
  return (
    <div className="dash-float w-[520px] max-w-full">
      <div className="bg-[#0d0f1a] border border-white/8 rounded-3xl overflow-hidden shadow-2xl" style={{boxShadow:'0 25px 80px rgba(0,0,0,0.5), 0 0 80px rgba(124,106,247,0.12)'}}>
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-4 bg-white/3 border-b border-white/8">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-white/25 font-semibold">AdPulse AI Dashboard</span>
        </div>
        <div className="p-5">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[['$4,820','SPEND','text-purple-400'],['4.2%','CTR','text-green-400'],['12','CAMPAIGNS','text-cyan-400']].map(([v,l,c]) => (
              <div key={l} className="p-3 rounded-xl bg-white/4 border border-white/8">
                <div className={`text-xl font-black ${c}`}>{v}</div>
                <div className="text-[10px] text-white/30 mt-0.5 font-semibold tracking-wider">{l}</div>
              </div>
            ))}
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-20 mb-4">
            {bars.map((h, i) => (
              <div key={i} className="bar-grow flex-1 rounded-t-md" style={{height:`${h}%`,background:'linear-gradient(to top,#7c6af7,#00d4ff)',animationDelay:`${i*0.1}s`}} />
            ))}
          </div>
          {/* AI cards */}
          <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3 mb-2">
            <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">🏆 AI Report — Today</div>
            <div className="text-[11px] text-white/50">Summer Sale campaign — 8.4% CTR. Scale budget by 30%</div>
          </div>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">⚠️ Needs Attention</div>
            <div className="text-[11px] text-white/50">Brand Awareness has high CPC ($8.20) — pause or refresh creatives</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature card
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="group relative p-8 rounded-2xl bg-white/4 border border-white/8 transition-all duration-500 hover:-translate-y-1.5 hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(124,106,247,0.15)] overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background:'linear-gradient(135deg,rgba(124,106,247,0.08),rgba(0,212,255,0.04))'}} />
      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 ${color}`}>{icon}</div>
      <h3 className="relative text-lg font-bold text-white mb-3">{title}</h3>
      <p className="relative text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

// Step card
function StepCard({ number, title, desc }) {
  return (
    <div className="text-center p-10 bg-white/4 border border-white/8 rounded-2xl">
      <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-black text-white"
        style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)',boxShadow:'0 8px 24px rgba(124,106,247,0.4)'}}>
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#07080d] text-white overflow-x-hidden">
      <AnimatedBg />

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-10 h-[70px] bg-[#07080d]/80 backdrop-blur-xl border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>⚡</div>
          <span className="text-lg font-black">AdPulse <span className="gradient-text">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <a href="#features" className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all">Features</a>
          <a href="#how-it-works" className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all">How it works</a>
          <Link href="/privacy" className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all">Privacy</Link>
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all">Sign In</Link>
          <Link href="/login?mode=signup" className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,106,247,0.5)]" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-20 pt-[120px] pb-20 z-10">
        <div className="max-w-[680px]">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold tracking-wide mb-8">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            AI-Powered Marketing Intelligence
          </div>
          <h1 className="text-[clamp(2.8rem,5vw,5rem)] font-black leading-[1.1] tracking-tight mb-6">
            Know Exactly<br/>
            Which Ads<br/>
            <span className="gradient-text">Are Working.</span>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-[540px]">
            AdPulse AI connects to your Meta & Google Ads and delivers daily AI-powered reports — 
            tailored to your business, in plain English. Stop guessing. Start scaling.
          </p>
          <div className="flex gap-4 flex-wrap mb-16">
            <Link href="/login?mode=signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,106,247,0.5)]" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)',boxShadow:'0 4px 20px rgba(124,106,247,0.35)'}}>
              🚀 Start Free Trial
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/8 transition-all">
              See How It Works
            </a>
          </div>
          {/* Stats */}
          <div className="flex gap-10 pt-10 border-t border-white/8 flex-wrap">
            {[['10x','Faster Analysis'],['2','Platforms Supported'],['24/7','AI Monitoring']].map(([v,l]) => (
              <div key={l}>
                <div className="text-3xl font-black gradient-text">{v}</div>
                <div className="text-xs text-white/35 font-medium mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Visual */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden xl:block">
          <MockDashboard />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 px-20 py-28">
        <div className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-[0.15em] gradient-text mb-4">Why AdPulse AI</div>
          <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-black tracking-tight mb-4">
            Everything you need to<br/><span className="gradient-text">dominate your ads</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">From connection to insights in minutes. No manual work. No spreadsheets.</p>
        </div>
        <div className="grid grid-cols-3 gap-5 reveal">
          <FeatureCard icon="🎯" title="Smart Daily Analysis" color="bg-purple-500/15" desc="Gemini AI analyzes every campaign every morning. Know your winners, losers, and what to do next — before you even have your coffee." />
          <FeatureCard icon="📊" title="Beautiful Charts & Graphs" color="bg-cyan-500/15" desc="Spend trends, CTR over time, campaign comparisons — all visualized in clean, interactive charts for both Meta and Google Ads." />
          <FeatureCard icon="🤖" title="Context-Aware Reports" color="bg-green-500/15" desc="Tell us what your business does — AdPulse AI tailors every insight to your industry and goals. Not generic advice." />
          <FeatureCard icon="⚡" title="Meta & Google Ads" color="bg-orange-500/15" desc="Connect Facebook/Instagram ads and Google Ads in one click. Get unified reporting or drill into each platform separately." />
          <FeatureCard icon="📅" title="Weekly Deep Dives" color="bg-red-500/15" desc="Every Monday, get a 7-day performance summary with trend analysis and strategic recommendations for the week ahead." />
          <FeatureCard icon="🚀" title="Scaling Opportunities" color="bg-violet-500/15" desc="AI identifies campaigns ready to scale, wasted budgets, and creative fatigue — so you always know where to put your money." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 px-20 pb-28">
        <div className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-[0.15em] gradient-text mb-4">Simple Setup</div>
          <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-black tracking-tight mb-4">
            Up and running in<br/><span className="gradient-text">3 easy steps</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">No technical knowledge required. Connect, describe, and let AI do the rest.</p>
        </div>
        <div className="grid grid-cols-3 gap-6 reveal">
          <StepCard number="1" title="Create Your Account" desc="Sign up with your work email. Tell us your company name and what your business does in a few sentences — that's all we need to personalize your reports." />
          <StepCard number="2" title="Connect Your Ad Accounts" desc="Link your Meta Business and/or Google Ads with one click. We securely store your credentials and sync your campaign data immediately." />
          <StepCard number="3" title="Get AI Insights Daily" desc="Every day at 9 AM, AdPulse AI analyzes all your campaigns and shows exactly what's working, what's wasting money, and what to do next." />
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-20 pb-20">
        <div className="reveal bg-white/4 border border-white/8 rounded-3xl p-14 flex items-center justify-around gap-10 flex-wrap">
          {[['20+','Hours saved per week'],['2x','Faster decision making'],['100%','Tailored to your business'],['Daily','Fresh AI reports']].map(([v,l], i) => (
            <>
              {i > 0 && <div key={`d${i}`} className="w-px h-14 bg-white/8 hidden md:block" />}
              <div key={v} className="text-center">
                <div className="text-5xl font-black gradient-text">{v}</div>
                <div className="text-xs text-white/35 font-medium mt-2">{l}</div>
              </div>
            </>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-20 mb-20">
        <div className="reveal relative overflow-hidden text-center rounded-3xl border border-purple-500/30 py-20 px-8" style={{background:'linear-gradient(135deg,rgba(124,106,247,0.12),rgba(0,212,255,0.06))'}}>
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at center,rgba(124,106,247,0.12) 0%,transparent 70%)'}} />
          <div className="relative z-10">
            <div className="text-xs font-bold uppercase tracking-[0.15em] gradient-text mb-4">Start Today</div>
            <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-black tracking-tight mb-4">
              Ready to stop wasting<br/><span className="gradient-text">ad budget?</span>
            </h2>
            <p className="text-white/50 text-lg max-w-md mx-auto mb-10">
              Join companies already using AdPulse AI to make smarter ad decisions every single day.
            </p>
            <Link href="/login?mode=signup" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold text-white hover:-translate-y-0.5 transition-all hover:shadow-[0_8px_40px_rgba(124,106,247,0.5)]" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)',boxShadow:'0 4px 20px rgba(124,106,247,0.35)'}}>
              🚀 Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/8 px-20 py-10 flex items-center justify-between text-sm text-white/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>⚡</div>
          <span className="font-bold text-white/60">AdPulse AI</span>
        </div>
        <span>© 2025 AdPulse AI. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
          <Link href="/login?mode=signup" className="hover:text-white/60 transition-colors">Get Started</Link>
        </div>
      </footer>
    </div>
  );
}
