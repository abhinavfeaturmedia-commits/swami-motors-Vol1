import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CARS = [
    { id: '1', make: 'Hyundai', model: 'Creta', year: 2021, variant: 'SX 1.5 Petrol Automatic', price: 1450000, priceFormatted: '₹ 14.50 Lakh', emi: '₹24,450', mileage: '24,000', fuel: 'Petrol', transmission: 'Auto', photos: 8, badges: ['Certified', 'New Arrival'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_' },
    { id: '2', make: 'Honda', model: 'City', year: 2020, variant: 'ZX Diesel Manual', price: 1125000, priceFormatted: '₹ 11.25 Lakh', emi: '₹18,900', mileage: '45,000', fuel: 'Diesel', transmission: 'Manual', photos: 6, badges: ['Certified'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR', oldPrice: '₹ 11.75' },
    { id: '3', make: 'Tata', model: 'Nexon', year: 2022, variant: 'XZ+ Petrol Automatic', price: 985000, priceFormatted: '₹ 9.85 Lakh', emi: '₹16,500', mileage: '12,500', fuel: 'Petrol', transmission: 'Auto', photos: 5, badges: ['Certified'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAicROhp9Gf-xzl-F5bNh2DjhBvVjM0t7ucbZNljF7upz9rq-p_8ljMdlqSRXmjZxsHOjtv1vWKs0kT2eRkFpLeiVdeTU8gymd2DLYq1bpuInOt9hJ0FZS7-g-ezBysRMoUzjGsZGYiSggig69oaBm7r_EuJjqTACUVFkzJnfBp42eh4UhYn_xfstqiAmf_tJom5VsITEASM1Kk8hW62SLGl-qS58ebghm-p7UQV73CYWsT-4qFxseupM2iWsPL6uMYT34NG4TMH1-X' },
    { id: '4', make: 'Toyota', model: 'Fortuner', year: 2019, variant: '4×4 Diesel Automatic', price: 3250000, priceFormatted: '₹ 32.50 Lakh', emi: '₹54,200', mileage: '58,000', fuel: 'Diesel', transmission: 'Auto', photos: 8, badges: ['Certified'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH' },
    { id: '5', make: 'Maruti', model: 'Swift', year: 2020, variant: 'ZXi Plus Petrol', price: 645000, priceFormatted: '₹ 6.45 Lakh', emi: '₹10,800', mileage: '32,000', fuel: 'Petrol', transmission: 'Manual', photos: 5, badges: ['Value Pick'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR' },
    { id: '6', make: 'Renault', model: 'Kwid', year: 2021, variant: 'Climber AMT', price: 480000, priceFormatted: '₹ 4.80 Lakh', emi: '₹8,100', mileage: '18,000', fuel: 'Petrol', transmission: 'Auto', photos: 4, badges: ['Certified'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAicROhp9Gf-xzl-F5bNh2DjhBvVjM0t7ucbZNljF7upz9rq-p_8ljMdlqSRXmjZxsHOjtv1vWKs0kT2eRkFpLeiVdeTU8gymd2DLYq1bpuInOt9hJ0FZS7-g-ezBysRMoUzjGsZGYiSggig69oaBm7r_EuJjqTACUVFkzJnfBp42eh4UhYn_xfstqiAmf_tJom5VsITEASM1Kk8hW62SLGl-qS58ebghm-p7UQV73CYWsT-4qFxseupM2iWsPL6uMYT34NG4TMH1-X' },
];

const BRANDS = [
    { name: 'Maruti Suzuki', count: 12 },
    { name: 'Hyundai', count: 8 },
    { name: 'Tata', count: 6 },
    { name: 'Toyota', count: 4 },
];

const Inventory = () => {
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

    const toggleBrand = (brand: string) => {
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    };

    return (
        <div className="container-main py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="lg:w-[16.25rem] shrink-0">
                    <div className="sticky top-[5.5rem]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-primary font-display text-lg">Filters</h3>
                            <button className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors">Clear All</button>
                        </div>

                        {/* Price Range */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-[var(--shadow-card)]">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-primary text-sm">Price Range</h4>
                                <span className="text-xs text-slate-400">₹ Lakhs</span>
                            </div>
                            <input type="range" min="2" max="50" defaultValue="25" className="w-full accent-accent" />
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>₹2L</span><span>₹50L</span>
                            </div>
                        </div>

                        {/* Make & Model */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-[var(--shadow-card)]">
                            <h4 className="font-semibold text-primary text-sm mb-3 flex items-center justify-between">
                                Make & Model
                                <span className="material-symbols-outlined text-slate-400 text-lg">expand_less</span>
                            </h4>
                            <div className="space-y-2.5">
                                {BRANDS.map(b => (
                                    <label key={b.name} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedBrands.includes(b.name) ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}>
                                            {selectedBrands.includes(b.name) && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                        </div>
                                        <span className="text-sm text-slate-700 flex-1">{b.name}</span>
                                        <span className="text-xs text-slate-400">({b.count})</span>
                                        <input type="checkbox" className="hidden" checked={selectedBrands.includes(b.name)} onChange={() => toggleBrand(b.name)} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Year, Fuel, Transmission dropdowns */}
                        {['Year', 'Fuel Type', 'Transmission'].map(filter => (
                            <div key={filter} className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-[var(--shadow-card)]">
                                <h4 className="font-semibold text-primary text-sm flex items-center justify-between cursor-pointer">
                                    {filter}
                                    <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                                </h4>
                            </div>
                        ))}

                        <button className="w-full h-12 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm text-sm">
                            Apply Filters
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-primary font-display mb-2">Used Car Inventory</h1>
                        <p className="text-slate-500">Discover your perfect ride from our certified collection in Kolhapur.</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <p className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-100">
                            Showing <strong className="text-primary">45 Cars</strong>
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Sort by:</span>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-primary outline-none focus:ring-2 focus:ring-primary/10">
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="mileage">Lowest Mileage</option>
                                </select>
                            </div>
                            <div className="hidden sm:flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}>
                                    <span className="material-symbols-outlined text-lg">grid_view</span>
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}>
                                    <span className="material-symbols-outlined text-lg">view_list</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Car Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {CARS.map(car => (
                            <article key={car.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 group flex flex-col">
                                <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                                    <img alt={`${car.year} ${car.make} ${car.model}`} src={car.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {car.badges.map(badge => (
                                            <span key={badge} className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider text-white ${badge === 'New Arrival' ? 'bg-primary' : badge === 'Value Pick' ? 'bg-green-600' : 'bg-green-700'}`}>
                                                <span className="inline-flex items-center gap-1">{badge === 'Certified' && <span className="material-symbols-outlined text-xs">verified</span>}{badge}</span>
                                            </span>
                                        ))}
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 shadow-sm backdrop-blur-sm transition-colors">
                                        <span className="material-symbols-outlined text-lg">favorite</span>
                                    </button>
                                    <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">photo_library</span> {car.photos} Photos
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-base font-bold text-primary font-display">{car.year} {car.make} {car.model}</h3>
                                    <p className="text-xs text-slate-500 mb-3">{car.variant}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">speed</span>{car.mileage} km</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                        <span>{car.fuel}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                        <span>{car.transmission}</span>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xl font-black text-primary font-display">₹ {car.priceFormatted.replace('₹ ', '')}</span>
                                            {car.oldPrice && <span className="text-sm text-slate-400 line-through">{car.oldPrice}</span>}
                                        </div>
                                        <p className="text-[11px] text-accent font-medium mb-4">
                                            <span className="material-symbols-outlined text-xs align-text-top">trending_down</span> EMI starts @ {car.emi}/mo
                                        </p>
                                        <div className="flex gap-2">
                                            <Link to={`/car/${car.id}`} className="flex-1 h-10 flex items-center justify-center text-sm font-semibold text-primary border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                                View Details
                                            </Link>
                                            <Link to="/book-test-drive" className="flex-1 h-10 flex items-center justify-center text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-light transition-colors">
                                                Book Test Drive
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-10">
                        <button className="size-10 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        {[1, 2, 3, '...', 12].map((p, i) => (
                            <button key={i} className={`size-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${p === 1 ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                {p}
                            </button>
                        ))}
                        <button className="size-10 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
