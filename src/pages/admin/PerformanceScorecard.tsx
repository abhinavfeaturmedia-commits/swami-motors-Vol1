import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const TEAM = [
    { name: 'Vikas Shinde', role: 'General Manager', avatar: 'VS', leads: 45, conversions: 18, revenue: '₹38.5L', rating: 4.8, rank: 1, trend: '+12%' },
    { name: 'Amit Deshmukh', role: 'Senior Sales', avatar: 'AD', leads: 38, conversions: 14, revenue: '₹28.2L', rating: 4.6, rank: 2, trend: '+8%' },
    { name: 'Priya Sharma', role: 'Sales Exec', avatar: 'PS', leads: 32, conversions: 11, revenue: '₹22.1L', rating: 4.5, rank: 3, trend: '+15%' },
    { name: 'Rahul Verma', role: 'Sales Exec', avatar: 'RV', leads: 28, conversions: 9, revenue: '₹18.7L', rating: 4.3, rank: 4, trend: '+5%' },
    { name: 'Sneha Kulkarni', role: 'Junior Sales', avatar: 'SK', leads: 22, conversions: 7, revenue: '₹14.5L', rating: 4.1, rank: 5, trend: '+20%' },
];

const PerformanceScorecard = () => {
    const [period, setPeriod] = useState('This Month');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Performance Scorecard</h1>
                    <p className="text-slate-500 text-sm">Track individual and team performance metrics.</p>
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>This Week</option><option>This Month</option><option>This Quarter</option>
                </select>
            </div>

            {/* Team Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Team Size', value: '5', icon: 'groups', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Total Leads', value: '165', icon: 'person_search', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Total Conversions', value: '59', icon: 'handshake', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Team Revenue', value: '₹1.22 Cr', icon: 'currency_rupee', color: 'bg-amber-500/10 text-amber-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-2xl font-black text-primary font-display">{s.value}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Leaderboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {TEAM.map(m => (
                    <div key={m.name} className={`bg-white rounded-2xl border p-5 shadow-[var(--shadow-card)] text-center relative overflow-hidden ${m.rank === 1 ? 'border-accent ring-1 ring-accent/20' : 'border-slate-100'}`}>
                        {m.rank === 1 && <div className="absolute top-0 right-0 bg-accent text-primary text-[9px] font-black px-3 py-1 rounded-bl-xl">🏆 TOP</div>}
                        <div className="size-14 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">{m.avatar}</div>
                        <p className="text-sm font-bold text-primary font-display">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mb-3">{m.role}</p>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-lg font-black text-primary">{m.conversions}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Sales</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-lg font-black text-primary">{m.leads}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Leads</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-1 text-green-600">
                            <TrendingUp size={12} /><span className="text-xs font-bold">{m.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="p-5 pb-0">
                    <h2 className="font-bold text-primary font-display text-lg">Detailed Performance</h2>
                </div>
                <table className="w-full mt-3">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-2.5">Rank</th>
                            <th className="text-left px-5 py-2.5">Team Member</th>
                            <th className="text-left px-5 py-2.5">Leads</th>
                            <th className="text-left px-5 py-2.5">Conversions</th>
                            <th className="text-left px-5 py-2.5">Conv. Rate</th>
                            <th className="text-left px-5 py-2.5">Revenue</th>
                            <th className="text-left px-5 py-2.5">Rating</th>
                            <th className="text-left px-5 py-2.5">Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TEAM.map(m => (
                            <tr key={m.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5">
                                    <span className={`text-sm font-black ${m.rank <= 3 ? 'text-accent' : 'text-slate-400'}`}>#{m.rank}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-[10px] font-bold">{m.avatar}</div>
                                        <div><p className="text-sm font-medium text-primary">{m.name}</p><p className="text-[10px] text-slate-400">{m.role}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{m.leads}</td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{m.conversions}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-600">{Math.round((m.conversions / m.leads) * 100)}%</td>
                                <td className="px-5 py-3.5 text-sm font-bold text-primary">{m.revenue}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                                        <span className="text-sm font-semibold text-primary">{m.rating}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5"><span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />{m.trend}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PerformanceScorecard;
