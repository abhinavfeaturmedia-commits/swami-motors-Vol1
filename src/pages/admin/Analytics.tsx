import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils'; // Assumes formatCurrency is available

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Analytics = () => {
    const [period, setPeriod] = useState('This Year');
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState({
        revenue: 0,
        avgSale: 0,
        conversionRate: 0,
        turnoverRate: 0
    });
    const [monthlyRev, setMonthlyRev] = useState<number[]>(new Array(12).fill(0));
    const [topModels, setTopModels] = useState<any[]>([]);
    const [funnel, setFunnel] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let startDate = new Date(now.getFullYear(), 0, 1);
                if (period === 'This Month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                else if (period === 'This Quarter') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

                // Fetch Sales
                const { data: salesData } = await supabase
                    .from('sales')
                    .select('final_price, sale_date, car:inventory(make, model)')
                    .gte('sale_date', startDate.toISOString());

                // Fetch Leads
                const { data: leadsData } = await supabase
                    .from('leads')
                    .select('status, created_at')
                    .gte('created_at', startDate.toISOString());

                // Fetch Active Inventory count
                const { count: inventoryCount } = await supabase
                    .from('inventory')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'available');

                // Process Sales Data
                let totalRevenue = 0;
                let soldCount = 0;
                const revMap = new Array(12).fill(0);
                const modelsMap: Record<string, { sold: number, revenue: number }> = {};

                salesData?.forEach((s: any) => {
                    const price = Number(s.final_price) || 0;
                    totalRevenue += price;
                    soldCount++;
                    
                    const date = new Date(s.sale_date);
                    revMap[date.getMonth()] += price / 100000; // in Lakhs

                    const key = `${s.car?.make || 'Unknown'} ${s.car?.model || ''}`.trim();
                    if (!modelsMap[key]) modelsMap[key] = { sold: 0, revenue: 0 };
                    modelsMap[key].sold++;
                    modelsMap[key].revenue += price;
                });

                // Top Models calculation
                const sortedModels = Object.entries(modelsMap)
                    .sort((a, b) => b[1].sold - a[1].sold)
                    .slice(0, 5)
                    .map(([name, data]) => ({
                        name,
                        sold: data.sold,
                        revenue: formatCurrency(data.revenue),
                        pct: Math.min(100, Math.round((data.sold / Math.max(soldCount, 1)) * 100))
                    }));

                // Funnel processing
                let newLeads = 0;
                let contacted = 0;
                let negotiations = 0;
                let closedWon = 0;

                leadsData?.forEach(l => {
                    if (l.status === 'new') newLeads++;
                    if (l.status === 'contacted') contacted++;
                    if (l.status === 'negotiation') negotiations++;
                    if (l.status === 'closed_won') closedWon++;
                });

                // Assuming some top of funnel based on total leads * multiplier for simulation, 
                // since we don't have website tracking anymore
                const totalLeads = leadsData?.length || 0;
                const websiteVisits = totalLeads > 0 ? totalLeads * 18 : 0;
                
                // For the funnel, we calculate cumulative stages (all closed_won went through negotiation, etc)
                const aggNegotiation = closedWon + negotiations;
                const aggContacted = aggNegotiation + contacted;
                const aggLeads = aggContacted + newLeads;

                const processedFunnel = [
                    { stage: 'Website Visits (Est)', count: websiteVisits, pct: 100, color: 'bg-blue-500' },
                    { stage: 'Leads Generated', count: totalLeads, pct: websiteVisits > 0 ? Math.round((totalLeads/websiteVisits)*100) : 0, color: 'bg-purple-500' },
                    { stage: 'Contacted', count: aggContacted, pct: totalLeads > 0 ? Math.round((aggContacted/totalLeads)*100) : 0, color: 'bg-amber-500' },
                    { stage: 'Negotiations', count: aggNegotiation, pct: aggContacted > 0 ? Math.round((aggNegotiation/aggContacted)*100) : 0, color: 'bg-orange-500' },
                    { stage: 'Closed Deals', count: closedWon, pct: aggNegotiation > 0 ? Math.round((closedWon/aggNegotiation)*100) : 0, color: 'bg-green-500' }
                ];

                const avgSale = soldCount > 0 ? totalRevenue / soldCount : 0;
                const conversionRate = totalLeads > 0 ? Math.round((soldCount / totalLeads) * 100) : 0;
                const turnoverRate = inventoryCount && inventoryCount > 0 ? (soldCount / inventoryCount).toFixed(1) : '0';

                setStats({
                    revenue: totalRevenue,
                    avgSale,
                    conversionRate,
                    turnoverRate: Number(turnoverRate)
                });
                setMonthlyRev(revMap);
                setTopModels(sortedModels);
                setFunnel(processedFunnel);

            } catch (err) {
                console.error("Error fetching analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]);

    const maxRevenue = Math.max(...monthlyRev, 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Analytics Dashboard</h1>
                    <p className="text-slate-500 text-sm">Deep dive into your dealership performance metrics (Live).</p>
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>This Month</option><option>This Quarter</option><option>This Year</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: loading ? '...' : formatCurrency(stats.revenue), up: true, icon: 'currency_rupee', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Avg Sale Price', value: loading ? '...' : formatCurrency(stats.avgSale), up: true, icon: 'sell', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Conversion Rate', value: loading ? '...' : `${stats.conversionRate}%`, up: true, icon: 'trending_up', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Inventory Turnover', value: loading ? '...' : `${stats.turnoverRate}x`, up: false, icon: 'autorenew', color: 'bg-amber-500/10 text-amber-600' },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${k.color}`}>
                                <span className="material-symbols-outlined text-lg">{k.icon}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Live
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
                        <h2 className="font-bold text-primary font-display text-lg">Revenue Trend (₹ Lakhs)</h2>
                        <div className="flex gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Revenue</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-48">
                        {loading ? (
                            <div className="w-full flex justify-center items-center h-full text-slate-300">Loading chart...</div>
                        ) : monthlyRev.every(v => v === 0) ? (
                            <div className="w-full flex flex-col justify-center items-center h-full text-slate-300">
                                <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                                <p className="text-sm">No sales data for selected period</p>
                            </div>
                        ) : (
                            MONTHS.map((m, i) => (
                                <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full flex flex-col items-center gap-0.5 relative">
                                        <div className="w-3/4 bg-accent/20 rounded-t transition-all" style={{ height: `${(monthlyRev[i] / maxRevenue) * 140}px` }}>
                                            <div className="w-full bg-accent rounded-t transition-all group-hover:bg-primary" style={{ height: `${(monthlyRev[i] / maxRevenue) * 100}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium">{m}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="font-bold text-primary font-display text-lg mb-6">Conversion Funnel</h2>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-100 rounded"></div>)}
                            </div>
                        ) : funnel.length === 0 ? (
                            <div className="h-32 flex justify-center items-center text-slate-300 text-sm">No leads found</div>
                        ) : (
                            funnel.map((f: any) => (
                                <div key={f.stage}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-slate-600">{f.stage}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[10px] text-slate-400">{f.pct}%</span>
                                            <span className="text-xs font-bold text-primary">{f.count}</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${f.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.max(f.pct, 2)}%` }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Models */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Top Selling Models</h2>
                <div className="space-y-4">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded"></div>)}
                        </div>
                    ) : topModels.length === 0 ? (
                        <div className="py-8 flex justify-center items-center text-slate-300 text-sm">No sales data found to rank models</div>
                    ) : (
                        topModels.map((m: any, i: number) => (
                            <div key={m.name} className="flex items-center gap-4 group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                                <span className="text-sm font-black text-slate-300 w-6 group-hover:text-accent">{String(i + 1).padStart(2, '0')}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold text-primary">{m.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-500">{m.sold} sold</span>
                                            <span className="text-xs font-bold text-primary">{m.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000" style={{ width: `${Math.max(m.pct, 2)}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
