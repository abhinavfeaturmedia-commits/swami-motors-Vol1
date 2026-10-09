import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPriceLakh } from '../lib/utils';

interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    mileage: number;
    condition: string;
    images: string[];
}

const SECTIONS = [
    { title: 'Vehicle Overview', rows: [{ key: 'year', label: 'Manufacturing Year' }, { key: 'price', label: 'Dealership Price' }, { key: 'condition', label: 'Condition Grade' }] },
    { title: 'Engine & Transmission', rows: [{ key: 'fuel_type', label: 'Fuel Type' }, { key: 'transmission', label: 'Gearbox / Transmission' }] },
    { title: 'Usage & Odometer', rows: [{ key: 'mileage', label: 'Verified Odometer' }] },
];

const CompareModels = () => {
    const [searchParams] = useSearchParams();
    const paramCarA = searchParams.get('carA') || '';
    const paramCarB = searchParams.get('carB') || '';

    const [inventory, setInventory] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [leftId, setLeftId] = useState('');
    const [rightId, setRightId] = useState('');
    const [highlightDiffsOnly, setHighlightDiffsOnly] = useState(false);

    useEffect(() => {
        const fetchInventory = async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select('id, make, model, year, price, fuel_type, transmission, mileage, condition, images')
                .in('status', ['available', 'reserved'])
                .order('created_at', { ascending: false });
            if (!error && data) {
                setInventory(data);
                
                const hasA = data.some((c: Car) => c.id === paramCarA);
                const hasB = data.some((c: Car) => c.id === paramCarB);

                if (hasA) {
                    setLeftId(paramCarA);
                } else if (data.length >= 1) {
                    setLeftId(data[0].id);
                }

                if (hasB) {
                    setRightId(paramCarB);
                } else if (data.length >= 2) {
                    const fallbackB = data.find((c: Car) => c.id !== (hasA ? paramCarA : data[0].id));
                    setRightId(fallbackB ? fallbackB.id : (data[1] ? data[1].id : ''));
                }
            }
            setLoading(false);
        };
        fetchInventory();
    }, [paramCarA, paramCarB]);

    const getPrimaryImage = (images: string[] | null) => {
        if (!images || images.length === 0) return 'https://placehold.co/800x500/slate/white?text=No+Photo';
        const img = images[0];
        if (img.startsWith('http')) return img;
        return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/car-images/${img}`;
    };

    const leftCar = inventory.find(c => c.id === leftId) || null;
    const rightCar = inventory.find(c => c.id === rightId) || null;

    const swapCars = () => {
        const temp = leftId;
        setLeftId(rightId);
        setRightId(temp);
    };

    const getVal = (car: Car | null, key: string): string => {
        if (!car) return '—';
        const val = (car as any)[key];
        if (val === undefined || val === null || val === '') return '—';
        if (key === 'price') return Number(val) > 0 ? `₹${formatPriceLakh(Number(val))} Lakh` : 'Price on Request';
        if (key === 'mileage') return `${Number(val).toLocaleString('en-IN')} km`;
        return String(val);
    };

    const isDifferent = (key: string): boolean => {
        if (!leftCar || !rightCar) return false;
        return (leftCar as any)[key] !== (rightCar as any)[key];
    };

    const getAdvantageBadge = (car: 'left' | 'right', key: string) => {
        if (!leftCar || !rightCar) return null;
        if (key === 'price') {
            const pL = Number(leftCar.price);
            const pR = Number(rightCar.price);
            if (pL > 0 && pR > 0 && pL !== pR) {
                if (car === 'left' && pL < pR) {
                    const diff = Math.round((pR - pL) / 1000) / 100;
                    return <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full ml-1.5">Save ₹{diff}L</span>;
                }
                if (car === 'right' && pR < pL) {
                    const diff = Math.round((pL - pR) / 1000) / 100;
                    return <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full ml-1.5">Save ₹{diff}L</span>;
                }
            }
        }
        if (key === 'mileage') {
            const mL = Number(leftCar.mileage);
            const mR = Number(rightCar.mileage);
            if (mL > 0 && mR > 0 && mL !== mR) {
                if (car === 'left' && mL < mR) {
                    return <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full ml-1.5">{(mR - mL).toLocaleString('en-IN')} km less</span>;
                }
                if (car === 'right' && mR < mL) {
                    return <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full ml-1.5">{(mL - mR).toLocaleString('en-IN')} km less</span>;
                }
            }
        }
        if (key === 'year') {
            if (leftCar.year !== rightCar.year) {
                if (car === 'left' && leftCar.year > rightCar.year) {
                    return <span className="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full ml-1.5">+{leftCar.year - rightCar.year} yrs newer</span>;
                }
                if (car === 'right' && rightCar.year > leftCar.year) {
                    return <span className="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full ml-1.5">+{rightCar.year - leftCar.year} yrs newer</span>;
                }
            }
        }
        return null;
    };

    if (loading) {
        return <div className="container-main py-20 text-center text-slate-400 font-medium">Loading inventory comparison...</div>;
    }

    if (inventory.length < 2) {
        return (
            <div className="container-main py-20 text-center">
                <div className="size-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 mx-auto">
                    <span className="material-symbols-outlined text-3xl text-slate-300">compare</span>
                </div>
                <h2 className="text-xl font-bold text-primary font-display mb-2">Not Enough Cars to Compare</h2>
                <p className="text-slate-400 mb-6">We need at least 2 vehicles in inventory to enable the comparison tool.</p>
                <Link to="/inventory" className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">View Inventory</Link>
            </div>
        );
    }

    return (
        <div className="container-main py-12">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">Compare Models</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                        <Sparkles size={12} className="text-amber-600" /> Side-by-Side Evaluator
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black text-primary font-display">
                        Compare <span className="text-accent">Used Cars</span> Side by Side
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Analyze specifications, verified odometers, and pricing to find the perfect fit for your family.
                    </p>
                </div>

                {leftCar && rightCar && (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setHighlightDiffsOnly(!highlightDiffsOnly)}
                            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                highlightDiffsOnly
                                    ? 'bg-amber-500/15 border-accent text-amber-900'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            {highlightDiffsOnly ? 'Show All Specs' : 'Highlight Differences'}
                        </button>
                        <button
                            type="button"
                            onClick={swapCars}
                            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            title="Swap Cars"
                        >
                            <ArrowLeftRight size={14} /> Swap
                        </button>
                    </div>
                )}
            </div>

            {/* Car Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10">
                {[
                    { car: leftCar, id: leftId, setId: setLeftId, excludeId: rightId, side: 'left' as const },
                    { car: rightCar, id: rightId, setId: setRightId, excludeId: leftId, side: 'right' as const },
                ].map(({ car, id, setId, excludeId, side }, idx) => (
                    <div key={idx} className="doppelrand-shell rounded-3xl shadow-sm">
                        <div className="doppelrand-core p-5 sm:p-6 text-center">
                            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 mb-4 relative">
                                {car ? (
                                    <>
                                        <img src={getPrimaryImage(car.images)} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
                                        <div className="absolute top-2.5 left-2.5 bg-primary/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                                            ₹{formatPriceLakh(car.price)} Lakh
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-4xl">directions_car</span>
                                    </div>
                                )}
                            </div>

                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-left mb-1.5">
                                Select Vehicle {side === 'left' ? 'A' : 'B'}
                            </label>
                            <select
                                value={id}
                                onChange={e => setId(e.target.value)}
                                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs sm:text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10"
                            >
                                <option value="">— Select a Car —</option>
                                {inventory.filter(c => c.id !== excludeId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.year} {c.make} {c.model} (₹{formatPriceLakh(c.price)} L)
                                    </option>
                                ))}
                            </select>

                            {car && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100">
                                    <ShieldCheck size={14} className="shrink-0" />
                                    <span>200-Pt Certified · Kolhapur Stock</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            {leftCar && rightCar ? (
                <div className="space-y-6">
                    {SECTIONS.map(section => {
                        const visibleRows = highlightDiffsOnly
                            ? section.rows.filter(r => isDifferent(r.key))
                            : section.rows;

                        if (visibleRows.length === 0) return null;

                        return (
                            <div key={section.title} className="doppelrand-shell rounded-3xl overflow-hidden shadow-sm">
                                <div className="doppelrand-core p-0">
                                    <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-accent" />
                                        <h2 className="text-xs font-bold text-primary uppercase tracking-wider font-display">{section.title}</h2>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {visibleRows.map((row) => {
                                            const diff = isDifferent(row.key);
                                            return (
                                                <div
                                                    key={row.key}
                                                    className={`flex flex-col sm:grid sm:grid-cols-3 transition-colors ${
                                                        diff && highlightDiffsOnly ? 'bg-amber-500/5' : ''
                                                    }`}
                                                >
                                                    {/* Mobile Header Label */}
                                                    <div className="sm:hidden px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100/60 border-b border-slate-100 text-center">
                                                        {row.label}
                                                    </div>
                                                    <div className="flex sm:contents">
                                                        <div className="flex-1 sm:flex-initial px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-primary flex items-center justify-center sm:justify-start">
                                                            {getVal(leftCar, row.key)}
                                                            {getAdvantageBadge('left', row.key)}
                                                        </div>
                                                        <div className="hidden sm:flex px-2 sm:px-6 py-3.5 sm:py-4 text-[11px] font-bold text-slate-400 text-center uppercase tracking-wide items-center justify-center bg-slate-50/40 border-x border-slate-100">
                                                            {row.label}
                                                        </div>
                                                        <div className="flex-1 sm:flex-initial px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-primary flex items-center justify-center sm:justify-end border-l sm:border-l-0 border-slate-100">
                                                            {getVal(rightCar, row.key)}
                                                            {getAdvantageBadge('right', row.key)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-400 text-sm">Select two cars above to see the comparison.</div>
            )}

            {/* CTAs */}
            {leftCar && rightCar && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 mt-8 mb-14">
                    {[leftCar, rightCar].map(car => (
                        <div key={car.id} className="flex gap-2">
                            <Link
                                to={`/car/${car.id}`}
                                className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-white text-primary border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                            >
                                View {car.model}
                            </Link>
                            <Link
                                to={`/book-test-drive?car=${car.id}`}
                                className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors text-xs sm:text-sm shadow-xs"
                            >
                                <span className="material-symbols-outlined text-base">directions_car</span> Book Test Drive
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Kolhapur Advisor WhatsApp Consultation Card */}
            {leftCar && rightCar && (
                <div className="doppelrand-shell rounded-3xl mb-12">
                    <div className="doppelrand-core p-8 text-center max-w-xl mx-auto space-y-4">
                        <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-2xl">help</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-primary font-display">Still deciding between both cars?</h3>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                            Share this comparison directly with our Kolhapur car specialists on WhatsApp for unbiased guidance regarding maintenance costs and resale value.
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href={`https://wa.me/919823237975?text=${encodeURIComponent(`Hello Shree Swami Samarth Motors, I am comparing the ${leftCar.year} ${leftCar.make} ${leftCar.model} (₹${formatPriceLakh(leftCar.price)}L) vs ${rightCar.year} ${rightCar.make} ${rightCar.model} (₹${formatPriceLakh(rightCar.price)}L). Which one would you recommend for my family?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-11 px-6 rounded-xl bg-[#25D366] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-base">chat</span> Ask Our Experts on WhatsApp
                            </a>
                            <Link
                                to="/book-test-drive"
                                className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 transition-all"
                            >
                                Visit Showroom
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompareModels;
