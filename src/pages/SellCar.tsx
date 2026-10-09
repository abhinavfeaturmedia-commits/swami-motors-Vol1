import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, ChevronRight, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const POPULAR_BRANDS = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia'];

const SellCar = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        registration_no: '',
        car_make: '',
        car_model: '',
        car_year: String(new Date().getFullYear()),
        car_mileage: '',
        inspection_address: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [heroReg, setHeroReg] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

    const calculateEstimatedRange = () => {
        let basePrice = 7.5;
        const b = (form.car_make || '').toLowerCase();
        if (b.includes('maruti')) basePrice = 6.8;
        else if (b.includes('hyundai')) basePrice = 7.6;
        else if (b.includes('tata')) basePrice = 8.2;
        else if (b.includes('mahindra')) basePrice = 11.5;
        else if (b.includes('toyota')) basePrice = 14.0;
        else if (b.includes('honda')) basePrice = 8.5;
        else if (b.includes('kia')) basePrice = 11.0;

        const currentYear = new Date().getFullYear();
        const year = Number(form.car_year) || currentYear;
        const age = Math.max(0, currentYear - year);
        const ageDepreciation = Math.pow(0.91, age);

        const mileage = Number(form.car_mileage) || (age + 1) * 12000;
        const expectedMileage = (age + 1) * 12000;
        const mileageFactor = Math.max(0.78, Math.min(1.15, 1 - ((mileage - expectedMileage) / 220000)));

        const mid = basePrice * ageDepreciation * mileageFactor;
        const min = Math.max(1.2, Math.round(mid * 0.93 * 10) / 10);
        const max = Math.max(min + 0.4, Math.round(mid * 1.07 * 10) / 10);

        return { min: min.toFixed(1), max: max.toFixed(1) };
    };

    const handleHeroSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (heroReg.trim()) {
            set('registration_no', heroReg.trim().toUpperCase());
        }
        document.getElementById('sell-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleStep1Next = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.car_make.trim() || !form.car_model.trim()) {
            setError('Please enter your car make and model to calculate valuation.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.full_name.trim() || !form.phone.trim()) {
            setError('Please provide your name and phone number.');
            return;
        }

        setLoading(true);
        const regPlate = form.registration_no?.trim().toUpperCase();
        const range = calculateEstimatedRange();
        const details = [
            regPlate ? `Reg: ${regPlate}` : null,
            form.car_mileage ? `${Number(form.car_mileage).toLocaleString('en-IN')} KM` : null,
            `Est: ₹${range.min}L - ₹${range.max}L`,
            form.inspection_address ? `Doorstep: ${form.inspection_address}` : null
        ].filter(Boolean).join(' | ');

        const { error: err } = await supabase.from('leads').insert({
            type: 'sell_car',
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            car_make: form.car_make.trim() || null,
            car_model: form.car_model.trim() || null,
            car_year: form.car_year ? Number(form.car_year) : null,
            car_mileage: form.car_mileage ? Number(form.car_mileage) : null,
            notes: details,
            message: `Selling Car Inquiry [Estimated Kolhapur Valuation: ₹${range.min}L - ₹${range.max}L]: ${form.car_year} ${form.car_make} ${form.car_model} (${details})`,
            source: 'website_sell_car',
        });
        if (err) setError('Something went wrong. Please call us directly.');
        else setSubmitted(true);
        setLoading(false);
    };

    return (
        <div className="w-full">
            {/* Hero */}
            <section className="relative bg-primary overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />
                <div className="relative z-10 container-main py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 bg-accent text-primary text-xs font-bold px-3 py-1.5 rounded-lg mb-6 uppercase"><span className="material-symbols-outlined text-sm">verified</span> Best Price Guaranteed</span>
                    <h1 className="text-4xl lg:text-6xl font-black text-white font-display leading-tight mb-4">Sell your car in <span className="text-accent">30 minutes</span></h1>
                    <p className="text-slate-400 text-lg max-w-lg mb-8">Shree Swami Samarth Motors: Kolhapur's most trusted car buying service. Instant payment, free RC transfer.</p>
                    <form onSubmit={handleHeroSubmit} className="flex gap-3 max-w-lg">
                        <input
                            type="text"
                            value={heroReg}
                            onChange={e => setHeroReg(e.target.value.toUpperCase())}
                            placeholder="MH09 AB 1234"
                            className="flex-1 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-5 text-sm uppercase font-mono outline-none backdrop-blur focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                            type="submit"
                            className="h-12 flex items-center justify-center px-6 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all text-sm whitespace-nowrap border-0 cursor-pointer"
                        >
                            Get Instant Quote
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-green-400">check_circle</span> 10,000+ Happy Customers in Kolhapur</p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 container-main">
                <div className="text-center max-w-xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-amber-900 font-bold text-xs uppercase tracking-wider mb-3">
                        <Sparkles size={13} className="text-amber-600" /> Kolhapur's Premium Car Buyers
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-bold text-primary font-display mb-3">Why Sell to Shree Swami Samarth Motors?</h2>
                    <p className="text-slate-500 text-sm">We eliminate lowball dealers, middleman brokerage, and tedious RTO queues.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: 'payments', title: 'Instant On-The-Spot Payment', desc: "Direct IMPS / RTGS bank transfer within 15 minutes of finalizing the deal. No credit or deferred cheques." },
                        { icon: 'description', title: '100% Free RC Transfer', desc: 'Full legal RTO ownership transfer handling with comprehensive legal delivery memo protecting you against liabilities.' },
                        { icon: 'home', title: '30-Min Doorstep Inspection', desc: 'Our senior technicians visit your home or office anywhere across Kolhapur & Ichalkaranji with digital testing gear.' },
                    ].map(b => (
                        <div key={b.title} className="doppelrand-shell rounded-2xl group hover:-translate-y-1 transition-all duration-300">
                            <div className="doppelrand-core p-7 text-center h-full flex flex-col items-center">
                                <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-5 shadow-xs group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-amber-700 text-2xl">{b.icon}</span>
                                </div>
                                <h3 className="font-bold text-primary font-display text-lg mb-2">{b.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-slate-50 border-y border-slate-200/70">
                <div className="container-main">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
                                Transparent 3-Step Protocol
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-black text-primary font-display mb-4">From Free Quote to Cash in 30 Minutes</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Avoid answering 50 random calls from classifieds. We inspect your car at your convenience, offer verified market value, and transfer funds immediately.
                            </p>
                            <a href="#sell-form" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-all shadow-md">
                                Calculate Your Car's Worth <ArrowRight size={16} />
                            </a>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: '01', icon: 'calculate', title: 'Instant Online Range Valuation', desc: 'Select your make, model, year, and mileage to unlock real Kolhapur market price estimates.' },
                                { step: '02', icon: 'fact_check', title: 'Free 30-Min Doorstep Inspection', desc: 'Our certified engineer visits your location to check paint, mechanicals, and documentation.' },
                                { step: '03', icon: 'account_balance_wallet', title: 'Instant Bank Transfer & Legal Memo', desc: 'Agree on price and receive instant bank payment alongside our legal indemnity document.' },
                            ].map((s) => (
                                <div key={s.step} className="doppelrand-shell rounded-2xl">
                                    <div className="doppelrand-core p-5 flex items-start gap-4">
                                        <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 font-black text-sm flex items-center justify-center shrink-0">
                                            {s.step}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary font-display text-base mb-1">{s.title}</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Valuation & Booking Form Section */}
            <section id="sell-form" className="py-20 bg-white">
                <div className="container-main max-w-3xl">
                    <div className="doppelrand-shell rounded-3xl shadow-xl">
                        <div className="doppelrand-core p-7 md:p-10">
                            {submitted ? (
                                <div className="text-center py-8">
                                    <div className="size-18 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                                        <CheckCircle2 className="size-10 text-emerald-600" />
                                    </div>
                                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                                        Evaluation Registered
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-black text-primary font-display mb-2">Valuation Request Received!</h3>
                                    <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
                                        Thank you, <strong className="text-slate-900">{form.full_name}</strong>. Our senior evaluator is reviewing your <strong className="text-slate-900">{form.car_year} {form.car_make} {form.car_model}</strong> and will call you on <strong className="text-slate-900">+91 {form.phone}</strong>.
                                    </p>

                                    {/* Receipt Card */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left max-w-lg mx-auto mb-8">
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Vehicle</span>
                                            <span className="text-sm font-bold text-primary">{form.car_year} {form.car_make} {form.car_model}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-200">
                                            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Est. Market Value</span>
                                            <span className="text-sm font-black text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                                                ₹{calculateEstimatedRange().min} L – ₹{calculateEstimatedRange().max} L
                                            </span>
                                        </div>
                                        {form.registration_no && (
                                            <div className="flex items-center justify-between py-3 border-b border-slate-200">
                                                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Registration</span>
                                                <span className="text-sm font-mono font-bold text-slate-800">{form.registration_no}</span>
                                            </div>
                                        )}
                                        {form.inspection_address && (
                                            <div className="flex items-center justify-between pt-3">
                                                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Doorstep Location</span>
                                                <span className="text-sm text-slate-700 font-medium truncate max-w-[220px]">{form.inspection_address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                                        <a
                                            href={`https://wa.me/919823237975?text=${encodeURIComponent(`Hello Shree Swami Samarth Motors, I just submitted an evaluation request for my ${form.car_year} ${form.car_make} ${form.car_model} (Est: ₹${calculateEstimatedRange().min}L - ₹${calculateEstimatedRange().max}L). My name is ${form.full_name}.`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-12 px-6 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">chat</span> Instant WhatsApp Connect
                                        </a>
                                        <button
                                            onClick={() => {
                                                setSubmitted(false);
                                                setStep(1);
                                                setHeroReg('');
                                                setForm({ full_name: '', phone: '', registration_no: '', car_make: '', car_model: '', car_year: String(new Date().getFullYear()), car_mileage: '', inspection_address: '' });
                                            }}
                                            className="h-12 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                                        >
                                            Value Another Car
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Steps Header */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="size-7 rounded-full bg-accent/20 border border-accent text-amber-900 font-bold text-xs flex items-center justify-center">
                                                    {step}
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Step {step} of 2: {step === 1 ? 'Car Details & Live Valuation' : 'Inspection & Contact Details'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-slate-200'}`} />
                                                <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-slate-200'}`} />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-primary font-display">
                                            {step === 1 ? "Calculate Your Car's Instant Market Value" : "Schedule Your Free Doorstep Evaluation"}
                                        </h2>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {step === 1 ? "Accurate Kolhapur benchmark based on real recent dealership sale transactions." : "Zero fee, no obligation. Our technician arrives with digital diagnostics."}
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg shrink-0">error</span>{error}
                                        </div>
                                    )}

                                    {/* STEP 1: Vehicle & Valuation */}
                                    {step === 1 && (
                                        <form onSubmit={handleStep1Next} className="space-y-6">
                                            {/* Quick Brand Selector Pills */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                    Select Make / Brand <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {POPULAR_BRANDS.map(brand => {
                                                        const active = form.car_make.toLowerCase() === brand.toLowerCase();
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={brand}
                                                                onClick={() => set('car_make', brand)}
                                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                                    active
                                                                        ? 'bg-primary text-white border-primary shadow-xs'
                                                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                {brand}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={form.car_make}
                                                    onChange={e => set('car_make', e.target.value)}
                                                    required
                                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                    placeholder="Or type make (e.g. Volkswagen, Skoda, MG)"
                                                />
                                            </div>

                                            {/* Model & Variant */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                    Car Model & Variant <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.car_model}
                                                    onChange={e => set('car_model', e.target.value)}
                                                    required
                                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                    placeholder="e.g. Swift VXi, Creta 1.5 SX, Nexon XZ+ Petrol"
                                                />
                                            </div>

                                            {/* Year & Mileage */}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                        Registration Year
                                                    </label>
                                                    <select
                                                        value={form.car_year}
                                                        onChange={e => set('car_year', e.target.value)}
                                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                    >
                                                        {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                        Approx KMs Driven
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={form.car_mileage}
                                                        onChange={e => set('car_mileage', e.target.value)}
                                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                        placeholder="e.g. 45000"
                                                    />
                                                </div>
                                            </div>

                                            {/* Optional Registration Plate */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                    Vehicle Registration Number (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.registration_no}
                                                    onChange={e => set('registration_no', e.target.value.toUpperCase())}
                                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm uppercase font-mono outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                    placeholder="e.g. MH09 AB 1234"
                                                />
                                            </div>

                                            {/* Live Valuation Card Preview */}
                                            {form.car_make && (
                                                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-transparent border border-amber-300/60">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                        <div>
                                                            <div className="text-xs uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                                                                <Sparkles size={14} className="text-amber-700" /> Kolhapur Dealership Estimated Range
                                                            </div>
                                                            <div className="text-2xl font-black text-primary font-display mt-0.5">
                                                                ₹{calculateEstimatedRange().min} Lakh – ₹{calculateEstimatedRange().max} Lakh*
                                                            </div>
                                                        </div>
                                                        <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                                            High Demand Model
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        *Estimated benchmark for a clean condition vehicle. Final price locked during free doorstep inspection with instant IMPS payout.
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className="w-full h-13 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                                            >
                                                Next: Lock Valuation & Pick Inspection Date <ArrowRight size={16} />
                                            </button>
                                        </form>
                                    )}

                                    {/* STEP 2: Customer Details & Inspection Address */}
                                    {step === 2 && (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Car Summary Bar */}
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <div>
                                                    <div className="text-xs text-slate-500 font-medium">Selected Vehicle & Valuation</div>
                                                    <div className="text-sm font-bold text-primary">
                                                        {form.car_year} {form.car_make} {form.car_model} · <span className="text-amber-700">₹{calculateEstimatedRange().min}L - ₹{calculateEstimatedRange().max}L</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="text-xs font-bold text-primary underline hover:text-accent cursor-pointer"
                                                >
                                                    Edit Details
                                                </button>
                                            </div>

                                            {/* Name & Phone */}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                        Full Name <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.full_name}
                                                        onChange={e => set('full_name', e.target.value)}
                                                        required
                                                        disabled={loading}
                                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                        placeholder="e.g. Ramesh Patil"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                        Phone Number <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="flex">
                                                        <div className="shrink-0 h-11 px-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl flex items-center text-xs font-bold text-slate-600">
                                                            +91
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            value={form.phone}
                                                            onChange={e => set('phone', e.target.value)}
                                                            required
                                                            disabled={loading}
                                                            className="flex-1 h-11 border border-slate-200 rounded-r-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                            placeholder="98220 XXXXX"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inspection Address */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                                    Doorstep Inspection Area / Address in Kolhapur
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.inspection_address}
                                                    onChange={e => set('inspection_address', e.target.value)}
                                                    disabled={loading}
                                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                    placeholder="e.g. Tarabai Park, Rajarampuri, Nagala Park, Shiroli"
                                                />
                                            </div>

                                            {/* Trust Badges */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                                                    <span>No obligation to sell</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <Zap size={16} className="text-amber-600 shrink-0" />
                                                    <span>Instant IMPS on agreement</span>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    disabled={loading}
                                                    className="h-13 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 h-13 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                                                >
                                                    {loading ? (
                                                        <><span className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Scheduling…</>
                                                    ) : (
                                                        <>Confirm Free 30-Min Inspection <ArrowRight size={16} /></>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 container-main">
                <div className="text-center max-w-xl mx-auto mb-10">
                    <h2 className="text-2xl lg:text-3xl font-bold text-primary font-display mb-2">Frequently Asked Questions</h2>
                    <p className="text-slate-500 text-sm">Clear answers about selling your car in Kolhapur.</p>
                </div>
                <div className="max-w-2xl mx-auto space-y-3">
                    {[
                        { q: 'What documents do I need to sell my car?', a: 'You will need your original RC smart card, valid insurance, valid PUC certificate, PAN card, Aadhar card, and two passport-sized photographs. If there is an active loan, we also help obtain the bank NOC/foreclosure letter.' },
                        { q: 'Is the doorstep evaluation truly free of cost?', a: 'Yes, 100% free with zero obligation. If you choose not to sell after our inspection, you pay absolutely nothing.' },
                        { q: 'How fast do I receive payment in my bank account?', a: 'Instant payout. Once the inspection is verified and the sale agreement is signed, we initiate an immediate IMPS / RTGS transfer directly into your bank account before taking custody.' },
                        { q: 'Do you take full legal liability for the car post-sale?', a: 'Yes. We issue an official legal delivery memo & RTO indemnity undertaking immediately upon purchase. We manage the entire RTO RC transfer at zero cost to you.' }
                    ].map((faq, i) => (
                        <div key={faq.q} className="doppelrand-shell rounded-2xl">
                            <div
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="doppelrand-core p-5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-bold text-primary">{faq.q}</span>
                                    <span className="material-symbols-outlined text-slate-400 transition-transform duration-300 shrink-0" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                                        expand_more
                                    </span>
                                </div>
                                {openFaq === i && (
                                    <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default SellCar;
