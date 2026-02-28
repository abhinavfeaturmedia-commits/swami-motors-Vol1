import React, { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminSettings = () => {
    const [businessName, setBusinessName] = useState('Shree Swami Samarth Motors');
    const [address, setAddress] = useState('Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur, Maharashtra 416006');
    const [phone, setPhone] = useState('098232 37975');
    const [email, setEmail] = useState('contact@sssmotors.com');
    const [saved, setSaved] = useState(false);

    const [notifications, setNotifications] = useState({ newLead: true, booking: true, followUp: true, stockAlert: false, dailyReport: true });

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Settings</h1>
                <p className="text-slate-500 text-sm">Manage your business profile, hours & notification preferences.</p>
            </div>

            {/* Business Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Business Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Business Name</label>
                        <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Address</label>
                        <input value={address} onChange={e => setAddress(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Working Hours</h2>
                <div className="space-y-3">
                    {DAYS.map(day => (
                        <div key={day} className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-700 w-28">{day}</span>
                            <input type="time" defaultValue="09:30" className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none" />
                            <span className="text-xs text-slate-400">to</span>
                            <input type="time" defaultValue={day === 'Saturday' ? '14:00' : '19:30'} className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none" />
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${day === 'Saturday' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{day === 'Saturday' ? 'Half Day' : 'Open'}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 w-28">Sunday</span>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Closed</span>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Notification Preferences</h2>
                <div className="space-y-4">
                    {[
                        { key: 'newLead', label: 'New Lead Alerts', desc: 'Get notified when a new lead is received' },
                        { key: 'booking', label: 'Booking Notifications', desc: 'Alerts for new test drive and service bookings' },
                        { key: 'followUp', label: 'Follow-Up Reminders', desc: 'Reminders for scheduled follow-ups' },
                        { key: 'stockAlert', label: 'Stock Alerts', desc: 'Notify when inventory drops below threshold' },
                        { key: 'dailyReport', label: 'Daily Summary', desc: 'Receive a daily performance summary email' },
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
                <button onClick={handleSave} className="h-10 px-8 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">{saved ? 'check' : 'save'}</span> {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
