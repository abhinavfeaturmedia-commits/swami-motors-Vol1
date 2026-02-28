import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const SALES = [
    { id: 'S001', car: '2021 Hyundai Creta SX', buyer: 'Sanjay Patil', phone: '+91 65432 10987', amount: '₹14,50,000', date: '25 Oct 2024', payment: 'Bank Loan', avatar: 'SP' },
    { id: 'S002', car: '2022 Maruti Swift LXI', buyer: 'Deepak Kulkarni', phone: '+91 78912 34567', amount: '₹6,25,000', date: '24 Oct 2024', payment: 'Cash', avatar: 'DK' },
    { id: 'S003', car: '2020 Honda City ZX', buyer: 'Arti Desai', phone: '+91 89012 34567', amount: '₹11,25,000', date: '22 Oct 2024', payment: 'Finance', avatar: 'AD' },
    { id: 'S004', car: '2019 Tata Nexon XZ', buyer: 'Rohit Jadhav', phone: '+91 90123 45678', amount: '₹8,75,000', date: '20 Oct 2024', payment: 'Cash', avatar: 'RJ' },
];

const AdminSales = () => {
    const [period, setPeriod] = useState('This Month');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Sales Overview</h1>
                    <p className="text-slate-500 text-sm">Track completed sales and revenue performance.</p>
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>This Week</option><option>This Month</option><option>This Quarter</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sales', value: '34', icon: 'sell', color: 'bg-green-500/10 text-green-600', change: '+8' },
                    { label: 'Revenue', value: '₹1.2 Cr', icon: 'currency_rupee', color: 'bg-purple-500/10 text-purple-600', change: '+18%' },
                    { label: 'Avg. Deal Size', value: '₹12.5L', icon: 'analytics', color: 'bg-blue-500/10 text-blue-600', change: '+5%' },
                    { label: 'Conversion Rate', value: '22%', icon: 'trending_up', color: 'bg-amber-500/10 text-amber-600', change: '+3%' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${s.color}`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />{s.change}</span>
                        </div>
                        <p className="text-2xl font-black text-primary font-display">{s.value}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="p-5 pb-0 flex items-center justify-between">
                    <h2 className="font-bold text-primary font-display text-lg">Recent Sales</h2>
                    <button className="text-sm font-semibold text-accent hover:underline">Export CSV</button>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Sale ID</th>
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Buyer</th>
                            <th className="text-left px-5 py-3">Amount</th>
                            <th className="text-left px-5 py-3">Payment</th>
                            <th className="text-left px-5 py-3">Date</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SALES.map(sale => (
                            <tr key={sale.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-mono text-slate-500">{sale.id}</td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{sale.car}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold">{sale.avatar}</div>
                                        <div><p className="text-sm font-medium text-primary">{sale.buyer}</p><p className="text-[10px] text-slate-400">{sale.phone}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-bold text-primary">{sale.amount}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${sale.payment === 'Cash' ? 'bg-green-100 text-green-700' : sale.payment === 'Finance' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{sale.payment}</span></td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{sale.date}</td>
                                <td className="px-5 py-3.5"><button className="p-1.5 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-lg">more_horiz</span></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSales;
