import React, { useState } from 'react';

const USERS = [
    { id: '1', name: 'Vikas Shinde', avatar: 'VS', email: 'vikas@sssmotors.com', phone: '+91 98765 43210', role: 'Admin', status: 'Active', lastLogin: '28 Oct, 10:30 AM' },
    { id: '2', name: 'Amit Deshmukh', avatar: 'AD', email: 'amit@sssmotors.com', phone: '+91 87654 32109', role: 'Sales', status: 'Active', lastLogin: '28 Oct, 09:15 AM' },
    { id: '3', name: 'Priya Sharma', avatar: 'PS', email: 'priya@sssmotors.com', phone: '+91 76543 21098', role: 'Sales', status: 'Active', lastLogin: '27 Oct, 06:45 PM' },
    { id: '4', name: 'Rahul Verma', avatar: 'RV', email: 'rahul@sssmotors.com', phone: '+91 65432 10987', role: 'Accountant', status: 'Active', lastLogin: '28 Oct, 08:00 AM' },
    { id: '5', name: 'Sneha Kulkarni', avatar: 'SK', email: 'sneha@sssmotors.com', phone: '+91 54321 09876', role: 'Sales', status: 'Inactive', lastLogin: '15 Oct, 03:20 PM' },
    { id: '6', name: 'Ravi Patil', avatar: 'RP', email: 'ravi@sssmotors.com', phone: '+91 43210 98765', role: 'Service', status: 'Active', lastLogin: '28 Oct, 07:45 AM' },
];

const roleColors: Record<string, string> = { Admin: 'bg-purple-100 text-purple-700', Sales: 'bg-blue-100 text-blue-700', Accountant: 'bg-green-100 text-green-700', Service: 'bg-amber-100 text-amber-700' };

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const filtered = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">User & Role Management</h1>
                    <p className="text-slate-500 text-sm">{USERS.filter(u => u.status === 'Active').length} active users · {USERS.length} total</p>
                </div>
                <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">person_add</span> Add User
                </button>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 w-72">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm text-primary outline-none w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(u => (
                    <div key={u.id} className={`bg-white rounded-2xl border p-5 shadow-[var(--shadow-card)] ${u.status === 'Inactive' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-11 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-sm">{u.avatar}</div>
                                <div>
                                    <p className="text-sm font-bold text-primary font-display">{u.name}</p>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                                </div>
                            </div>
                            <span className={`size-2.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} title={u.status} />
                        </div>
                        <div className="space-y-2 text-xs text-slate-500 mb-4">
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-slate-400">mail</span>{u.email}</div>
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-slate-400">call</span>{u.phone}</div>
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-slate-400">schedule</span>Last login: {u.lastLogin}</div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <button className="flex-1 h-8 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition-colors">Edit</button>
                            <button className={`flex-1 h-8 text-[10px] font-bold rounded-lg transition-colors ${u.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
