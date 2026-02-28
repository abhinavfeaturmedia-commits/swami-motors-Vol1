import React, { useState } from 'react';

const SOURCES = [
    { name: 'Walk-in', leads: 42, conversions: 15, rate: '36%', cost: '—', color: 'bg-blue-500', pct: 27 },
    { name: 'Website', leads: 35, conversions: 8, rate: '23%', cost: '₹120/lead', color: 'bg-purple-500', pct: 22 },
    { name: 'OLX / CarDekho', leads: 28, conversions: 5, rate: '18%', cost: '₹250/lead', color: 'bg-green-500', pct: 18 },
    { name: 'Instagram', leads: 22, conversions: 4, rate: '18%', cost: '₹180/lead', color: 'bg-pink-500', pct: 14 },
    { name: 'Referral', leads: 18, conversions: 8, rate: '44%', cost: '—', color: 'bg-amber-500', pct: 11 },
    { name: 'Google Ads', leads: 8, conversions: 2, rate: '25%', cost: '₹350/lead', color: 'bg-red-500', pct: 5 },
    { name: 'WhatsApp', leads: 3, conversions: 1, rate: '33%', cost: '—', color: 'bg-teal-500', pct: 3 },
];

const LeadSources = () => {
    const [period, setPeriod] = useState('This Month');
    const totalLeads = SOURCES.reduce((s, x) => s + x.leads, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Lead Source Tracker</h1>
                    <p className="text-slate-500 text-sm">Understand where your leads come from and their ROI.</p>
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>This Week</option><option>This Month</option><option>This Quarter</option>
                </select>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Donut Chart Visual */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="font-bold text-primary font-display text-lg mb-5">Source Distribution</h2>
                    <div className="relative size-48 mx-auto mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {SOURCES.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, s, i) => {
                                const dash = (s.pct / 100) * 283;
                                const elem = <circle key={i} cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${dash} ${283 - dash}`} strokeDashoffset={-acc.offset} className={s.color.replace('bg-', 'text-')} />;
                                acc.elements.push(elem);
                                acc.offset += dash;
                                return acc;
                            }, { offset: 0, elements: [] }).elements}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-2xl font-black text-primary font-display">{totalLeads}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Total Leads</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {SOURCES.map(s => (
                            <div key={s.name} className="flex items-center gap-2">
                                <span className={`size-2.5 rounded-full ${s.color}`} />
                                <span className="text-xs text-slate-600 flex-1">{s.name}</span>
                                <span className="text-xs font-bold text-primary">{s.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="p-5 pb-0">
                        <h2 className="font-bold text-primary font-display text-lg">Source Performance</h2>
                    </div>
                    <table className="w-full mt-3">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-2.5">Source</th>
                                <th className="text-left px-5 py-2.5">Leads</th>
                                <th className="text-left px-5 py-2.5">Conversions</th>
                                <th className="text-left px-5 py-2.5">Conv. Rate</th>
                                <th className="text-left px-5 py-2.5">Cost/Lead</th>
                                <th className="text-left px-5 py-2.5">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SOURCES.map(s => (
                                <tr key={s.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-3 rounded-full ${s.color}`} />
                                            <span className="text-sm font-semibold text-primary">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-primary">{s.leads}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{s.conversions}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold ${parseInt(s.rate) >= 30 ? 'text-green-600' : parseInt(s.rate) >= 20 ? 'text-amber-600' : 'text-red-500'}`}>{s.rate}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">{s.cost}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                                            </div>
                                            <span className="text-xs text-slate-500">{s.pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeadSources;
