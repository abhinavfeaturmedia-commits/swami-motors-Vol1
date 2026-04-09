import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useData } from '../../contexts/DataContext';

const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-slate-200 text-slate-500',
};

const tabs = ['All Bookings', 'test_drive', 'service'];

const AdminBookings = () => {
    const { bookings, loading, refreshData } = useData();
    const [activeTab, setActiveTab] = useState('All Bookings');

    const updateStatus = async (id: string, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', id);
                
            if (error) {
                console.error('Failed to update status:', error);
                alert('Failed to update booking status');
            } else {
                refreshData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = activeTab === 'All Bookings'
        ? bookings
        : bookings.filter(b => b.booking_type === activeTab);

    const tabLabel = (tab: string) => {
        if (tab === 'All Bookings') return 'All Bookings';
        if (tab === 'test_drive') return 'Test Drive';
        if (tab === 'service') return 'Service';
        return tab;
    };

    const tabCount = (tab: string) =>
        tab === 'All Bookings' ? bookings.length : bookings.filter(b => b.booking_type === tab).length;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'TBA';
        // handle basic time formats or full ISO
        if (timeStr.includes('T')) {
            return new Date(timeStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
        return timeStr.substring(0, 5); // Return HH:mm if it's purely a time string
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Booking Schedule</h1>
                    <p className="text-slate-500 text-sm">Manage scheduled test drives and service appointments.</p>
                </div>
                <button onClick={refreshData} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                    <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Total Calendar Bookings', val: bookings.length, icon: 'today', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Test Drives', val: bookings.filter(b => b.booking_type === 'test_drive').length, icon: 'directions_car', color: 'bg-purple-500/10 text-purple-600' },
                    { label: 'Service Appts', val: bookings.filter(b => b.booking_type === 'service').length, icon: 'build', color: 'bg-amber-500/10 text-amber-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
                            <span className="material-symbols-outlined text-lg">{s.icon}</span>
                        </div>
                        <p className="text-2xl font-black text-primary font-display">{loading ? '...' : s.val}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {tabLabel(tab)} <span className="text-xs text-slate-400 ml-1">({tabCount(tab)})</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto min-h-[300px]">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-left px-5 py-3">Lead / Client</th>
                            <th className="text-left px-5 py-3">Vehicle Locked In</th>
                            <th className="text-left px-5 py-3">Slot Date & Time</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading bookings...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">event_note</span>
                                    <p className="text-slate-400 font-medium">No bookings yet</p>
                                    <p className="text-xs text-slate-300 mt-1">Bookings from the website will appear here.</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(b => (
                                <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${b.booking_type === 'test_drive' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {b.booking_type === 'test_drive' ? 'Test Drive' : 'Service'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {b.lead?.full_name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-primary line-clamp-1">{b.lead?.full_name || 'Deleted Lead'}</p>
                                                <p className="text-[10px] text-slate-400">{b.lead?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-700">
                                        {b.car ? `${b.car.year} ${b.car.make} ${b.car.model}`.trim() : <span className="text-slate-300 italic">No specific car</span>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-sm text-primary font-bold">{formatDate(b.booking_date)}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{formatTime(b.booking_time)}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <select 
                                            value={b.status || 'scheduled'} 
                                            onChange={(e) => updateStatus(b.id, b.status, e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded border-none cursor-pointer outline-none ${statusColors[b.status || 'scheduled'] || 'bg-slate-100 text-slate-500'}`}
                                        >
                                            <option value="scheduled">SCHEDULED</option>
                                            <option value="completed">COMPLETED</option>
                                            <option value="cancelled">CANCELLED</option>
                                            <option value="no_show">NO SHOW</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1">
                                            <a href={`tel:${b.lead?.phone}`} className="p-1.5 hover:bg-green-50 rounded-lg" title="Call">
                                                <span className="material-symbols-outlined text-green-500 text-lg">call</span>
                                            </a>
                                            <a href={`https://wa.me/91${b.lead?.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg" title="WhatsApp">
                                                <span className="material-symbols-outlined text-slate-400 text-lg">forum</span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBookings;
