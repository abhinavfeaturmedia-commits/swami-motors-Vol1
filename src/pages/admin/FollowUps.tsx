import React, { useState } from 'react';

const FOLLOWUPS = [
    { id: '1', lead: 'Rajesh Kumar', avatar: 'RK', phone: '+91 98765 43210', car: 'Hyundai Creta 2022', type: 'Call', priority: 'Hot', time: '10:30 AM', status: 'Pending', overdue: false },
    { id: '2', lead: 'Priya Deshmukh', avatar: 'PD', phone: '+91 87654 32109', car: 'Toyota Fortuner', type: 'WhatsApp', priority: 'Hot', time: '11:00 AM', status: 'Pending', overdue: true },
    { id: '3', lead: 'Amit Joshi', avatar: 'AJ', phone: '+91 76543 21098', car: 'Tata Nexon XZ+', type: 'Visit', priority: 'Warm', time: '02:00 PM', status: 'Pending', overdue: false },
    { id: '4', lead: 'Meera Shah', avatar: 'MS', phone: '+91 54321 09876', car: 'Maruti Swift', type: 'Call', priority: 'Cold', time: '03:30 PM', status: 'Pending', overdue: false },
    { id: '5', lead: 'Sanjay Patil', avatar: 'SP', phone: '+91 65432 10987', car: 'Honda City ZX', type: 'Email', priority: 'Warm', time: '04:00 PM', status: 'Completed', overdue: false },
    { id: '6', lead: 'Ravi Shinde', avatar: 'RS', phone: '+91 12345 67890', car: 'Kia Seltos', type: 'Call', priority: 'Hot', time: 'Yesterday', status: 'Overdue', overdue: true },
];

const priorityColors: Record<string, string> = { Hot: 'bg-red-100 text-red-700', Warm: 'bg-amber-100 text-amber-700', Cold: 'bg-blue-100 text-blue-700' };
const typeIcons: Record<string, string> = { Call: 'call', WhatsApp: 'chat', Email: 'mail', Visit: 'directions_walk' };
const TABS = ['All', 'Pending', 'Completed', 'Overdue'];

const FollowUps = () => {
    const [tab, setTab] = useState('All');
    const filtered = tab === 'All' ? FOLLOWUPS : FOLLOWUPS.filter(f => f.status === tab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Follow-Up Manager</h1>
                    <p className="text-slate-500 text-sm">Today's follow-ups · {FOLLOWUPS.filter(f => f.status === 'Pending').length} pending · {FOLLOWUPS.filter(f => f.overdue).length} overdue</p>
                </div>
                <button className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> Add Follow-Up
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Today', val: FOLLOWUPS.length, icon: 'event', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Pending', val: FOLLOWUPS.filter(f => f.status === 'Pending').length, icon: 'pending', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Completed', val: FOLLOWUPS.filter(f => f.status === 'Completed').length, icon: 'check_circle', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Overdue', val: FOLLOWUPS.filter(f => f.overdue).length, icon: 'warning', color: 'bg-red-500/10 text-red-600' },
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
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {t} <span className="text-xs text-slate-400 ml-1">({t === 'All' ? FOLLOWUPS.length : FOLLOWUPS.filter(f => f.status === t).length})</span>
                    </button>
                ))}
            </div>

            {/* Follow-up Cards */}
            <div className="space-y-3">
                {filtered.map(f => (
                    <div key={f.id} className={`bg-white rounded-2xl border p-4 shadow-[var(--shadow-card)] flex items-center gap-4 ${f.overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xs font-bold shrink-0">{f.avatar}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-bold text-primary">{f.lead}</p>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${priorityColors[f.priority]}`}>{f.priority}</span>
                                {f.overdue && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">OVERDUE</span>}
                            </div>
                            <p className="text-xs text-slate-500">{f.car} · {f.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-base">{typeIcons[f.type]}</span>
                            <span className="font-medium">{f.type}</span>
                            <span className="text-slate-300">·</span>
                            <span>{f.time}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button className="p-2 hover:bg-green-50 rounded-xl" title="Mark Done"><span className="material-symbols-outlined text-green-500">check_circle</span></button>
                            <button className="p-2 hover:bg-blue-50 rounded-xl" title="Reschedule"><span className="material-symbols-outlined text-blue-500">schedule</span></button>
                            <button className="p-2 hover:bg-green-50 rounded-xl" title="Call Now"><span className="material-symbols-outlined text-green-600">call</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FollowUps;
