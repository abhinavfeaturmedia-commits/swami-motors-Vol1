import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPriceLakh, getPrimaryImage } from '../lib/utils';

interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    images: string[];
}

const PARTNER_BANKS = [
    { name: 'State Bank of India', rate: 8.75, tag: 'Lowest Govt ROI', icon: 'account_balance' },
    { name: 'HDFC Bank', rate: 8.90, tag: 'Fast Disbursal', icon: 'bolt' },
    { name: 'ICICI Bank', rate: 9.00, tag: 'Flexible Terms', icon: 'verified' },
    { name: 'Bank of Maharashtra', rate: 9.15, tag: 'Local PSU', icon: 'shield' },
];

const EMICalculator = () => {
    const [searchParams] = useSearchParams();
    const initialPrice = Number(searchParams.get('price')) || 1000000;

    const [calculationMode, setCalculationMode] = useState<'on_road' | 'direct_loan'>('on_road');
    const [carPrice, setCarPrice] = useState(initialPrice);
    const [downPaymentPct, setDownPaymentPct] = useState(20);
    const [loanAmount, setLoanAmount] = useState(Math.round(initialPrice * 0.8));
    const [interestRate, setInterestRate] = useState(8.9);
    const [tenureYears, setTenureYears] = useState(5);
    const [tenureMode, setTenureMode] = useState<'years' | 'months'>('years');
    const [selectedBank, setSelectedBank] = useState('HDFC Bank');

    // Sync loan amount when car price or down payment pct changes in on_road mode
    useEffect(() => {
        if (calculationMode === 'on_road') {
            const calculatedLoan = Math.max(50000, Math.round(carPrice * (1 - downPaymentPct / 100)));
            setLoanAmount(calculatedLoan);
        }
    }, [carPrice, downPaymentPct, calculationMode]);

    // ─── Budget cars ──────────────────────────────────────────────────────────
    const [budgetCars, setBudgetCars] = useState<Car[]>([]);
    const [carsLoading, setCarsLoading] = useState(false);

    // ─── Apply Form State ─────────────────────────────────────────────────────
    const [isApplying, setIsApplying] = useState(false);
    const [applyForm, setApplyForm] = useState({ full_name: '', phone: '', email: '', preferred_bank: 'HDFC Bank' });
    const [applyLoading, setApplyLoading] = useState(false);
    const [applySubmitted, setApplySubmitted] = useState(false);
    const [applyError, setApplyError] = useState('');

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplyError('');
        setApplyLoading(true);

        const { error: err } = await supabase.from('leads').insert({
            type: 'finance',
            full_name: applyForm.full_name.trim(),
            phone: applyForm.phone.trim(),
            email: applyForm.email.trim() || null,
            budget: `₹${(loanAmount / 100000).toFixed(2)}L`,
            message: `EMI Calculator Request: Loan of ₹${loanAmount.toLocaleString('en-IN')} over ${tenureYears} years at ${interestRate}%. Preferred Bank: ${applyForm.preferred_bank || selectedBank}. Estimated EMI: ₹${Math.round(emi).toLocaleString('en-IN')}/mo.`,
            source: 'website_finance',
        });

        if (err) {
            setApplyError('Failed to submit application. Please call us directly.');
        } else {
            await supabase.from('finance_services').insert({
                type: 'loan',
                full_name: applyForm.full_name.trim(),
                phone: applyForm.phone.trim(),
                email: applyForm.email.trim() || null,
                amount: loanAmount,
                tenure_months: tenureYears * 12,
                interest_rate: interestRate,
                provider_name: applyForm.preferred_bank.trim() || selectedBank,
                status: 'pending',
                notes: `Online EMI Calculator Application. Estimated EMI: ₹${Math.round(emi).toLocaleString('en-IN')}/mo.`
            });
            setApplySubmitted(true);
        }
        setApplyLoading(false);
    };

    const tenureMonths = tenureMode === 'years' ? tenureYears * 12 : tenureYears;
    const monthlyRate = interestRate / 100 / 12;
    const emi = monthlyRate > 0
        ? loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        : loanAmount / tenureMonths;
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - loanAmount;
    const principalPercent = (loanAmount / totalPayable) * 100;

    // ─── Fetch cars within budget ─────────────────────────────────────────────
    const fetchBudgetCars = useCallback(async (budget: number) => {
        setCarsLoading(true);
        const maxPrice = Math.round(budget * 1.3);
        const { data } = await supabase
            .from('inventory')
            .select('id, make, model, year, price, fuel_type, transmission, images')
            .in('status', ['available', 'reserved'])
            .lte('price', maxPrice)
            .order('price', { ascending: false })
            .limit(3);
        setBudgetCars(data || []);
        setCarsLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchBudgetCars(loanAmount), 600);
        return () => clearTimeout(timer);
    }, [loanAmount, fetchBudgetCars]);

    const handleBankSelect = (bank: typeof PARTNER_BANKS[0]) => {
        setSelectedBank(bank.name);
        setInterestRate(bank.rate);
        setApplyForm(prev => ({ ...prev, preferred_bank: bank.name }));
    };

    return (
        <div className="container-main py-12">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">EMI Calculator</span>
            </nav>

            <div className="max-w-2xl mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-amber-900 font-bold text-xs uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-sm">calculate</span> 100% Transparent Financial Calculator
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-primary font-display mb-2">
                    Estimate Your <span className="text-accent">Monthly Car EMI</span>
                </h1>
                <p className="text-slate-500 text-base lg:text-lg">
                    Calculate monthly installments, select partner bank interest rates in Kolhapur, and see your principal vs interest breakdown in real time.
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Calculator Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="doppelrand-shell rounded-3xl shadow-sm">
                        <div className="doppelrand-core p-6 sm:p-8 space-y-7">
                            {/* Calculation Mode Toggle */}
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalculationMode('on_road')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${calculationMode === 'on_road' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Car Price & Down Payment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalculationMode('direct_loan')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${calculationMode === 'direct_loan' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Direct Loan Amount
                                </button>
                            </div>

                            {/* Mode 1: Car Price + Down Payment % */}
                            {calculationMode === 'on_road' ? (
                                <>
                                    {/* Car On-Road Price */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-accent text-base">directions_car</span> Vehicle Budget / Price
                                            </label>
                                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1 border border-slate-200">
                                                <span className="text-xs text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="text"
                                                    value={carPrice.toLocaleString('en-IN')}
                                                    onChange={e => setCarPrice(parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                                    className="w-24 text-xs font-bold text-primary text-right outline-none bg-transparent"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min={200000}
                                            max={5000000}
                                            step={25000}
                                            value={carPrice}
                                            onChange={e => setCarPrice(Number(e.target.value))}
                                            className="w-full accent-accent cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[11px] text-slate-400 mt-1"><span>₹2 Lakh</span><span>₹50 Lakh</span></div>
                                    </div>

                                    {/* Down Payment Presets */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-accent text-base">savings</span> Down Payment: {downPaymentPct}% (₹{Math.round(carPrice * (downPaymentPct / 100)).toLocaleString('en-IN')})
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[10, 20, 30, 50].map(pct => (
                                                <button
                                                    key={pct}
                                                    type="button"
                                                    onClick={() => setDownPaymentPct(pct)}
                                                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                        downPaymentPct === pct
                                                            ? 'bg-primary text-white border-primary shadow-xs'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {pct}% {pct === 20 && '★'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                            <span>Net Financed Loan:</span>
                                            <strong className="text-primary font-bold">₹{loanAmount.toLocaleString('en-IN')}</strong>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Direct Loan Amount */
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-accent text-base">account_balance_wallet</span> Required Loan Amount
                                        </label>
                                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1 border border-slate-200">
                                            <span className="text-xs text-slate-400 font-bold">₹</span>
                                            <input
                                                type="text"
                                                value={loanAmount.toLocaleString('en-IN')}
                                                onChange={e => setLoanAmount(parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                                className="w-24 text-xs font-bold text-primary text-right outline-none bg-transparent"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={100000}
                                        max={5000000}
                                        step={50000}
                                        value={loanAmount}
                                        onChange={e => setLoanAmount(Number(e.target.value))}
                                        className="w-full accent-accent cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[11px] text-slate-400 mt-1"><span>₹1 Lakh</span><span>₹50 Lakh</span></div>
                                </div>
                            )}

                            {/* Partner Bank Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Compare Kolhapur Bank Lending Partners
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {PARTNER_BANKS.map(bank => {
                                        const isSelected = selectedBank === bank.name;
                                        return (
                                            <button
                                                key={bank.name}
                                                type="button"
                                                onClick={() => handleBankSelect(bank)}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-amber-500/10 border-accent ring-1 ring-accent'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="material-symbols-outlined text-base text-amber-700">{bank.icon}</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1 rounded">
                                                        {bank.rate}%
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold text-primary truncate">{bank.name}</div>
                                                <div className="text-[10px] text-slate-500">{bank.tag}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Interest Rate Custom Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-accent text-base">percent</span> Annual Interest Rate
                                    </label>
                                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1 border border-slate-200">
                                        <input
                                            type="text"
                                            value={interestRate}
                                            onChange={e => setInterestRate(parseFloat(e.target.value) || 0)}
                                            className="w-12 text-xs font-bold text-primary text-right outline-none bg-transparent"
                                        />
                                        <span className="text-xs text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={6}
                                    max={18}
                                    step={0.05}
                                    value={interestRate}
                                    onChange={e => setInterestRate(Number(e.target.value))}
                                    className="w-full accent-accent cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] text-slate-400 mt-1"><span>6.0%</span><span>18.0%</span></div>
                            </div>

                            {/* Tenure Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-accent text-base">date_range</span> Loan Tenure
                                    </label>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setTenureMode('years')}
                                            className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-all ${tenureMode === 'years' ? 'bg-primary text-white shadow-xs' : 'text-slate-500'}`}
                                        >
                                            Years
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTenureMode('months')}
                                            className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-all ${tenureMode === 'months' ? 'bg-primary text-white shadow-xs' : 'text-slate-500'}`}
                                        >
                                            Months
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 2, 3, 4, 5, 6, 7].map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => setTenureYears(y)}
                                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                tenureYears === y
                                                    ? 'bg-primary text-white border-primary shadow-xs'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {y} Year{y > 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-2.5 text-xs text-slate-500 border border-slate-100">
                                <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5">info</span>
                                <span>
                                    Indicative rates for Kolhapur used cars. Actual sanction depends on CIBIL score (750+ qualifies for prime rates) and vehicle age at maturity.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Right Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* EMI Output Card */}
                    <div className="doppelrand-shell rounded-3xl shadow-sm">
                        <div className="doppelrand-core p-6 space-y-6">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estimated Monthly EMI</span>
                                <div className="text-3xl sm:text-4xl font-black text-primary font-display">
                                    ₹{Math.round(emi).toLocaleString('en-IN')}
                                    <span className="text-sm font-bold text-slate-400">/mo*</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-2">
                                    <span className="material-symbols-outlined text-[12px]">verified</span> Rate: {interestRate}% via {selectedBank}
                                </span>
                            </div>

                            {/* Donut Chart */}
                            <div className="flex justify-center py-2">
                                <div className="relative size-36">
                                    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9"
                                            fill="none"
                                            stroke="#0f1729"
                                            strokeWidth="3"
                                            strokeDasharray={`${principalPercent} ${100 - principalPercent}`}
                                            className="transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Outlay</p>
                                        <p className="text-base font-black text-primary font-display">₹{(totalPayable / 100000).toFixed(2)}L</p>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Rows */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="size-2.5 rounded-full bg-primary" /> Principal Loan
                                    </span>
                                    <span className="font-bold text-primary">₹{loanAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="size-2.5 rounded-full bg-slate-300" /> Total Interest
                                    </span>
                                    <span className="font-bold text-amber-700">₹{Math.round(totalInterest).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <span className="font-bold text-primary">Total Amount Payable</span>
                                    <span className="text-sm font-black text-primary font-display">₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Direct WhatsApp Consultation */}
                            <a
                                href={`https://wa.me/919823237975?text=${encodeURIComponent(`Hello Shree Swami Samarth Motors, I calculated an EMI of ₹${Math.round(emi).toLocaleString('en-IN')}/mo on a loan of ₹${(loanAmount / 100000).toFixed(2)} Lakh (${tenureYears} yrs @ ${interestRate}% via ${selectedBank}). Can you assist with pre-approved loan options?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full h-11 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-xs"
                            >
                                <span className="material-symbols-outlined text-base">chat</span> Check Pre-Approved Loan via WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Finance Application Box */}
                    <div className="doppelrand-shell rounded-3xl">
                        <div className="doppelrand-core p-6">
                            {applySubmitted ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                                    <span className="material-symbols-outlined text-emerald-600 text-3xl mb-1 font-bold">check_circle</span>
                                    <h4 className="font-bold text-primary text-sm mb-1 font-display">Application Received!</h4>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Our finance desk will call +91 {applyForm.phone} with offers from {applyForm.preferred_bank || selectedBank}.
                                    </p>
                                    <button
                                        onClick={() => { setApplySubmitted(false); setApplyForm({ full_name: '', phone: '', email: '', preferred_bank: selectedBank }); }}
                                        className="text-xs font-bold text-primary underline"
                                    >
                                        Calculate Another Loan
                                    </button>
                                </div>
                            ) : isApplying ? (
                                <form onSubmit={handleApply} className="space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-primary text-xs uppercase tracking-wider font-display">Instant Finance Pre-Screen</h4>
                                        <button type="button" onClick={() => setIsApplying(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                                    </div>
                                    {applyError && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{applyError}</div>}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                                        <input required type="text" placeholder="e.g. Ramesh Patil" value={applyForm.full_name} onChange={e => setApplyForm(f => ({ ...f, full_name: e.target.value }))} className="w-full h-10 border border-slate-200 bg-white rounded-xl px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Phone Number *</label>
                                        <div className="flex">
                                            <span className="h-10 px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl flex items-center text-xs text-slate-500 font-bold">+91</span>
                                            <input required type="tel" placeholder="98220 XXXXX" value={applyForm.phone} onChange={e => setApplyForm(f => ({ ...f, phone: e.target.value }))} className="flex-1 h-10 border border-slate-200 bg-white rounded-r-xl px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Preferred Bank</label>
                                        <input type="text" value={applyForm.preferred_bank} onChange={e => setApplyForm(f => ({ ...f, preferred_bank: e.target.value }))} className="w-full h-10 border border-slate-200 bg-white rounded-xl px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20" />
                                    </div>
                                    <button type="submit" disabled={applyLoading} className="w-full h-11 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer">
                                        {applyLoading ? <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Lock Pre-Approved Interest Rate'}
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsApplying(true)}
                                    className="w-full h-12 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Apply for Fast Car Finance <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            )}
                            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 mt-2.5">
                                <span className="material-symbols-outlined text-xs text-amber-500">bolt</span> 30-Minute In-Principle Sanction Available
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cars within budget */}
            <section className="mt-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                    <div>
                        <h2 className="text-2xl font-black text-primary font-display">Inventory Matching Your Budget</h2>
                        <p className="text-sm text-slate-500">Pre-inspected Kolhapur vehicles under ₹{formatPriceLakh(loanAmount * 1.3)} Lakh</p>
                    </div>
                    <Link to="/inventory" className="text-xs sm:text-sm font-bold text-primary hover:text-accent flex items-center gap-1">
                        View Complete Inventory <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>

                {carsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="doppelrand-shell rounded-2xl animate-pulse">
                                <div className="doppelrand-core p-4">
                                    <div className="aspect-[16/10] bg-slate-100 rounded-xl mb-3" />
                                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : budgetCars.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">directions_car</span>
                        <p className="text-slate-500 font-medium">No cars in inventory match this specific budget range.</p>
                        <Link to="/inventory" className="mt-4 inline-flex items-center gap-2 h-10 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                            Browse All Cars
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {budgetCars.map(car => {
                            const carPriceNum = Number(car.price);
                            const approxEmi = Math.round((carPriceNum * 0.8) * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1));
                            return (
                                <Link
                                    key={car.id}
                                    to={`/car/${car.id}`}
                                    className="doppelrand-shell rounded-2xl group hover:-translate-y-1 transition-all duration-300 block"
                                >
                                    <div className="doppelrand-core p-3">
                                        <div className="relative aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden mb-3">
                                            <img
                                                src={getPrimaryImage(car.images)}
                                                alt={`${car.year} ${car.make} ${car.model}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2.5 left-2.5 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                                ₹{formatPriceLakh(car.price)} Lakh
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <h3 className="font-bold text-primary font-display text-sm mb-1 group-hover:text-accent transition-colors">
                                                {car.year} {car.make} {car.model}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">
                                                {car.fuel_type} • {car.transmission}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. EMI</span>
                                                    <span className="text-xs font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-full">
                                                        ₹{approxEmi.toLocaleString('en-IN')}/mo*
                                                    </span>
                                                </div>
                                                <span className="text-accent flex items-center text-xs font-bold">
                                                    View <span className="material-symbols-outlined text-sm ml-0.5">arrow_forward</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default EMICalculator;
