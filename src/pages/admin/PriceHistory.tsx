import React, { useState } from 'react';

const VEHICLES = [
    { name: 'Hyundai Creta 2022', listed: '₹14.50L', market: '₹15.20L', sold: '₹14.00L', daysOnLot: 22, changes: [{ date: '01 Oct', price: '₹15.50L' }, { date: '10 Oct', price: '₹14.80L' }, { date: '20 Oct', price: '₹14.50L' }] },
    { name: 'Toyota Fortuner 2021', listed: '₹32.00L', market: '₹33.50L', sold: '—', daysOnLot: 35, changes: [{ date: '15 Sep', price: '₹34.00L' }, { date: '05 Oct', price: '₹33.00L' }, { date: '25 Oct', price: '₹32.00L' }] },
    { name: 'Tata Nexon 2023', listed: '₹9.85L', market: '₹10.50L', sold: '—', daysOnLot: 12, changes: [{ date: '18 Oct', price: '₹10.20L' }, { date: '25 Oct', price: '₹9.85L' }] },
    { name: 'Honda City 2020', listed: '₹11.25L', market: '₹11.80L', sold: '₹11.00L', daysOnLot: 45, changes: [{ date: '10 Sep', price: '₹12.50L' }, { date: '01 Oct', price: '₹11.80L' }, { date: '15 Oct', price: '₹11.25L' }] },
    { name: 'Maruti Swift 2022', listed: '₹6.25L', market: '₹6.80L', sold: '₹6.10L', daysOnLot: 18, changes: [{ date: '12 Oct', price: '₹6.50L' }, { date: '22 Oct', price: '₹6.25L' }] },
];

const PriceHistory = () => {
    const [selected, setSelected] = useState(VEHICLES[0].name);
    const vehicle = VEHICLES.find(v => v.name === selected)!;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Price History & Market Comparison</h1>
                <p className="text-slate-500 text-sm">Track price changes and compare with market rates.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Vehicle List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="p-4 border-b border-slate-100"><h2 className="font-bold text-primary font-display text-sm">Select Vehicle</h2></div>
                    <div className="divide-y divide-slate-50">
                        {VEHICLES.map(v => (
                            <button key={v.name} onClick={() => setSelected(v.name)} className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${selected === v.name ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-slate-50'}`}>
                                <div>
                                    <p className="text-sm font-semibold text-primary">{v.name}</p>
                                    <p className="text-xs text-slate-400">{v.daysOnLot} days on lot</p>
                                </div>
                                <span className="text-sm font-bold text-primary">{v.listed}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Comparison Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Listed Price</p>
                            <p className="text-xl font-black text-primary font-display">{vehicle.listed}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Market Average</p>
                            <p className="text-xl font-black text-blue-600 font-display">{vehicle.market}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{vehicle.sold !== '—' ? 'Sold Price' : 'Days on Lot'}</p>
                            <p className={`text-xl font-black font-display ${vehicle.sold !== '—' ? 'text-green-600' : 'text-amber-600'}`}>{vehicle.sold !== '—' ? vehicle.sold : vehicle.daysOnLot}</p>
                        </div>
                    </div>

                    {/* Price Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display text-sm mb-4">Price Adjustment Timeline</h3>
                        <div className="relative pl-6 space-y-4">
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                            {vehicle.changes.map((c, i) => (
                                <div key={i} className="relative flex items-center gap-4">
                                    <div className={`absolute left-[-16px] size-3 rounded-full border-2 ${i === vehicle.changes.length - 1 ? 'bg-accent border-accent' : 'bg-white border-slate-300'}`} />
                                    <div className="flex-1 flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                        <span className="text-xs text-slate-500">{c.date}</span>
                                        <span className="text-sm font-bold text-primary">{c.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggestion */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">lightbulb</span>
                        <div>
                            <p className="text-sm font-bold text-amber-800 mb-1">Price Suggestion</p>
                            <p className="text-xs text-amber-700">Based on market data, the current listing is <strong>₹{((parseFloat(vehicle.market.replace(/[₹,L]/g, '')) - parseFloat(vehicle.listed.replace(/[₹,L]/g, ''))).toFixed(2))}L below market</strong>. Consider this competitive pricing as it may attract quicker sales.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceHistory;
