import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

interface Customer {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    alternate_phone: string | null;
    address: string | null;
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
    email: '',
    address: '',
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
    const [addForm, setAddForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const filtered = customers.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.city ?? '').toLowerCase().includes(search.toLowerCase())
    );

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.full_name || !addForm.phone) return;
        setSaving(true);
        const { supabase } = await import('../../lib/supabase');
        const { error } = await supabase.from('customers').insert({
            full_name: addForm.full_name,
            phone: addForm.phone,
            alternate_phone: addForm.alternate_phone || null,
            email: addForm.email || null,
            address: addForm.address || null,
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
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 w-full max-w-md">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email or city…" className="bg-transparent text-sm text-primary outline-none w-full" />
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
                                    <tr key={c.id} onClick={() => setDetail(c)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer transition-colors">
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
                                                <a href={`https://wa.me/91${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg" title="WhatsApp" onClick={e => e.stopPropagation()}>
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
                            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
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

                            {/* Contact Info */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Information</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: 'call', label: 'Phone', value: detail.phone },
                                        { icon: 'phone_in_talk', label: 'Alt. Phone', value: detail.alternate_phone },
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
                            {(detail.address || detail.date_of_birth) && (
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
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Address</p>
                                                </div>
                                                <p className="text-sm font-semibold text-primary pl-6">{detail.address}</p>
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

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <a href={`tel:${detail.phone}`} className="h-11 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                    <span className="material-symbols-outlined text-base">call</span> Call
                                </a>
                                <a href={`https://wa.me/91${detail.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="h-11 bg-primary text-white hover:bg-primary-light rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
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

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                <input type="text" value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} placeholder="Street, Area, Landmark" className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
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
