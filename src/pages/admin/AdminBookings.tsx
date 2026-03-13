import React, { useState } from 'react';

const BOOKINGS = [
    { id: 'B001', type: 'Test Drive', customer: 'Rajesh Kumar', avatar: 'RK', phone: '+91 98765 43210', car: 'Hyundai Creta 2022', date: '27 Oct 2024', time: '10:30 AM', status: 'Confirmed' },
    { id: 'B002', type: 'Service', customer: 'Meera Shah', avatar: 'MS', phone: '+91 54321 09876', car: 'Maruti Swift 2022', date: '27 Oct 2024', time: '02:00 PM', status: 'Pending' },
    { id: 'B003', type: 'Test Drive', customer: 'Priya Deshmukh', avatar: 'PD', phone: '+91 87654 32109', car: 'Toyota Fortuner 2021', date: '28 Oct 2024', time: '11:00 AM', status: 'Confirmed' },
    { id: 'B004', type: 'Delivery', customer: 'Amit Joshi', avatar: 'AJ', phone: '+91 76543 21098', car: 'Tata Nexon 2023', date: '28 Oct 2024', time: '04:00 PM', status: 'In Progress' },
    { id: 'B005', type: 'Service', customer: 'Sanjay Patil', avatar: 'SP', phone: '+91 65432 10987', car: 'Honda City 2020', date: '29 Oct 2024', time: '09:00 AM', status: 'Pending' },
];

const statusColors: Record<string, string> = { 'Confirmed': 'bg-green-100 text-green-700', 'Pending': 'bg-amber-100 text-amber-700', 'In Progress': 'bg-blue-100 text-blue-700', 'Completed': 'bg-slate-200 text-slate-600', 'Cancelled': 'bg-red-100 text-red-700' };
const typeColors: Record<string, string> = { 'Test Drive': 'bg-purple-100 text-purple-700', 'Service': 'bg-blue-100 text-blue-700', 'Delivery': 'bg-green-100 text-green-700' };
const tabs = ['All Bookings', 'Test Drive', 'Service', 'Delivery'];

const AdminBookings = () => {
    const [activeTab, setActiveTab] = useState('All Bookings');
    const filtered = activeTab === 'All Bookings' ? BOOKINGS : BOOKINGS.filter(b => b.type === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Booking Management</h1>
                    <p className="text-slate-500 text-sm">Manage test drives, service appointments, and deliveries.</p>
                </div>
                <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> New Booking
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Today\'s Bookings', val: '5', icon: 'today', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Test Drives', val: '2', icon: 'directions_car', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Service Appts', val: '2', icon: 'build', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Deliveries', val: '1', icon: 'local_shipping', color: 'bg-green-500/10 text-green-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-2xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {tab} <span className="text-xs text-slate-400 ml-1">({tab === 'All Bookings' ? BOOKINGS.length : BOOKINGS.filter(b => b.type === tab).length})</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Booking ID</th>
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-left px-5 py-3">Customer</th>
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Date & Time</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(b => (
                            <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-mono text-slate-500">{b.id}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${typeColors[b.type]}`}>{b.type}</span></td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold">{b.avatar}</div>
                                        <div><p className="text-sm font-medium text-primary">{b.customer}</p><p className="text-[10px] text-slate-400">{b.phone}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-700">{b.car}</td>
                                <td className="px-5 py-3.5"><p className="text-sm text-primary font-medium">{b.date}</p><p className="text-[10px] text-slate-400">{b.time}</p></td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[b.status]}`}>{b.status}</span></td>
                                <td className="px-5 py-3.5">
                                    <div className="flex gap-1">
                                        <button className="p-1.5 hover:bg-green-50 rounded-lg" title="Confirm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span></button>
                                        <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Reschedule"><span className="material-symbols-outlined text-slate-400 text-lg">edit_calendar</span></button>
                                        <button className="p-1.5 hover:bg-red-50 rounded-lg" title="Cancel"><span className="material-symbols-outlined text-red-400 text-lg">cancel</span></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBookings;
