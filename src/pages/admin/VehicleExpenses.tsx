import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const EXPENSES = [
    { id: '1', vehicle: 'Hyundai Creta 2022', category: 'Repair', desc: 'AC compressor replacement', amount: '₹12,500', date: '02 Oct 2024' },
    { id: '2', vehicle: 'Hyundai Creta 2022', category: 'Detailing', desc: 'Full body polish + interior', amount: '₹4,500', date: '05 Oct 2024' },
    { id: '3', vehicle: 'Toyota Fortuner 2021', category: 'Parts', desc: 'Brake pad replacement (all 4)', amount: '₹8,200', date: '08 Oct 2024' },
    { id: '4', vehicle: 'Toyota Fortuner 2021', category: 'Registration', desc: 'Transfer + NOC fees', amount: '₹6,800', date: '10 Oct 2024' },
    { id: '5', vehicle: 'Tata Nexon 2023', category: 'Detailing', desc: 'Ceramic coating', amount: '₹15,000', date: '12 Oct 2024' },
    { id: '6', vehicle: 'Honda City 2020', category: 'Repair', desc: 'Clutch plate + bearing', amount: '₹9,800', date: '15 Oct 2024' },
    { id: '7', vehicle: 'Honda City 2020', category: 'Parts', desc: 'Battery replacement', amount: '₹5,500', date: '18 Oct 2024' },
];

const PROFIT = [
    { vehicle: 'Hyundai Creta 2022', purchase: '₹12.50L', expenses: '₹17,000', selling: '₹14.50L', profit: '₹1.83L', margin: '12.6%' },
    { vehicle: 'Honda City 2020', purchase: '₹9.20L', expenses: '₹15,300', selling: '₹11.25L', profit: '₹1.90L', margin: '16.9%' },
    { vehicle: 'Maruti Swift 2022', purchase: '₹5.10L', expenses: '₹8,200', selling: '₹6.25L', profit: '₹1.07L', margin: '17.1%' },
];

const catColors: Record<string, string> = { Repair: 'bg-red-100 text-red-700', Detailing: 'bg-blue-100 text-blue-700', Parts: 'bg-purple-100 text-purple-700', Registration: 'bg-green-100 text-green-700' };

const VehicleExpenses = () => {
    const [tab, setTab] = useState<'expenses' | 'profit'>('expenses');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Vehicle Expenses</h1>
                    <p className="text-slate-500 text-sm">Track per-vehicle costs and calculate profit margins.</p>
                </div>
                <button className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Expenses', val: '₹62,300', icon: 'receipt_long', color: 'bg-red-500/10 text-red-600' },
                    { label: 'Repairs', val: '₹22,300', icon: 'build', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Detailing', val: '₹19,500', icon: 'auto_awesome', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Avg Profit/Car', val: '₹1.60L', icon: 'trending_up', color: 'bg-green-500/10 text-green-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                <button onClick={() => setTab('expenses')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === 'expenses' ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>Expense Log</button>
                <button onClick={() => setTab('profit')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === 'profit' ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>Profit / Loss</button>
            </div>

            {tab === 'expenses' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Vehicle</th>
                                <th className="text-left px-5 py-3">Category</th>
                                <th className="text-left px-5 py-3">Description</th>
                                <th className="text-left px-5 py-3">Amount</th>
                                <th className="text-left px-5 py-3">Date</th>
                                <th className="text-left px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {EXPENSES.map(e => (
                                <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-sm font-semibold text-primary">{e.vehicle}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${catColors[e.category]}`}>{e.category}</span></td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{e.desc}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-red-600">{e.amount}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">{e.date}</td>
                                    <td className="px-5 py-3.5">
                                        <button className="p-1.5 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-lg">edit</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Vehicle</th>
                                <th className="text-left px-5 py-3">Purchase</th>
                                <th className="text-left px-5 py-3">Expenses</th>
                                <th className="text-left px-5 py-3">Selling</th>
                                <th className="text-left px-5 py-3">Profit</th>
                                <th className="text-left px-5 py-3">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROFIT.map(p => (
                                <tr key={p.vehicle} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-sm font-semibold text-primary">{p.vehicle}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{p.purchase}</td>
                                    <td className="px-5 py-3.5 text-sm text-red-600 font-medium">{p.expenses}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{p.selling}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-green-600">{p.profit}</td>
                                    <td className="px-5 py-3.5"><span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />{p.margin}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VehicleExpenses;
