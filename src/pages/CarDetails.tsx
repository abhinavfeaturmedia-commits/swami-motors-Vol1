import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPrimaryImage, formatPriceLakh } from '../lib/utils';

const SPECS = [
    { icon: 'speed', label: 'Odometer', key: 'mileage', suffix: ' km' },
    { icon: 'person', label: 'Ownership', key: 'ownership', default: '1st Owner' },
    { icon: 'local_gas_station', label: 'Fuel', key: 'fuel_type' },
    { icon: 'engineering', label: 'Engine', key: 'engine', default: 'N/A' },
    { icon: 'tune', label: 'Transmission', key: 'transmission' },
    { icon: 'calendar_month', label: 'Year', key: 'year' },
    { icon: 'directions_car', label: 'Condition', key: 'condition' },
    { icon: 'verified_user', label: 'Insurance', key: 'insurance', default: 'Valid' },
];

const INSPECTION = [
    { label: 'Engine Sound is Smooth', pass: true },
    { label: 'No Oil Leakage', pass: true },
    { label: 'AC Cooling is Effective', pass: true },
    { label: 'All Electricals Working', pass: true },
];

interface CarData {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    mileage: number;
    condition: string;
    images: string[];
    features: string;
    status: string;
}

const CarDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [car, setCar] = useState<CarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedImg, setSelectedImg] = useState(0);

    useEffect(() => {
        const fetchCar = async () => {
            if (!id) return;
            const { data, error: err } = await supabase.from('inventory').select('*').eq('id', id).single();
            if (err || !data) {
                setError(true);
            } else {
                setCar(data);
            }
            setLoading(false);
        };
        fetchCar();
    }, [id]);

    if (loading) {
        return <div className="container-main py-20 text-center text-slate-400 font-medium">Loading vehicle details...</div>;
    }

    if (error || !car) {
        return (
            <div className="container-main py-20 text-center">
                <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
                <p className="text-slate-500 font-medium mb-4">Vehicle not found or an error occurred.</p>
                <Link to="/inventory" className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                    Back to Inventory
                </Link>
            </div>
        );
    }

    const mainImage = car.images && car.images.length > 0 ? getPrimaryImage([car.images[selectedImg] || car.images[0]]) : getPrimaryImage([]);
    const thumbnails = car.images && car.images.length > 0 ? car.images : [];

    return (
        <div className="container-main py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link to="/inventory" className="hover:text-primary transition-colors">Used Cars</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-medium">{car.make}: {car.model}</span>
            </nav>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Images */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Image */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[16/10]">
                        <img src={mainImage} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 flex gap-2">
                            {car.condition === 'Excellent' && (
                                <span className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider backdrop-blur-md">Certified</span>
                            )}
                            {car.status === 'reserved' && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider backdrop-blur-md">Reserved</span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {thumbnails.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {thumbnails.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImg(i)} className={`shrink-0 w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-accent shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
                                    <img src={getPrimaryImage([img])} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-primary font-display">{car.year} {car.make} {car.model}</h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <span>{car.fuel_type}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{car.transmission}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Kolhapur</span>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div>
                        <h2 className="text-xl font-bold text-primary font-display mb-5">Car Specifications</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {SPECS.map(spec => {
                                let val = (car as any)[spec.key];
                                if (val === undefined || val === null || val === '') val = spec.default;
                                if (spec.key === 'mileage' && val) val = val.toLocaleString();
                                return (
                                    <div key={spec.key} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[var(--shadow-card)]">
                                        <span className="material-symbols-outlined text-xl text-accent mb-2 block">{spec.icon}</span>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{spec.label}</p>
                                        <p className="text-sm font-bold text-primary">{String(val)}{spec.suffix || ''}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Features List */}
                    {car.features && (
                        <div>
                            <h2 className="text-xl font-bold text-primary font-display mb-5">Key Features</h2>
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[var(--shadow-card)] font-medium text-sm text-slate-700 whitespace-pre-wrap">
                                {car.features}
                            </div>
                        </div>
                    )}

                    {/* Inspection Report */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-success-light rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-success">verified</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-primary font-display">Inspection Report</h3>
                                <p className="text-xs text-slate-500">150-Point Check Passed</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INSPECTION.map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="size-6 rounded-full bg-success-light flex items-center justify-center">
                                        <Check size={14} className="text-success" />
                                    </div>
                                    <span className="text-sm text-slate-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Price Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[var(--shadow-card)] sticky top-[5.5rem]">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Total Price</p>
                                <p className="text-3xl font-black text-primary font-display">₹ {formatPriceLakh(car.price)}</p>
                                <p className="text-xl font-black text-primary font-display">Lakh</p>
                            </div>
                            <span className="bg-accent-light text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">Fixed Price</span>
                        </div>
                        <Link to={`/finance?price=${car.price}`} className="text-sm font-semibold text-accent hover:underline flex items-center gap-1 mb-6">
                            Calculate EMI Options <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </Link>
                        <div className="space-y-3 mb-4">
                            <Link to={`/book-test-drive?car=${car.id}`} className="w-full h-12 flex items-center justify-center gap-2 bg-accent text-primary font-bold rounded-xl hover:bg-accent-hover transition-all shadow-sm text-sm">
                                <span className="material-symbols-outlined text-lg">directions_car</span> Book Test Drive
                            </Link>
                            <a href={`https://wa.me/919876543210?text=I'm interested in the ${car.year} ${car.make} ${car.model} (ID: ${car.id})`} target="_blank" rel="noreferrer" className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-colors text-sm">
                                <span className="material-symbols-outlined text-lg">forum</span> WhatsApp Inquiry
                            </a>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                            <span className="material-symbols-outlined text-sm text-success">verified</span>
                            7-Day Money Back Guarantee
                        </div>
                    </div>

                    {/* Dealer Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0">
                                <span className="material-symbols-outlined text-lg">storefront</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary">Shree Swami Samarth Motors</p>
                                <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-xs text-accent shrink-0 mt-0.5">location_on</span>
                                    <span>Kasaba Bawada, Kolhapur, Maharashtra 416006</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-accent text-xl shrink-0">support_agent</span>
                            <p className="text-sm font-bold text-primary">Need help?</p>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Talk to our car experts to get more details about this car.</p>
                        <a href="tel:+919823237975" className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">call</span> Call +91 98232 37975
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarDetails;
