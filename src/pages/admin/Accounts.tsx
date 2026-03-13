import React, { useState } from 'react';

const TRANSACTIONS = [
    { id: '1', desc: 'Sale — Hyundai Creta 2022', type: 'Income', amount: '+₹14,00,000', date: '28 Oct 2024', mode: 'NEFT', status: 'Completed' },
    { id: '2', desc: 'Purchase — Toyota Fortuner 2021', type: 'Expense', amount: '-₹28,50,000', date: '25 Oct 2024', mode: 'Cheque', status: 'Completed' },
    { id: '3', desc: 'Repair — AC compressor (Creta)', type: 'Expense', amount: '-₹12,500', date: '22 Oct 2024', mode: 'Cash', status: 'Completed' },
    { id: '4', desc: 'Down Payment — Honda City (Sanjay P.)', type: 'Income', amount: '+₹2,50,000', date: '20 Oct 2024', mode: 'UPI', status: 'Completed' },
    { id: '5', desc: 'Balance — Honda City (Sanjay P.)', type: 'Income', amount: '+₹8,75,000', date: '—', mode: '—', status: 'Pending' },
    { id: '6', desc: 'Insurance Renewal — Fortuner', type: 'Expense', amount: '-₹18,500', date: '18 Oct 2024', mode: 'Online', status: 'Completed' },
    { id: '7', desc: 'Commission — Amit D. (Oct)', type: 'Expense', amount: '-₹28,200', date: '—', mode: '—', status: 'Pending' },
];

const statusColors: Record<string, string> = { Completed: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700' };
const TABS = ['All', 'Income', 'Expense', 'Pending'];

const Accounts = () => {
    const [tab, setTab] = useState('All');
    const filtered = tab === 'All' ? TRANSACTIONS : tab === 'Pending' ? TRANSACTIONS.filter(t => t.status === 'Pending') : TRANSACTIONS.filter(t => t.type === tab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Accounts & Payments</h1>
                    <p className="text-slate-500 text-sm">Track income, expenses, and pending payments.</p>
                </div>
                <button className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> Add Transaction
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Income', val: '₹25.25L', icon: 'trending_up', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Total Expense', val: '₹29.09L', icon: 'trending_down', color: 'bg-red-500/10 text-red-600' },
                    { label: 'Net Balance', val: '-₹3.84L', icon: 'account_balance', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Pending Dues', val: '₹9.03L', icon: 'pending', color: 'bg-amber-500/10 text-amber-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>{t}</button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Description</th>
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-left px-5 py-3">Amount</th>
                            <th className="text-left px-5 py-3">Date</th>
                            <th className="text-left px-5 py-3">Mode</th>
                            <th className="text-left px-5 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(t => (
                            <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-medium text-primary">{t.desc}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${t.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type}</span></td>
                                <td className={`px-5 py-3.5 text-sm font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{t.date}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{t.mode}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[t.status]}`}>{t.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Accounts;
