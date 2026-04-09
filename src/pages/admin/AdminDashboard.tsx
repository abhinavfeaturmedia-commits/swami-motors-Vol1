import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statusColors: Record<string, string> = {
    'new': 'bg-blue-100 text-blue-700',
    'contacted': 'bg-amber-100 text-amber-700',
    'negotiation': 'bg-purple-100 text-purple-700',
    'closed_won': 'bg-green-100 text-green-700',
    'closed_lost': 'bg-slate-200 text-slate-500',
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStock: 0,
        activeLeads: 0,
        carsSold: 0,
        revenue: 0
    });
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    const [actionRequired, setActionRequired] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);

            try {
                // Fetch inventory stats
                const { data: invData, error: invError } = await supabase.from('inventory').select('status, price');
                let stock = 0;
                let sold = 0;
                let rev = 0;

                if (invData) {
                    invData.forEach(car => {
                        if (car.status === 'available') stock++;
                        if (car.status === 'sold') {
                            sold++;
                            rev += (car.price || 0);
                        }
                    });
                }

                // Fetch leads stats & recent
                const { data: leadsData, error: leadsError } = await supabase.from('leads')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                let active = 0;
                const recent = [];

                if (leadsData) {
                    leadsData.forEach(lead => {
                        if (['new', 'contacted', 'negotiation'].includes(lead.status)) {
                            active++;
                        }
                    });
                    recent.push(...leadsData.slice(0, 5));
                    setActionRequired(leadsData.filter(l => l.status === 'new'));
                }

                setStats({
                    totalStock: stock,
                    activeLeads: active,
                    carsSold: sold,
                    revenue: rev
                });
                setRecentLeads(recent);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatRevenue = (val: number) => {
        if (val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        return `₹${(val / 100000).toFixed(2)} L`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getAvatar = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    };

    const formatLeadType = (type: string) => {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-primary font-display leading-tight">Command Center</h1>
                    <p className="text-slate-500 text-xs sm:text-sm">Live snapshot of your dealership metrics.</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Link to="/admin/analytics" className="h-10 px-3 sm:px-4 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-lg">monitoring</span> <span className="hidden xs:inline">Total View</span><span className="xs:hidden">All</span>
                    </Link>
                    <Link to="/admin/inventory/new" className="h-10 px-4 sm:px-5 bg-accent text-primary font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-lg">add</span> New <span className="hidden xs:inline">Listing</span>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1 */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600">
                            <span className="material-symbols-outlined text-lg">inventory_2</span>
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-primary font-display truncate">{loading ? '...' : stats.totalStock}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Available Stock</p>
                </div>
                {/* 2 */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-600">
                            <span className="material-symbols-outlined text-lg">people</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold flex items-center gap-0.5 text-green-600">
                            <TrendingUp size={12} />
                        </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-primary font-display truncate">{loading ? '...' : stats.activeLeads}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Active Leads</p>
                </div>
                {/* 3 */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600">
                            <span className="material-symbols-outlined text-lg">sell</span>
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-primary font-display truncate">{loading ? '...' : stats.carsSold}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Cars Sold</p>
                </div>
                {/* 4 */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600">
                            <span className="material-symbols-outlined text-lg">currency_rupee</span>
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-primary font-display truncate">{loading ? '...' : formatRevenue(stats.revenue)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Revenue</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Leads Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="p-4 sm:p-5 flex items-center justify-between">
                        <h2 className="font-bold text-primary font-display text-base sm:text-lg">Recent Activity</h2>
                        <Link to="/admin/leads" className="text-xs sm:text-sm font-semibold text-accent hover:underline flex items-center gap-1">View All <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
                    </div>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <table className="w-full min-w-[600px] sm:min-w-full">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                    <th className="text-left px-4 sm:px-5 py-3">Customer</th>
                                    <th className="text-left px-4 sm:px-5 py-3">Interest Type</th>
                                    <th className="text-left px-4 sm:px-5 py-3">Status</th>
                                    <th className="text-left px-4 sm:px-5 py-3">Date</th>
                                    <th className="text-right px-4 sm:px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                ) : recentLeads.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No leads yet.</td></tr>
                                ) : (
                                    recentLeads.map(lead => (
                                        <tr key={lead.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 sm:px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {getAvatar(lead.full_name)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs sm:text-sm font-semibold text-primary truncate">{lead.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 truncate">{lead.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-5 py-3.5">
                                                <span className="text-xs text-slate-700 font-medium block truncate">{formatLeadType(lead.type)}</span>
                                            </td>
                                            <td className="px-4 sm:px-5 py-3.5">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${statusColors[lead.status] || 'bg-slate-100'}`}>
                                                    {lead.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-5 py-3.5 text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                                            <td className="px-4 sm:px-5 py-3.5 text-right">
                                                <Link to={`/admin/leads`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors inline-block" title="Manage Lead">
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">open_in_new</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* Priority Leads */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm sm:text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">local_fire_department</span> Action Required
                        </h3>
                        <div className="space-y-2.5">
                            {loading ? (
                                <p className="text-xs text-slate-400">Loading...</p>
                            ) : actionRequired.length === 0 ? (
                                <p className="text-xs text-slate-400">No new leads require action.</p>
                            ) : (
                                actionRequired.slice(0, 5).map(lead => (
                                    <div key={lead.id} className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-xl border border-red-100">
                                        <div className="size-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">{getAvatar(lead.full_name)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-primary truncate">{lead.full_name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{formatLeadType(lead.type)}</p>
                                        </div>
                                        <a href={`tel:${lead.phone}`} className="p-1.5 hover:bg-red-100 rounded-lg shrink-0"><span className="material-symbols-outlined text-sm text-red-600">call</span></a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm sm:text-base mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent text-lg">inventory_2</span> Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link to="/admin/inventory/new" className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-primary text-xl">add_a_photo</span>
                                <div>
                                    <p className="text-xs font-bold text-primary">Upload Vehicle</p>
                                    <p className="text-[10px] text-slate-500">Create a new live listing</p>
                                </div>
                            </Link>
                            <Link to="/admin/leads" className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-primary text-xl">contact_mail</span>
                                <div>
                                    <p className="text-xs font-bold text-primary">Manage Leads</p>
                                    <p className="text-[10px] text-slate-500">View CRM and follow-ups</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
