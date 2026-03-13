import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

const TRUST_BADGES = [
    { icon: 'verified_user', title: '200-Point Check', desc: 'Certified Quality Standards' },
    { icon: 'payments', title: 'Fixed Price', desc: 'No Haggling, Just Value' },
    { icon: 'published_with_changes', title: '5-Day Return', desc: '100% Satisfaction Guarantee' },
    { icon: 'gpp_good', title: '1-Year Warranty', desc: 'Comprehensive Peace of Mind' },
];

const FRESH_ARRIVALS = [
    { id: '1', title: '2022 Premium SUV', price: '₹13.50 L', mileage: '24,500 km', transmission: 'Automatic', fuel: 'Petrol', owners: '1st Owner', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_', tag: 'New Arrival' },
    { id: '2', title: '2020 Executive Sedan', price: '₹9.80 L', mileage: '42,000 km', transmission: 'Manual', fuel: 'Petrol', year: '2020', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR' },
    { id: '3', title: '2021 Sport Crossover', price: '₹16.20 L', mileage: '18,200 km', transmission: 'Automatic', fuel: 'Diesel', status: 'Available', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAicROhp9Gf-xzl-F5bNh2DjhBvVjM0t7ucbZNljF7upz9rq-p_8ljMdlqSRXmjZxsHOjtv1vWKs0kT2eRkFpLeiVdeTU8gymd2DLYq1bpuInOt9hJ0FZS7-g-ezBysRMoUzjGsZGYiSggig69oaBm7r_EuJjqTACUVFkzJnfBp42eh4UhYn_xfstqiAmf_tJom5VsITEASM1Kk8hW62SLGl-qS58ebghm-p7UQV73CYWsT-4qFxseupM2iWsPL6uMYT34NG4TMH1-X', tag: 'Value Pick' },
    { id: '4', title: '2023 Luxury 4×4', price: '₹42.00 L', mileage: '8,400 km', transmission: 'Automatic', fuel: 'Diesel', bodyType: '4×4 Utility', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH' },
];

const Home = () => {
    return (
        <div className="w-full flex flex-col">
            {/* Hero Section — split layout */}
            <section className="relative overflow-hidden w-full bg-primary">
                <div className="container-main">
                    <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[32.5rem] py-12 lg:py-0">
                        {/* Left — copy + search */}
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-bold uppercase tracking-widest mb-6">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                Effortless Luxury Discovery
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-white leading-[1.08] tracking-tight font-display mb-5">
                                Discover Your<br />Dream Ride,<br />
                                <span className="text-accent">Effortlessly.</span>
                            </h1>

                            <p className="text-base text-slate-400 max-w-md leading-relaxed mb-8">
                                Experience the freedom of the open road with our meticulously curated collection of premium certified vehicles. Your next adventure starts here.
                            </p>

                            {/* Search filters */}
                            <div className="bg-white rounded-2xl p-5 shadow-xl max-w-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Budget Range</label>
                                        <select className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer">
                                            <option>Any Budget</option>
                                            <option>Under ₹5L</option>
                                            <option>₹5L - ₹10L</option>
                                            <option>₹10L - ₹20L</option>
                                            <option>₹20L - ₹50L</option>
                                            <option>₹50L+</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Preferred Brand</label>
                                        <select className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer">
                                            <option>All Brands</option>
                                            <option>Hyundai</option>
                                            <option>Toyota</option>
                                            <option>Tata</option>
                                            <option>Honda</option>
                                            <option>Maruti Suzuki</option>
                                            <option>Kia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Model Year</label>
                                        <select className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer">
                                            <option>Any Year</option>
                                            <option>2024</option>
                                            <option>2023</option>
                                            <option>2022</option>
                                            <option>2021</option>
                                            <option>2020</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <Link to="/inventory" className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
                                        <span className="material-symbols-outlined text-sm">tune</span> Advanced Filters
                                    </Link>
                                    <Link to="/inventory" className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-light transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-lg">search</span> Explore Inventory
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right — car images */}
                        <div className="hidden lg:flex flex-col gap-4 items-end relative">
                            <div className="rounded-2xl overflow-hidden shadow-2xl w-full max-w-md aspect-[4/3]">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH"
                                    alt="Premium luxury car"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Secondary card below */}
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full max-w-md">
                                <div className="size-20 rounded-xl overflow-hidden shrink-0">
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAicROhp9Gf-xzl-F5bNh2DjhBvVjM0t7ucbZNljF7upz9rq-p_8ljMdlqSRXmjZxsHOjtv1vWKs0kT2eRkFpLeiVdeTU8gymd2DLYq1bpuInOt9hJ0FZS7-g-ezBysRMoUzjGsZGYiSggig69oaBm7r_EuJjqTACUVFkzJnfBp42eh4UhYn_xfstqiAmf_tJom5VsITEASM1Kk8hW62SLGl-qS58ebghm-p7UQV73CYWsT-4qFxseupM2iWsPL6uMYT34NG4TMH1-X"
                                        alt="Performance car"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Curated Arrivals</span>
                                    <h3 className="text-white font-bold font-display text-lg leading-tight mt-1">Drive Beyond Boundaries</h3>
                                    <p className="text-white/60 text-xs mt-1">Premium Performance Series</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-14 bg-white border-b border-slate-100 w-full">
                <div className="container-main">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {TRUST_BADGES.map(f => (
                            <div key={f.title} className="flex flex-col items-center text-center gap-3 group cursor-default">
                                <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-accent shadow-sm border border-slate-100 group-hover:bg-accent group-hover:text-primary transition-all duration-300">
                                    <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary text-sm mb-0.5 font-display">{f.title}</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Fresh Arrivals */}
            <section className="py-16 w-full bg-slate-50">
                <div className="container-main">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-black text-primary font-display tracking-tight mb-2">Fresh Arrivals</h2>
                            <p className="text-slate-500">Hand-picked luxury vehicles newly added to our showroom.</p>
                        </div>
                        <Link to="/inventory" className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent transition-colors whitespace-nowrap">
                            Explore Entire Collection
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {FRESH_ARRIVALS.map((car) => (
                            <article key={car.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 group flex flex-col">
                                <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                                    <img alt={car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={car.img} />
                                    {car.tag && (
                                        <div className={`absolute top-3 left-3 ${car.tag === 'New Arrival' ? 'bg-primary' : 'bg-green-600'} text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider`}>
                                            {car.tag}
                                        </div>
                                    )}
                                    <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm">
                                        <Heart size={16} />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-primary font-display mb-2">{car.title}</h3>

                                    {/* Specs row */}
                                    <div className="flex items-center gap-3 mb-2 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">settings</span>{car.transmission}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">local_gas_station</span>{car.fuel}</span>
                                    </div>

                                    {/* Secondary info */}
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">speed</span>{car.mileage}</span>
                                        <span>{(car as any).owners || (car as any).year || (car as any).status || (car as any).bodyType || ''}</span>
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">Price</span>
                                            <p className="text-lg font-black text-primary font-display">{car.price}</p>
                                        </div>
                                        <Link to={`/car/${car.id}`} className="inline-flex items-center gap-1 bg-accent/10 hover:bg-accent text-accent hover:text-primary px-3.5 py-2 rounded-lg text-xs font-bold transition-all">
                                            View <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
