import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REVENUE_DATA = [42, 55, 48, 72, 65, 80, 78, 92, 88, 105, 98, 120];
const LEADS_DATA = [30, 45, 38, 52, 60, 48, 55, 70, 65, 75, 80, 90];
const CONVERSION_DATA = [15, 22, 18, 28, 25, 30, 32, 38, 35, 42, 40, 48];

const TOP_MODELS = [
    { name: 'Hyundai Creta', sold: 18, revenue: '₹2.6 Cr', pct: 85 },
    { name: 'Toyota Fortuner', sold: 12, revenue: '₹3.8 Cr', pct: 70 },
    { name: 'Tata Nexon', sold: 15, revenue: '₹1.5 Cr', pct: 65 },
    { name: 'Honda City', sold: 10, revenue: '₹1.1 Cr', pct: 55 },
    { name: 'Maruti Swift', sold: 14, revenue: '₹0.9 Cr', pct: 50 },
];

const FUNNEL = [
    { stage: 'Website Visits', count: 2450, pct: 100, color: 'bg-blue-500' },
    { stage: 'Leads Generated', count: 156, pct: 65, color: 'bg-purple-500' },
    { stage: 'Test Drives', count: 68, pct: 45, color: 'bg-amber-500' },
    { stage: 'Negotiations', count: 42, pct: 30, color: 'bg-orange-500' },
    { stage: 'Closed Deals', count: 34, pct: 20, color: 'bg-green-500' },
];

const Analytics = () => {
    const [period, setPeriod] = useState('This Year');
    const maxRevenue = Math.max(...REVENUE_DATA);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Analytics Dashboard</h1>
                    <p className="text-slate-500 text-sm">Deep dive into your dealership performance metrics.</p>
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>This Month</option><option>This Quarter</option><option>This Year</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: '₹1.2 Cr', change: '+18%', up: true, icon: 'currency_rupee', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Avg Sale Price', value: '₹12.5L', change: '+5%', up: true, icon: 'sell', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Conversion Rate', value: '22%', change: '+3%', up: true, icon: 'trending_up', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Inventory Turnover', value: '4.2x', change: '-0.3', up: false, icon: 'autorenew', color: 'bg-amber-500/10 text-amber-600' },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${k.color}`}><span className="material-symbols-outlined text-lg">{k.icon}</span></div>
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${k.up ? 'text-green-600' : 'text-red-500'}`}>
                                {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{k.change}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-primary font-display">{k.value}</p>
                        <p className="text-xs text-slate-400 font-medium">{k.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-primary font-display text-lg">Revenue Trend</h2>
                        <div className="flex gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Revenue</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Leads</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-48">
                        {MONTHS.map((m, i) => (
                            <div key={m} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex flex-col items-center gap-0.5">
                                    <div className="w-3/4 bg-accent/20 rounded-t" style={{ height: `${(REVENUE_DATA[i] / maxRevenue) * 140}px` }}>
                                        <div className="w-full bg-accent rounded-t" style={{ height: `${(REVENUE_DATA[i] / maxRevenue) * 100}%` }} />
                                    </div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium">{m}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="font-bold text-primary font-display text-lg mb-6">Conversion Funnel</h2>
                    <div className="space-y-3">
                        {FUNNEL.map(f => (
                            <div key={f.stage}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-slate-600">{f.stage}</span>
                                    <span className="text-xs font-bold text-primary">{f.count}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${f.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Models */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Top Selling Models</h2>
                <div className="space-y-4">
                    {TOP_MODELS.map((m, i) => (
                        <div key={m.name} className="flex items-center gap-4">
                            <span className="text-sm font-black text-slate-300 w-6">{String(i + 1).padStart(2, '0')}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-primary">{m.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-500">{m.sold} sold</span>
                                        <span className="text-xs font-bold text-primary">{m.revenue}</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${m.pct}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
