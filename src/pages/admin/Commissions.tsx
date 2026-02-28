import React from 'react';

const COMMISSIONS = [
    { name: 'Vikas Shinde', avatar: 'VS', role: 'GM', deals: 8, rate: '2.5%', earned: '₹96,250', paid: '₹72,000', pending: '₹24,250', status: 'Partial' },
    { name: 'Amit Deshmukh', avatar: 'AD', role: 'Senior Sales', deals: 6, rate: '2.0%', earned: '₹56,400', paid: '₹56,400', pending: '—', status: 'Paid' },
    { name: 'Priya Sharma', avatar: 'PS', role: 'Sales Exec', deals: 5, rate: '1.5%', earned: '₹33,150', paid: '₹33,150', pending: '—', status: 'Paid' },
    { name: 'Rahul Verma', avatar: 'RV', role: 'Sales Exec', deals: 4, rate: '1.5%', earned: '₹28,050', paid: '₹0', pending: '₹28,050', status: 'Unpaid' },
    { name: 'Sneha Kulkarni', avatar: 'SK', role: 'Junior Sales', deals: 3, rate: '1.0%', earned: '₹14,500', paid: '₹0', pending: '₹14,500', status: 'Unpaid' },
];

const statusColors: Record<string, string> = { Paid: 'bg-green-100 text-green-700', Partial: 'bg-amber-100 text-amber-700', Unpaid: 'bg-red-100 text-red-700' };

const Commissions = () => {
    const totalEarned = '₹2,28,350';
    const totalPaid = '₹1,61,550';
    const totalPending = '₹66,800';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Commission Tracker</h1>
                <p className="text-slate-500 text-sm">Calculate and track sales team commissions.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <div className="size-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 mb-3"><span className="material-symbols-outlined text-lg">payments</span></div>
                    <p className="text-2xl font-black text-primary font-display">{totalEarned}</p>
                    <p className="text-xs text-slate-400 font-medium">Total Earned</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <div className="size-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-600 mb-3"><span className="material-symbols-outlined text-lg">check_circle</span></div>
                    <p className="text-2xl font-black text-green-600 font-display">{totalPaid}</p>
                    <p className="text-xs text-slate-400 font-medium">Total Paid</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <div className="size-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 mb-3"><span className="material-symbols-outlined text-lg">pending</span></div>
                    <p className="text-2xl font-black text-amber-600 font-display">{totalPending}</p>
                    <p className="text-xs text-slate-400 font-medium">Total Pending</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Team Member</th>
                            <th className="text-left px-5 py-3">Deals</th>
                            <th className="text-left px-5 py-3">Rate</th>
                            <th className="text-left px-5 py-3">Earned</th>
                            <th className="text-left px-5 py-3">Paid</th>
                            <th className="text-left px-5 py-3">Pending</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMMISSIONS.map(c => (
                            <tr key={c.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold">{c.avatar}</div>
                                        <div><p className="text-sm font-medium text-primary">{c.name}</p><p className="text-[10px] text-slate-400">{c.role}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-bold text-primary">{c.deals}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-600">{c.rate}</td>
                                <td className="px-5 py-3.5 text-sm font-bold text-primary">{c.earned}</td>
                                <td className="px-5 py-3.5 text-sm text-green-600">{c.paid}</td>
                                <td className="px-5 py-3.5 text-sm text-amber-600 font-medium">{c.pending}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[c.status]}`}>{c.status}</span></td>
                                <td className="px-5 py-3.5">
                                    {c.status !== 'Paid' ? (
                                        <button className="h-7 px-3 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 transition-colors">Mark Paid</button>
                                    ) : (
                                        <span className="text-xs text-slate-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Commissions;
