import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import imageCompression from 'browser-image-compression';

const MAKES = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Kia', 'MG', 'Mahindra', 'Volkswagen', 'Skoda', 'Renault', 'Nissan', 'Ford', 'Jeep', 'Mercedes-Benz', 'BMW', 'Audi', 'Other'];

interface Dealer {
    id: string;
    dealer_code: string;
    name: string;
    status: string;
}

const InventoryForm = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Form state ──────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        make: '', model: '', variant: '', year: new Date().getFullYear(),
        price: '', original_price: '',
        fuel_type: 'Petrol', transmission: 'Manual',
        mileage: '', color: '', body_type: '', registration_no: '',
        ownership: '1', condition: 'used', status: 'available',
        description: '',
    });

    // ─── Dealer state ─────────────────────────────────────────────────────────
    const [source, setSource] = useState<'own' | 'dealer'>('own');
    const [dealerId, setDealerId] = useState('');
    const [dealerAskingPrice, setDealerAskingPrice] = useState('');
    const [ourMargin, setOurMargin] = useState('');
    const [dealerCommission, setDealerCommission] = useState('');
    const [dealers, setDealers] = useState<Dealer[]>([]);

    // Fetch dealers for dropdown
    useEffect(() => {
        supabase.from('dealers').select('id, dealer_code, name, status').eq('status', 'active').then(({ data }) => {
            if (data) setDealers(data as Dealer[]);
        });
    }, []);

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [autoFillText, setAutoFillText] = useState('');

    const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

    // ─── Load data if Edit Mode ─────────────────────────────────────────────
    useEffect(() => {
        const fetchCar = async () => {
            if (!id) return;
            const { data, error } = await supabase.from('inventory').select('*').eq('id', id).single();
            if (error || !data) {
                setError('Car not found.');
                setInitialLoading(false);
                return;
            }
            // Populate form
            setForm({
                make: data.make || '',
                model: data.model || '',
                variant: data.variant || '',
                year: data.year || new Date().getFullYear(),
                price: data.price ? String(data.price) : '',
                original_price: data.original_price ? String(data.original_price) : '',
                fuel_type: data.fuel_type || 'Petrol',
                transmission: data.transmission || 'Manual',
                mileage: data.mileage ? String(data.mileage) : '',
                color: data.color || '',
                body_type: data.body_type || '',
                registration_no: data.registration_no || '',
                ownership: data.ownership ? String(data.ownership) : '1',
                condition: data.condition || 'used',
                status: data.status || 'available',
                description: data.description || '',
            });
            // Populate dealer fields
            setSource(data.source || 'own');
            setDealerId(data.dealer_id || '');
            setDealerAskingPrice(data.dealer_asking_price ? String(data.dealer_asking_price) : '');
            setOurMargin(data.our_margin ? String(data.our_margin) : '');
            setDealerCommission(data.dealer_commission ? String(data.dealer_commission) : '');
            if (data.images) {
                setExistingImages(data.images);
            }
            setInitialLoading(false);
        };
        fetchCar();
    }, [id]);

    // ─── Image selection ─────────────────────────────────────────────────────
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        const totalCount = existingImages.length + selectedFiles.length + files.length;
        if (totalCount > 20) {
            alert('Cannot select more than 20 photos total.');
            return;
        }

        setUploading(true);
        try {
            const options = {
                maxSizeMB: 0.5, // Target max size 500KB
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8
            };

            const compressedFiles = await Promise.all(
                files.map(async (file) => {
                    try {
                        const compressedBlob = await imageCompression(file, options);
                        return new File([compressedBlob], file.name, {
                            type: compressedBlob.type,
                            lastModified: Date.now(),
                        });
                    } catch (err) {
                        console.error('Image compression failed for', file.name, err);
                        return file; // use original if compression fails
                    }
                })
            );

            const combined = [...selectedFiles, ...compressedFiles];
            setSelectedFiles(combined);
            setPreviews(combined.map(f => URL.createObjectURL(f)));
        } catch (error) {
            console.error('Error handling file selection:', error);
            alert('An error occurred while compiling your images.');
        } finally {
            setUploading(false);
        }

        // Reset the input value so the same files can be selected again
        if (e.target) {
            e.target.value = '';
        }
    };

    const removeNewImage = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const getImageUrl = (img: string) => {
        if (img.startsWith('http')) return img;
        return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/car-images/${img}`;
    };

    // ─── Magic Auto Fill ─────────────────────────────────────────────────────
    const handleAutoFill = () => {
        if (!autoFillText.trim()) return;

        const data = { ...form };
        // Remove emojis and special characters: keep alphanumeric, spaces, and basic punctuation
        const text = autoFillText.replace(/[^\w\s.,₹:\-/()]/g, '');
        const lowerText = text.toLowerCase();

        // 1. Detect Make
        const makes = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Kia', 'MG', 'Mahindra', 'Volkswagen', 'Skoda', 'Renault', 'Nissan', 'Ford', 'Jeep', 'Mercedes-Benz', 'BMW', 'Audi'];
        for (const make of makes) {
            if (lowerText.includes(make.toLowerCase()) || (make === 'Maruti Suzuki' && lowerText.includes('maruti'))) {
                data.make = make;
                break;
            }
        }

        // 2. Detect Model using a known models lookup per make
        const modelsByMake: Record<string, string[]> = {
            'Maruti Suzuki': ['Swift', 'Dzire', 'Alto', 'Baleno', 'Ertiga', 'Vitara Brezza', 'Brezza', 'WagonR', 'Wagon R', 'Celerio', 'Ignis', 'S-Cross', 'Ciaz', 'Eeco', 'Omni', 'Grand Vitara', 'Jimny', 'Fronx', 'Invicto'],
            'Hyundai': ['Creta', 'Venue', 'i20', 'i10', 'Grand i10', 'Verna', 'Tucson', 'Alcazar', 'Aura', 'Santro', 'Exter', 'Ioniq'],
            'Tata': ['Nexon', 'Harrier', 'Safari', 'Tiago', 'Tigor', 'Punch', 'Altroz', 'Hexa', 'Indica', 'Indigo', 'Nano', 'Zest', 'Bolt'],
            'Honda': ['City', 'Amaze', 'Jazz', 'WR-V', 'BR-V', 'CR-V', 'HR-V', 'Accord', 'Civic', 'Brio', 'Mobilio', 'Elevate'],
            'Toyota': ['Fortuner', 'Innova', 'Innova Crysta', 'Glanza', 'Urban Cruiser', 'Camry', 'Etios', 'Liva', 'Corolla', 'Hyryder', 'Rumion'],
            'Kia': ['Seltos', 'Sonet', 'Carnival', 'Carens', 'EV6'],
            'MG': ['Hector', 'Astor', 'Gloster', 'ZS EV', 'Comet'],
            'Mahindra': ['XUV700', 'XUV400', 'XUV300', 'Thar', 'Scorpio', 'Scorpio N', 'Bolero', 'KUV100', 'Marazzo', 'BE6'],
            'Volkswagen': ['Polo', 'Vento', 'Taigun', 'Tiguan', 'Virtus'],
            'Skoda': ['Rapid', 'Kushaq', 'Octavia', 'Superb', 'Kodiaq', 'Slavia'],
            'Renault': ['Duster', 'Kwid', 'Triber', 'Kiger'],
            'Nissan': ['Magnite', 'Kicks', 'Terrano', 'Micra'],
            'Ford': ['EcoSport', 'Figo', 'Endeavour', 'Freestyle', 'Aspire'],
            'Jeep': ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
        };

        const knownModels = data.make ? (modelsByMake[data.make] || []) : Object.values(modelsByMake).flat();
        // Sort by length descending so "Innova Crysta" matches before "Innova"
        const sortedModels = [...knownModels].sort((a, b) => b.length - a.length);

        for (const model of sortedModels) {
            if (lowerText.includes(model.toLowerCase())) {
                data.model = model;
                // Extract variant: text after make+model, strip common noise words
                const makeStr = data.make === 'Maruti Suzuki' ? '(?:maruti suzuki|maruti)' : data.make.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const modelStr = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const afterModel = text.replace(new RegExp(`${makeStr}\\s*`, 'gi'), '')
                    .replace(new RegExp(`${modelStr}\\s*`, 'gi'), '');
                // Pick out variant — first word(s) that aren't petrol/diesel/year/km/owner/price
                const variantMatch = afterModel.match(/\b([A-Z][a-zA-Z0-9+\-]{1,}(?:\s+[A-Z][a-zA-Z0-9+\-]{1,})?)\b/);
                if (variantMatch) {
                    const candidate = variantMatch[1];
                    if (!/^(petrol|diesel|cng|electric|ev|hybrid|owner|price|km|kms|rs|inr|\d{4})$/i.test(candidate)) {
                        data.variant = candidate;
                    }
                }
                break;
            }
        }

        // 3. Year
        const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) data.year = Number(yearMatch[1]);

        // 4. Price
        const priceMatch = text.match(/price\s*[:\-]?\s*(?:rs|inr|₹)?\s*([\d,]+)/i);
        if (priceMatch) data.price = priceMatch[1].replace(/,/g, '');

        // 5. Registration number
        const regMatch = text.match(/([A-Z]{2}\s?\d{1,2}\s?[a-zA-Z]{1,3}\s?\d{1,4})/i);
        if (regMatch) data.registration_no = regMatch[1].replace(/\s+/g, '').toUpperCase();

        // 6. Mileage
        const milMatch = text.match(/([\d,]+)\s*(km|kms)\b/i);
        if (milMatch) data.mileage = milMatch[1].replace(/,/g, '');

        // 7. Fuel type
        if (lowerText.includes('petrol')) data.fuel_type = 'Petrol';
        else if (lowerText.includes('diesel')) data.fuel_type = 'Diesel';
        else if (lowerText.includes('cng')) data.fuel_type = 'CNG';
        else if (lowerText.includes('electric') || lowerText.includes(' ev')) data.fuel_type = 'Electric';

        // 8. Ownership
        const ownerMatch = lowerText.match(/(\d)(?:st|nd|rd|th)?\s*owner/i);
        if (ownerMatch) data.ownership = ownerMatch[1];
        else if (lowerText.match(/\b1st\b|\bfirst\b/i)) data.ownership = '1';
        else if (lowerText.match(/\b2nd\b|\bsecond\b/i)) data.ownership = '2';
        else if (lowerText.match(/\b3rd\b|\bthird\b/i)) data.ownership = '3';

        setForm(data);
        setAutoFillText('');
    };


    // ─── Upload images to Supabase Storage ───────────────────────────────────
    const uploadImages = async (): Promise<string[]> => {
        if (selectedFiles.length === 0) return [];
        setUploading(true);
        const urls: string[] = [];
        const failed: string[] = [];

        for (const file of selectedFiles) {
            const ext = file.name.split('.').pop() || 'jpg';
            const path = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('car-images')
                .upload(path, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error for', file.name, uploadError.message);
                failed.push(file.name);
                continue;
            }

            const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(path);
            if (urlData?.publicUrl) urls.push(urlData.publicUrl);
        }

        setUploading(false);

        // Surface any failures so the user knows what happened
        if (failed.length > 0) {
            throw new Error(`These photos failed to upload: ${failed.join(', ')}. Please try again.`);
        }

        return urls;
    };

    // ─── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
        setError('');

        if (!form.make || !form.model || !form.price) {
            setError('Make, Model, and Price are required fields.');
            return;
        }

        setSaving(true);
        try {
            const newImageUrls = await uploadImages();
            const allImages = [...existingImages, ...newImageUrls];
            const thumbnail = allImages.length > 0 ? allImages[0] : null;

            const payload: any = {
                make: form.make,
                model: form.model,
                variant: form.variant || null,
                year: Number(form.year),
                price: Number(form.price),
                original_price: form.original_price ? Number(form.original_price) : null,
                fuel_type: form.fuel_type,
                transmission: form.transmission,
                mileage: form.mileage ? Number(form.mileage) : null,
                color: form.color || null,
                body_type: form.body_type || null,
                registration_no: form.registration_no || null,
                ownership: Number(form.ownership),
                condition: form.condition,
                status: isDraft ? 'pending' : form.status,
                description: form.description || null,
                images: allImages.length > 0 ? allImages : null,
                thumbnail,
                // Dealer fields
                source,
                dealer_id: source === 'dealer' ? (dealerId || null) : null,
                dealer_asking_price: source === 'dealer' && dealerAskingPrice ? Number(dealerAskingPrice) : null,
                our_margin: source === 'dealer' && ourMargin ? Number(ourMargin) : null,
                dealer_commission: source === 'dealer' && dealerCommission ? Number(dealerCommission) : null,
            };

            if (isEditMode) {
                const { error: updateError } = await supabase.from('inventory').update(payload).eq('id', id);
                if (updateError) throw updateError;
            } else {
                payload.added_by = user?.id ?? null;
                const { error: insertError } = await supabase.from('inventory').insert(payload);
                if (insertError) throw insertError;
            }

            navigate('/admin/inventory');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading) {
        return <div className="py-20 text-center text-slate-400 font-medium">Loading inventory details...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">{isEditMode ? 'Edit Car' : 'Add New Car'}</h1>
                    <p className="text-slate-500 text-sm">Fill in the vehicle details to {isEditMode ? 'update the' : 'create a live'} listing.</p>
                </div>
                <Link to="/admin/inventory" className="text-sm font-semibold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Inventory
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg shrink-0">error</span>
                    {error}
                </div>
            )}

            {/* Smart Auto Fill */}
            {!isEditMode && (
                <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5 mb-6">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="material-symbols-outlined text-accent text-xl shrink-0">auto_awesome</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-primary mb-1">Smart Auto-Fill</h3>
                            <p className="text-xs text-slate-600 mb-3">Paste unstructured text from WhatsApp or notes (e.g. "Maruti Swift Vxi Petrol 2012 360000"). We'll extract the details and fill the form below.</p>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <textarea value={autoFillText} onChange={e => setAutoFillText(e.target.value)} rows={3} placeholder="Paste car details here..." className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 resize-y bg-white" />
                                <button type="button" onClick={handleAutoFill} disabled={!autoFillText.trim()} className="h-11 px-6 bg-primary text-white font-bold rounded-xl text-sm shrink-0 self-start hover:bg-primary-light transition-all disabled:opacity-50">
                                    Extract Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Identity & Pricing */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">directions_car</span> Vehicle Identity & Pricing
                    </h2>

                    {/* Source Toggle (Own / Dealer) */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Car Source <span className="text-xs text-slate-400">(internal — not shown to customers)</span></label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSource('own')}
                                className={`flex-1 h-10 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${
                                    source === 'own'
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">home</span> Own Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => setSource('dealer')}
                                className={`flex-1 h-10 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${
                                    source === 'dealer'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">store</span> Dealer Car
                            </button>
                        </div>
                    </div>

                    {/* Dealer fields — only shown when source = dealer */}
                    {source === 'dealer' && (
                        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 mb-5 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-amber-500 text-lg">store</span>
                                <p className="text-sm font-bold text-amber-800">Dealer Details <span className="text-xs font-normal text-amber-600">(visible to admin only — never public)</span></p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Select Dealer</label>
                                <select
                                    value={dealerId}
                                    onChange={e => setDealerId(e.target.value)}
                                    className="w-full h-11 bg-white border border-amber-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                                >
                                    <option value="">— Select a dealer —</option>
                                    {dealers.map(d => (
                                        <option key={d.id} value={d.id}>{d.dealer_code} — {d.name}</option>
                                    ))}
                                </select>
                                {dealers.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        No active dealers found. <a href="/admin/dealers" className="underline font-semibold">Add a dealer first →</a>
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Dealer's Cost (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={dealerAskingPrice}
                                            onChange={e => setDealerAskingPrice(e.target.value)}
                                            placeholder="e.g., 380000"
                                            className="w-full h-11 bg-white border border-amber-200 rounded-xl pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Our Margin (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={ourMargin}
                                            onChange={e => setOurMargin(e.target.value)}
                                            placeholder="e.g., 20000"
                                            className="w-full h-11 bg-white border border-amber-200 rounded-xl pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Commission (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={dealerCommission}
                                            onChange={e => setDealerCommission(e.target.value)}
                                            placeholder="e.g., 5000"
                                            className="w-full h-11 bg-white border border-amber-200 rounded-xl pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Make <span className="text-red-400">*</span></label>
                            <select value={form.make} onChange={e => set('make', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" required>
                                <option value="">Select Make</option>
                                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Model <span className="text-red-400">*</span></label>
                            <input type="text" value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g., Creta" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Year</label>
                            <select value={form.year} onChange={e => set('year', Number(e.target.value))} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Variant</label>
                            <input type="text" value={form.variant} onChange={e => set('variant', e.target.value)} placeholder="e.g., SX 1.5 Turbo" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Asking Price (₹) <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₹</span>
                                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g., 1450000" className="w-full h-11 border border-slate-200 rounded-xl pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" required />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Original Price (₹) <span className="text-xs text-slate-400">(optional, shows strikethrough)</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₹</span>
                                <input type="number" value={form.original_price} onChange={e => set('original_price', e.target.value)} placeholder="e.g., 1700000" className="w-full h-11 border border-slate-200 rounded-xl pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Registration No.</label>
                            <input type="text" value={form.registration_no} onChange={e => set('registration_no', e.target.value.toUpperCase())} placeholder="MH09 AB 1234" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 font-mono" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Ownership</label>
                            <select value={form.ownership} onChange={e => set('ownership', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                {['1', '2', '3', '4'].map(o => <option key={o} value={o}>{o === '1' ? '1st Owner' : o === '2' ? '2nd Owner' : o === '3' ? '3rd Owner' : '4th+ Owner'}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Technical Specs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">engineering</span> Technical Specifications
                    </h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Fuel Type</label>
                            <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transmission</label>
                            <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                {['Manual', 'Automatic', 'CVT'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Mileage (km)</label>
                            <input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="e.g., 24000" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
                            <input type="text" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g., Polar White" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Body Type</label>
                            <select value={form.body_type} onChange={e => set('body_type', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                <option value="">Select body type</option>
                                {['Hatchback', 'Sedan', 'SUV', 'MUV', 'Crossover', 'Coupe', 'Convertible', 'Pickup Truck'].map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Condition</label>
                            <select value={form.condition} onChange={e => set('condition', e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none">
                                <option value="used">Used</option>
                                <option value="certified">Certified Pre-Owned</option>
                                <option value="new">New</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-5">
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Highlight key features, service history, accident-free status, etc." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 resize-y" />
                    </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">inventory_2</span> Listing Status
                    </h2>
                    <div className="flex gap-3 flex-wrap">
                        {[
                            { val: 'available', label: 'Available', icon: 'check_circle', cls: 'bg-green-50 border-green-200 text-green-700' },
                            { val: 'reserved', label: 'Reserved', icon: 'schedule', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
                            { val: 'sold', label: 'Sold', icon: 'sell', cls: 'bg-slate-100 border-slate-200 text-slate-600' },
                            { val: 'pending', label: 'Pending', icon: 'pending', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                        ].map(s => (
                            <button key={s.val} type="button" onClick={() => set('status', s.val)}
                                className={`flex-1 min-w-[120px] h-11 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${form.status === s.val ? `${s.cls} shadow-sm` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{s.icon}</span>{s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Image Upload */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-primary font-display mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">image</span> Car Photos
                    </h2>
                    <p className="text-xs text-slate-500 mb-5">Photos upload to Supabase Storage. First photo becomes the thumbnail. Supports JPG, PNG, WebP.</p>

                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                        <p className="text-sm font-medium text-slate-600 mb-1">Click to browse photos</p>
                        <p className="text-xs text-slate-400">JPG, PNG, WebP · Max 20 photos</p>
                    </div>

                    {(existingImages.length > 0 || previews.length > 0) && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
                            {/* Existing Images */}
                            {existingImages.map((src, i) => (
                                <div key={`ex-${i}`} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                        <img src={getImageUrl(src)} alt={`Existing ${i}`} className="w-full h-full object-cover" />
                                    </div>
                                    {i === 0 && (
                                        <span className="absolute bottom-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded">THUMB</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(i)}
                                        className="absolute top-1 right-1 size-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">delete</span>
                                    </button>
                                </div>
                            ))}

                            {/* New Previews */}
                            {previews.map((src, i) => (
                                <div key={`new-${i}`} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 ring-2 ring-accent">
                                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">NEW</span>
                                        </div>
                                    </div>
                                    {existingImages.length === 0 && i === 0 && (
                                        <span className="absolute bottom-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded">THUMB</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(i)}
                                        className="absolute top-1 right-1 size-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </div>
                            ))}

                            <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary/30 hover:text-primary transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-xl">add</span>
                                <span className="text-[10px] font-medium">Add</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tip */}
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-accent text-xl shrink-0">lightbulb</span>
                    <div>
                        <p className="text-sm font-bold text-primary mb-1">Premium Listing Quality</p>
                        <p className="text-xs text-slate-600">Listings with 12+ photos, complete specs, and a good description get 3x more enquiries. Include exterior, interior, engine bay, and dashboard shots.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-8 sticky bottom-0 bg-white p-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-xl -mx-4 px-4 sm:mx-0 sm:px-6">
                    <button
                        type="button"
                        onClick={e => handleSubmit(e as any, true)}
                        disabled={saving}
                        className="h-11 px-6 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="submit"
                        disabled={saving || uploading}
                        className="h-11 px-6 bg-accent text-primary font-bold rounded-xl text-sm hover:bg-accent-hover transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 min-w-[160px] justify-center"
                    >
                        {saving || uploading ? (
                            <>
                                <span className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                {uploading ? 'Uploading photos…' : isEditMode ? 'Updating…' : 'Publishing…'}
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">{isEditMode ? 'save' : 'publish'}</span>
                                {isEditMode ? 'Save Changes' : 'Confirm & Publish'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InventoryForm;
