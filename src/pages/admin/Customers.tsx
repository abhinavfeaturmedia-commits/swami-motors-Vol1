import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';
import { toWhatsAppUrl } from '../../lib/utils';

interface Customer {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    alternate_phone: string | null;
    whatsapp_number: string | null;
    address: string | null;
    office_address: string | null;
    city: string | null;
    occupation: string | null;
    date_of_birth: string | null;
    notes: string | null;
    created_at: string;
}

const emptyForm = {
    full_name: '',
    phone: '',
    alternate_phone: '',
    whatsapp_number: '',
    email: '',
    address: '',
    office_address: '',
    city: 'Kolhapur',
    occupation: '',
    date_of_birth: '',
    notes: '',
};

const Customers = () => {
    const { customers, sales, loading, refreshData } = useData();
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState<Customer | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(emptyForm);
    const [addForm, setAddForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ─── Customer Car Interests ─────────────────────────────────────────
    const [customerInterests, setCustomerInterests] = useState<any[]>([]);
    const [interestsLoading, setInterestsLoading] = useState(false);

    useEffect(() => {
        if (!detail) { setCustomerInterests([]); return; }
        setInterestsLoading(true);
        supabase
            .from('lead_car_interests')
            .select('*, car:inventory(id, make, model, year, price, thumbnail)')
            .eq('customer_id', detail.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setCustomerInterests(data || []);
                setInterestsLoading(false);
            });
    }, [detail]);

    /**
     * Bulk-fetch lead_car_interests with customer_id so we can search ALL customers
     * by car interest (make/model/reg) without opening their detail panel first.
     * This is separate from the per-detail fetch above which loads full car info for display.
     */
    const [customerCarInterestMap, setCustomerCarInterestMap] = useState<Map<string, Array<{ make: string; model: string; registration_no: string }>>>(new Map());

    useEffect(() => {
        supabase
            .from('lead_car_interests')
            .select('customer_id, car:inventory(make, model, registration_no)')
            .not('customer_id', 'is', null)
            .then(({ data }) => {
                const map = new Map<string, Array<{ make: string; model: string; registration_no: string }>>();
                (data || []).forEach((r: any) => {
                    if (!r.customer_id || !r.car) return;
                    if (!map.has(r.customer_id)) map.set(r.customer_id, []);
                    map.get(r.customer_id)!.push({
                        make:            (r.car.make            || '').toLowerCase(),
                        model:           (r.car.model           || '').toLowerCase(),
                        registration_no: (r.car.registration_no || '').toLowerCase(),
                    });
                });
                setCustomerCarInterestMap(map);
            });
    }, []);

    /**
     * Build a lookup map: customerId → array of purchased car info.
     * Source: sales with joined car:inventory(*) already loaded in DataContext.
     * This allows searching customers by registration number, make, or model
     * without any extra DB round-trip.
     */
    const customerCarMap = useMemo(() => {
        const map = new Map<string, Array<{ make: string; model: string; registration_no: string }>>(
        );
        for (const sale of (sales || [])) {
            const cid = sale.customer_id;
            if (!cid || !sale.car) continue;
            if (!map.has(cid)) map.set(cid, []);
            map.get(cid)!.push({
                make:            (sale.car.make            || '').toLowerCase(),
                model:           (sale.car.model           || '').toLowerCase(),
                registration_no: (sale.car.registration_no || '').toLowerCase(),
            });
        }
        return map;
    }, [sales]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return customers;
        return customers.filter(c => {
            // 1. Standard personal fields
            if ((c.full_name || '').toLowerCase().includes(q)) return true;
            if ((c.phone     || '').includes(q))               return true;
            if ((c.email     || '').toLowerCase().includes(q)) return true;
            if ((c.city      || '').toLowerCase().includes(q)) return true;

            // 2. Cars from PURCHASE history (sales → inventory)
            const purchasedCars = customerCarMap.get(c.id) || [];
            if (purchasedCars.some(car =>
                car.make.includes(q) ||
                car.model.includes(q) ||
                car.registration_no.includes(q) ||
                `${car.make} ${car.model}`.includes(q)
            )) return true;

            // 3. Cars from INTEREST history (lead_car_interests with customer_id)
            const interestedCars = customerCarInterestMap.get(c.id) || [];
            return interestedCars.some(car =>
                car.make.includes(q) ||
                car.model.includes(q) ||
                car.registration_no.includes(q) ||
                `${car.make} ${car.model}`.includes(q)
            );
        });
    }, [customers, search, customerCarMap, customerCarInterestMap]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const getCustomerSales = (id: string) => sales.filter(s => s.customer_id === id);

    const openDetail = (c: Customer) => {
        setDetail(c);
        setIsEditing(false);
        setEditForm({
            full_name: c.full_name || '',
            phone: c.phone || '',
            alternate_phone: c.alternate_phone || '',
            whatsapp_number: c.whatsapp_number || '',
            email: c.email || '',
            address: c.address || '',
            office_address: c.office_address || '',
            city: c.city || 'Kolhapur',
            occupation: c.occupation || '',
            date_of_birth: c.date_of_birth || '',
            notes: c.notes || '',
        });
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !editForm.full_name || !editForm.phone) return;
        setSaving(true);
        const { error } = await supabase.from('customers').update({
            full_name: editForm.full_name,
            phone: editForm.phone,
            alternate_phone: editForm.alternate_phone || null,
            whatsapp_number: editForm.whatsapp_number || null,
            email: editForm.email || null,
            address: editForm.address || null,
            office_address: editForm.office_address || null,
            city: editForm.city || 'Kolhapur',
            occupation: editForm.occupation || null,
            date_of_birth: editForm.date_of_birth || null,
            notes: editForm.notes || null,
        }).eq('id', detail.id);
        setSaving(false);
        if (!error) {
            setIsEditing(false);
            refreshData();
            setDetail(prev => prev ? { ...prev, ...editForm } as Customer : null);
        } else { alert('Failed to update customer'); }
    };

    const handleDelete = async () => {
        if (!detail) return;
        if (!window.confirm(`Delete ${detail.full_name}? This cannot be undone.`)) return;
        setDeleting(true);
        const { error } = await supabase.from('customers').delete().eq('id', detail.id);
        setDeleting(false);
        if (!error) { setDetail(null); refreshData(); }
        else alert('Failed to delete customer');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.full_name || !addForm.phone) return;
        setSaving(true);
        const { supabase } = await import('../../lib/supabase');
        const { error } = await supabase.from('customers').insert({
            full_name: addForm.full_name,
            phone: addForm.phone,
            alternate_phone: addForm.alternate_phone || null,
            whatsapp_number: addForm.whatsapp_number || null,
            email: addForm.email || null,
            address: addForm.address || null,
            office_address: addForm.office_address || null,
            city: addForm.city || 'Kolhapur',
            occupation: addForm.occupation || null,
            date_of_birth: addForm.date_of_birth || null,
            notes: addForm.notes || null,
        });
        setSaving(false);
        if (!error) {
            setIsAdding(false);
            setAddForm(emptyForm);
            refreshData();
        } else {
            console.error(error);
            alert('Failed to add customer');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Customer Directory</h1>
                    <p className="text-slate-500 text-sm">{loading ? '...' : customers.length} verified customers in your database.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsAdding(true)} className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary-light transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">person_add</span> Add Customer
                    </button>
                    <button onClick={refreshData} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 w-full max-w-lg">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email, city, car brand or reg. no…" className="bg-transparent text-sm text-primary outline-none w-full" />
                {search && <button onClick={() => setSearch('')} className="material-symbols-outlined text-slate-300 text-base hover:text-slate-500">close</button>}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="overflow-x-auto relative">
                    <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Customer</th>
                            <th className="text-left px-5 py-3">Contact</th>
                            <th className="text-left px-5 py-3">City</th>
                            <th className="text-left px-5 py-3">Sales</th>
                            <th className="text-left px-5 py-3">Added On</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading customers...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">people_alt</span>
                                    <p className="text-slate-400 font-medium">No customers found</p>
                                    <p className="text-xs text-slate-300 mt-1">Convert leads or add a customer manually.</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((c: Customer) => {
                                const custSales = getCustomerSales(c.id);
                                return (
                                    <tr key={c.id} onClick={() => openDetail(c)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-sm font-bold shrink-0">
                                                    {c.full_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-primary">{c.full_name}</p>
                                                    {c.occupation && <p className="text-[10px] text-slate-400">{c.occupation}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-medium text-slate-700">{c.phone}</p>
                                            {c.email && <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{c.email}</p>}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600">{c.city || '—'}</td>
                                        <td className="px-5 py-3.5">
                                            {custSales.length > 0 ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-700 uppercase tracking-wide">
                                                    {custSales.length} Purchase{custSales.length > 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(c.created_at)}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1">
                                                <a href={`tel:${c.phone}`} className="p-1.5 hover:bg-green-50 rounded-lg" title="Call" onClick={e => e.stopPropagation()}>
                                                    <span className="material-symbols-outlined text-green-500 text-base">call</span>
                                                </a>
                                        <a href={`https://wa.me/91${(c.whatsapp_number || c.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg" title="WhatsApp" onClick={e => e.stopPropagation()}>
                                                    <span className="material-symbols-outlined text-slate-400 text-base">chat</span>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* ── Customer Detail Modal ── */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary to-primary-light px-6 pt-6 pb-8 rounded-t-3xl relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => setIsEditing(v => !v)} className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title="Edit">
                                    <span className="material-symbols-outlined text-white text-lg">{isEditing ? 'close' : 'edit'}</span>
                                </button>
                                <button onClick={() => setDetail(null)} className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-white text-lg">close</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black">
                                    {detail.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">{detail.full_name}</h2>
                                    {detail.occupation && <p className="text-white/70 text-sm mt-0.5">{detail.occupation}</p>}
                                    <p className="text-white/50 text-xs mt-1">Customer since {formatDate(detail.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* Edit Form */}
                            {isEditing && (
                                <form onSubmit={handleEditSave} className="space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Edit Details</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name *</label><input required value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone *</label><input required value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">City</label><input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">WhatsApp</label><input value={editForm.whatsapp_number} onChange={e => setEditForm({...editForm, whatsapp_number: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Occupation</label><input value={editForm.occupation} onChange={e => setEditForm({...editForm, occupation: e.target.value})} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10" /></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notes</label><textarea rows={2} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10 resize-none" /></div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 h-10 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete Customer'}</button>
                                        <button type="submit" disabled={saving} className="flex-1 h-10 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-light transition disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
                                    </div>
                                </form>
                            )}

                            {/* Contact Info */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Information</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: 'call', label: 'Phone', value: detail.phone },
                                        { icon: 'phone_in_talk', label: 'Alt. Phone', value: detail.alternate_phone },
                                        { icon: 'forum', label: 'WhatsApp', value: detail.whatsapp_number },
                                        { icon: 'mail', label: 'Email', value: detail.email },
                                        { icon: 'location_on', label: 'City', value: detail.city },
                                    ].map((item, i) => item.value && (
                                        <div key={i} className="bg-slate-50 rounded-xl px-3.5 py-3">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="material-symbols-outlined text-slate-400 text-sm">{item.icon}</span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-primary pl-6">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Personal Info */}
                            {(detail.address || detail.office_address || detail.date_of_birth) && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {detail.date_of_birth && (
                                            <div className="bg-slate-50 rounded-xl px-3.5 py-3">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">cake</span>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date of Birth</p>
                                                </div>
                                                <p className="text-sm font-semibold text-primary pl-6">{formatDate(detail.date_of_birth)}</p>
                                            </div>
                                        )}
                                        {detail.address && (
                                            <div className="bg-slate-50 rounded-xl px-3.5 py-3 col-span-2">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">home</span>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Personal Address</p>
                                                </div>
                                                <p className="text-sm font-semibold text-primary pl-6">{detail.address}</p>
                                            </div>
                                        )}
                                        {detail.office_address && (
                                            <div className="bg-slate-50 rounded-xl px-3.5 py-3 col-span-2">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">business</span>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Office Address</p>
                                                </div>
                                                <p className="text-sm font-semibold text-primary pl-6">{detail.office_address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {detail.notes && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-amber-500 text-sm">sticky_note_2</span>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Notes</p>
                                    </div>
                                    <p className="text-sm text-amber-900 leading-relaxed">{detail.notes}</p>
                                </div>
                            )}

                            {/* Purchase History */}
                            {getCustomerSales(detail.id).length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Purchase History</p>
                                    <div className="space-y-2">
                                        {getCustomerSales(detail.id).map(sale => (
                                            <div key={sale.id} className="bg-green-50 border border-green-100 rounded-xl p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-bold text-primary">{sale.car?.year} {sale.car?.make} {sale.car?.model}</p>
                                                    <span className="text-xs font-black text-green-700">{formatCurrency(sale.final_price)}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">Sold on {formatDate(sale.sale_date)}</p>
                                                {sale.notes && <p className="text-xs text-slate-600 mt-1.5 bg-white/60 px-2 py-1 rounded-lg">{sale.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Car Interests */}
                            {(interestsLoading || customerInterests.length > 0) && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Car Interests</p>
                                    {interestsLoading ? (
                                        <p className="text-xs text-slate-400">Loading...</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {customerInterests.map((interest: any) => (
                                                <div key={interest.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5">
                                                    <div className="size-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                                                        {interest.car?.thumbnail ? (
                                                            <img src={interest.car.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-slate-400 text-base">directions_car</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-primary truncate">
                                                            {interest.car?.year} {interest.car?.make} {interest.car?.model}
                                                        </p>
                                                        <p className="text-xs text-slate-500">₹{interest.car?.price?.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                        interest.interest_level === 'hot' ? 'bg-red-100 text-red-600' :
                                                        interest.interest_level === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {interest.interest_level === 'hot' ? '🔥' : interest.interest_level === 'warm' ? '⭐' : '❄️'} {interest.interest_level}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lead Origin Link */}
                            {(detail as any).lead_id && (
                                <Link to={`/admin/leads/${(detail as any).lead_id}`} onClick={() => setDetail(null)} className="flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                                    <span className="material-symbols-outlined text-base">person_search</span> View Original Lead →
                                </Link>
                            )}
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <a href={`tel:${detail.phone}`} className="h-11 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                    <span className="material-symbols-outlined text-base">call</span> Call
                                </a>
                                <a href={toWhatsAppUrl(detail.whatsapp_number || detail.phone)} target="_blank" rel="noreferrer" className="h-11 bg-primary text-white hover:bg-primary-light rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                    <span className="material-symbols-outlined text-base">forum</span> WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Customer Modal ── */}
            {isAdding && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-primary font-display">Add Customer</h2>
                                <p className="text-xs text-slate-500">Manually add a new customer to the directory.</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="size-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                                <input required type="text" value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} placeholder="e.g., Rahul Patil" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>

                            {/* Phone + Alt Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone <span className="text-red-400">*</span></label>
                                    <input required type="tel" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="9876543210" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Alternate Phone <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="tel" value={addForm.alternate_phone} onChange={e => setAddForm({ ...addForm, alternate_phone: e.target.value })} placeholder="9876543210" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                            </div>

                            {/* WhatsApp Number */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">WhatsApp Number <span className="text-xs text-slate-400 font-normal">(if different from primary)</span></label>
                                <input type="tel" value={addForm.whatsapp_number} onChange={e => setAddForm({ ...addForm, whatsapp_number: e.target.value })} placeholder="WhatsApp number" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>

                            {/* Email + Occupation */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Email <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="rahul@example.com" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Occupation <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="text" value={addForm.occupation} onChange={e => setAddForm({ ...addForm, occupation: e.target.value })} placeholder="e.g., Teacher, Engineer" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                            </div>

                            {/* City + DOB */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">City</label>
                                    <input type="text" value={addForm.city} onChange={e => setAddForm({ ...addForm, city: e.target.value })} placeholder="Kolhapur" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Date of Birth <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="date" value={addForm.date_of_birth} onChange={e => setAddForm({ ...addForm, date_of_birth: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                            </div>

                            {/* Personal Address */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Personal Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                <input type="text" value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} placeholder="Street, Area, Landmark" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>

                            {/* Office Address */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Office Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                <input type="text" value={addForm.office_address} onChange={e => setAddForm({ ...addForm, office_address: e.target.value })} placeholder="Workplace / Office address" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Internal Notes <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                <textarea rows={3} value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Any notes about this customer…" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 resize-none" />
                            </div>

                            <div className="pt-1">
                                <button type="submit" disabled={saving} className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70">
                                    {saving
                                        ? <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                        : <><span className="material-symbols-outlined text-lg">person_add</span> Save Customer</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
