import React from 'react';
import { TrendingUp, CarFront } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const AdminSales = () => {
    const { sales, loading, refreshData } = useData();

    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.final_price) || 0), 0);
    const avgDealSize = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Sales Overview</h1>
                    <p className="text-slate-500 text-sm">Track completed sales, revenue, and customer assignments.</p>
                </div>
                <button onClick={refreshData} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                    <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Total Sales', value: loading ? '...' : String(sales.length), icon: 'sell', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Total Revenue', value: loading ? '...' : formatCurrency(totalRevenue), icon: 'currency_rupee', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Avg. Deal Size', value: loading ? '...' : formatCurrency(avgDealSize), icon: 'analytics', color: 'bg-blue-500/10 text-blue-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                            </div>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                                <TrendingUp size={12} />Live
                            </span>
                        </div>
                        <p className="text-2xl font-black text-primary font-display">{s.value}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="p-5 pb-0 flex items-center justify-between">
                    <h2 className="font-bold text-primary font-display text-lg">Sales Ledger</h2>
                </div>
                <table className="w-full mt-4">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Customer</th>
                            <th className="text-left px-5 py-3">Final Price</th>
                            <th className="text-left px-5 py-3">Date Sold</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">Loading sales data...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">sell</span>
                                    <p className="text-slate-400 font-medium">No completed sales yet</p>
                                    <p className="text-xs text-slate-300 mt-1">Convert a lead to a customer and register a sale to see it here.</p>
                                </td>
                            </tr>
                        ) : (
                            sales.map(sale => (
                                <tr key={sale.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                <CarFront size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{sale.car?.make} {sale.car?.model}</p>
                                                <p className="text-xs text-slate-400">{sale.car?.year} • {sale.car?.transmission}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-primary">{sale.customer?.full_name || 'Unknown'}</span>
                                            <span className="text-xs text-slate-500">{sale.customer?.phone || 'No phone'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                            {formatCurrency(sale.final_price)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(sale.sale_date)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSales;
