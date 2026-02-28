import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const Contact = () => {
    return (
        <div className="container-main py-12">
            <h1 className="text-4xl font-black text-primary font-display mb-2">Get in Touch</h1>
            <p className="text-slate-500 text-lg mb-10">Visit our showroom or send us a message to experience premium service in Kolhapur.</p>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Left: Map + Contact Info */}
                <div className="space-y-6">
                    {/* Map */}
                    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-[var(--shadow-card)] bg-white">
                        <div className="aspect-[4/3] bg-slate-100 relative">
                            <iframe src="https://maps.google.com/maps?q=Shree%20Swami%20Samarth%20Motors,%20Kasaba%20Bawada,%20Kolhapur&t=&z=15&ie=UTF8&iwloc=&output=embed" className="w-full h-full border-0" allowFullScreen loading="lazy" title="Location Map" />
                            <button className="absolute bottom-4 right-4 bg-white shadow-md rounded-xl px-4 py-2 text-sm font-semibold text-primary flex items-center gap-2 hover:shadow-lg transition-shadow">
                                <span className="material-symbols-outlined text-accent text-lg">near_me</span> Get Directions
                            </button>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] space-y-5">
                        <h3 className="text-xl font-bold text-primary font-display">Contact Information</h3>
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-primary-light/10 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-0.5">Address</p>
                                <p className="text-sm text-slate-500">Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur, Maharashtra 416006</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-primary-light/10 flex items-center justify-center shrink-0">
                                <Phone size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-0.5">Phone</p>
                                <p className="text-sm font-bold text-primary">098232 37975</p>
                                <p className="text-xs text-slate-400">Mon-Sat: 9AM - 8PM</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-primary-light/10 flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-0.5">Email</p>
                                <p className="text-sm text-primary">sales@swamisamarthmotors.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Contact Form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-[var(--shadow-card)] h-fit">
                    <h3 className="text-2xl font-bold text-primary font-display mb-2">Send us a Message</h3>
                    <p className="text-sm text-slate-500 mb-6">Fill out the form below and our team will get back to you within 24 hours.</p>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                            <input type="text" placeholder="Enter your full name" className="w-full h-12 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                            <div className="flex">
                                <div className="shrink-0 h-12 px-4 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl flex items-center text-sm font-medium text-slate-500">+91</div>
                                <input type="tel" placeholder="98XXX XXXXX" className="flex-1 h-12 border border-slate-200 rounded-r-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                            <textarea rows={4} placeholder="I am interested in..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 resize-y" />
                        </div>
                        <button type="submit" className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors shadow-sm text-sm">
                            Send Message
                        </button>
                        <p className="text-xs text-slate-400 text-center">
                            By submitting this form, you agree to our <a href="#" className="text-primary hover:underline">privacy policy</a>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
