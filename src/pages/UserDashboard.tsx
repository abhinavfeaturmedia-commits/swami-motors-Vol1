import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Sparkles, Shield, ArrowRight, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getPrimaryImage, formatPriceLakh, formatDate } from '../lib/utils';

interface Booking {
    id: string;
    type: string;
    message: string | null;
    status: string;
    created_at: string;
    full_name: string;
    car_make: string | null;
    car_model: string | null;
    car_year: number | null;
}

interface WishlistCar {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    images: string[];
    fuel_type: string;
    transmission: string;
}

const getCustomerStatus = (status: string) => {
    switch (status) {
        case 'new':
            return { label: 'Received · In Queue', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 1, stepText: 'Step 1: Evaluator Reviewing' };
        case 'contacted':
            return { label: 'Advisor Assigned', color: 'bg-amber-100 text-amber-800 border-amber-200', step: 2, stepText: 'Step 2: Active Consultation' };
        case 'negotiation':
            return { label: 'Deal Finalizing', color: 'bg-purple-100 text-purple-800 border-purple-200', step: 2, stepText: 'Step 2: Paperwork & Terms' };
        case 'closed_won':
            return { label: 'Confirmed / Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', step: 3, stepText: 'Step 3: Successful Deal' };
        case 'closed_lost':
            return { label: 'Cancelled / Archived', color: 'bg-slate-100 text-slate-500 border-slate-200', step: 0, stepText: 'Inquiry Closed' };
        default:
            return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', step: 1, stepText: 'Under Review' };
    }
};

const UserDashboard = () => {
    const { user, profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('bookings');

    // ─── Bookings from leads table ────────────────────────────────────────────
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);

    // ─── Wishlist from user_wishlist ──────────────────────────────────────────
    const [wishlistCars, setWishlistCars] = useState<WishlistCar[]>([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // ─── Finance Services State ────────────────────────────────────────────────
    const [myServices, setMyServices] = useState<any[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);

    const tabs = [
        { id: 'bookings', label: 'My Bookings', icon: 'event_note' },
        { id: 'services', label: 'Financial Services', icon: 'handshake' },
        { id: 'shortlisted', label: 'Shortlisted Cars', icon: 'favorite' },
        { id: 'settings', label: 'Profile', icon: 'person' },
    ];

    // ─── Fetch bookings ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!profile?.phone && !profile?.email) {
            setBookingsLoading(false);
            return;
        }

        const fetchBookings = async () => {
            setBookingsLoading(true);
            let query = supabase
                .from('leads')
                .select('id, type, message, status, created_at, full_name, car_make, car_model, car_year')
                .order('created_at', { ascending: false });

            if (profile.phone) {
                query = query.eq('phone', profile.phone);
            } else if (profile.email) {
                query = query.eq('email', profile.email);
            }

            const { data } = await query;
            setBookings(data || []);
            setBookingsLoading(false);
        };

        fetchBookings();
    }, [profile]);

    // ─── Fetch financial services ─────────────────────────────────────────────
    useEffect(() => {
        const fetchServices = async () => {
            if (!profile?.phone && !profile?.email) {
                setServicesLoading(false);
                return;
            }
            setServicesLoading(true);
            let query = supabase
                .from('finance_services')
                .select('*, car:inventory(*)')
                .order('created_at', { ascending: false });

            if (profile.phone) {
                query = query.eq('phone', profile.phone);
            } else if (profile.email) {
                query = query.eq('email', profile.email);
            }

            const { data } = await query;
            setMyServices(data || []);
            setServicesLoading(false);
        };

        if (activeTab === 'services') {
            fetchServices();
        }
    }, [activeTab, profile]);

    // ─── Load wishlist from Supabase ─────────────────────────────────────
    useEffect(() => {
        const loadWishlist = async () => {
            if (!user) {
                setWishlistCars([]);
                return;
            }
            setWishlistLoading(true);

            const { data: wishlistData } = await supabase
                .from('user_wishlist')
                .select('inventory_id')
                .eq('user_id', user.id);

            const savedIds = (wishlistData as any[])?.map((w: any) => w.inventory_id) || [];

            if (savedIds.length === 0) {
                setWishlistCars([]);
                setWishlistLoading(false);
                return;
            }

            const { data } = await supabase
                .from('inventory')
                .select('id, make, model, year, price, images, fuel_type, transmission')
                .in('id', savedIds)
                .in('status', ['available', 'reserved']);

            setWishlistCars(data || []);
            setWishlistLoading(false);
        };

        loadWishlist();
    }, [activeTab, user]);

    const removeFromWishlist = async (id: string) => {
        if (!user) return;
        setWishlistCars(prev => prev.filter(c => c.id !== id));
        await supabase.from('user_wishlist').delete().match({ user_id: user.id, inventory_id: id });
    };

    const getLeadTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            test_drive: 'Test Drive Booking',
            contact: 'General Showroom Inquiry',
            sell_car: 'Sell Car Valuation',
            insurance: 'Insurance Quote',
            service: 'Service Booking',
            finance: 'Finance / Loan Application',
            car_service: 'Workshop & Care',
        };
        return map[type] || type;
    };

    return (
        <div className="container-main py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="lg:w-[16rem] shrink-0">
                    <div className="sticky top-[5.5rem] space-y-4">
                        {/* User Profile Card */}
                        <div className="doppelrand-shell rounded-2xl shadow-sm">
                            <div className="doppelrand-core p-5">
                                <div className="size-13 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold mb-3 shadow-xs">
                                    {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <p className="font-bold text-primary text-sm truncate">{profile?.full_name || 'Valued Customer'}</p>
                                <p className="text-xs text-slate-500 truncate">{profile?.phone || profile?.email || user?.email || ''}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-2">
                                    <CheckCircle2 size={11} /> Verified Account
                                </span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="doppelrand-shell rounded-2xl shadow-sm">
                            <div className="doppelrand-core p-2 space-y-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            activeTab === tab.id
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}

                                <button
                                    onClick={signOut}
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all mt-2 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Pane */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Customer Portal</span>
                            <h1 className="text-2xl lg:text-3xl font-black text-primary font-display">My Dealership Hub</h1>
                        </div>
                        <Link
                            to="/inventory"
                            className="hidden sm:inline-flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-xs"
                        >
                            <span className="material-symbols-outlined text-base">search</span> Browse Showroom
                        </Link>
                    </div>

                    {/* My Bookings Tab */}
                    {activeTab === 'bookings' && (
                        <section className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-primary font-display flex items-center gap-2">
                                    <span className="material-symbols-outlined text-accent">event_note</span> Appointments & Inquiries
                                </h2>
                                <span className="text-xs text-slate-400 font-medium">{bookings.length} Registered</span>
                            </div>

                            {bookingsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="doppelrand-shell rounded-2xl animate-pulse h-24" />
                                    ))}
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="doppelrand-shell rounded-3xl text-center py-12 px-6">
                                    <div className="doppelrand-core p-8 flex flex-col items-center">
                                        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl">event_available</span>
                                        </div>
                                        <h3 className="font-bold text-primary font-display text-lg mb-1">No active appointments</h3>
                                        <p className="text-xs text-slate-500 max-w-sm mb-6">
                                            Your test drives, doorstep evaluations, and showroom visits will be tracked live here.
                                        </p>
                                        <Link
                                            to="/book-test-drive"
                                            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">directions_car</span> Schedule a Test Drive
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map(b => {
                                        const cStatus = getCustomerStatus(b.status);
                                        return (
                                            <div key={b.id} className="doppelrand-shell rounded-2xl">
                                                <div className="doppelrand-core p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3.5">
                                                            <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-xl">
                                                                    {b.type === 'test_drive' ? 'directions_car'
                                                                        : b.type === 'sell_car' ? 'sell'
                                                                        : b.type === 'insurance' ? 'shield'
                                                                        : b.type === 'finance' ? 'account_balance'
                                                                        : b.type === 'car_service' ? 'build'
                                                                        : 'chat'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-bold text-primary text-sm">{getLeadTypeLabel(b.type)}</p>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cStatus.color}`}>
                                                                        {cStatus.label}
                                                                    </span>
                                                                </div>
                                                                {(b.car_make || b.car_model) && (
                                                                    <p className="text-xs font-semibold text-slate-700 mt-1">
                                                                        Vehicle: {b.car_year} {b.car_make} {b.car_model}
                                                                    </p>
                                                                )}
                                                                {b.message && (
                                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                                                                        "{b.message}"
                                                                    </p>
                                                                )}
                                                                <p className="text-[11px] text-slate-400 mt-1">
                                                                    Requested on {formatDate(b.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                                                            <a
                                                                href={`https://wa.me/919823237975?text=${encodeURIComponent(`Hello Shree Swami Samarth Motors, I am inquiring about my ${getLeadTypeLabel(b.type)} (ID: ${b.id.slice(0, 8)}). Please share current status update.`)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="h-9 px-3 rounded-lg bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#20bd5a] transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">chat</span> WhatsApp Desk
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Milestone Track Pill */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Clock size={13} className="text-slate-400" /> {cStatus.stepText}
                                                        </span>
                                                        <span className="text-primary font-bold">Kolhapur Showroom Priority</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Financial Services Tab */}
                    {activeTab === 'services' && (
                        <section className="mb-10">
                            <h2 className="text-base font-bold text-primary font-display flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-accent">handshake</span> Loans & Insurance Policies
                            </h2>

                            {servicesLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="doppelrand-shell rounded-2xl animate-pulse h-24" />
                                    ))}
                                </div>
                            ) : myServices.length === 0 ? (
                                <div className="doppelrand-shell rounded-3xl text-center py-12 px-6">
                                    <div className="doppelrand-core p-8 flex flex-col items-center">
                                        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl">handshake</span>
                                        </div>
                                        <h3 className="font-bold text-primary font-display text-lg mb-1">No active finance files</h3>
                                        <p className="text-xs text-slate-500 max-w-sm mb-6">
                                            Submit an online loan application or insurance request to monitor sanction progress in real time.
                                        </p>
                                        <div className="flex gap-3 justify-center">
                                            <Link
                                                to="/finance"
                                                className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm">calculate</span> EMI Calculator
                                            </Link>
                                            <Link
                                                to="/insurance"
                                                className="inline-flex items-center gap-2 h-10 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">shield</span> Instant Insurance
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myServices.map(s => {
                                        return (
                                            <div key={s.id} className="doppelrand-shell rounded-2xl">
                                                <div className="doppelrand-core p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="size-12 rounded-xl bg-slate-50 border border-slate-200 text-primary flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-xl">
                                                                {s.type === 'loan' ? 'account_balance' : 'shield'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold text-primary text-sm capitalize">
                                                                    {s.type === 'loan' ? 'Car Loan File' : 'Car Insurance Contract'}
                                                                </p>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                                                    {(s.status || 'pending').replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                Registered Applicant: <span className="font-bold text-slate-800">{s.full_name}</span>
                                                            </p>
                                                            {s.provider_name && (
                                                                <p className="text-xs text-slate-600 mt-0.5">
                                                                    Financier: <span className="font-semibold">{s.provider_name}</span>
                                                                </p>
                                                            )}
                                                            {s.car && (
                                                                <p className="text-xs text-slate-600 mt-0.5">
                                                                    Vehicle: <span className="font-semibold">{s.car.year} {s.car.make} {s.car.model}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                                        {s.type === 'loan' ? (
                                                            <>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Sanctioned / Requested</p>
                                                                <p className="text-lg font-black text-primary font-display">₹{Number(s.amount || 0).toLocaleString('en-IN')}</p>
                                                                {s.interest_rate && (
                                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                                        Rate: {s.interest_rate}% · Tenure: {s.tenure_months}M
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Insurance Premium</p>
                                                                <p className="text-lg font-black text-primary font-display">{s.premium_amount ? `₹${Number(s.premium_amount).toLocaleString('en-IN')}` : '—'}</p>
                                                                {s.amount && (
                                                                    <p className="text-xs text-slate-500 mt-0.5">IDV Cover: ₹{Number(s.amount).toLocaleString('en-IN')}</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Shortlisted Cars Tab */}
                    {activeTab === 'shortlisted' && (
                        <section>
                            <h2 className="text-base font-bold text-primary font-display flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-rose-500">favorite</span> Saved Vehicles
                            </h2>

                            {wishlistLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[1, 2].map(i => <div key={i} className="doppelrand-shell rounded-2xl h-48 animate-pulse" />)}
                                </div>
                            ) : wishlistCars.length === 0 ? (
                                <div className="doppelrand-shell rounded-3xl text-center py-12 px-6">
                                    <div className="doppelrand-core p-8 flex flex-col items-center">
                                        <div className="size-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl">favorite</span>
                                        </div>
                                        <h3 className="font-bold text-primary font-display text-lg mb-1">Your wishlist is empty</h3>
                                        <p className="text-xs text-slate-500 max-w-sm mb-6">
                                            Tap the heart icon on any vehicle while browsing inventory to save it for easy access.
                                        </p>
                                        <Link
                                            to="/inventory"
                                            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">search</span> Explore Live Inventory
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {wishlistCars.map(car => (
                                        <div key={car.id} className="doppelrand-shell rounded-2xl group hover:-translate-y-1 transition-all duration-300">
                                            <div className="doppelrand-core p-3">
                                                <Link to={`/car/${car.id}`} className="block relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                                    <img
                                                        src={getPrimaryImage(car.images)}
                                                        alt={`${car.year} ${car.make} ${car.model}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            removeFromWishlist(car.id);
                                                        }}
                                                        className="absolute top-2.5 right-2.5 size-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                                        title="Remove from wishlist"
                                                    >
                                                        <Heart size={16} fill="currentColor" />
                                                    </button>
                                                </Link>
                                                <div className="p-2">
                                                    <h3 className="font-bold text-primary text-sm group-hover:text-accent transition-colors">
                                                        {car.year} {car.make} {car.model}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
                                                        {car.fuel_type} • {car.transmission}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                        <span className="text-base font-black text-primary">
                                                            ₹{formatPriceLakh(car.price)} Lakh
                                                        </span>
                                                        <Link
                                                            to={`/car/${car.id}`}
                                                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                                                        >
                                                            View Car <ArrowRight size={13} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'settings' && (
                        <section>
                            <h2 className="text-base font-bold text-primary font-display flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-accent">person</span> Profile Information
                            </h2>
                            <div className="doppelrand-shell rounded-2xl shadow-sm">
                                <div className="doppelrand-core p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                                            <p className="text-sm font-bold text-primary">{profile?.full_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                                            <p className="text-sm font-bold text-primary">{user?.email || profile?.email || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                                            <p className="text-sm font-bold text-primary">{profile?.phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role / Account Tier</p>
                                            <p className="text-sm font-bold text-emerald-700 capitalize">{profile?.role || 'Customer'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Need to update your contact information?</span>
                                        <Link to="/contact" className="font-bold text-primary hover:text-accent underline">
                                            Contact Showroom Desk
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
