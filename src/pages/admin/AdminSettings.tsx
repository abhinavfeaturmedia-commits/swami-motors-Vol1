import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminSettings = () => {
    const { settings, refreshData } = useData();

    const [businessProfile, setBusinessProfile] = useState({
        name: 'Shree Swami Samarth Motors',
        address: 'Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur',
        phone: '098232 37975',
        email: 'contact@sssmotors.com'
    });

    const [workingHours, setWorkingHours] = useState<Record<string, { start: string, end: string, status: string }>>({});
    
    const [notifications, setNotifications] = useState({ 
        newLead: true, 
        booking: true, 
        followUp: true, 
        stockAlert: false, 
        dailyReport: true 
    });

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sync from database on load
    useEffect(() => {
        if (settings.business_profile) {
            setBusinessProfile(settings.business_profile);
        }
        if (settings.working_hours) {
            setWorkingHours(settings.working_hours);
        } else {
            // Default Hours
            const defaultHours: any = {};
            DAYS.forEach(d => {
                defaultHours[d] = { start: '09:30', end: d === 'Saturday' ? '14:00' : '19:30', status: d === 'Saturday' ? 'Half Day' : 'Open' };
            });
            defaultHours['Sunday'] = { start: '', end: '', status: 'Closed' };
            setWorkingHours(defaultHours);
        }
        if (settings.notifications) {
            setNotifications(settings.notifications);
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upsert Business Profile
            await supabase.from('dealership_settings').upsert({ key: 'business_profile', value: businessProfile }, { onConflict: 'key' });
            // Upsert Working Hours
            await supabase.from('dealership_settings').upsert({ key: 'working_hours', value: workingHours }, { onConflict: 'key' });
            // Upsert Notifications
            await supabase.from('dealership_settings').upsert({ key: 'notifications', value: notifications }, { onConflict: 'key' });

            refreshData();
            
            setSaved(true); 
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            alert('Failed to sync settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleProfileChange = (key: string, val: string) => {
        setBusinessProfile(prev => ({ ...prev, [key]: val }));
    };

    const handleHourChange = (day: string, key: string, val: string) => {
        setWorkingHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [key]: val }
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Settings</h1>
                <p className="text-slate-500 text-sm">Manage your branch profiles globally synced across the system.</p>
            </div>

            {/* Business Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Business Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Business Name</label>
                        <input value={businessProfile.name} onChange={e => handleProfileChange('name', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                        <input value={businessProfile.email} onChange={e => handleProfileChange('email', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                        <input value={businessProfile.phone} onChange={e => handleProfileChange('phone', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Address</label>
                        <input value={businessProfile.address} onChange={e => handleProfileChange('address', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Operative Working Hours</h2>
                <div className="space-y-3">
                    {DAYS.map(day => {
                        const dayData = workingHours[day] || { start: '09:30', end: '19:30', status: 'Open' };
                        return (
                            <div key={day} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-700 w-28">{day}</span>
                                <input type="time" value={dayData.start} onChange={e => handleHourChange(day, 'start', e.target.value)} className="h-9 w-[120px] bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none" />
                                <span className="text-xs text-slate-400">to</span>
                                <input type="time" value={dayData.end} onChange={e => handleHourChange(day, 'end', e.target.value)} className="h-9 w-[120px] bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none" />
                                <select value={dayData.status} onChange={e => handleHourChange(day, 'status', e.target.value)} className={`h-9 border border-transparent rounded-lg px-2 text-xs font-bold outline-none cursor-pointer ${dayData.status === 'Half Day' ? 'bg-amber-100 text-amber-700' : dayData.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    <option value="Open">Open</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        )
                    })}
                    {/* Sunday specific */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 w-28">Sunday</span>
                        <select value={workingHours['Sunday']?.status || 'Closed'} onChange={e => handleHourChange('Sunday', 'status', e.target.value)} className="h-9 bg-red-100 text-red-700 border border-transparent rounded-lg px-2 text-xs font-bold outline-none cursor-pointer">
                            <option value="Closed">Closed</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Open">Open</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Global Preference Hooks</h2>
                <div className="space-y-4">
                    {[
                        { key: 'newLead', label: 'New Lead Alerts', desc: 'Get notified when a new lead is received' },
                        { key: 'booking', label: 'Booking Notifications', desc: 'Alerts for new test drive and service bookings' },
                        { key: 'followUp', label: 'Follow-Up Reminders', desc: 'Reminders for scheduled follow-ups via Tasks engine' },
                        { key: 'stockAlert', label: 'Stock Alerts', desc: 'Notify when inventory drops below threshold limits' },
                        { key: 'dailyReport', label: 'Daily Summary', desc: 'Receive a daily operative summary snapshot' },
                    ].map(n => (
                        <div key={n.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-primary">{n.label}</p>
                                <p className="text-xs text-slate-400">{n.desc}</p>
                            </div>
                            <button onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof notifications] }))} className={`relative w-11 h-6 rounded-full transition-colors ${notifications[n.key as keyof typeof notifications] ? 'bg-accent' : 'bg-slate-300'}`}>
                                <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${notifications[n.key as keyof typeof notifications] ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="h-10 px-8 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">{saved ? 'check' : saving ? 'sync' : 'save'}</span> {saved ? 'Synced!' : saving ? 'Saving...' : 'Sync Global Changes'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
