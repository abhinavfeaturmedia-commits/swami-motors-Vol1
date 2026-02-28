import React from 'react';
import { Link, useParams } from 'react-router-dom';

const LeadDetail = () => {
    const { id } = useParams<{ id: string }>();

    const lead = {
        name: 'Rajesh Kumar', avatar: 'RK', phone: '+91 98765 43210', email: 'rajesh.k@gmail.com',
        location: 'Kolhapur, MH', car: 'Hyundai Creta SX 2022', budget: '₹14-16 Lakhs',
        source: 'Walk-in', status: 'Hot Lead', score: 85, date: '22 Oct 2024',
    };

    const timeline = [
        { icon: 'local_offer', title: 'Offer Sent', desc: 'Price quote of ₹14.5L shared via WhatsApp', time: '2 hours ago', color: 'bg-amber-500' },
        { icon: 'directions_car', title: 'Test Drive Completed', desc: 'Drove Hyundai Creta for 45 min. Positive feedback.', time: '1 day ago', color: 'bg-purple-500' },
        { icon: 'call', title: 'Follow-up Call', desc: 'Discussed financing options. Interested in 5-year EMI.', time: '2 days ago', color: 'bg-green-500' },
        { icon: 'person_add', title: 'Inquiry Received', desc: 'Walk-in inquiry for premium SUV segment.', time: '4 days ago', color: 'bg-blue-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Link to="/admin/leads" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-slate-400">arrow_back</span></Link>
                <h1 className="text-xl font-bold text-primary font-display">Lead Profile</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left - Profile & Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <div className="flex items-start gap-5">
                            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-2xl font-bold shadow-lg">{lead.avatar}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-black text-primary font-display">{lead.name}</h2>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-red-100 text-red-700">{lead.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span> {lead.location}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> Added {lead.date}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="relative inline-flex">
                                    <svg viewBox="0 0 36 36" className="size-14 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" /><circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${lead.score} ${100 - lead.score}`} /></svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-primary">{lead.score}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Lead Score</p>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-accent">call</span><div><p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p><p className="text-sm font-bold text-primary">{lead.phone}</p></div></div>
                            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-accent">mail</span><div><p className="text-[10px] text-slate-400 uppercase font-bold">Email</p><p className="text-sm font-bold text-primary">{lead.email}</p></div></div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">call</span> Log Call</button>
                            <button className="flex-1 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">chat</span> Send WhatsApp</button>
                            <button className="flex-1 h-10 bg-slate-100 text-primary text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">event</span> Schedule Visit</button>
                        </div>
                    </div>

                    {/* Vehicle Interest */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-accent">directions_car</span> Vehicle Interest</h3>
                        <div className="flex gap-6">
                            <div className="w-48 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_" alt={lead.car} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-primary font-display">{lead.car}</h4>
                                <p className="text-sm text-slate-500">Budget: <strong className="text-primary">{lead.budget}</strong></p>
                                <p className="text-sm text-slate-500">Source: <strong className="text-primary">{lead.source}</strong></p>
                                <Link to={`/car/1`} className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">View Car Details →</Link>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-accent">timeline</span> Interaction Timeline</h3>
                        <div className="space-y-6">
                            {timeline.map((event, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`size-10 rounded-xl ${event.color} flex items-center justify-center shrink-0`}><span className="material-symbols-outlined text-white text-lg">{event.icon}</span></div>
                                        {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-2" />}
                                    </div>
                                    <div className="pb-6">
                                        <h4 className="font-bold text-primary text-sm">{event.title}</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">{event.desc}</p>
                                        <p className="text-xs text-slate-400 mt-1">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Suggested Next Step */}
                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-accent">lightbulb</span><h4 className="font-bold text-primary text-sm">Suggested Next Step</h4></div>
                        <p className="text-sm text-slate-600 mb-3">Rajesh showed strong interest after the test drive. Send a follow-up WhatsApp with final pricing and financing options.</p>
                        <button className="w-full h-10 bg-accent text-primary font-bold rounded-xl text-sm hover:bg-accent-hover transition-all">Send Follow-up</button>
                    </div>

                    {/* Upcoming Task */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <h4 className="font-bold text-primary text-sm mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">task</span> Upcoming Task</h4>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-sm font-semibold text-primary">Final Negotiation Call</p>
                            <p className="text-xs text-slate-500 mt-1">Tomorrow, 11:00 AM</p>
                            <p className="text-xs text-slate-400 mt-1">Discuss final pricing and delivery timeline.</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <h4 className="font-bold text-primary text-sm mb-3"><span className="material-symbols-outlined text-accent text-sm align-text-bottom">location_on</span> Location Context</h4>
                        <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden">
                            <iframe src="https://maps.google.com/maps?q=Shree%20Swami%20Samarth%20Motors,%20Kasaba%20Bawada,%20Kolhapur&t=&z=15&ie=UTF8&iwloc=&output=embed" className="w-full h-full border-0" allowFullScreen loading="lazy" title="Location" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{lead.location} · 5km from showroom</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetail;
