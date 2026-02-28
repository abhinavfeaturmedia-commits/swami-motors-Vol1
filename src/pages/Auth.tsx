import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/admin');
    };

    return (
        <div className="min-h-[calc(100vh-72px)] flex">
            {/* Left Side - Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-100 to-slate-200 relative items-center justify-center p-16">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuA1XK2L7EpsFR7K_eosnwu-nObzshJ1Ty2a8myYaJLGxNfVRumnjS7qbstQgmr0orhubbj2qWZONaSEPe_N7kcPM_1QfK25z_ISQyqhepk7R2dKxgZkvCaLxu1sknYBEuc8ql5XtjjvTxpkgGtcvcz9YskEEhJWegVcLP20ML2BowuulsKcxPJys4ux6Vi6vSqWwbUnsgtemZ2KMzcaeJsz8ZDBvA8U6qYDVmNQ5ksSaho1Svizzl2FUtSrad_4n_fgXjaKl4oo-CEH')] bg-cover bg-center opacity-10 blur-sm" />
                </div>
                <div className="relative z-10 max-w-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-2xl">directions_car</span>
                        </div>
                        <h2 className="text-xl font-bold text-primary font-display">Shree Swami Samarth Motors</h2>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-primary font-display leading-tight mb-6">
                        Experience the premium journey.
                    </h1>
                    <p className="text-slate-600 text-lg leading-relaxed mb-8">
                        Access your garage, schedule services, and explore our exclusive inventory. Join thousands of satisfied customers in Kolhapur.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-accent text-lg">verified</span> Trusted Service</span>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-accent text-lg">build</span> Genuine Parts</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-primary font-display mb-2">Welcome Back</h2>
                        <p className="text-sm text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    {/* Login/Signup toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
                            <div className="flex">
                                <div className="shrink-0 h-12 px-4 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl flex items-center text-sm font-medium text-slate-600">
                                    +91
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Enter your mobile number"
                                        className="w-full h-12 border border-slate-200 rounded-r-xl px-4 text-sm text-primary placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all"
                                        required
                                    />
                                    <Smartphone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            Get OTP
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                            <div className="relative flex justify-center text-xs"><span className="bg-white px-4 text-slate-400 uppercase tracking-wide font-medium">Or Continue With</span></div>
                        </div>

                        <button type="button" className="w-full h-12 border-2 border-slate-200 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-primary hover:bg-slate-50 transition-colors">
                            <svg className="size-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Continue with Google
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        By continuing, you agree to our <a href="#" className="text-accent font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-accent font-semibold hover:underline">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
