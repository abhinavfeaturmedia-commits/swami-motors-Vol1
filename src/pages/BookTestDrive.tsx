import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { formatPriceLakh, getPrimaryImage } from '../lib/utils';

const TIMES = {
    Morning: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    Afternoon: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM'],
    Evening: ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'],
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface CarInfo {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    images: string[];
}

const BookTestDrive = () => {
    const [searchParams] = useSearchParams();
    const carId = searchParams.get('car');

    // ─── Calendar state ───────────────────────────────────────────────────────
    const today = useMemo(() => new Date(), []);

    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState('10:30 AM');

    // ─── Car info sidebar ─────────────────────────────────────────────────────
    const [car, setCar] = useState<CarInfo | null>(null);
    const [carLoading, setCarLoading] = useState(false);

    // ─── Form state ───────────────────────────────────────────────────────────
    const [driveLocation, setDriveLocation] = useState<'showroom' | 'doorstep'>('showroom');
    const [doorstepAddress, setDoorstepAddress] = useState('');
    const [form, setForm] = useState({ full_name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // ─── Fetch car if ID is passed ────────────────────────────────────────────
    useEffect(() => {
        if (!carId) return;
        const fetchCar = async () => {
            setCarLoading(true);
            const { data } = await supabase
                .from('inventory')
                .select('id, make, model, year, price, fuel_type, transmission, images')
                .eq('id', carId)
                .single();
            if (data) setCar(data);
            setCarLoading(false);
        };
        fetchCar();
    }, [carId]);

    // ─── Calendar helpers ─────────────────────────────────────────────────────
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    // ISO weekday of the 1st: 1=Mon … 7=Sun → offset 0-6
    const firstDayOffset = (() => {
        const d = new Date(calYear, calMonth, 1).getDay(); // 0=Sun, 1=Mon…
        return d === 0 ? 6 : d - 1; // convert to Mon-first
    })();

    const isDateDisabled = (day: number) => {
        const d = new Date(calYear, calMonth, day);
        d.setHours(0, 0, 0, 0);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d < t; // past dates disabled
    };

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
        setSelectedDate(null);
    };

    const selectedDateLabel = selectedDate
        ? `${selectedDate} ${MONTH_NAMES[calMonth]} ${calYear}`
        : 'No date selected';

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name || !form.phone) return setError('Please enter your valid details.');
        if (!selectedDate) return setError('Please select a date for the test drive.');
        if (driveLocation === 'doorstep' && !doorstepAddress.trim()) {
            return setError('Please enter your Kolhapur delivery address for doorstep test drive.');
        }

        setError('');
        setLoading(true);

        const locationTag = driveLocation === 'doorstep'
            ? `[DOORSTEP TEST DRIVE: ${doorstepAddress.trim()}]`
            : `[SHOWROOM VISIT: Kasaba Bawada]`;

        const messageText = car
            ? `${locationTag} Test Drive requested for: ${car.year} ${car.make} ${car.model} on ${selectedDateLabel} at ${selectedTime}`
            : `${locationTag} Test Drive requested for: ${selectedDateLabel} at ${selectedTime}`;

        const { data: leadData, error: err } = await supabase.from('leads').insert({
            type: 'test_drive',
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            car_make: car?.make || null,
            car_model: car?.model || null,
            car_year: car?.year || null,
            message: messageText,
            notes: driveLocation === 'doorstep' ? `Doorstep Delivery Address: ${doorstepAddress.trim()}` : 'Showroom Kasaba Bawada',
            source: 'website_test_drive',
        }).select().single();

        if (err) setError('Something went wrong. Please call us directly.');
        else {
            if (leadData?.id) {
                // Compute local calendar date string (avoiding UTC timezone shift)
                const yyyy = calYear;
                const mm = String(calMonth + 1).padStart(2, '0');
                const dd = String(selectedDate).padStart(2, '0');
                const isoDate = `${yyyy}-${mm}-${dd}`;

                // Convert 12-hour AM/PM string to MySQL TIME 24-hour format
                const matchTime = selectedTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                let time24 = '10:30:00';
                if (matchTime) {
                    let h = parseInt(matchTime[1], 10);
                    const m = matchTime[2];
                    const meridiem = matchTime[3].toUpperCase();
                    if (meridiem === 'PM' && h < 12) h += 12;
                    if (meridiem === 'AM' && h === 12) h = 0;
                    time24 = `${String(h).padStart(2, '0')}:${m}:00`;
                }

                await supabase.from('bookings').insert({
                    lead_id: leadData.id,
                    inventory_id: car?.id || null,
                    booking_type: 'test_drive',
                    booking_date: isoDate,
                    booking_time: time24,
                    status: 'scheduled'
                });

                // Link car to customer interest
                if (car?.id) {
                    await supabase.from('lead_car_interests').insert({
                        lead_id: leadData.id,
                        inventory_id: car.id
                    });
                }
            }
            setSubmitted(true);
        }
        setLoading(false);
    };

    return (
        <div className="container-main py-10">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
                {['Select Car', 'Date & Time', 'Confirmation'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                        <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                        <span className={`text-sm font-medium ${i <= 1 ? 'text-primary' : 'text-slate-400'}`}>{step}</span>
                        {i < 2 && <div className={`w-12 h-0.5 ${i < 1 ? 'bg-primary' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {submitted ? (
                        <div className="doppelrand-shell p-2 shadow-2xl">
                            <div className="doppelrand-core p-8 md:p-12 text-center bg-white space-y-6">
                                <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                                </div>
                                <div>
                                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/60 inline-block mb-3">
                                        Appointment Requested
                                    </span>
                                    <h2 className="text-3xl font-black text-primary font-display mb-2">Test Drive Confirmed!</h2>
                                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                                        Thank you, <strong>{form.full_name}</strong>. We have reserved your appointment for:
                                    </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                                        <span className="text-xs text-slate-500 font-medium">Date & Time</span>
                                        <span className="text-xs font-bold text-primary">{selectedDateLabel} at {selectedTime}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                                        <span className="text-xs text-slate-500 font-medium">Type</span>
                                        <span className="text-xs font-bold text-primary">
                                            {driveLocation === 'doorstep' ? '🏡 Doorstep Delivery (Kolhapur)' : '🏢 Showroom Visit (Kasaba Bawada)'}
                                        </span>
                                    </div>
                                    {driveLocation === 'doorstep' && doorstepAddress && (
                                        <div className="flex items-start justify-between pb-3 border-b border-slate-200/60">
                                            <span className="text-xs text-slate-500 font-medium">Address</span>
                                            <span className="text-xs font-bold text-primary max-w-[60%] text-right">{doorstepAddress}</span>
                                        </div>
                                    )}
                                    {car && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Vehicle</span>
                                            <span className="text-xs font-bold text-primary">{car.year} {car.make} {car.model}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <a
                                        href={`https://wa.me/919823237975?text=Hello%20Shree%20Swami%20Samarth%20Motors,%20I%20have%20booked%20a%20test%20drive%20for%20${car ? `${car.year}%20${car.make}%20${car.model}` : 'a%20vehicle'}%20on%20${selectedDateLabel}%20at%20${selectedTime}.%20My%20name%20is%20${encodeURIComponent(form.full_name)}.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full sm:w-auto h-12 px-6 bg-[#25D366] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">forum</span>
                                        Confirm on WhatsApp
                                    </a>
                                    {driveLocation === 'showroom' ? (
                                        <a
                                            href="https://maps.google.com/?q=Kasaba+Bawada,+Kolhapur"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full sm:w-auto h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">navigation</span>
                                            Get Showroom Directions
                                        </a>
                                    ) : (
                                        <Link
                                            to="/inventory"
                                            className="w-full sm:w-auto h-12 px-6 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                                        >
                                            Browse More Cars
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h1 className="text-2xl font-black text-primary font-display mb-1">Book Your Test Drive</h1>
                                <p className="text-slate-500 text-sm">Experience your preferred vehicle firsthand at our Kasaba Bawada showroom or your doorstep.</p>
                            </div>

                            {/* Step 1: Drive Location Preference */}
                            <div className="doppelrand-shell p-1.5 shadow-[var(--shadow-card)]">
                                <div className="doppelrand-core p-5 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-extrabold text-primary font-display text-sm uppercase tracking-wider text-slate-500">
                                            1. Test Drive Location Preference
                                        </h3>
                                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">
                                            Kolhapur
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDriveLocation('showroom')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                driveLocation === 'showroom'
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="material-symbols-outlined text-xl text-accent">storefront</span>
                                                <span className="font-bold text-sm">Showroom Visit</span>
                                            </div>
                                            <p className={`text-xs ${driveLocation === 'showroom' ? 'text-slate-200' : 'text-slate-500'}`}>
                                                Kasaba Bawada showroom. Complete inspection bay access and multiple car test comparisons.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDriveLocation('doorstep')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                driveLocation === 'doorstep'
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="material-symbols-outlined text-xl text-accent">home_pin</span>
                                                <span className="font-bold text-sm">Doorstep Delivery</span>
                                                <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">Free</span>
                                            </div>
                                            <p className={`text-xs ${driveLocation === 'doorstep' ? 'text-slate-200' : 'text-slate-500'}`}>
                                                Complimentary vehicle delivery to your home or office anywhere in Kolhapur city.
                                            </p>
                                        </button>
                                    </div>
                                    {driveLocation === 'doorstep' && (
                                        <div className="pt-2">
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Your Kolhapur Delivery Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={doorstepAddress}
                                                onChange={(e) => setDoorstepAddress(e.target.value)}
                                                placeholder="e.g. Flat 302, Royal Residency, Tarabai Park, Kolhapur"
                                                className="w-full h-11 px-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Calendar */}
                            <div className="doppelrand-shell p-1.5 shadow-[var(--shadow-card)]">
                                <div className="doppelrand-core p-6 bg-white space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-extrabold text-primary font-display text-sm uppercase tracking-wider text-slate-500">
                                            2. Choose Date
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <button onClick={prevMonth} className="size-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-base">chevron_left</span>
                                            </button>
                                            <span className="font-bold text-primary font-display text-sm min-w-[9rem] text-center">
                                                {MONTH_NAMES[calMonth]} {calYear}
                                            </span>
                                            <button onClick={nextMonth} className="size-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-base">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Day headers */}
                                    <div className="grid grid-cols-7 gap-1 mb-1">
                                        {DAY_LABELS.map(d => (
                                            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1.5">{d}</div>
                                        ))}
                                    </div>

                                    {/* Date cells */}
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}

                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                            const disabled = isDateDisabled(d);
                                            const selected = selectedDate === d;
                                            const isToday = today.getDate() === d && today.getMonth() === calMonth && today.getFullYear() === calYear;
                                            return (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => !disabled && setSelectedDate(d)}
                                                    disabled={disabled}
                                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative
                                                        ${selected ? 'bg-primary text-white font-bold shadow-md ring-2 ring-accent/60 scale-105 z-10'
                                                        : disabled ? 'text-slate-300 cursor-not-allowed bg-slate-50/50'
                                                        : 'text-slate-700 hover:bg-slate-100 hover:scale-105 active:scale-95'}`}
                                                >
                                                    <span>{d}</span>
                                                    {isToday && !selected && (
                                                        <span className="size-1 rounded-full bg-accent absolute bottom-1" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> Selected</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300" /> Available</span>
                                        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Time Slots */}
                            <div className="doppelrand-shell p-1.5 shadow-[var(--shadow-card)]">
                                <div className="doppelrand-core p-6 bg-white space-y-4">
                                    <h3 className="font-extrabold text-primary font-display text-sm uppercase tracking-wider text-slate-500">
                                        3. Available Time Slots
                                    </h3>
                                    {Object.entries(TIMES).map(([period, slots]) => (
                                        <div key={period} className="mb-4 last:mb-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-accent">
                                                    {period === 'Morning' ? 'wb_sunny' : period === 'Afternoon' ? 'wb_cloudy' : 'wb_twilight'}
                                                </span>
                                                {period}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {slots.map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setSelectedTime(t)}
                                                        className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${selectedTime === t
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 4: Personal Details */}
                            <div className="doppelrand-shell p-1.5 shadow-[var(--shadow-card)]">
                                <div className="doppelrand-core p-6 bg-white space-y-4">
                                    <h3 className="font-extrabold text-primary font-display text-sm uppercase tracking-wider text-slate-500">
                                        4. Your Contact Details
                                    </h3>

                                    {error && (
                                        <div className="bg-red-50 text-red-700 text-xs rounded-xl px-4 py-3 flex items-center gap-2 border border-red-200">
                                            <span className="material-symbols-outlined text-base shrink-0">error</span>
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {selectedDate && (
                                        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-accent text-base">event_available</span>
                                                <span className="font-semibold text-primary">
                                                    {selectedDateLabel} at <strong>{selectedTime}</strong>
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-accent uppercase">
                                                {driveLocation === 'doorstep' ? 'Doorstep' : 'Showroom'}
                                            </span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={form.full_name}
                                                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                                                    required
                                                    disabled={loading}
                                                    placeholder="e.g. Ramesh Patil"
                                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phone Number <span className="text-red-500">*</span></label>
                                                <div className="flex">
                                                    <span className="h-11 px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl flex items-center text-xs font-bold text-slate-600">
                                                        +91
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        value={form.phone}
                                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                                        required
                                                        disabled={loading}
                                                        placeholder="98XXX XXXXX"
                                                        className="flex-1 h-11 border border-slate-200 rounded-r-xl px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-13 bg-accent text-primary font-black rounded-xl hover:bg-accent-hover active:scale-[0.99] transition-all shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                                        >
                                            {loading
                                                ? <span className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                : <><span className="material-symbols-outlined text-lg">event_available</span> Confirm & Schedule Test Drive</>
                                            }
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Car Info Sidebar */}
                <div className="space-y-4">
                    <div className="sticky top-[5.5rem] space-y-4">
                        <div className="doppelrand-shell p-1.5 shadow-[var(--shadow-card)]">
                            <div className="doppelrand-core p-5 bg-white">
                                {carLoading ? (
                                    <div className="flex flex-col gap-3 animate-pulse">
                                        <div className="aspect-[16/10] rounded-xl bg-slate-100" />
                                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                                    </div>
                                ) : car ? (
                                    <>
                                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-4">
                                            <img
                                                src={getPrimaryImage(car.images)}
                                                alt={`${car.year} ${car.make} ${car.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Certified</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{car.year} Model</span>
                                        </div>
                                        <h3 className="font-bold text-primary font-display text-lg mb-1">{car.year} {car.make} {car.model}</h3>
                                        <p className="text-xl font-black text-primary font-display mb-3">₹ {formatPriceLakh(car.price)} Lakh</p>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            {[
                                                { val: car.fuel_type, label: 'Fuel' },
                                                { val: car.transmission, label: 'Transmission' },
                                            ].map(s => (
                                                <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-1">
                                                    <p className="text-xs font-bold text-primary truncate">{s.val}</p>
                                                    <p className="text-[9px] text-slate-400 uppercase font-semibold">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-4 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">directions_car</span>
                                        </div>
                                        <p className="text-xs text-slate-400 text-center">No car selected. <Link to="/inventory" className="text-accent font-bold hover:underline">Browse inventory →</Link></p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base text-accent">storefront</span>
                                Kasaba Bawada Showroom
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">Shree Swami Samarth Motors, Kasaba Bawada, Kolhapur, Maharashtra 416006</p>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                                <a
                                    href="https://maps.google.com/?q=Kasaba+Bawada,+Kolhapur"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-accent hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">navigation</span> Directions
                                </a>
                                <a
                                    href="tel:+919823237975"
                                    className="font-bold text-slate-600 hover:text-primary flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">call</span> Call Showroom
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookTestDrive;
