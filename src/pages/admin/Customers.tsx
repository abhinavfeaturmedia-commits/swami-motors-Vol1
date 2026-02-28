import React, { useState } from 'react';

const CUSTOMERS = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@email.com', avatar: 'RK', purchases: 2, lastPurchase: 'Hyundai Creta 2022', date: '15 Sep 2024', value: '₹28.5L', type: 'VIP' },
    { id: '2', name: 'Priya Deshmukh', phone: '+91 87654 32109', email: 'priya@email.com', avatar: 'PD', purchases: 1, lastPurchase: 'Toyota Fortuner 2021', date: '22 Aug 2024', value: '₹32.0L', type: 'Recent' },
    { id: '3', name: 'Amit Joshi', phone: '+91 76543 21098', email: 'amit@email.com', avatar: 'AJ', purchases: 1, lastPurchase: 'Tata Nexon 2023', date: '10 Oct 2024', value: '₹10.5L', type: 'Recent' },
    { id: '4', name: 'Sanjay Patil', phone: '+91 65432 10987', email: 'sanjay@email.com', avatar: 'SP', purchases: 3, lastPurchase: 'Honda City 2020', date: '05 Jul 2024', value: '₹42.0L', type: 'VIP' },
    { id: '5', name: 'Meera Shah', phone: '+91 54321 09876', email: 'meera@email.com', avatar: 'MS', purchases: 1, lastPurchase: 'Maruti Swift 2022', date: '28 Oct 2024', value: '₹6.8L', type: 'Recent' },
    { id: '6', name: 'Deepak Kulkarni', phone: '+91 43210 98765', email: 'deepak@email.com', avatar: 'DK', purchases: 2, lastPurchase: 'Kia Seltos 2023', date: '01 Jun 2024', value: '₹25.3L', type: 'Repeat' },
];

const TABS = ['All', 'Recent Buyers', 'Repeat', 'VIP'];

const Customers = () => {
    const [tab, setTab] = useState('All');
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState<string | null>(null);

    const filtered = CUSTOMERS
        .filter(c => tab === 'All' || c.type === tab.replace(' Buyers', ''))
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const selectedCustomer = CUSTOMERS.find(c => c.id === detail);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Customer Database</h1>
                    <p className="text-slate-500 text-sm">{CUSTOMERS.length} customers · {CUSTOMERS.filter(c => c.type === 'VIP').length} VIP</p>
                </div>
                <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">person_add</span> Add Customer
                </button>
            </div>

            {/* Search + Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-1 border-b border-slate-200">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>{t}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 w-64">
                    <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="bg-transparent text-sm text-primary outline-none w-full" />
                </div>
            </div>

            <div className="flex gap-6">
                {/* Table */}
                <div className={`bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden flex-1 ${detail ? 'hidden lg:block' : ''}`}>
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Customer</th>
                                <th className="text-left px-5 py-3">Contact</th>
                                <th className="text-left px-5 py-3">Purchases</th>
                                <th className="text-left px-5 py-3">Last Purchase</th>
                                <th className="text-left px-5 py-3">Total Value</th>
                                <th className="text-left px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} onClick={() => setDetail(c.id)} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors ${detail === c.id ? 'bg-primary/5' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold">{c.avatar}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{c.name}</p>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.type === 'VIP' ? 'bg-amber-100 text-amber-700' : c.type === 'Repeat' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{c.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5"><p className="text-sm text-slate-600">{c.phone}</p><p className="text-[10px] text-slate-400">{c.email}</p></td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-primary">{c.purchases}</td>
                                    <td className="px-5 py-3.5"><p className="text-sm text-slate-600">{c.lastPurchase}</p><p className="text-[10px] text-slate-400">{c.date}</p></td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-primary">{c.value}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1">
                                            <button className="p-1.5 hover:bg-green-50 rounded-lg" title="Call"><span className="material-symbols-outlined text-green-500 text-base">call</span></button>
                                            <button className="p-1.5 hover:bg-green-50 rounded-lg" title="WhatsApp"><span className="material-symbols-outlined text-green-600 text-base">chat</span></button>
                                            <button className="p-1.5 hover:bg-blue-50 rounded-lg" title="Email"><span className="material-symbols-outlined text-blue-500 text-base">mail</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {detail && selectedCustomer && (
                    <div className="w-full lg:w-80 bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] shrink-0">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold">{selectedCustomer.avatar}</div>
                            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <h3 className="font-bold text-primary font-display text-lg">{selectedCustomer.name}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedCustomer.type === 'VIP' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{selectedCustomer.type}</span>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600"><span className="material-symbols-outlined text-base text-slate-400">call</span>{selectedCustomer.phone}</div>
                            <div className="flex items-center gap-2 text-slate-600"><span className="material-symbols-outlined text-base text-slate-400">mail</span>{selectedCustomer.email}</div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Purchase History</p>
                            <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-sm font-semibold text-primary">{selectedCustomer.lastPurchase}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.date} · {selectedCustomer.value}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button className="h-9 bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"><span className="material-symbols-outlined text-sm">call</span>Call</button>
                            <button className="h-9 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"><span className="material-symbols-outlined text-sm">chat</span>WhatsApp</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
