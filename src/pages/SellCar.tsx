import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, ChevronRight } from 'lucide-react';

const SellCar = () => {
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
                    <div className="flex gap-3 max-w-lg">
                        <input type="text" placeholder="MH09 AB 1234" className="flex-1 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-5 text-sm outline-none backdrop-blur focus:ring-2 focus:ring-accent/30" />
                        <button className="h-12 px-6 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all text-sm whitespace-nowrap">Get Instant Quote</button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-green-400">check_circle</span> 10,000+ Happy Customers in Kolhapur</p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 container-main">
                <h2 className="text-2xl font-bold text-primary font-display text-center mb-3">Why Sell to Us?</h2>
                <p className="text-slate-500 text-center mb-10">We make selling your car simple, safe, and speedy.</p>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: 'payments', title: 'Instant Payment', desc: "Don't wait. Bank transfer NEFT/IMPS on the spot, within minutes of deal finalization." },
                        { icon: 'description', title: 'RC Transfer Free', desc: 'We handle all the legal paperwork and RC transfer process at zero cost to you.' },
                        { icon: 'home', title: 'Doorstep Inspection', desc: 'Our experts come to your home or office anywhere in Kolhapur for a free evaluation.' },
                    ].map(b => (
                        <div key={b.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] text-center">
                            <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-accent text-2xl">{b.icon}</span>
                            </div>
                            <h3 className="font-bold text-primary font-display mb-2">{b.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-white">
                <div className="container-main">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Simple Process</p>
                            <h2 className="text-3xl font-black text-primary font-display mb-3">How it works</h2>
                            <p className="text-slate-500 mb-8">From quote to cash in just 3 simple steps. No haggling, no headaches.</p>
                            <Link to="/sell" className="text-sm font-bold text-primary flex items-center gap-1 hover:text-accent transition-colors">Start selling now <ArrowRight size={14} /></Link>
                        </div>
                        <div className="space-y-6">
                            {[
                                { icon: 'computer', title: 'Instant Online Quote', desc: 'Get an AI-driven estimated price range in seconds by entering your car details.' },
                                { icon: 'home', title: 'Free Home Evaluation', desc: 'We visit you in Kolhapur to inspect the car condition. It takes just 30 minutes.' },
                                { icon: 'payments', title: 'Same-Day Payment', desc: "Agree on the price? Money is transferred to your bank instantly." },
                            ].map((step, i) => (
                                <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-2xl p-5">
                                    <div className="size-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="material-symbols-outlined text-accent text-xl">{step.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary font-display mb-1">{step.title}</h4>
                                        <p className="text-sm text-slate-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 container-main">
                <h2 className="text-2xl font-bold text-primary font-display text-center mb-8">Frequently Asked Questions</h2>
                <div className="max-w-2xl mx-auto space-y-3">
                    {['What documents do I need to sell my car?', 'Is the home inspection chargeable?', 'How fast will I receive the payment?'].map(q => (
                        <div key={q} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all">
                            <span className="text-sm font-semibold text-primary">{q}</span>
                            <span className="material-symbols-outlined text-slate-400">expand_more</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default SellCar;
