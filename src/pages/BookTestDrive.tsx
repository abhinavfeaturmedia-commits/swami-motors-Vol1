import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TIMES = {
    Morning: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    Afternoon: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM'],
    Evening: ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'],
};

const BookTestDrive = () => {
    const [selectedDate, setSelectedDate] = useState(27);
    const [selectedTime, setSelectedTime] = useState('10:30 AM');
    const currentMonth = 'October 2024';
    const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const dates = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="container-main py-10">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-8">
                {['Select Car', 'Date & Time', 'Confirmation'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                        <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                        <span className={`text-sm font-medium ${i <= 1 ? 'text-primary' : 'text-slate-400'}`}>{step}</span>
                        {i < 2 && <div className={`w-12 h-0.5 ${i < 1 ? 'bg-primary' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-primary font-display mb-1">Select Date & Time</h1>
                        <p className="text-slate-500 text-sm">Choose a convenient slot for your test drive at our Kolhapur showroom.</p>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-4">
                            <button className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400">chevron_left</span></button>
                            <h3 className="font-bold text-primary font-display">{currentMonth}</h3>
                            <button className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400">chevron_right</span></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {days.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for offset */}
                            <div /><div />
                            {dates.map(d => (
                                <button key={d} onClick={() => setSelectedDate(d)} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${d === selectedDate ? 'bg-primary text-white font-bold shadow-sm' : d < 25 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`} disabled={d < 25}>
                                    {d}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" /> Selected</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border" /> Available</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50" /> Unavailable</span>
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-4">Available Time Slots</h3>
                        {Object.entries(TIMES).map(([period, slots]) => (
                            <div key={period} className="mb-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-accent">{period === 'Morning' ? 'wb_sunny' : period === 'Afternoon' ? 'wb_cloudy' : 'wb_twilight'}</span>
                                    {period}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {slots.map(t => (
                                        <button key={t} onClick={() => setSelectedTime(t)} className={`h-9 px-4 rounded-lg text-sm font-medium transition-all ${selectedTime === t ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Personal Details */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-4">Your Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                                <input type="text" placeholder="Enter your name" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</label>
                                <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        </div>

                        <button className="mt-6 w-full h-12 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">event_available</span> Confirm Test Drive
                        </button>
                    </div>
                </div>

                {/* Car Info Sidebar */}
                <div className="space-y-4">
                    <div className="sticky top-[5.5rem]">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-4">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_" alt="Test Drive Car" className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-primary font-display text-lg mb-1">2022 Hyundai Creta SX</h3>
                            <p className="text-lg font-black text-primary font-display mb-3">₹14.50 Lakh</p>
                            <div className="flex items-center gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-xl text-accent">star</span>)}
                                <span className="text-xs text-slate-500 ml-2">4.8 (120 reviews)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[{ val: '1.5L', label: 'Engine' }, { val: 'Petrol', label: 'Fuel' }, { val: 'Auto', label: 'Trans' }].map(s => (
                                    <div key={s.label} className="bg-slate-50 rounded-lg py-2.5">
                                        <p className="text-xs font-bold text-primary">{s.val}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-4">
                            <h4 className="text-sm font-bold text-primary mb-2">📌 Showroom Location</h4>
                            <p className="text-xs text-slate-500">Shree Swami Samarth Motors, Tarabai Park, Kolhapur</p>
                            <a href="#" className="text-xs font-semibold text-accent hover:underline mt-2 inline-block">View on Map →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookTestDrive;
