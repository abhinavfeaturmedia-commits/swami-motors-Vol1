import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const CAR_DATA: Record<string, any> = {
    '1': {
        make: 'Hyundai', model: 'Creta', variant: 'SX', year: 2021, price: '14.50', fuel: 'Petrol', transmission: 'Automatic', location: 'Kolhapur', odometer: '12,500 km', ownership: '1st Owner', engine: '1497 cc', body: 'SUV', insurance: "Valid till Nov '24", imgs: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_',
        ]
    },
};

const SPECS = [
    { icon: 'speed', label: 'Odometer', key: 'odometer' },
    { icon: 'person', label: 'Ownership', key: 'ownership' },
    { icon: 'local_gas_station', label: 'Fuel', key: 'fuel' },
    { icon: 'engineering', label: 'Engine', key: 'engine' },
    { icon: 'tune', label: 'Transmission', key: 'transmission' },
    { icon: 'calendar_month', label: 'Year', key: 'year' },
    { icon: 'directions_car', label: 'Body', key: 'body' },
    { icon: 'verified_user', label: 'Insurance', key: 'insurance' },
];

const INSPECTION = [
    { label: 'Engine Sound is Smooth', pass: true },
    { label: 'No Oil Leakage', pass: true },
    { label: 'AC Cooling is Effective', pass: true },
    { label: 'All Electricals Working', pass: true },
];

const CarDetails = () => {
    const { id } = useParams<{ id: string }>();
    const car = CAR_DATA[id || '1'] || CAR_DATA['1'];
    const [selectedImg, setSelectedImg] = useState(0);

    return (
        <div className="container-main py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link to="/inventory" className="hover:text-primary transition-colors">Used Cars</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">{car.make}: {car.model} {car.variant}</span>
            </nav>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Images */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Image */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[16/10]">
                        <img src={car.imgs[selectedImg]} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            Drag to rotate
                        </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {[...Array(6)].map((_, i) => (
                            <button key={i} onClick={() => setSelectedImg(0)} className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-accent shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
                                <img src={car.imgs[0]} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-primary font-display">{car.year} {car.make} {car.model} {car.variant}</h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <span>{car.fuel}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{car.transmission}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{car.location}</span>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div>
                        <h2 className="text-xl font-bold text-primary font-display mb-5">Car Specifications</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {SPECS.map(spec => (
                                <div key={spec.key} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[var(--shadow-card)]">
                                    <span className="material-symbols-outlined text-xl text-accent mb-2 block">{spec.icon}</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{spec.label}</p>
                                    <p className="text-sm font-bold text-primary">{String(car[spec.key] || 'N/A')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inspection Report */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-success-light rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-success">verified</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-primary font-display">Inspection Report</h3>
                                <p className="text-xs text-slate-500">150-Point Check Passed</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INSPECTION.map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="size-6 rounded-full bg-success-light flex items-center justify-center">
                                        <Check size={14} className="text-success" />
                                    </div>
                                    <span className="text-sm text-slate-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 text-sm font-semibold text-primary hover:text-accent flex items-center gap-1 transition-colors">
                            View Full Inspection Report <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Price Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[var(--shadow-card)] sticky top-[5.5rem]">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Total Price</p>
                                <p className="text-3xl font-black text-primary font-display">₹ {car.price}</p>
                                <p className="text-xl font-black text-primary font-display">Lakh</p>
                            </div>
                            <span className="bg-accent-light text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">Fixed Price</span>
                        </div>
                        <a href="#" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1 mb-6">
                            Calculate EMI Options <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                        <div className="space-y-3 mb-4">
                            <Link to="/book-test-drive" className="w-full h-12 flex items-center justify-center gap-2 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all shadow-sm text-sm">
                                <span className="material-symbols-outlined text-lg">directions_car</span> Book Test Drive
                            </Link>
                            <button className="w-full h-12 flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors text-sm">
                                <span className="material-symbols-outlined text-lg">shopping_cart</span> Buy Online
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                            <span className="material-symbols-outlined text-sm text-success">verified</span>
                            7-Day Money Back Guarantee
                        </div>
                    </div>

                    {/* Dealer Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-lg">storefront</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary">Shree Swami Samarth Motors</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-accent">location_on</span> Kasaba Bawada, Kolhapur, Maharashtra 416006
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-accent text-xl">support_agent</span>
                            <p className="text-sm font-bold text-primary">Need help?</p>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Talk to our car experts to get more details about this car.</p>
                        <a href="tel:09823237975" className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">call</span> Call 098232 37975
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarDetails;
