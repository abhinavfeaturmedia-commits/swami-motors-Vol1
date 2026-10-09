import React, { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Contact = () => {
    const [form, setForm] = useState({ full_name: '', phone: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.full_name.trim() || !form.phone.trim()) {
            setError('Please fill in your name and phone number.');
            return;
        }

        setLoading(true);

        const { error: insertError } = await supabase.from('leads').insert({
            type: 'contact',
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            message: form.message.trim() || null,
            source: 'website_contact',
        });

        if (insertError) {
            setError('Something went wrong. Please call us directly or try again.');
        } else {
            setSubmitted(true);
        }
        setLoading(false);
    };

    return (
        <div className="container-main py-12">
            <h1 className="text-4xl font-black text-primary font-display mb-2">Get in Touch</h1>
            <p className="text-slate-500 text-lg mb-10">Visit our showroom or send us a message to experience premium service in Kolhapur.</p>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
                {/* Left: Map + Contact Info */}
                <div className="space-y-6">
                    <div className="doppelrand-shell rounded-3xl overflow-hidden shadow-sm">
                        <div className="doppelrand-core p-0 overflow-hidden bg-white">
                            <div className="aspect-[4/3] bg-slate-100 relative">
                                <iframe
                                    src="https://maps.google.com/maps?q=Shree%20Swami%20Samarth%20Motors,%20Kasaba%20Bawada,%20Kolhapur&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    loading="lazy"
                                    title="Location Map"
                                />
                                <a
                                    href="https://www.google.com/maps/dir/?api=1&destination=Shree+Swami+Samarth+Motors+Kasaba+Bawada+Kolhapur"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs shadow-md border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-primary flex items-center gap-2 hover:bg-white hover:scale-105 transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-amber-700 text-base">near_me</span> Open in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="doppelrand-shell rounded-3xl shadow-sm">
                        <div className="doppelrand-core p-6 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-primary font-display">Dealership Information</h3>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kolhapur Showroom
                                </span>
                            </div>

                            {[
                                { icon: <MapPin size={18} className="text-amber-800" />, label: 'Showroom Address', value: 'Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur, Maharashtra 416006', link: 'https://www.google.com/maps/dir/?api=1&destination=Shree+Swami+Samarth+Motors+Kasaba+Bawada+Kolhapur' },
                                { icon: <Phone size={18} className="text-amber-800" />, label: 'Phone Line', value: '+91 98232 37975', sub: 'Mon-Sun: 9:30 AM – 8:00 PM', link: 'tel:+919823237975' },
                                { icon: <Mail size={18} className="text-amber-800" />, label: 'Email', value: 'sales@swamisamarthmotors.com', link: 'mailto:sales@swamisamarthmotors.com' },
                            ].map(item => (
                                <a
                                    key={item.label}
                                    href={item.link}
                                    target={item.link.startsWith('http') ? '_blank' : undefined}
                                    rel="noreferrer"
                                    className="flex items-start gap-4 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                        <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">{item.value}</p>
                                        {item.sub && <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>}
                                    </div>
                                </a>
                            ))}

                            <div className="pt-3 border-t border-slate-100 flex gap-3">
                                <a
                                    href="https://wa.me/919823237975?text=Hello%20Shree%20Swami%20Samarth%20Motors,%20I%20have%20an%20inquiry."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 h-11 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#20bd5a] transition-all shadow-xs"
                                >
                                    <span className="material-symbols-outlined text-base">chat</span> WhatsApp Chat
                                </a>
                                <a
                                    href="tel:+919823237975"
                                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all"
                                >
                                    <Phone size={14} /> Call Showroom
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="doppelrand-shell rounded-3xl shadow-sm h-fit">
                    <div className="doppelrand-core p-7 sm:p-8">
                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="size-16 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
                                </div>
                                <h3 className="text-xl font-bold text-primary font-display mb-2">Message Delivered!</h3>
                                <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-sm mx-auto">
                                    Thank you, <strong className="text-slate-900">{form.full_name}</strong>. Our Kolhapur showroom desk will call you on <strong className="text-slate-900">+91 {form.phone}</strong> shortly.
                                </p>
                                <button
                                    onClick={() => { setSubmitted(false); setForm({ full_name: '', phone: '', email: '', message: '' }); }}
                                    className="h-11 px-6 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-colors cursor-pointer"
                                >
                                    Send Another Inquiry
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-black text-primary font-display mb-1">Direct Showroom Desk Message</h3>
                                <p className="text-xs text-slate-500 mb-6">Drop your details below for test drives, RC queries, or general vehicle questions.</p>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base shrink-0">error</span>{error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Full Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={e => set('full_name', e.target.value)}
                                            placeholder="e.g. Anand Kulkarni"
                                            className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                                                placeholder="98220 XXXXX"
                                                className="flex-1 h-11 border border-slate-200 rounded-r-xl px-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Email Address <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => set('email', e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            How Can We Help You?
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={form.message}
                                            onChange={e => set('message', e.target.value)}
                                            placeholder="Ask about car condition, exchange evaluation, loan approval..."
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white resize-none"
                                            disabled={loading}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                    >
                                        {loading ? (
                                            <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-base">send</span> Send Showroom Inquiry</>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
