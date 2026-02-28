import React, { useState } from 'react';

const LOGS = [
    { id: '1', user: 'Vikas Shinde', avatar: 'VS', action: 'Created', target: 'Lead — Rajesh Kumar', category: 'Leads', time: '28 Oct, 10:45 AM' },
    { id: '2', user: 'Amit Deshmukh', avatar: 'AD', action: 'Updated', target: 'Vehicle — Hyundai Creta 2022 (price)', category: 'Inventory', time: '28 Oct, 10:30 AM' },
    { id: '3', user: 'Priya Sharma', avatar: 'PS', action: 'Completed', target: 'Sale — Honda City 2020 to Sanjay Patil', category: 'Sales', time: '28 Oct, 09:15 AM' },
    { id: '4', user: 'Rahul Verma', avatar: 'RV', action: 'Added', target: 'Expense — AC repair ₹12,500 (Creta)', category: 'Finance', time: '27 Oct, 06:20 PM' },
    { id: '5', user: 'Vikas Shinde', avatar: 'VS', action: 'Approved', target: 'Commission — Amit D. ₹56,400', category: 'Finance', time: '27 Oct, 05:00 PM' },
    { id: '6', user: 'Sneha Kulkarni', avatar: 'SK', action: 'Scheduled', target: 'Test Drive — Priya D. (Fortuner)', category: 'Bookings', time: '27 Oct, 03:45 PM' },
    { id: '7', user: 'Amit Deshmukh', avatar: 'AD', action: 'Uploaded', target: 'Document — RC for Tata Nexon 2023', category: 'Documents', time: '27 Oct, 02:10 PM' },
    { id: '8', user: 'Vikas Shinde', avatar: 'VS', action: 'Deleted', target: 'Lead — Duplicate entry (Ravi P.)', category: 'Leads', time: '27 Oct, 11:30 AM' },
    { id: '9', user: 'Priya Sharma', avatar: 'PS', action: 'Edited', target: 'Customer — Meera Shah phone updated', category: 'CRM', time: '26 Oct, 04:50 PM' },
    { id: '10', user: 'Rahul Verma', avatar: 'RV', action: 'Generated', target: 'Report — Monthly Sales October', category: 'Reports', time: '26 Oct, 03:00 PM' },
];

const actionColors: Record<string, string> = { Created: 'text-green-600', Updated: 'text-blue-600', Completed: 'text-emerald-600', Added: 'text-purple-600', Approved: 'text-green-600', Scheduled: 'text-amber-600', Uploaded: 'text-blue-600', Deleted: 'text-red-600', Edited: 'text-blue-600', Generated: 'text-teal-600' };
const CATEGORIES = ['All', 'Leads', 'Inventory', 'Sales', 'Finance', 'Bookings', 'Documents', 'CRM', 'Reports'];

const AuditLogs = () => {
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = LOGS
        .filter(l => category === 'All' || l.category === category)
        .filter(l => l.target.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Audit Logs</h1>
                <p className="text-slate-500 text-sm">Track all actions performed by staff members.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase ${category === c ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary'}`}>{c}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-9 w-56">
                    <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-xs text-primary outline-none w-full" />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">User</th>
                            <th className="text-left px-5 py-3">Action</th>
                            <th className="text-left px-5 py-3">Target</th>
                            <th className="text-left px-5 py-3">Category</th>
                            <th className="text-left px-5 py-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(l => (
                            <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[9px] font-bold">{l.avatar}</div>
                                        <span className="text-sm font-medium text-primary">{l.user}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3"><span className={`text-xs font-bold ${actionColors[l.action]}`}>{l.action}</span></td>
                                <td className="px-5 py-3 text-sm text-slate-600">{l.target}</td>
                                <td className="px-5 py-3"><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">{l.category}</span></td>
                                <td className="px-5 py-3 text-xs text-slate-400">{l.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
