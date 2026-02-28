import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const InventoryForm = () => {
    const [status, setStatus] = useState('Available');

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Add New Car</h1>
                    <p className="text-slate-500 text-sm">Fill in the vehicle details to create a premium listing.</p>
                </div>
                <Link to="/admin/inventory" className="text-sm font-semibold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Inventory
                </Link>
            </div>

            <form className="space-y-8">
                {/* Vehicle Identity & Pricing */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-accent">directions_car</span> Vehicle Identity & Pricing</h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Make</label>
                            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                <option>Select Make</option>
                                <option>Hyundai</option><option>Toyota</option><option>Tata</option><option>Honda</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Model</label>
                            <input type="text" placeholder="e.g., Creta" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Year</label>
                            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Variant</label>
                            <input type="text" placeholder="e.g., SX 1.5 Turbo" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Asking Price (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                                <input type="number" placeholder="e.g., 1450000" className="w-full h-11 border border-slate-200 rounded-xl pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">VIN / Chassis No.</label>
                            <input type="text" placeholder="Enter chassis number" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>
                </div>

                {/* Technical Specs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-accent">engineering</span> Technical Specifications</h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Fuel Type</label>
                            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                <option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transmission</label>
                            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                <option>Manual</option><option>Automatic</option><option>CVT</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Mileage (km)</label>
                            <input type="number" placeholder="e.g., 24000" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
                            <input type="text" placeholder="e.g., Polar White" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-accent">inventory_2</span> Inventory Status</h2>
                    <div className="flex gap-3">
                        {['Available', 'Reserved', 'Sold'].map(s => (
                            <button key={s} type="button" onClick={() => setStatus(s)} className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${status === s ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Media Upload */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-accent">image</span> High-Resolution Media</h2>
                    <p className="text-xs text-slate-500 mb-5">Upload at least 6 photos for a premium listing experience.</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                        <p className="text-sm font-medium text-slate-600 mb-1">Drag & drop photos or click to browse</p>
                        <p className="text-xs text-slate-400">PNG, JPG up to 10MB · Min 6, Max 20 photos</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="size-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300 text-xl">add_photo_alternate</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tip */}
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-accent text-xl shrink-0">lightbulb</span>
                    <div>
                        <p className="text-sm font-bold text-primary mb-1">Premium Listing Quality</p>
                        <p className="text-xs text-slate-600">Listings with 12+ photos, complete specs, and a video walkthrough get 3x more engagement. Upload exterior, interior, engine bay, and dashboard shots.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button type="button" className="h-11 px-6 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                        Save Draft
                    </button>
                    <div className="flex gap-3">
                        <button type="button" className="h-11 px-6 bg-slate-100 text-primary font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors">
                            Preview
                        </button>
                        <button type="submit" className="h-11 px-6 bg-accent text-primary font-bold rounded-xl text-sm hover:bg-accent-hover transition-all shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">publish</span> Confirm & Publish
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InventoryForm;
