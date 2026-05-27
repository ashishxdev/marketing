'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/* ─────────────────────────────────────── 
   HELPER COMPONENTS 
   ───────────────────────────────────────*/

function Spinner({ size = 5 }) {
  return <span className={`spin inline-block w-${size} h-${size} border-2 border-white/15 border-t-purple-500 rounded-full`} />;
}

function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function Badge({ type, children }) {
  const styles = {
    green:  'bg-green-500/15 border-green-500/30 text-green-400',
    red:    'bg-red-500/15 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    cyan:   'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    orange: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    gray:   'bg-white/5 border-white/10 text-white/40',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[type] || styles.gray}`}>
      {children}
    </span>
  );
}

function KpiCard({ icon, label, value, change, changeType, gradient, loading }) {
  return (
    <div className="p-6 rounded-2xl bg-white/4 border border-white/8 flex flex-col gap-3 hover:border-white/15 transition-all">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${gradient}`}>{icon}</div>
        {change && (
          <span className={`text-xs font-semibold ${changeType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {changeType === 'up' ? '▲' : '▼'} {change}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-16" />
        </>
      ) : (
        <>
          <div className="text-3xl font-black tracking-tight text-white">{value ?? '—'}</div>
          <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</div>
        </>
      )}
    </div>
  );
}

const CHART_COLORS = { meta: '#7c6af7', google: '#00d4ff' };
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0f1a] border border-white/15 rounded-xl px-4 py-3 text-xs shadow-xl">
      <div className="text-white/50 mb-2 font-semibold">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}: </span>
          <span className="text-white font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────── 
   TAB: OVERVIEW 
   ───────────────────────────────────────*/
function OverviewTab({ token, company, status }) {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getCampaigns(token, 'meta', 'daily').catch(() => []),
      api.getCampaigns(token, 'google', 'daily').catch(() => []),
    ]).then(([meta, google]) => {
      const all = [...(meta || []), ...(google || [])];
      const totalSpend   = all.reduce((s, c) => s + (+c.spend || 0), 0);
      const totalImpr    = all.reduce((s, c) => s + (+c.impressions || 0), 0);
      const totalClicks  = all.reduce((s, c) => s + (+c.clicks || 0), 0);
      const avgCtr       = totalImpr ? (totalClicks / totalImpr) * 100 : 0;
      setKpis({ totalSpend, totalImpr, totalClicks, avgCtr });

      // Build 7-day chart from snapshots (group by date)
      const byDate = {};
      all.forEach(c => {
        const d = c.snapshot_date || c.date_start || 'Today';
        if (!byDate[d]) byDate[d] = { date: d, spend: 0, clicks: 0, impressions: 0 };
        byDate[d].spend      += +c.spend || 0;
        byDate[d].clicks     += +c.clicks || 0;
        byDate[d].impressions += +c.impressions || 0;
      });
      // Calculate real CTR percentage for each date
      Object.keys(byDate).forEach(d => {
        const impr = byDate[d].impressions;
        byDate[d].ctr = impr ? (byDate[d].clicks / impr) * 100 : 0;
      });
      setChartData(Object.values(byDate).slice(-7));
      setLoading(false);
    });
  }, [token]);

  const fmt = (n, prefix = '') => n >= 1000 ? `${prefix}${(n/1000).toFixed(1)}K` : `${prefix}${n?.toFixed ? n.toFixed(2) : n}`;

  return (
    <div className="fade-in-up flex flex-col gap-6">
      {/* Welcome */}
      <div className="p-6 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/8 to-cyan-500/4">
        <h2 className="text-xl font-bold text-white mb-1">Welcome back, <span className="gradient-text">{company?.company_name || 'there'}</span> 👋</h2>
        <p className="text-sm text-white/45">{company?.company_description || 'Set up your company description in Settings for tailored AI reports.'}</p>
        <div className="flex gap-2 mt-4">
          {status?.meta    ? <Badge type="purple">✅ Meta Connected</Badge>  : <Badge type="gray">⚠️ Meta Not Connected</Badge>}
          {status?.google  ? <Badge type="cyan">✅ Google Connected</Badge> : <Badge type="gray">⚠️ Google Not Connected</Badge>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard loading={loading} icon="💸" label="Total Spend" value={kpis ? `$${fmt(kpis.totalSpend)}` : null} gradient="bg-purple-500/15" />
        <KpiCard loading={loading} icon="👁️" label="Impressions"  value={kpis ? fmt(kpis.totalImpr) : null}  gradient="bg-cyan-500/15" />
        <KpiCard loading={loading} icon="🖱️" label="Total Clicks" value={kpis ? fmt(kpis.totalClicks) : null} gradient="bg-green-500/15" />
        <KpiCard loading={loading} icon="📊" label="Avg CTR"      value={kpis ? `${kpis.avgCtr.toFixed(2)}%` : null} gradient="bg-orange-500/15" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 p-6 rounded-2xl bg-white/4 border border-white/8">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">Spend Over Last 7 Days</div>
          {loading ? <Skeleton className="h-48" /> : (
            chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-white/25 gap-2">
                <span className="text-3xl">📊</span>
                <span className="text-sm">No data yet — run the daily cron or connect an ad account</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="spend" name="Spend ($)" stroke="#7c6af7" strokeWidth={2.5} dot={{ fill: '#7c6af7', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          )}
        </div>
        <div className="p-6 rounded-2xl bg-white/4 border border-white/8">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">Click-Through Rate</div>
          {loading ? <Skeleton className="h-48" /> : (
            chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-white/25 gap-2">
                <span className="text-2xl">📈</span>
                <span className="text-xs text-center">No CTR data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ctr" name="CTR (%)" fill="#00d4ff" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 
   TAB: ADS (Meta or Google) 
   ───────────────────────────────────────*/
function AdsTab({ token, platform, status, companyId }) {
  const [period, setPeriod] = useState('daily');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMeta = platform === 'meta';
  const isConnected = status?.[platform];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchData = useCallback(async () => {
    if (!token || !isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.getCampaigns(token, platform, period);
      setCampaigns(data || []);
    } catch { setCampaigns([]); }
    setLoading(false);
  }, [token, platform, period, isConnected]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConnect = () => {
    const route = isMeta ? '/login' : '/google-login';
    window.location.href = `${API_URL}${route}?company_id=${companyId}`;
  };

  const total = (key) => campaigns.reduce((s, c) => s + (+c[key] || 0), 0);
  const avgCtr = campaigns.length ? (total('ctr') / campaigns.length).toFixed(2) : '0.00';

  // Chart data
  const chartData = campaigns.slice(0, 8).map(c => ({
    name: (c.campaign_name || c.name || 'Campaign').slice(0, 14),
    spend: +c.spend || 0,
    ctr: +c.ctr || 0,
    clicks: +c.clicks || 0,
  }));

  return (
    <div className="fade-in-up flex flex-col gap-6">
      {/* Connect card */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between gap-4 ${isConnected ? 'border-green-500/25 bg-green-500/5' : 'border-white/8 bg-white/3'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isMeta ? 'bg-blue-500/15' : 'bg-red-500/15'}`}>
            {isMeta ? '📘' : '🎯'}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{isMeta ? 'Meta Ads' : 'Google Ads'}</h3>
            <p className="text-sm text-white/40">{isConnected ? '✅ Account connected and syncing' : `Connect your ${isMeta ? 'Facebook/Instagram' : 'Google'} Ads account`}</p>
          </div>
        </div>
        {!isConnected && (
          <button onClick={handleConnect}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-[0_4px_20px_rgba(124,106,247,0.4)] transition-all"
            style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
            {isMeta ? '🔗 Connect Meta' : '🔗 Connect Google'}
          </button>
        )}
        {isConnected && <Badge type="green">● Live</Badge>}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-3">
          <span className="text-5xl">{isMeta ? '📘' : '🎯'}</span>
          <p className="text-lg font-semibold text-white/40">Connect your {isMeta ? 'Meta' : 'Google'} Ads account to see campaigns</p>
          <p className="text-sm">Click the button above to get started</p>
        </div>
      ) : (
        <>
          {/* Period toggle + KPIs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 p-1.5 bg-white/4 border border-white/8 rounded-xl w-fit">
              {['daily','weekly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${period === p ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  style={period === p ? {background:'linear-gradient(135deg,#7c6af7,#00d4ff)'} : {}}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-purple-500/40 transition-all" title="Refresh">
              🔄
            </button>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-4 gap-3">
            {[
              ['💸','Spend',`$${total('spend').toFixed(2)}`, 'bg-purple-500/15'],
              ['👁️','Impressions',total('impressions').toLocaleString(), 'bg-cyan-500/15'],
              ['🖱️','Clicks',total('clicks').toLocaleString(), 'bg-green-500/15'],
              ['📊','Avg CTR',`${avgCtr}%`, 'bg-orange-500/15'],
            ].map(([icon,label,val,grad]) => (
              <div key={label} className="p-4 rounded-xl bg-white/4 border border-white/8 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${grad}`}>{icon}</div>
                <div>
                  {loading ? <Skeleton className="h-5 w-16 mb-1" /> : <div className="font-bold text-white text-sm">{val}</div>}
                  <div className="text-[10px] text-white/30 uppercase tracking-widest">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="p-6 rounded-2xl bg-white/4 border border-white/8">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">Campaign Spend Breakdown</div>
            {loading ? <Skeleton className="h-44" /> : (
              chartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-white/25 text-sm">No campaign data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="spend" name="Spend ($)" fill={CHART_COLORS[platform]} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>

          {/* Campaign table */}
          <div className="rounded-2xl overflow-hidden border border-white/8">
            <div className="px-6 py-4 bg-white/3 border-b border-white/8 flex items-center justify-between">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Campaigns ({campaigns.length})</span>
            </div>
            {loading ? (
              <div className="p-6 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-10 text-center text-white/25 text-sm">No campaigns found for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      {['Campaign','Spend','Impressions','Clicks','CTR','CPC','Status'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const ctr = +c.ctr || 0;
                      const isGood = ctr > 2;
                      return (
                        <tr key={i} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                          <td className="px-5 py-4 font-medium text-white max-w-[200px] truncate">{c.campaign_name || c.name || '—'}</td>
                          <td className="px-5 py-4 text-white/60">${(+c.spend || 0).toFixed(2)}</td>
                          <td className="px-5 py-4 text-white/60">{(+c.impressions || 0).toLocaleString()}</td>
                          <td className="px-5 py-4 text-white/60">{(+c.clicks || 0).toLocaleString()}</td>
                          <td className="px-5 py-4 text-white/60">{ctr.toFixed(2)}%</td>
                          <td className="px-5 py-4 text-white/60">${(+c.cpc || 0).toFixed(2)}</td>
                          <td className="px-5 py-4">
                            <Badge type={isGood ? 'green' : 'orange'}>{isGood ? '🏆 Winning' : '⚠️ Monitor'}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── 
   TAB: AI REPORTS 
   ───────────────────────────────────────*/
function ReportItem({ dot, text }) {
  const colors = { green: 'bg-green-400', red: 'bg-red-400', blue: 'bg-blue-400', orange: 'bg-orange-400' };
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/4 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[dot] || 'bg-white/30'}`} />
      <p className="text-sm text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function ReportCard({ report }) {
  const [open, setOpen] = useState(false);
  const r = report.report_json;
  const date = new Date(report.created_at).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  const time = new Date(report.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden hover:border-white/15 transition-all">
      <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/3 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${report.platform === 'meta' ? 'bg-blue-500/15' : report.platform === 'google' ? 'bg-red-500/15' : 'bg-purple-500/15'}`}>
            {report.platform === 'meta' ? '📘' : report.platform === 'google' ? '🎯' : '🤖'}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{date} at {time}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge type={report.platform === 'meta' ? 'purple' : 'cyan'}>{report.platform?.toUpperCase()}</Badge>
              <Badge type={report.period === 'daily' ? 'gray' : 'orange'}>{report.period?.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
        <span className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && r && (
        <div className="px-6 pb-6 border-t border-white/6 pt-4 fade-in-up">
          <div className="grid grid-cols-2 gap-4">
            {/* Winners */}
            {r.winners?.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15">
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">🏆 Top Performers</div>
                {r.winners.map((w, i) => (
                  <ReportItem key={i} dot="green" text={typeof w === 'string' ? w : `${w.campaign} — ${w.reason}`} />
                ))}
              </div>
            )}
            {/* Losers */}
            {r.losers?.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">❌ Underperformers</div>
                {r.losers.map((l, i) => (
                  <ReportItem key={i} dot="red" text={typeof l === 'string' ? l : `${l.campaign} — ${l.reason}`} />
                ))}
              </div>
            )}
            {/* Recommendations */}
            {r.recommendations?.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">📈 Recommendations</div>
                {r.recommendations.map((rec, i) => (
                  <ReportItem key={i} dot="blue" text={rec} />
                ))}
              </div>
            )}
            {/* Scaling */}
            {r.scaling_opportunities?.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">🚀 Scaling Opportunities</div>
                {r.scaling_opportunities.map((s, i) => (
                  <ReportItem key={i} dot="orange" text={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!token) return;
    api.getReports(token, 'all').then(data => {
      setReports(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const filtered = filter === 'all' ? reports : reports.filter(r => 
    r.platform === filter || 
    r.period === filter
  );

  return (
    <div className="fade-in-up flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Reports</h2>
          <p className="text-sm text-white/40 mt-1">Daily & weekly Gemini AI analysis of your campaigns</p>
        </div>
        <div className="flex gap-1 p-1.5 bg-white/4 border border-white/8 rounded-xl">
          {[['all','All'],['meta','Meta'],['google','Google'],['daily','Daily'],['weekly','Weekly']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === v ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={filter === v ? {background:'linear-gradient(135deg,#7c6af7,#00d4ff)'} : {}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-3">
          <span className="text-5xl">🤖</span>
          <p className="text-lg font-semibold text-white/40">No AI reports yet</p>
          <p className="text-sm">Reports are generated daily at 9 AM and weekly on Mondays</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── 
   TAB: SETTINGS 
   ───────────────────────────────────────*/
function SettingsTab({ token, company, onUpdate, status, companyId }) {
  const [form, setForm] = useState({ company_name: company?.company_name || '', company_description: company?.company_description || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (company) setForm({ company_name: company.company_name || '', company_description: company.company_description || '' });
  }, [company]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCompany(token, form);
      onUpdate(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleConnect = (platform) => {
    const route = platform === 'meta' ? '/login' : '/google-login';
    window.location.href = `${API_URL}${route}?company_id=${companyId}`;
  };

  return (
    <div className="fade-in-up flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-white/40 mt-1">Manage your company profile and connected accounts</p>
      </div>

      {/* Company Profile */}
      <div className="p-6 rounded-2xl bg-white/4 border border-white/8">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">🏢 Company Profile</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">Company Name</label>
            <input value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))}
              placeholder="Your company name"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">
              What does your company do? <span className="text-white/20 normal-case">(AI uses this to tailor your reports)</span>
            </label>
            <textarea rows={4} value={form.company_description} onChange={e => setForm(f => ({...f, company_description: e.target.value}))}
              placeholder="e.g. We sell handmade skincare products targeting women aged 25-40 in the US. Our main goal is brand awareness and driving conversions on our Shopify store..."
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all" />
            <p className="text-xs text-white/25 mt-2">💡 More detail = better AI analysis. Tell us your industry, target audience, and goals.</p>
          </div>
          <button type="submit" disabled={saving}
            className="self-start px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-[0_4px_20px_rgba(124,106,247,0.4)] disabled:opacity-60"
            style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
            {saving ? <span className="flex items-center gap-2"><Spinner size={4} /> Saving...</span> : saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </form>
      </div>

      {/* Connected Accounts */}
      <div className="p-6 rounded-2xl bg-white/4 border border-white/8">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">🔗 Connected Accounts</h3>
        <div className="flex flex-col gap-4">
          {/* Meta */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${status?.meta ? 'border-green-500/25 bg-green-500/5' : 'border-white/8 bg-white/3'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-500/15">📘</div>
              <div>
                <div className="font-semibold text-white text-sm">Meta Ads</div>
                <div className="text-xs text-white/40">{status?.meta ? 'Connected — syncing daily' : 'Not connected'}</div>
              </div>
            </div>
            {status?.meta
              ? <Badge type="green">● Connected</Badge>
              : <button onClick={() => handleConnect('meta')} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>Connect</button>
            }
          </div>
          {/* Google */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${status?.google ? 'border-green-500/25 bg-green-500/5' : 'border-white/8 bg-white/3'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-red-500/15">🎯</div>
              <div>
                <div className="font-semibold text-white text-sm">Google Ads</div>
                <div className="text-xs text-white/40">{status?.google ? 'Connected — syncing daily' : 'Not connected'}</div>
              </div>
            </div>
            {status?.google
              ? <Badge type="green">● Connected</Badge>
              : <button onClick={() => handleConnect('google')} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>Connect</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 
   SIDEBAR 
   ───────────────────────────────────────*/
const NAV_ITEMS = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'meta',     icon: '📘', label: 'Meta Ads' },
  { id: 'google',   icon: '🎯', label: 'Google Ads' },
  { id: 'reports',  icon: '🤖', label: 'AI Reports' },
  { id: 'settings', icon: '⚙️',  label: 'Settings' },
];

function Sidebar({ activeTab, setActiveTab, company, onLogout }) {
  const initials = (company?.company_name || 'A').slice(0,2).toUpperCase();
  return (
    <aside className="w-60 bg-[#0d0f1a] border-r border-white/8 fixed top-0 left-0 bottom-0 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>⚡</div>
        <span className="text-sm font-black text-white">AdPulse <span className="gradient-text">AI</span></span>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto pt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-3 pb-2">Navigation</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full border ${activeTab === item.id ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      {/* User */}
      <div className="p-2 border-t border-white/8">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/8">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{company?.company_name || 'Your Company'}</div>
            <button onClick={onLogout} className="text-[10px] text-white/30 hover:text-red-400 transition-colors">Sign out</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────── 
   MAIN DASHBOARD 
   ───────────────────────────────────────*/
const PAGE_TITLES = {
  overview: { title: 'Overview',   subtitle: "Here's what's happening with your ads today" },
  meta:     { title: 'Meta Ads',   subtitle: 'Facebook & Instagram campaign performance' },
  google:   { title: 'Google Ads', subtitle: 'Google Ads campaign performance' },
  reports:  { title: 'AI Reports', subtitle: 'Gemini AI analysis of your campaigns' },
  settings: { title: 'Settings',   subtitle: 'Manage your profile and connected accounts' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState({ meta: false, google: false });
  const [authChecked, setAuthChecked] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshStatus = useCallback(async (tkn) => {
    try {
      const st = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/connection-status`, {
        headers: { Authorization: `Bearer ${tkn}` }
      }).then(r => r.json());
      setStatus(st);
      return st;
    } catch { return null; }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const tkn = session.access_token;
      setToken(tkn);
      setUser(session.user);

      // Fetch company + connection status
      try {
        const [comp, st] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/company`, {
            headers: { Authorization: `Bearer ${tkn}` }
          }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/connection-status`, {
            headers: { Authorization: `Bearer ${tkn}` }
          }).then(r => r.json()),
        ]);
        setCompany(comp);
        setStatus(st);
      } catch (e) {
        console.error('Dashboard init error:', e);
      }

      // Check URL params for OAuth redirect result
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const error = params.get('error');

      if (connected === 'meta') {
        showToast('✅ Meta Ads connected successfully!');
        setStatus(s => ({ ...s, meta: true }));
        // Re-verify from server
        setTimeout(() => refreshStatus(tkn), 1000);
      } else if (connected === 'google') {
        showToast('✅ Google Ads connected successfully!');
        setStatus(s => ({ ...s, google: true }));
        setTimeout(() => refreshStatus(tkn), 1000);
      } else if (error === 'meta_failed') {
        showToast('❌ Meta connection failed. Please try again.', 'error');
      } else if (error === 'google_failed') {
        showToast('❌ Google connection failed. Please try again.', 'error');
      }

      // Clean URL params without page reload
      if (connected || error) {
        window.history.replaceState({}, '', '/dashboard');
      }

      setAuthChecked(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{background:'linear-gradient(135deg,#7c6af7,#00d4ff)'}}>⚡</div>
          <Spinner size={8} />
          <p className="text-white/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { title, subtitle } = PAGE_TITLES[activeTab] || {};
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  return (
    <div className="min-h-screen bg-[#07080d] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} company={company} onLogout={handleLogout} />

      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-8 h-[68px] bg-[#07080d]/90 backdrop-blur-xl border-b border-white/8">
          <div>
            <div className="font-bold text-white text-base">{title}</div>
            <div className="text-xs text-white/30 mt-0.5">{subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">{today}</span>
            <div className="flex gap-2">
              {status?.meta    && <Badge type="purple">📘 Meta</Badge>}
              {status?.google  && <Badge type="cyan">🎯 Google</Badge>}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && <OverviewTab token={token} company={company} status={status} />}
          {activeTab === 'meta'     && <AdsTab token={token} platform="meta"   status={status} companyId={user?.id} />}
          {activeTab === 'google'   && <AdsTab token={token} platform="google" status={status} companyId={user?.id} />}
          {activeTab === 'reports'  && <ReportsTab token={token} />}
          {activeTab === 'settings' && (
            <SettingsTab token={token} company={company} companyId={user?.id} status={status}
              onUpdate={(updated) => setCompany(c => ({...c, ...updated}))}
            />
          )}
        </div>
      </main>
    </div>
  );
}
