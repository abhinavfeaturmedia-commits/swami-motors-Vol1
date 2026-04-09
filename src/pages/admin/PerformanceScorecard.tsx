import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
};

const PerformanceScorecard = () => {
    const { leads, sales } = useData();
    const [period, setPeriod] = useState('This Month');
    const [profiles, setProfiles] = useState<any[]>([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data } = await supabase.from('profiles').select('*');
            if (data) setProfiles(data);
        };
        fetchProfiles();
    }, []);

    const kpis = useMemo(() => {
        const totalLeads = leads.length;
        const totalSalesVolume = sales.reduce((sum, s) => sum + Number(s.final_price), 0);
        const totalConversions = sales.length;

        let rankedTeam = profiles.map(m => {
            // Find leads assigned to this user
            const memberLeads = leads.filter(l => l.assigned_to === m.id || l.user_id === m.id);
            const memberConversions = memberLeads.filter(l => l.status === 'closed_won').length;
            
            // For revenue, if we can't directly attribute, we'll assign 0 for now as 'sales' lack user_id in DB, 
            // or we could accumulate the value of closed_won leads if they had a price.
            const memberRevenue = 0; 

            return {
                id: m.id,
                name: m.full_name || 'Unnamed Team Member',
                role: m.role || 'Sales',
                avatar: (m.full_name || 'U').substring(0, 2).toUpperCase(),
                leads: memberLeads.length,
                conversions: memberConversions,
                revenueStr: formatCurrency(memberRevenue),
                convRate: memberLeads.length > 0 ? Math.round((memberConversions / memberLeads.length) * 100) : 0,
                rating: 0, // Placeholder
                trend: `0%` // Placeholder
            };
        });

        // Filter out profiles that are generic customers unless they have leads, meaning they act as a team member here.
        // Usually, you only want internal staff. 
        rankedTeam = rankedTeam.filter(m => m.leads > 0 || m.role === 'admin');

        // Ensure real leaderboard sorting by conversions capability
        rankedTeam = rankedTeam.sort((a, b) => b.conversions - a.conversions);

        return {
            team: rankedTeam.map((t, idx) => ({ ...t, rank: idx + 1 })),
            globalTotalLeads: totalLeads,
            globalTotalConversions: totalConversions,
            globalTotalRevenue: formatCurrency(totalSalesVolume)
        };
    }, [leads, sales, period, profiles]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Global Performance Scorecard</h1>
                    <p className="text-slate-500 text-sm">Track actual global branch capability scaled against team profiles.</p>
                </div>
                <div className="flex items-center gap-3">
                     <span className="py-2 px-3 text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 rounded-lg shadow-sm">DYNAMIC POOL</span>
                     <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                        <option>Lifetime (Global)</option>
                    </select>
                </div>
            </div>

            {/* Team Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Team Size', value: kpis.team.length, icon: 'groups', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Global Leads', value: kpis.globalTotalLeads, icon: 'person_search', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Global Conversions', value: kpis.globalTotalConversions, icon: 'handshake', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Global Revenue', value: kpis.globalTotalRevenue, icon: 'currency_rupee', color: 'bg-amber-500/10 text-amber-600' },
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
                {kpis.team.map(m => (
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
                    <h2 className="font-bold text-primary font-display text-lg">Performance Drilldown (Projected Metric Slice)</h2>
                </div>
                <table className="w-full mt-3 min-w-[800px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                            <th className="text-left px-5 py-2.5 rounded-tl-xl">Rank</th>
                            <th className="text-left px-5 py-2.5">Team Member</th>
                            <th className="text-left px-5 py-2.5">Lead Alloc.</th>
                            <th className="text-left px-5 py-2.5">Closed Value</th>
                            <th className="text-left px-5 py-2.5">Conv. Win Rate</th>
                            <th className="text-left px-5 py-2.5">Revenue Slice</th>
                            <th className="text-left px-5 py-2.5">Quality Rating</th>
                            <th className="text-left px-5 py-2.5">Velocity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kpis.team.length === 0 && <tr><td colSpan={8} className="text-center p-8 text-slate-400">No active leads or sales.</td></tr>}
                        {kpis.team.map(m => (
                            <tr key={m.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 border-r border-slate-50">
                                    <span className={`text-sm font-black ${m.rank <= 3 ? 'text-accent' : 'text-slate-400'}`}>#{m.rank}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-[10px] font-bold">{m.avatar}</div>
                                        <div><p className="text-sm font-medium text-primary">{m.name}</p><p className="text-[10px] text-slate-400">{m.role}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{m.leads}</td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{m.conversions} Deals</td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 bg-blue-50/30">{m.convRate}%</td>
                                <td className="px-5 py-3.5 text-sm font-bold text-green-700 bg-green-50/30">{m.revenueStr}</td>
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
