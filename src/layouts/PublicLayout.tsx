import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, User, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useInquiryCart } from '../contexts/InquiryCartContext';
import { InquiryCartDrawer } from '../components/ui/InquiryCartDrawer';
import { Chatbot } from '../components/Chatbot';
import { supabase } from '../lib/supabase';
import { getPrimaryImage, formatPriceLakh } from '../lib/utils';

interface SearchCarMatch {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    images: string[];
    condition: string;
}

const POPULAR_SEARCH_TAGS = [
    { label: '🚙 SUVs under 10L', path: '/inventory?body_type=SUV&budget=5to10' },
    { label: '⚡ Automatic', path: '/inventory?transmission=Automatic' },
    { label: '⛽ Diesel Cars', path: '/inventory?search=Diesel' },
    { label: '⭐ Under ₹5L', path: '/inventory?budget=under5' },
    { label: 'Maruti Suzuki', path: '/inventory?make=Maruti+Suzuki' },
    { label: 'Hyundai', path: '/inventory?make=Hyundai' },
];

const PublicLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchCarMatch[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    const { cartItems, setIsCartOpen } = useInquiryCart();
    const { user, profile } = useAuth();

    // ─── Showroom Live Status (Kasaba Bawada, Kolhapur IST) ─────────────────
    const showroomStatus = useMemo(() => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (3600000 * 5.5));
        const hours = ist.getHours() + (ist.getMinutes() / 60);
        const isOpen = hours >= 9.5 && hours < 20; // 9:30 AM to 8:00 PM
        return {
            isOpen,
            text: isOpen ? 'Open Today · 9:30 AM – 8:00 PM' : 'Opens Tomorrow 9:30 AM'
        };
    }, []);

    // ─── Live Search Query with Debounce ─────────────────────────────────────
    useEffect(() => {
        if (!searchVal.trim() || searchVal.trim().length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            const clean = searchVal.trim();
            const { data, error } = await supabase
                .from('inventory')
                .select('id, make, model, year, price, fuel_type, transmission, images, condition')
                .in('status', ['available', 'reserved'])
                .or(`make.ilike.%${clean}%,model.ilike.%${clean}%,fuel_type.ilike.%${clean}%`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error && data) {
                setSearchResults(data as SearchCarMatch[]);
            }
            setSearchLoading(false);
        }, 220);

        return () => clearTimeout(timer);
    }, [searchVal]);

    // Close search popover & more dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchContainerRef.current && 
                !searchContainerRef.current.contains(e.target as Node) &&
                mobileSearchRef.current &&
                !mobileSearchRef.current.contains(e.target as Node)
            ) {
                setSearchFocused(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                setMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile drawers and popovers on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setSearchFocused(false);
        setMoreMenuOpen(false);
    }, [location.pathname]);

    const primaryNavLinks = [
        { name: 'Inventory', path: '/inventory' },
        { name: 'Sell Car', path: '/sell' },
        { name: 'Accessories', path: '/accessories' },
        { name: 'Finance', path: '/finance' },
    ];

    const secondaryNavLinks = [
        { name: 'Services', path: '/services' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const navLinks = [
        { name: 'Home', path: '/' },
        ...primaryNavLinks,
        ...secondaryNavLinks
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleCarSelect = (carId: string) => {
        setSearchFocused(false);
        setSearchVal('');
        setMobileSearchOpen(false);
        navigate(`/car/${carId}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchVal.trim()) {
            setSearchFocused(false);
            setMobileSearchOpen(false);
            navigate(`/inventory?search=${encodeURIComponent(searchVal.trim())}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col w-full bg-background-light font-body antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
                <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-[4.5rem] gap-2 lg:gap-3 xl:gap-5">
                        {/* Logo & Showroom Subtitle */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
                                <div className="size-9 sm:size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                                    <span className="material-symbols-outlined text-xl">directions_car</span>
                                </div>
                                <div className="block min-w-0">
                                    <h1 className="text-primary text-xs xs:text-sm sm:text-base font-bold leading-tight tracking-tight font-display truncate">
                                        Shree Swami Samarth Motors
                                    </h1>
                                    <p className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
                                        <span className={`size-1.5 rounded-full shrink-0 ${showroomStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                                        <span>Kolhapur</span>
                                        <span className="hidden sm:inline text-slate-300">·</span>
                                        <span className="hidden sm:inline text-slate-500 font-normal">{showroomStatus.isOpen ? 'Open 9:30 AM – 8:00 PM' : 'Opens 9:30 AM'}</span>
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                            {primaryNavLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-200 shrink-0 ${isActive(link.path)
                                        ? 'text-primary bg-slate-100 font-semibold'
                                        : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {/* Directly visible on wide displays (2xl) */}
                            <div className="hidden 2xl:flex items-center gap-1">
                                {secondaryNavLinks.map(link => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 ${isActive(link.path)
                                            ? 'text-primary bg-slate-100 font-semibold'
                                            : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            {/* "More ▾" dropdown on laptop screens (lg to xl) */}
                            <div ref={moreMenuRef} className="relative 2xl:hidden">
                                <button
                                    type="button"
                                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                                    className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-200 cursor-pointer ${
                                        moreMenuOpen || secondaryNavLinks.some(l => isActive(l.path))
                                            ? 'text-primary bg-slate-100 font-semibold'
                                            : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                    }`}
                                >
                                    <span>More</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {moreMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-11 left-0 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                                        >
                                            {secondaryNavLinks.map(link => (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    onClick={() => setMoreMenuOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-xs xl:text-sm transition-colors ${
                                                        isActive(link.path)
                                                            ? 'bg-slate-50 text-primary font-bold'
                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                                                    }`}
                                                >
                                                    {link.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </nav>

                        {/* Actions & Interactive Search & Auth */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Desktop Search Bar with Live Popover */}
                            <div ref={searchContainerRef} className="relative hidden md:block">
                                <form 
                                    onSubmit={handleSearchSubmit}
                                    className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 h-9.5 border border-slate-200/80 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 focus-within:bg-white transition-all duration-300 w-28 lg:w-36 xl:w-44 focus-within:w-52 lg:focus-within:w-60"
                                >
                                    {searchLoading ? (
                                        <Loader2 size={15} className="text-slate-400 animate-spin shrink-0" />
                                    ) : (
                                        <Search size={15} className="text-slate-400 shrink-0" />
                                    )}
                                    <input
                                        value={searchVal}
                                        onFocus={() => setSearchFocused(true)}
                                        onChange={(e) => setSearchVal(e.target.value)}
                                        className="bg-transparent border-none text-xs sm:text-sm text-primary placeholder:text-slate-400 w-full outline-none"
                                        placeholder="Search..."
                                    />
                                    {searchVal && (
                                        <button 
                                            type="button" 
                                            onClick={() => setSearchVal('')} 
                                            className="text-slate-400 hover:text-primary p-0.5 cursor-pointer"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </form>

                                {/* Desktop Live Search Autocomplete Popover */}
                                <AnimatePresence>
                                    {searchFocused && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-12 right-0 w-[24rem] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 p-2"
                                        >
                                            {/* Results List */}
                                            {searchResults.length > 0 ? (
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                                                        Matching Vehicles ({searchResults.length})
                                                    </p>
                                                    <div className="space-y-1">
                                                        {searchResults.map(car => (
                                                            <button
                                                                key={car.id}
                                                                type="button"
                                                                onClick={() => handleCarSelect(car.id)}
                                                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                                                            >
                                                                <img
                                                                    src={getPrimaryImage(car.images)}
                                                                    alt={`${car.year} ${car.make} ${car.model}`}
                                                                    className="size-12 rounded-lg object-cover bg-slate-100 shrink-0"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-primary truncate group-hover:text-accent transition-colors">
                                                                        {car.year} {car.make} {car.model}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500">
                                                                        {car.fuel_type} · {car.transmission}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-xs font-bold text-primary">
                                                                        ₹{formatPriceLakh(car.price)} L
                                                                    </p>
                                                                    <span className="text-[10px] text-accent font-semibold flex items-center justify-end gap-0.5">
                                                                        View <ArrowRight size={10} />
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2 mt-2 border-t border-slate-100 px-2 pb-1">
                                                        <button
                                                            onClick={handleSearchSubmit}
                                                            className="w-full text-center text-xs font-semibold text-primary hover:text-accent py-1 cursor-pointer"
                                                        >
                                                            View all results in Inventory →
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : searchVal.trim().length >= 2 && !searchLoading ? (
                                                <div className="p-4 text-center">
                                                    <p className="text-xs text-slate-500 mb-2">No matching vehicles found for "{searchVal}".</p>
                                                    <button
                                                        onClick={handleSearchSubmit}
                                                        className="text-xs text-primary font-bold hover:underline"
                                                    >
                                                        Browse Full Inventory
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Quick Category Suggestions */
                                                <div className="p-2">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                                                        Quick Searches
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {POPULAR_SEARCH_TAGS.map(tag => (
                                                            <button
                                                                key={tag.label}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSearchFocused(false);
                                                                    navigate(tag.path);
                                                                }}
                                                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                                                            >
                                                                {tag.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Inquiry Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                title="Inquiry Cart"
                                className="relative flex size-9.5 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer shrink-0"
                                aria-label="View Inquiry Cart"
                            >
                                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 size-4.5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                                        {cartItems.length}
                                    </span>
                                )}
                            </button>

                            {/* Wishlist Button */}
                            <Link 
                                to={user ? "/dashboard" : "/auth"} 
                                state={user ? undefined : { from: { pathname: '/dashboard' } }}
                                title="Wishlist & Garage"
                                className="hidden lg:flex size-9.5 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors shrink-0"
                            >
                                <Heart size={18} />
                            </Link>

                            {/* Staff Portal Button - Visible on Mobile and Desktop */}
                            <Link 
                                to="/admin/login" 
                                title="Staff & Admin CRM Portal"
                                className="flex h-9 px-2 sm:h-9.5 sm:px-2.5 xl:px-3 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-amber-200/90 bg-amber-50/70 text-amber-900 hover:text-primary hover:bg-amber-100/70 transition-all shrink-0 cursor-pointer shadow-2xs"
                            >
                                <span className="material-symbols-outlined text-base sm:text-lg text-amber-700">admin_panel_settings</span>
                                <span className="text-[11px] sm:text-xs font-bold">Staff</span>
                            </Link>

                            {/* Customer Login / Dashboard Pill */}
                            {user ? (
                                <Link 
                                    to="/dashboard" 
                                    className="hidden sm:flex h-9.5 px-3.5 xl:px-4 items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-xs xl:text-sm font-bold hover:bg-primary-light transition-all shadow-xs shrink-0 cursor-pointer"
                                >
                                    <User size={15} />
                                    <span className="truncate max-w-[85px]">{profile?.full_name ? profile.full_name.split(' ')[0] : 'Account'}</span>
                                </Link>
                            ) : (
                                <Link 
                                    to="/auth" 
                                    className="hidden sm:flex h-9.5 px-3.5 xl:px-4.5 items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-xs xl:text-sm font-bold hover:bg-primary-light transition-all shadow-xs shrink-0 cursor-pointer"
                                >
                                    <User size={15} />
                                    <span>Login</span>
                                </Link>
                            )}
                            
                            {/* Mobile Search Button */}
                            <button 
                                onClick={() => {
                                    setMobileSearchOpen(!mobileSearchOpen);
                                    setMobileMenuOpen(false);
                                }}
                                className="md:hidden flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Search"
                            >
                                <Search size={18} />
                            </button>

                            <Link to={user ? "/dashboard" : "/auth"} className="sm:hidden flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                                <User size={18} />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(!mobileMenuOpen);
                                    setMobileSearchOpen(false);
                                }}
                                className="lg:hidden flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Toggle Navigation Menu"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar Drawer */}
                    <AnimatePresence>
                        {mobileSearchOpen && (
                            <motion.div 
                                ref={mobileSearchRef}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="md:hidden overflow-hidden bg-slate-50 border-t border-slate-100"
                            >
                                <div className="px-4 py-3">
                                    <form 
                                        onSubmit={handleSearchSubmit}
                                        className="flex items-center gap-2 bg-white rounded-xl px-4 h-11 border border-slate-200 shadow-sm"
                                    >
                                        {searchLoading ? (
                                            <Loader2 size={16} className="text-slate-400 animate-spin shrink-0" />
                                        ) : (
                                            <Search size={16} className="text-slate-400 shrink-0" />
                                        )}
                                        <input
                                            value={searchVal}
                                            onChange={(e) => setSearchVal(e.target.value)}
                                            autoFocus
                                            className="bg-transparent border-none text-sm text-primary placeholder:text-slate-400 w-full outline-none"
                                            placeholder="Search by make, model, fuel..."
                                        />
                                        {searchVal && (
                                            <button 
                                                type="button" 
                                                onClick={() => setSearchVal('')} 
                                                className="text-slate-400 hover:text-primary flex items-center p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </form>

                                    {/* Mobile Search Autocomplete Results */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 bg-white rounded-xl border border-slate-200 p-2 shadow-md max-h-60 overflow-y-auto">
                                            {searchResults.map(car => (
                                                <button
                                                    key={car.id}
                                                    type="button"
                                                    onClick={() => handleCarSelect(car.id)}
                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                                                >
                                                    <img
                                                        src={getPrimaryImage(car.images)}
                                                        alt={`${car.year} ${car.make} ${car.model}`}
                                                        className="size-11 rounded-lg object-cover bg-slate-100 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-primary truncate">
                                                            {car.year} {car.make} {car.model}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {car.fuel_type} · {car.transmission}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs font-bold text-primary shrink-0">
                                                        ₹{formatPriceLakh(car.price)} L
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Pills for Mobile */}
                                    {!searchVal && (
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            {POPULAR_SEARCH_TAGS.slice(0, 4).map(tag => (
                                                <button
                                                    key={tag.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setMobileSearchOpen(false);
                                                        navigate(tag.path);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
                                                >
                                                    {tag.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Menu Drawer */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="lg:hidden overflow-hidden fixed inset-x-0 top-16 bottom-0 z-[60] bg-white pt-4 pb-8 flex flex-col border-t border-slate-100"
                            >
                                <div className="px-4 pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`size-2.5 rounded-full ${showroomStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                                        <span className="text-xs font-semibold text-slate-700">{showroomStatus.text}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">Kasaba Bawada</span>
                                </div>

                                {/* Prominent Staff Portal Card in Mobile Menu */}
                                <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200/80 flex items-center justify-between shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8.5 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Staff Account</p>
                                            <p className="text-[10px] text-slate-500">Employee & Admin Portal</p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/admin/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-1.5 bg-slate-900 text-amber-300 hover:text-white hover:bg-black text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all shrink-0"
                                    >
                                        Staff Login →
                                    </Link>
                                </div>
                                <nav className="flex flex-col gap-1 px-4 overflow-y-auto">
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
                                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3 px-6 pb-20">
                                    <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                        Staff Portal Login
                                    </Link>
                                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors shadow-lg">
                                        <User size={18} />
                                        Sign In / Register
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content with bottom padding on mobile to avoid quick-dock collision */}
            <main className="flex-1 w-full flex flex-col pb-20 lg:pb-0">
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
                                Kolhapur's trusted destination for quality certified pre-owned cars since 2011. Certified 200-point inspection and instant financing.
                            </p>
                            <div className="flex items-center gap-3">
                                {[
                                    { id: 'facebook', icon: <Facebook size={18} /> },
                                    { id: 'instagram', icon: <Instagram size={18} /> },
                                    { id: 'twitter', icon: <Twitter size={18} /> },
                                    { id: 'youtube', icon: <Youtube size={18} /> }
                                ].map(social => (
                                    <a key={social.id} href="#" className="flex-none size-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-primary transition-all duration-300">
                                        {social.icon}
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
                                    { name: 'About Us', path: '/about' },
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
                                    { name: 'Accessories Catalog', path: '/accessories' },
                                    { name: 'Car Detailing & Care', path: '/services' },
                                ].map((link, i) => (
                                    <li key={i}>
                                        <Link to={link.path} className="hover:text-accent transition-colors">{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Visit Us */}
                        <div>
                            <h4 className="font-bold font-display text-base mb-5">Visit Showroom</h4>
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
                                    <a href="mailto:sales@swamimotors.com" className="hover:text-accent transition-colors">sales@swamimotors.com</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10">
                    <div className="container-main py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} Shree Swami Samarth Motors. Effortless Automotive Discovery Since 2011.
                        </p>
                        <div className="flex gap-6 text-xs text-slate-500">
                            <Link to="/about" className="hover:text-accent transition-colors">About</Link>
                            <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
                            <Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link>
                            <Link to="/admin/login" className="hover:text-accent transition-colors">Admin</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Bottom Floating Quick-Dock (Thumb Ergonomics) */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
                    <Link
                        to="/inventory"
                        className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                            location.pathname === '/inventory' ? 'text-primary font-bold' : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">directions_car</span>
                        <span className="text-[10px] tracking-tight mt-0.5">Inventory</span>
                    </Link>
                    <Link
                        to="/sell"
                        className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                            location.pathname === '/sell' ? 'text-primary font-bold' : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">payments</span>
                        <span className="text-[10px] tracking-tight mt-0.5">Sell Car</span>
                    </Link>
                    <Link
                        to={user ? "/dashboard" : "/auth"}
                        state={user ? undefined : { from: { pathname: '/dashboard' } }}
                        className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                            location.pathname === '/dashboard' ? 'text-primary font-bold' : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <Heart size={19} className={location.pathname === '/dashboard' ? 'text-primary fill-primary' : 'text-slate-500'} />
                        <span className="text-[10px] tracking-tight mt-0.5">Saved</span>
                    </Link>
                    <a
                        href="https://wa.me/919823237975?text=Hello%20Shree%20Swami%20Samarth%20Motors,%20I%20am%20interested%20in%20a%20car"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center py-1 rounded-xl text-emerald-600 hover:text-emerald-700 transition-all font-semibold"
                    >
                        <span className="material-symbols-outlined text-xl">chat</span>
                        <span className="text-[10px] tracking-tight mt-0.5">WhatsApp</span>
                    </a>
                </div>
            </div>

            {/* Floating Inquiry Cart Badge */}
            <AnimatePresence>
                {cartItems.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 50 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(true)}
                        className={`fixed z-40 items-center justify-center gap-2.5 h-13 px-4 md:px-6 rounded-full bg-primary text-white shadow-2xl hover:bg-primary-light transition-colors border border-white/10 cursor-pointer ${
                            location.pathname.startsWith('/car/') || location.pathname.startsWith('/cars/')
                                ? 'hidden md:flex bottom-6 right-[5.5rem]'
                                : 'flex bottom-20 md:bottom-6 right-[4.5rem] md:right-[5.5rem]'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">shopping_bag</span>
                        <span className="text-xs sm:text-sm font-bold tracking-wide">Cart</span>
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-primary text-[11px] font-black shadow-inner">
                            {cartItems.length}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            <Chatbot />
            <InquiryCartDrawer />
        </div>
    );
};

export default PublicLayout;
