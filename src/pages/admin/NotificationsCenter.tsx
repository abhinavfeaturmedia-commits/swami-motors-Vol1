import React, { useState } from 'react';

const NOTIFICATIONS = [
    { id: '1', title: 'New Lead Received', desc: 'Rajesh Kumar interested in Hyundai Creta 2022', time: '2 min ago', type: 'lead', read: false },
    { id: '2', title: 'Test Drive Booked', desc: 'Priya Deshmukh booked test drive for Toyota Fortuner — Tomorrow 11 AM', time: '15 min ago', type: 'booking', read: false },
    { id: '3', title: 'Follow-Up Overdue', desc: 'Amit Joshi follow-up was due yesterday — Tata Nexon XZ+', time: '1 hr ago', type: 'warning', read: false },
    { id: '4', title: 'Stock Alert', desc: 'Inventory below 10 vehicles. Consider restocking popular models.', time: '3 hrs ago', type: 'stock', read: true },
    { id: '5', title: 'Sale Completed', desc: 'Honda City 2020 sold to Sanjay Patil — ₹11.00L', time: '5 hrs ago', type: 'sale', read: true },
    { id: '6', title: 'Document Expiring', desc: 'Insurance for Toyota Fortuner expires in 15 days', time: '6 hrs ago', type: 'warning', read: true },
    { id: '7', title: 'New Review', desc: 'Meera Shah left a 5-star review on Google', time: '1 day ago', type: 'review', read: true },
    { id: '8', title: 'Commission Processed', desc: 'October commissions ready for Amit Deshmukh', time: '1 day ago', type: 'finance', read: true },
];

const typeIcons: Record<string, { icon: string; color: string }> = {
    lead: { icon: 'person_add', color: 'bg-blue-500/10 text-blue-600' },
    booking: { icon: 'event', color: 'bg-purple-500/10 text-purple-600' },
    warning: { icon: 'warning', color: 'bg-amber-500/10 text-amber-600' },
    stock: { icon: 'inventory', color: 'bg-red-500/10 text-red-600' },
    sale: { icon: 'shopping_cart', color: 'bg-green-500/10 text-green-600' },
    review: { icon: 'star', color: 'bg-amber-500/10 text-amber-600' },
    finance: { icon: 'currency_rupee', color: 'bg-teal-500/10 text-teal-600' },
};

const TABS = ['All', 'Unread', 'Leads', 'Bookings', 'Alerts'];

const NotificationsCenter = () => {
    const [tab, setTab] = useState('All');
    const [notifs, setNotifs] = useState(NOTIFICATIONS);

    const filtered = notifs.filter(n => {
        if (tab === 'All') return true;
        if (tab === 'Unread') return !n.read;
        if (tab === 'Leads') return n.type === 'lead';
        if (tab === 'Bookings') return n.type === 'booking';
        if (tab === 'Alerts') return n.type === 'warning' || n.type === 'stock';
        return true;
    });

    const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, read: true })));
    const unreadCount = notifs.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Notifications</h1>
                    <p className="text-slate-500 text-sm">{unreadCount} unread notifications</p>
                </div>
                <button onClick={markAllRead} className="h-10 px-5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined text-lg">done_all</span> Mark All Read
                </button>
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>{t}</button>
                ))}
            </div>

            <div className="space-y-2">
                {filtered.map(n => {
                    const ti = typeIcons[n.type];
                    return (
                        <div key={n.id} className={`bg-white rounded-2xl border p-4 flex items-start gap-4 transition-all cursor-pointer hover:shadow-sm ${!n.read ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100'}`}>
                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${ti.color}`}>
                                <span className="material-symbols-outlined text-lg">{ti.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm ${!n.read ? 'font-bold text-primary' : 'font-medium text-slate-700'}`}>{n.title}</p>
                                    {!n.read && <span className="size-2 rounded-full bg-accent shrink-0" />}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{n.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationsCenter;
