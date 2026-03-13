import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

const STATS = [
    { icon: 'inventory_2', label: 'Total Stock', value: '87', change: '+12', trend: 'up', color: 'bg-blue-500/10 text-blue-600' },
    { icon: 'people', label: 'Active Leads', value: '156', change: '+23', trend: 'up', color: 'bg-green-500/10 text-green-600' },
    { icon: 'sell', label: 'Cars Sold (Monthly)', value: '34', change: '+8', trend: 'up', color: 'bg-amber-500/10 text-amber-600' },
    { icon: 'currency_rupee', label: 'Revenue (Monthly)', value: '₹1.2 Cr', change: '+18%', trend: 'up', color: 'bg-purple-500/10 text-purple-600' },
];

const RECENT = [
    { name: 'Rajesh Kumar', phone: '+91 98765 43210', car: 'Hyundai Creta 2022', status: 'Hot', date: 'Today, 10:30 AM', avatar: 'RK' },
    { name: 'Priya Deshmukh', phone: '+91 87654 32109', car: 'Toyota Fortuner 2021', status: 'New', date: 'Today, 09:15 AM', avatar: 'PD' },
    { name: 'Amit Joshi', phone: '+91 76543 21098', car: 'Tata Nexon 2023', status: 'Follow-up', date: 'Yesterday', avatar: 'AJ' },
    { name: 'Sanjay Patil', phone: '+91 65432 10987', car: 'Honda City 2020', status: 'Converted', date: 'Yesterday', avatar: 'SP' },
    { name: 'Meera Shah', phone: '+91 54321 09876', car: 'Maruti Swift 2022', status: 'Hot', date: '2 days ago', avatar: 'MS' },
];

const statusColors: Record<string, string> = {
    'Hot': 'bg-red-100 text-red-700',
    'New': 'bg-blue-100 text-blue-700',
    'Follow-up': 'bg-amber-100 text-amber-700',
    'Converted': 'bg-green-100 text-green-700',
};

const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-primary font-display leading-tight">Command Center</h1>
                    <p className="text-slate-500 text-xs sm:text-sm">Good afternoon, Vikas. Here's your dealership overview.</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <button className="h-10 px-3 sm:px-4 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-lg">calendar_today</span> <span className="hidden xs:inline">This Month</span><span className="xs:hidden">Month</span>
                    </button>
                    <Link to="/admin/inventory/new" className="h-10 px-4 sm:px-5 bg-accent text-primary font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-lg">add</span> New <span className="hidden xs:inline">Listing</span>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 ${s.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {s.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {s.change}
                            </span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-primary font-display truncate">{s.value}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
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
                                    <th className="text-left px-4 sm:px-5 py-3">Interest</th>
                                    <th className="text-left px-4 sm:px-5 py-3">Status</th>
                                    <th className="text-left px-4 sm:px-5 py-3">Date</th>
                                    <th className="text-right px-4 sm:px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT.map(lead => (
                                    <tr key={lead.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 sm:px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold shrink-0">{lead.avatar}</div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs sm:text-sm font-semibold text-primary truncate">{lead.name}</span>
                                                    <span className="text-[10px] text-slate-400 truncate">{lead.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-5 py-3.5">
                                            <span className="text-xs text-slate-700 font-medium block truncate max-w-[120px] sm:max-w-none">{lead.car}</span>
                                        </td>
                                        <td className="px-4 sm:px-5 py-3.5">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${statusColors[lead.status]}`}>{lead.status}</span>
                                        </td>
                                        <td className="px-4 sm:px-5 py-3.5 text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">{lead.date}</td>
                                        <td className="px-4 sm:px-5 py-3.5 text-right">
                                            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-slate-400 text-lg">more_horiz</span></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* Priority Leads */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm sm:text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">local_fire_department</span> Priority
                        </h3>
                        <div className="space-y-2.5">
                            {RECENT.filter(l => l.status === 'Hot').map(lead => (
                                <div key={lead.name} className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="size-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">{lead.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-primary truncate">{lead.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{lead.car}</p>
                                    </div>
                                    <button className="p-1.5 hover:bg-red-100 rounded-lg shrink-0"><span className="material-symbols-outlined text-sm text-red-600">call</span></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Target */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm sm:text-base mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent text-lg">flag</span> Target
                        </h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] sm:text-xs text-slate-600">34 / 45 Sold</span>
                            <span className="text-xs font-bold text-primary">76%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: '76%' }} />
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm sm:text-base mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent text-lg">schedule</span> Today
                        </h3>
                        <div className="space-y-3">
                            {[
                                { time: '10:00 AM', task: 'Test Drive - Rajesh', type: 'Test Drive' },
                                { time: '02:00 PM', task: 'Meeting - Priya D.', type: 'Meeting' },
                                { time: '04:30 PM', task: 'Delivery - Amit J.', type: 'Delivery' },
                            ].map(item => (
                                <div key={item.time} className="flex items-start gap-2.5">
                                    <span className="text-[9px] font-bold text-slate-400 w-14 pt-1 shrink-0">{item.time}</span>
                                    <div className="flex-1 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100">
                                        <p className="text-[11px] font-semibold text-primary leading-tight">{item.task}</p>
                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{item.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
