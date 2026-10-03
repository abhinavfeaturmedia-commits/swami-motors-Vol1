import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import HighlightText from '../../components/ui/HighlightText';

// ─── Sale Type Config ──────────────────────────────────────────────────────────
const saleTypeBadge: Record<string, { label: string; cls: string }> = {
    purchased:    { label: '🏠 Purchased',   cls: 'bg-blue-100 text-blue-700' },
    consignment:  { label: '🤝 Consignment', cls: 'bg-purple-100 text-purple-700' },
    dealer:       { label: '🏪 Dealer',       cls: 'bg-amber-100 text-amber-700' },
};

const AdminSales = () => {
    const { sales, inventory, loading, refreshData } = useData();
    const toast = useToast();

    // ─── Filters ──────────────────────────────────────────────────────────────
    const [period, setPeriod]     = useState('All Time');
    const [typeFilter, setType]   = useState('All');
    const [search, setSearch]     = useState('');
    const [detail, setDetail]     = useState<any>(null);

    // ─── Record Sale State ───────────────────────────────────────────────────
    const [isAddingSale, setIsAddingSale] = useState(false);
    const [addForm, setAddForm] = useState({
        inventory_id: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        final_price: '',
        notes: ''
    });
    const [savingSale, setSavingSale] = useState(false);
    const [saleError, setSaleError] = useState('');

    const availableCars = useMemo(() => {
        return inventory.filter(c => c.status === 'available' || !c.status || c.status === 'in_stock');
    }, [inventory]);

    const handleRecordDirectSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.inventory_id || !addForm.customer_name || !addForm.final_price) {
            setSaleError('Please fill in vehicle, buyer name, and final price.');
            return;
        }

        setSavingSale(true);
        setSaleError('');

        try {
            const selectedCar = inventory.find(c => c.id === addForm.inventory_id);
            if (!selectedCar) throw new Error('Selected vehicle not found.');

            const salePrice = Number(addForm.final_price);
            const purchaseCost = Number(selectedCar.purchase_cost || 0);
            const profit = salePrice - purchaseCost;

            // 1. Find or create customer
            // 1. Execute atomic sale transaction
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('swami_access_token');
            let success = false;

            if (token) {
                try {
                    const res = await fetch(`${apiUrl}/api/data/record-sale-transaction`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            inventory_id: selectedCar.id,
                            final_price: salePrice,
                            customer_name: addForm.customer_name,
                            customer_phone: addForm.customer_phone,
                            customer_email: addForm.customer_email,
                            notes: addForm.notes,
                            sale_type: selectedCar.source || 'purchased'
                        })
                    });
                    const resData = await res.json();
                    if (res.ok && resData.success) {
                        success = true;
                    }
                } catch (e) {
                    console.warn('Direct transaction endpoint unavailable, using standard client write fallback', e);
                }
            }

            if (!success) {
                // Fallback client write
                let customerId: string | null = null;
                if (addForm.customer_phone) {
                    const { data: existingCust } = await supabase
                        .from('customers')
                        .select('id')
                        .eq('phone', addForm.customer_phone.trim())
                        .maybeSingle();
                    if (existingCust) customerId = existingCust.id;
                }

                if (!customerId) {
                    const { data: newCust, error: custErr } = await supabase.from('customers').insert({
                        full_name: addForm.customer_name.trim(),
                        phone: addForm.customer_phone ? addForm.customer_phone.trim() : null,
                        email: addForm.customer_email ? addForm.customer_email.trim() : null,
                        notes: `Direct showroom buyer of ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                    }).select('id').single();
                    if (custErr) throw custErr;
                    if (newCust) customerId = newCust.id;
                }

                const { error: saleErr } = await supabase.from('sales').insert({
                    inventory_id: selectedCar.id,
                    customer_id: customerId,
                    final_price: salePrice,
                    sale_date: new Date().toISOString().split('T')[0],
                    sale_type: selectedCar.source || 'purchased',
                    purchase_cost_snapshot: purchaseCost,
                    profit: profit,
                    status: 'completed',
                    payment_status: 'paid',
                    notes: addForm.notes.trim() || 'Direct Showroom Walk-in Sale'
                });
                if (saleErr) throw saleErr;

                await supabase.from('inventory').update({ status: 'sold' }).eq('id', selectedCar.id);
            }

            await refreshData();
            setIsAddingSale(false);
            setAddForm({ inventory_id: '', customer_name: '', customer_phone: '', customer_email: '', final_price: '', notes: '' });
            toast.success(`✓ Sale recorded for ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}!`);
        } catch (err: any) {
            console.error('Error recording direct sale:', err);
            const msg = err.message || 'Failed to record sale';
            setSaleError(msg);
            toast.error(msg);
        } finally {
            setSavingSale(false);
        }
    };

    // ─── Filter Logic ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const now = new Date();
        let start: Date | null = null;
        if (period === 'This Month')   start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (period === 'This Quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        if (period === 'This Year')    start = new Date(now.getFullYear(), 0, 1);

        return sales.filter(s => {
            if (start && new Date(s.sale_date) < start) return false;
            if (typeFilter !== 'All' && s.sale_type !== typeFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const carName = `${s.car?.make || ''} ${s.car?.model || ''}`.toLowerCase();
                const custName = (s.customer?.full_name || '').toLowerCase();
                if (!carName.includes(q) && !custName.includes(q)) return false;
            }
            return true;
        });
    }, [sales, period, typeFilter, search]);

    // ─── Aggregate Stats ──────────────────────────────────────────────────────
    const totalRevenue       = filtered.reduce((a, s) => a + (Number(s.final_price) || 0), 0);
    const totalNetIncome     = filtered.reduce((a, s) => a + (Number(s.profit) || 0), 0);
    const consignmentFees    = filtered.filter(s => s.sale_type === 'consignment').reduce((a, s) => a + (Number(s.consignment_fee_collected) || 0), 0);
    const avgDealSize        = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

    // ─── CSV Export ───────────────────────────────────────────────────────────
    const exportCSV = () => {
        const rows = [
            ['Date', 'Vehicle', 'Customer', 'Phone', 'Sale Type', 'Final Price', 'Profit/Fee', 'Notes'],
            ...filtered.map(s => [
                s.sale_date,
                `${s.car?.year || ''} ${s.car?.make || ''} ${s.car?.model || ''}`.trim(),
                s.customer?.full_name || '',
                s.customer?.phone || '',
                s.sale_type || 'purchased',
                s.final_price,
                s.profit || '',
                (s.notes || '').replace(/,/g, ';'),
            ])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'swami-sales.csv'; a.click();
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Sales Ledger</h1>
                    <p className="text-slate-500 text-sm">Full financial record of all vehicle sales.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setIsAddingSale(true); setSaleError(''); }} className="h-10 px-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors shadow-sm">
                        <Plus size={16} /> Record Sale
                    </button>
                    <button onClick={exportCSV} className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span> Export CSV
                    </button>
                    <button onClick={refreshData} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sales',       value: loading ? '...' : String(filtered.length),          icon: 'sell',            color: 'bg-green-500/10 text-green-600' },
                    { label: 'Gross Revenue',     value: loading ? '...' : formatCurrency(totalRevenue),     icon: 'currency_rupee',  color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Net Income',        value: loading ? '...' : formatCurrency(totalNetIncome),   icon: 'trending_up',     color: 'bg-emerald-500/10 text-emerald-600' },
                    { label: 'Consignment Fees',  value: loading ? '...' : formatCurrency(consignmentFees),  icon: 'handshake',       color: 'bg-purple-500/10 text-purple-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                                <TrendingUp size={12} />Live
                            </span>
                        </div>
                        <p className="text-2xl font-black text-primary font-display">{s.value}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 flex-1 min-w-[180px]">
                    <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by car or customer…" className="bg-transparent text-sm text-primary outline-none w-full" />
                    {search && <button onClick={() => setSearch('')} className="material-symbols-outlined text-slate-300 text-base hover:text-slate-500">close</button>}
                </div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option>All Time</option>
                    <option>This Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                </select>
                <select value={typeFilter} onChange={e => setType(e.target.value)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none">
                    <option value="All">All Types</option>
                    <option value="purchased">🏠 Purchased</option>
                    <option value="consignment">🤝 Consignment</option>
                    <option value="dealer">🏪 Dealer</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px]">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Vehicle</th>
                                <th className="text-left px-5 py-3">Customer</th>
                                <th className="text-left px-5 py-3">Type</th>
                                <th className="text-right px-5 py-3">Sale Price</th>
                                <th className="text-right px-5 py-3">Net Profit / Fee</th>
                                <th className="text-left px-5 py-3">Date</th>
                                <th className="text-left px-5 py-3">Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading sales data…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">sell</span>
                                        <p className="text-slate-400 font-medium">No sales match your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(sale => {
                                    const badge = saleTypeBadge[sale.sale_type || 'purchased'] || saleTypeBadge.purchased;
                                    const profit = Number(sale.profit) || 0;
                                    const isConsignment = sale.sale_type === 'consignment';
                                    return (
                                        <tr key={sale.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setDetail(sale)}>
                                            <td className="px-5 py-3.5">
                                                <div>
                                                    <p className="text-sm font-semibold text-primary">{sale.car?.year} <HighlightText text={sale.car?.make || ''} highlight={search} /> <HighlightText text={sale.car?.model || ''} highlight={search} /></p>
                                                    <p className="text-xs text-slate-400">{sale.car?.transmission || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-primary"><HighlightText text={sale.customer?.full_name || 'Unknown'} highlight={search} /></p>
                                                <p className="text-xs text-slate-400">{sale.customer?.phone || ''}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="text-sm font-bold text-green-600">{formatCurrency(sale.final_price)}</span>
                                                {isConsignment && <p className="text-[10px] text-slate-400">pass-through</p>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCurrency(profit)}
                                                </span>
                                                {isConsignment && <p className="text-[10px] text-slate-400">fee only</p>}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                                            <td className="px-5 py-3.5">
                                                <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="View Details">
                                                    <span className="material-symbols-outlined text-slate-400 text-base">open_in_new</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sale Detail Modal */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-primary to-primary-light px-6 pt-6 pb-8 rounded-t-3xl relative">
                            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
                            <h2 className="text-xl font-black text-white">{detail.car?.year} {detail.car?.make} {detail.car?.model}</h2>
                            <p className="text-white/70 text-sm mt-1">Sale on {formatDate(detail.sale_date)}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Customer', value: detail.customer?.full_name || '—' },
                                    { label: 'Phone', value: detail.customer?.phone || '—' },
                                    { label: 'Sale Type', value: (saleTypeBadge[detail.sale_type || 'purchased']?.label || '—') },
                                    { label: 'Sale Price', value: formatCurrency(detail.final_price) },
                                    { label: 'Net Income', value: formatCurrency(detail.profit || 0) },
                                    { label: 'Purchase Cost', value: formatCurrency(detail.purchase_cost_snapshot || 0) },
                                    ...(detail.sale_type === 'consignment' ? [{ label: 'Consignment Fee', value: formatCurrency(detail.consignment_fee_collected || 0) }] : []),
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-50 rounded-xl px-3.5 py-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                                        <p className="text-sm font-semibold text-primary mt-0.5">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            {detail.notes && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <p className="text-xs font-bold text-amber-600 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-amber-900 leading-relaxed">{detail.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Record Sale Modal */}
            {isAddingSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddingSale(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-primary to-primary-light px-6 pt-6 pb-6 text-white relative">
                            <button onClick={() => setIsAddingSale(false)} className="absolute top-4 right-4 size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
                            <h2 className="text-xl font-black">Record Direct / Walk-in Sale</h2>
                            <p className="text-white/70 text-xs mt-1">Logs vehicle sale, auto-creates customer CRM profile, and marks inventory sold.</p>
                        </div>

                        <form onSubmit={handleRecordDirectSale} className="p-6 space-y-4">
                            {saleError && (
                                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                                    {saleError}
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Select Available Vehicle *</label>
                                <select 
                                    required 
                                    value={addForm.inventory_id} 
                                    onChange={e => {
                                        const c = availableCars.find(x => x.id === e.target.value);
                                        setAddForm({
                                            ...addForm,
                                            inventory_id: e.target.value,
                                            final_price: c ? String(c.price || '') : addForm.final_price
                                        });
                                    }}
                                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                >
                                    <option value="" disabled>Choose car from inventory ({availableCars.length} available)...</option>
                                    {availableCars.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.year} {c.make} {c.model} {c.variant ? `(${c.variant})` : ''} — Listed: ₹{Number(c.price).toLocaleString('en-IN')} | Cost: ₹{Number(c.purchase_cost || 0).toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Buyer Full Name *</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={addForm.customer_name} 
                                        onChange={e => setAddForm({ ...addForm, customer_name: e.target.value })} 
                                        placeholder="e.g. Ramesh Patil" 
                                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Buyer Phone</label>
                                    <input 
                                        type="tel" 
                                        value={addForm.customer_phone} 
                                        onChange={e => setAddForm({ ...addForm, customer_phone: e.target.value })} 
                                        placeholder="10-digit mobile" 
                                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Final Sale Price (₹) *</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={addForm.final_price} 
                                        onChange={e => setAddForm({ ...addForm, final_price: e.target.value })} 
                                        placeholder="Agreed price" 
                                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Buyer Email</label>
                                    <input 
                                        type="email" 
                                        value={addForm.customer_email} 
                                        onChange={e => setAddForm({ ...addForm, customer_email: e.target.value })} 
                                        placeholder="Email (optional)" 
                                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                </div>
                            </div>

                            {addForm.inventory_id && addForm.final_price && (() => {
                                const c = availableCars.find(x => x.id === addForm.inventory_id);
                                const cost = Number(c?.purchase_cost || 0);
                                const price = Number(addForm.final_price);
                                const profit = price - cost;
                                return (
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Acquisition Cost: <strong className="text-slate-700">₹{cost.toLocaleString('en-IN')}</strong></span>
                                        <span className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            Net Profit: ₹{profit.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                );
                            })()}

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Sale Notes / Payment Details</label>
                                <textarea 
                                    rows={2} 
                                    value={addForm.notes} 
                                    onChange={e => setAddForm({ ...addForm, notes: e.target.value })} 
                                    placeholder="e.g. Paid ₹3L via RTGS, balance in cash" 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddingSale(false)} className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingSale || !addForm.inventory_id || !addForm.final_price || !addForm.customer_name} className="flex-1 h-11 bg-primary hover:bg-primary-light text-white font-bold rounded-xl text-sm transition disabled:opacity-50">
                                    {savingSale ? 'Recording Sale...' : 'Confirm Sale'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSales;
