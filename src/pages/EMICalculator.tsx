import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EMICalculator = () => {
    const [loanAmount, setLoanAmount] = useState(1000000);
    const [interestRate, setInterestRate] = useState(9.5);
    const [tenureYears, setTenureYears] = useState(5);
    const [tenureMode, setTenureMode] = useState<'years' | 'months'>('years');

    const tenureMonths = tenureMode === 'years' ? tenureYears * 12 : tenureYears;
    const monthlyRate = interestRate / 100 / 12;
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - loanAmount;

    const principalPercent = (loanAmount / totalPayable) * 100;

    return (
        <div className="container-main py-12">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link to="/finance" className="hover:text-primary">Finance</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">EMI Calculator</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-black text-primary font-display mb-2">
                Estimate Your <span className="text-accent">Payments</span>
            </h1>
            <p className="text-slate-500 text-lg mb-10 max-w-xl">
                Calculate your monthly car loan payments easily. Adjust the loan amount, interest rate, and tenure to find a plan that suits your budget.
            </p>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Calculator */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-8 shadow-[var(--shadow-card)] space-y-8">
                    {/* Loan Amount */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">account_balance_wallet</span> Loan Amount
                            </label>
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                                <span className="text-sm text-slate-400">₹</span>
                                <input type="text" value={loanAmount.toLocaleString('en-IN')} onChange={e => setLoanAmount(parseInt(e.target.value.replace(/,/g, '')) || 0)} className="w-24 text-sm font-bold text-primary text-right outline-none bg-transparent" />
                            </div>
                        </div>
                        <input type="range" min={100000} max={5000000} step={50000} value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} className="w-full accent-accent" />
                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>₹1L</span><span>₹50L</span></div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">percent</span> Interest Rate
                            </label>
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                                <input type="text" value={interestRate} onChange={e => setInterestRate(parseFloat(e.target.value) || 0)} className="w-12 text-sm font-bold text-primary text-right outline-none bg-transparent" />
                                <span className="text-sm text-slate-400">%</span>
                            </div>
                        </div>
                        <input type="range" min={6} max={20} step={0.1} value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full accent-accent" />
                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>6%</span><span>20%</span></div>
                    </div>

                    {/* Tenure */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">date_range</span> Loan Tenure
                            </label>
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button onClick={() => setTenureMode('years')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tenureMode === 'years' ? 'bg-primary text-white' : 'text-slate-500'}`}>Years</button>
                                <button onClick={() => setTenureMode('months')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tenureMode === 'months' ? 'bg-primary text-white' : 'text-slate-500'}`}>Months</button>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7].map(y => (
                                <button key={y} onClick={() => setTenureYears(y)} className={`h-10 px-5 rounded-lg text-sm font-semibold transition-all ${tenureYears === y ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                                    {y}Y
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm text-slate-400">info</span>
                        <span>Interest rates are subject to change based on your credit score and the car model selected. <a href="#" className="text-accent font-semibold hover:underline">View current rates for all models.</a></span>
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Monthly EMI</p>
                        <p className="text-4xl font-black text-primary font-display">₹{Math.round(emi).toLocaleString('en-IN')}<span className="text-base font-medium text-slate-400">/month</span></p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        {/* Donut Chart */}
                        <div className="flex justify-center mb-6">
                            <div className="relative size-40">
                                <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0f1729" strokeWidth="3" strokeDasharray={`${principalPercent} ${100 - principalPercent}`} className="transition-all duration-500" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p>
                                    <p className="text-xl font-black text-primary font-display">₹{(totalPayable / 100000).toFixed(1)}L</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 rounded-full bg-primary" /> Principal Amount</span>
                                <span className="text-sm font-bold text-primary">₹{loanAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 rounded-full bg-slate-300" /> Total Interest</span>
                                <span className="text-sm font-bold text-primary">₹{Math.round(totalInterest).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <span className="text-sm font-bold text-primary">Total Payable</span>
                                <span className="text-lg font-black text-primary font-display">₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full h-12 bg-gradient-to-r from-accent to-amber-400 text-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg text-sm flex items-center justify-center gap-2">
                        Apply for Finance <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                    <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">bolt</span> Approval in as fast as 30 minutes
                    </p>
                </div>
            </div>

            {/* Cars within budget */}
            <section className="mt-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                    <div>
                        <h2 className="text-2xl font-black text-primary font-display">Cars within your budget</h2>
                        <p className="text-sm text-slate-500">Based on your calculated EMI range</p>
                    </div>
                    <Link to="/inventory" className="text-sm font-semibold text-primary hover:text-accent flex items-center gap-1">View all cars <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Hyundai Verna SX', type: 'Petrol • Automatic', price: '₹10.89 Lakh', tag: 'New Arrival' },
                        { name: 'Tata Nexon XZ+', type: 'Diesel • Manual', price: '₹11.50 Lakh' },
                        { name: 'Mahindra XUV700', type: 'Diesel • Automatic', price: '₹14.00 Lakh', tag: 'Best Seller' },
                    ].map((car, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all group">
                            <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_" alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                {car.tag && <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{car.tag}</span>}
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-primary font-display mb-1">{car.name}</h3>
                                <p className="text-xs text-slate-500 uppercase mb-3">{car.type}</p>
                                <div className="flex items-center justify-between">
                                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Starting at</p><p className="text-lg font-black text-primary font-display">{car.price}</p></div>
                                    <Link to="/inventory" className="text-accent hover:text-accent-hover"><span className="material-symbols-outlined">arrow_outward</span></Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default EMICalculator;
