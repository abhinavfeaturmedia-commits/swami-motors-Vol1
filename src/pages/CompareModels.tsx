import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CARS = [
    { id: '1', name: '2022 Hyundai Creta SX', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_', details: { type: 'SUV', year: '2022', price: '₹14.50 Lakh', engine: '1.5L Turbo Petrol', power: '150 BHP', torque: '253 Nm', transmission: 'Automatic', drivetrain: 'FWD', fuel: 'Petrol', mileage: '16.8 km/l', length: '4300mm', width: '1790mm', height: '1635mm', wheelbase: '2610mm', sunroof: '✓', cruise: '✓', reverse_cam: '✓', adas: '✗', } },
    { id: '2', name: '2022 Tata Nexon XZ+', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR', details: { type: 'SUV', year: '2022', price: '₹11.50 Lakh', engine: '1.2L Turbo Petrol', power: '120 BHP', torque: '170 Nm', transmission: 'Manual', drivetrain: 'FWD', fuel: 'Petrol', mileage: '17.4 km/l', length: '3993mm', width: '1811mm', height: '1606mm', wheelbase: '2498mm', sunroof: '✓', cruise: '✓', reverse_cam: '✓', adas: '✓', } },
];

const SECTIONS = [
    { title: 'Vehicle Details', rows: [{ key: 'type', label: 'Body Type' }, { key: 'year', label: 'Year' }, { key: 'price', label: 'Price' }] },
    { title: 'Engine & Performance', rows: [{ key: 'engine', label: 'Engine' }, { key: 'power', label: 'Power' }, { key: 'torque', label: 'Torque' }, { key: 'transmission', label: 'Transmission' }, { key: 'drivetrain', label: 'Drivetrain' }, { key: 'fuel', label: 'Fuel Type' }, { key: 'mileage', label: 'Mileage' }] },
    { title: 'Dimensions', rows: [{ key: 'length', label: 'Length' }, { key: 'width', label: 'Width' }, { key: 'height', label: 'Height' }, { key: 'wheelbase', label: 'Wheelbase' }] },
    { title: 'Key Features', rows: [{ key: 'sunroof', label: 'Sunroof' }, { key: 'cruise', label: 'Cruise Control' }, { key: 'reverse_cam', label: 'Reverse Camera' }, { key: 'adas', label: 'ADAS' }] },
];

const CompareModels = () => {
    const [leftCar] = useState(CARS[0]);
    const [rightCar] = useState(CARS[1]);

    return (
        <div className="container-main py-12">
            <h1 className="text-3xl font-black text-primary font-display mb-2">Compare Models</h1>
            <p className="text-slate-500 mb-8">See how your top picks stack up side by side.</p>

            {/* Car Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10">
                {[leftCar, rightCar].map((car) => (
                    <div key={car.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] text-center">
                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-4">
                            <img src={car.img} alt={car.name} className="w-full h-full object-cover" />
                        </div>
                        <select className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-primary outline-none">
                            <option>{car.name}</option>
                        </select>
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="space-y-8">
                {SECTIONS.map(section => (
                    <div key={section.title}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-0.5 w-6 bg-accent rounded-full" />
                            <h2 className="text-lg font-bold text-primary font-display">{section.title}</h2>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[var(--shadow-card)]">
                            {section.rows.map((row, i) => {
                                const lVal = leftCar.details[row.key as keyof typeof leftCar.details];
                                const rVal = rightCar.details[row.key as keyof typeof rightCar.details];
                                return (
                                    <div key={row.key} className={`grid grid-cols-3 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                                        <div className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-primary flex items-center bg-slate-50/50">{lVal}</div>
                                        <div className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-400 text-center uppercase tracking-wide flex items-center justify-center bg-white border-x border-slate-50">{row.label}</div>
                                        <div className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-primary flex items-center justify-end bg-slate-50/50">{rVal}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 mt-8 mb-16">
                {[leftCar, rightCar].map(car => (
                    <Link key={car.id} to="/book-test-drive" className="h-12 flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors text-sm">
                        <span className="material-symbols-outlined text-lg">description</span> Request Brochure
                    </Link>
                ))}
            </div>

            {/* Confused */}
            <div className="bg-slate-50 rounded-2xl p-8 text-center mb-8">
                <h3 className="text-xl font-bold text-primary font-display mb-2">Still confused?</h3>
                <p className="text-slate-500 mb-6">Let our experts in Kolhapur help you choose the right car for your needs.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/contact" className="h-11 px-6 flex items-center gap-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors text-sm">Contact Us</Link>
                    <Link to="/contact" className="h-11 px-6 flex items-center gap-2 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all text-sm">Visit Showroom</Link>
                </div>
            </div>
        </div>
    );
};

export default CompareModels;
