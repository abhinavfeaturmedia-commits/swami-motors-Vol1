import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
    { id: 'general', icon: 'build', title: 'General Service', desc: 'Regular maintenance — oil change, filter replacement, fluid top-up, and 50-point checkup.' },
    { id: 'denting', icon: 'auto_fix_high', title: 'Denting & Painting', desc: 'Expert denting repairs and premium painting for your car body. We restore it to showroom condition.' },
    { id: 'ac', icon: 'ac_unit', title: 'AC Repair & Gas Filling', desc: 'Complete AC diagnostics, gas refill, compressor check, and cooling service by certified technicians.' },
    { id: 'wheel', icon: 'tire_repair', title: 'Wheel Alignment & Care', desc: 'Computerized wheel alignment, balancing, and tire rotation for a smooth, safe ride.' },
];

const ServiceBooking = () => {
    const [selected, setSelected] = useState<string[]>(['general']);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('10:00 AM');

    const toggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    return (
        <div className="container-main py-12">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">Schedule Service</span>
            </nav>

            <h1 className="text-3xl font-black text-primary font-display mb-2">Schedule Your Service</h1>
            <p className="text-slate-500 text-lg mb-10">Expert care for your vehicle at Kolhapur's most trusted service center.</p>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Services */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-primary font-display mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">checklist</span> Select Services
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 mb-10">
                        {SERVICES.map(s => (
                            <button key={s.id} onClick={() => toggle(s.id)} className={`text-left rounded-2xl border-2 p-5 transition-all ${selected.includes(s.id) ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 bg-white shadow-[var(--shadow-card)] hover:border-slate-200'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${selected.includes(s.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-xl">{s.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary font-display text-base mb-1">{s.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                                {selected.includes(s.id) && (
                                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                                        <span className="material-symbols-outlined text-sm">check_circle</span> Selected
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Why choose us */}
                    <div className="bg-slate-50 rounded-2xl p-8">
                        <h3 className="text-lg font-bold text-primary font-display mb-6">Why Choose Us?</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: 'verified', title: 'Genuine Parts', desc: 'Only OEM and company-approved spare parts.' },
                                { icon: 'engineering', title: 'Expert Mechanics', desc: '20+ years combined experience in Kolhapur.' },
                                { icon: 'schedule', title: 'On-Time Delivery', desc: 'We value your time—strict pickup/delivery.' },
                            ].map(w => (
                                <div key={w.title} className="flex flex-col items-center text-center">
                                    <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-accent text-xl">{w.icon}</span>
                                    </div>
                                    <h4 className="font-bold text-primary text-sm mb-1">{w.title}</h4>
                                    <p className="text-xs text-slate-500">{w.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Booking Sidebar */}
                <div>
                    <div className="sticky top-[5.5rem]">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] space-y-5">
                            <h3 className="font-bold text-primary font-display text-lg">Booking Details</h3>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Your Vehicle</label>
                                <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                    <option>Select Your Car</option>
                                    <option>Hyundai Creta 2021</option>
                                    <option>Honda City 2020</option>
                                    <option>Maruti Swift 2022</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Preferred Date</label>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Time Slot</label>
                                <div className="flex flex-wrap gap-2">
                                    {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(t => (
                                        <button key={t} onClick={() => setSelectedTime(t)} className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${selectedTime === t ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Order Summary</h4>
                                {selected.map(id => {
                                    const s = SERVICES.find(sv => sv.id === id);
                                    return s ? (
                                        <div key={id} className="flex items-center justify-between py-1.5">
                                            <span className="text-sm text-slate-700">{s.title}</span>
                                            <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                        </div>
                                    ) : null;
                                })}
                                {selected.length === 0 && <p className="text-xs text-slate-400 italic">No services selected</p>}
                            </div>

                            <button className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors text-sm flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">event_available</span> Confirm Booking
                            </button>
                            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-xs text-green-500">verified</span> Free vehicle pickup & drop
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceBooking;
