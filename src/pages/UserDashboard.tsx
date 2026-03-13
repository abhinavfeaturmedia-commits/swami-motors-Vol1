import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings');
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'bookings', label: 'My Bookings', icon: 'event_note' },
        { id: 'shortlisted', label: 'Shortlisted Cars', icon: 'favorite' },
        { id: 'settings', label: 'Profile Settings', icon: 'settings' },
    ];

    return (
        <div className="container-main py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="lg:w-[15rem] shrink-0">
                    <div className="sticky top-[5.5rem] space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 px-3">Account Menu</p>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}>
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-primary font-display">User Dashboard</h1>
                            <p className="text-slate-500 text-sm">Welcome back, Rahul. Manage your premium automotive interests in Kolhapur.</p>
                        </div>
                        <Link to="/inventory" className="hidden sm:flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                            <span className="material-symbols-outlined text-lg">add</span> Browse New Cars
                        </Link>
                    </div>

                    {/* My Bookings */}
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-primary font-display flex items-center gap-2"><span className="material-symbols-outlined text-accent">event_note</span> My Bookings</h2>
                            <a href="#" className="text-sm font-semibold text-accent hover:underline">View all history</a>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_" alt="BMW M4" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="inline-flex items-center gap-1 bg-info-light text-info text-[10px] font-bold px-2 py-0.5 rounded-md uppercase mb-2"><span className="material-symbols-outlined text-xs">info</span> Test Drive Scheduled</span>
                                            <h3 className="text-lg font-bold text-primary font-display">2024 BMW M4 Competition</h3>
                                            <p className="text-sm text-slate-500">Scheduled for: 24th Oct, 2023 at 11:00 AM</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span> Kolhapur Showroom</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">person</span> Advisor: Vikram Singh</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                                            <button className="h-9 px-4 bg-slate-100 text-primary text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">Reschedule</button>
                                            <button className="text-sm font-semibold text-danger hover:underline">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Stepper */}
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between max-w-md mx-auto">
                                    {['Booked', 'Scheduled', 'Offer', 'Delivery'].map((step, i) => (
                                        <div key={step} className="flex items-center gap-0 flex-1">
                                            <div className="flex flex-col items-center">
                                                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    {i <= 1 ? <span className="material-symbols-outlined text-sm">check</span> : <span className="material-symbols-outlined text-sm">{['receipt', 'handshake', 'local_offer', 'key'][i]}</span>}
                                                </div>
                                                <p className={`text-[10px] font-bold mt-1.5 uppercase ${i <= 1 ? 'text-primary' : 'text-slate-400'}`}>{step}</p>
                                            </div>
                                            {i < 3 && <div className={`flex-1 h-0.5 mx-2 mt-[-16px] ${i < 1 ? 'bg-primary' : 'bg-slate-200'}`} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Shortlisted Cars */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-primary font-display flex items-center gap-2"><span className="material-symbols-outlined text-red-400">favorite</span> Shortlisted Cars</h2>
                            <span className="text-sm text-slate-400">Sort by: Price High to Low ▾</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: '2023 Range Rover Sport', price: '₹1,64,00,000', mileage: '1,200 km', fuel: 'Diesel', trans: 'Automatic', status: 'Available', tags: ['New Arrival'] },
                                { name: '2022 Porsche 911 Carrera', price: '₹1,86,00,000', mileage: '8,500 km', fuel: 'Petrol', trans: 'Manual', status: 'Sold', tags: [] },
                            ].map(car => (
                                <div key={car.name} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] flex flex-col md:flex-row gap-5">
                                    <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH" alt={car.name} className="w-full h-full object-cover" />
                                        <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-400"><span className="material-symbols-outlined text-lg">favorite</span></button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-primary font-display text-lg">{car.name}</h3>
                                                <p className="text-accent font-bold">{car.price}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${car.status === 'Available' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>{car.status}</span>
                                                {car.tags.map(t => <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-primary text-white">{t}</span>)}
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-xs text-slate-500 mb-4">
                                            <span><strong className="text-slate-700">Mileage</strong> {car.mileage}</span>
                                            <span><strong className="text-slate-700">Fuel</strong> {car.fuel}</span>
                                            <span><strong className="text-slate-700">Transmission</strong> {car.trans}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className={`flex-1 h-10 text-sm font-semibold rounded-xl transition-colors ${car.status === 'Available' ? 'bg-primary text-white hover:bg-primary-light' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                                                {car.status === 'Available' ? 'Contact Dealer' : 'Notify Similar'}
                                            </button>
                                            <Link to={`/car/1`} className="flex-1 h-10 flex items-center justify-center text-sm font-semibold border border-slate-200 rounded-xl text-primary hover:bg-slate-50 transition-colors">
                                                View {car.status === 'Sold' ? 'Specs' : 'Details'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Support Hub */}
            <div className="fixed bottom-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 bg-primary text-white rounded-2xl p-4 shadow-xl max-w-[12.5rem] z-50">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                    <p className="text-sm font-bold">Support Hub</p>
                </div>
                <p className="text-xs text-slate-300 mb-3">Need help with a booking?</p>
                <button className="w-full h-8 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors">Contact Dealer</button>
            </div>
        </div>
    );
};

export default UserDashboard;
