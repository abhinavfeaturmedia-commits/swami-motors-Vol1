import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, Heart, User, Menu, X, Phone, Mail, MapPin } from 'lucide-react';

const PublicLayout: React.FC = () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Inventory', path: '/inventory' },
        { name: 'Sell Car', path: '/sell' },
        { name: 'Services', path: '/services' },
        { name: 'Finance', path: '/finance' },
        { name: 'Contact', path: '/contact' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen flex flex-col w-full bg-background-light font-body antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
                <div className="container-main">
                    <div className="flex items-center justify-between h-16 sm:h-[4.5rem] gap-2 lg:gap-6">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
                            <div className="size-9 sm:size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-xl">directions_car</span>
                            </div>
                            <div className="block min-w-0 flex-1">
                                <h1 className="text-primary text-sm sm:text-lg font-bold leading-tight tracking-tight font-display truncate">
                                    <span className="xs:hidden">SSSM Motors</span>
                                    <span className="hidden xs:inline">Shree Swami Samarth Motors</span>
                                </h1>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.path)
                                        ? 'text-primary bg-slate-100 font-semibold'
                                        : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-3">
                            <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-xl px-4 h-10 border border-slate-100 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all min-w-[10rem] lg:min-w-[12.5rem]">
                                <Search size={16} className="text-slate-400 shrink-0" />
                                <input
                                    className="bg-transparent border-none text-sm text-primary placeholder:text-slate-400 w-full outline-none"
                                    placeholder="Search..."
                                />
                            </div>

                            <button className="hidden lg:flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors">
                                <Heart size={20} />
                            </button>
                            <Link to="/admin/login" className="hidden lg:flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                Admin
                            </Link>
                            <Link to="/auth" className="hidden sm:flex h-10 px-5 items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm">
                                <User size={16} />
                                Login
                            </Link>
                            <Link to="/auth" className="sm:hidden flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                                <User size={18} />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-[60] bg-white overflow-y-auto pt-4 pb-8 flex flex-col">
                            <nav className="flex flex-col gap-1 px-4">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${isActive(link.path)
                                            ? 'text-primary bg-slate-50 border-l-4 border-accent'
                                            : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3 px-6">
                                <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                    Staff Login
                                </Link>
                                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors shadow-lg">
                                    <User size={18} />
                                    Sign In / Register
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-primary text-white pt-12 sm:pt-16 pb-8 border-t border-primary-light/10">
                <div className="container-main">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                        {/* Brand */}
                        <div className="space-y-4 sm:space-y-6">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="size-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined font-bold">directions_car</span>
                                </div>
                                <h2 className="text-lg font-bold font-display leading-tight">Shree Swami Samarth Motors</h2>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                                Your trusted destination for quality pre-owned cars in Kolhapur. We bring you the best deals with certified assurance.
                            </p>
                            <div className="flex items-center gap-3">
                                {['facebook', 'instagram', 'twitter', 'youtube'].map(social => (
                                    <a key={social} href="#" className="size-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-primary transition-all duration-300">
                                        <span className="material-symbols-outlined text-lg">{social === 'youtube' ? 'play_circle' : social}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Explore */}
                        <div>
                            <h4 className="font-bold font-display text-base mb-5">Explore</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                {[
                                    { name: 'Current Inventory', path: '/inventory' },
                                    { name: 'Sell Your Car', path: '/sell' },
                                    { name: 'Financing Options', path: '/finance' },
                                    { name: 'Compare Models', path: '/compare' },
                                    { name: 'FAQ', path: '/faq' },
                                ].map(link => (
                                    <li key={link.path}>
                                        <Link to={link.path} className="hover:text-accent transition-colors">{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Our Services */}
                        <div>
                            <h4 className="font-bold font-display text-base mb-5">Our Services</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                {[
                                    { name: 'Car Insurance', path: '/insurance' },
                                    { name: 'Book a Test Drive', path: '/book-test-drive' },
                                    { name: 'Vehicle Service', path: '/services' },
                                    { name: 'Extended Warranty', path: '/faq' },
                                    { name: 'Car Detailing', path: '/services' },
                                ].map((link, i) => (
                                    <li key={i}>
                                        <Link to={link.path} className="hover:text-accent transition-colors">{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Visit Us */}
                        <div>
                            <h4 className="font-bold font-display text-base mb-5">Visit Us</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li className="flex items-start gap-3">
                                    <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                                    <span>Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur, Maharashtra 416006</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={16} className="text-accent shrink-0" />
                                    <span>098232 37975</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={16} className="text-accent shrink-0" />
                                    <span>sales@sssmotors.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10">
                    <div className="container-main py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} Shree Swami Samarth Motors. Effortless Discovery Since 2011.
                        </p>
                        <div className="flex gap-6 text-xs text-slate-500">
                            <a href="#" className="hover:text-accent transition-colors">Privacy</a>
                            <a href="#" className="hover:text-accent transition-colors">Terms</a>
                            <a href="#" className="hover:text-accent transition-colors">Sitemap</a>
                            <Link to="/admin/login" className="hover:text-accent transition-colors">Admin</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
