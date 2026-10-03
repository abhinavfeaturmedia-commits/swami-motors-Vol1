import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface PriceAuditEntry {
    id: string;
    target_name: string | null;
    details: string | null;
    created_at: string;
    user_id: string | null;
}

const PriceHistory: React.FC = () => {
    const { inventory, refreshData } = useData();
    const { profile } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [agingFilter, setAgingFilter] = useState<'all' | '30' | '60' | '90'>('all');
    const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all');
    
    // Repricing modal
    const [selectedCar, setSelectedCar] = useState<any | null>(null);
    const [newPrice, setNewPrice] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('Market adjustment');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');

    // Audit logs
    const [recentLogs, setRecentLogs] = useState<PriceAuditEntry[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Filter to active showroom inventory
    const activeInventory = inventory.filter(c => c.status !== 'sold');

    // Fetch recent repricing logs
    const fetchRecentLogs = async () => {
        setLoadingLogs(true);
        try {
            const { data } = await supabase
                .from('audit_logs')
                .select('id, target_name, details, created_at, user_id')
                .eq('action', 'Price Adjusted')
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) setRecentLogs(data as PriceAuditEntry[]);
        } catch (e) {
            console.error('Failed to load audit logs:', e);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchRecentLogs();
    }, []);

    // KPIs
    const totalInventoryValue = activeInventory.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const totalAcquisitionCost = activeInventory.reduce((sum, c) => sum + (Number(c.purchase_cost) || 0), 0);
    const totalProjectedProfit = totalInventoryValue - totalAcquisitionCost;
    const avgMarginPct = totalInventoryValue > 0 ? Math.round((totalProjectedProfit / totalInventoryValue) * 100) : 0;
    
    const aging30Plus = activeInventory.filter(c => {
        const days = Math.floor((Date.now() - new Date(c.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 30;
    }).length;

    // Filter cars
    const filteredInventory = activeInventory.filter(c => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            `${c.make} ${c.model} ${c.variant || ''} ${c.registration_no || ''}`.toLowerCase().includes(q);

        const days = Math.floor((Date.now() - new Date(c.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
        let matchesAging = true;
        if (agingFilter === '30') matchesAging = days >= 30;
        if (agingFilter === '60') matchesAging = days >= 60;
        if (agingFilter === '90') matchesAging = days >= 90;

        const purchase = Number(c.purchase_cost) || 0;
        const price = Number(c.price) || 0;
        const marginPct = price > 0 ? ((price - purchase) / price) * 100 : 0;

        let matchesMargin = true;
        if (marginFilter === 'high') matchesMargin = marginPct >= 15;
        if (marginFilter === 'normal') matchesMargin = marginPct >= 8 && marginPct < 15;
        if (marginFilter === 'low') matchesMargin = marginPct < 8;

        return matchesSearch && matchesAging && matchesMargin;
    });

    const openRepriceModal = (car: any) => {
        setSelectedCar(car);
        setNewPrice(String(car.price || ''));
        setAdjustmentReason('Seasonal market demand repricing');
        setSaveSuccess('');
        setSaveError('');
    };

    const handleSaveReprice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCar) return;

        const updatedPriceNum = Number(newPrice);
        if (isNaN(updatedPriceNum) || updatedPriceNum <= 0) {
            setSaveError('Please enter a valid price amount in Rupees.');
            return;
        }

        setIsSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const oldPrice = Number(selectedCar.price) || 0;
            const diff = updatedPriceNum - oldPrice;
            const diffLabel = diff >= 0 ? `+₹${diff.toLocaleString('en-IN')}` : `-₹${Math.abs(diff).toLocaleString('en-IN')}`;

            // 1. Update inventory
            const { error: invErr } = await supabase
                .from('inventory')
                .update({ price: updatedPriceNum, updated_at: new Date().toISOString() })
                .eq('id', selectedCar.id);

            if (invErr) throw invErr;

            // 2. Log in audit_logs
            const vehicleTitle = `${selectedCar.year} ${selectedCar.make} ${selectedCar.model} (${selectedCar.registration_no || 'No Reg'})`;
            await supabase.from('audit_logs').insert({
                user_id: profile?.id || null,
                action: 'Price Adjusted',
                target_type: 'Inventory Vehicle',
                target_name: vehicleTitle,
                details: `Price changed from ₹${oldPrice.toLocaleString('en-IN')} to ₹${updatedPriceNum.toLocaleString('en-IN')} (${diffLabel}). Reason: ${adjustmentReason}`
            });

            setSaveSuccess(`Price updated to ₹${updatedPriceNum.toLocaleString('en-IN')} successfully!`);
            await refreshData();
            await fetchRecentLogs();

            setTimeout(() => {
                setSelectedCar(null);
            }, 1200);
        } catch (err: any) {
            console.error('Failed to update price:', err);
            setSaveError(err.message || 'Failed to update vehicle price.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Price History & Market Appraisal</h1>
                    <p className="text-slate-500 text-sm">Monitor fleet inventory valuations, margin thresholds, and optimize turn-rates.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fleet Retail Value</p>
                    <p className="text-xl font-black text-primary font-display">₹{(totalInventoryValue / 100000).toFixed(1)}L</p>
                    <p className="text-[11px] text-slate-400 mt-1">{activeInventory.length} Active Vehicles</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acquisition Cost</p>
                    <p className="text-xl font-black text-slate-700 font-display">₹{(totalAcquisitionCost / 100000).toFixed(1)}L</p>
                    <p className="text-[11px] text-slate-400 mt-1">Capital Invested</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Projected Gross Profit</p>
                    <p className={`text-xl font-black font-display ${totalProjectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(totalProjectedProfit / 100000).toFixed(1)}L
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Spread Across Stock</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Margin</p>
                    <p className={`text-xl font-black font-display ${avgMarginPct >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                        {avgMarginPct}%
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Target: &gt;12%</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)] col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aging Stock (&gt;30d)</p>
                    <p className={`text-xl font-black font-display ${aging30Plus > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {aging30Plus}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Potential Price Cut</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)] flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search make, model, registration..."
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10"
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select
                        value={agingFilter}
                        onChange={e => setAgingFilter(e.target.value as any)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    >
                        <option value="all">All Days in Stock</option>
                        <option value="30">Aging &gt; 30 Days</option>
                        <option value="60">Aging &gt; 60 Days</option>
                        <option value="90">Aging &gt; 90 Days</option>
                    </select>
                    <select
                        value={marginFilter}
                        onChange={e => setMarginFilter(e.target.value as any)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    >
                        <option value="all">All Profit Margins</option>
                        <option value="high">High Margin (&gt;15%)</option>
                        <option value="normal">Normal Margin (8-15%)</option>
                        <option value="low">Tight Margin (&lt;8%)</option>
                    </select>
                </div>
            </div>

            {/* Main Pricing Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-primary font-display text-sm">
                        Active Fleet Valuation &amp; Repricing Matrix ({filteredInventory.length})
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Vehicle Details</th>
                                <th className="py-3 px-3">Days in Stock</th>
                                <th className="py-3 px-3">Dealer Cost</th>
                                <th className="py-3 px-3">Listed Price</th>
                                <th className="py-3 px-3">Projected Margin</th>
                                <th className="py-3 px-3">Market Appraisal</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <span className="material-symbols-outlined text-3xl mb-2 text-slate-300">directions_car</span>
                                        <p>No vehicles found matching current filter parameters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map(car => {
                                    const days = Math.floor((Date.now() - new Date(car.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
                                    const purchase = Number(car.purchase_cost) || 0;
                                    const price = Number(car.price) || 0;
                                    const profit = price - purchase;
                                    const marginPct = price > 0 ? Math.round((profit / price) * 100) : 0;
                                    
                                    // Estimated market guideline range (±5% benchmark)
                                    const marketLow = Math.round((price * 0.96) / 1000) * 1000;
                                    const marketHigh = Math.round((price * 1.05) / 1000) * 1000;

                                    return (
                                        <tr key={car.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                        {car.thumbnail ? (
                                                            <img src={car.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <span className="material-symbols-outlined text-sm">directions_car</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary truncate max-w-[200px]">
                                                            {car.year} {car.make} {car.model}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-mono">
                                                            {car.registration_no || 'Reg Pending'} · {car.fuel_type || 'Petrol'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                    days >= 60 ? 'bg-red-50 text-red-600' :
                                                    days >= 30 ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                                    {days} days
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-600 font-mono">
                                                {purchase > 0 ? `₹${purchase.toLocaleString('en-IN')}` : <span className="text-slate-400 italic">Not set</span>}
                                            </td>
                                            <td className="py-3 px-3 text-primary font-bold font-mono">
                                                ₹{price.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div>
                                                    <span className={`inline-block font-bold font-mono text-[11px] px-2 py-0.5 rounded-md ${
                                                        marginPct >= 15 ? 'bg-green-100 text-green-700' :
                                                        marginPct >= 8 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {marginPct}% (₹{profit.toLocaleString('en-IN')})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="text-[11px]">
                                                    <span className="text-slate-500 font-mono">₹{marketLow.toLocaleString('en-IN')} - ₹{marketHigh.toLocaleString('en-IN')}</span>
                                                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[11px]">verified</span> Fair Market Range
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => openRepriceModal(car)}
                                                    className="h-8 px-3 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary-light transition-colors inline-flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-xs">price_change</span>
                                                    Reprice
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

            {/* Repricing Modal */}
            {selectedCar && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-primary font-display text-base">Adjust Vehicle Price</h3>
                                <p className="text-xs text-slate-400">
                                    {selectedCar.year} {selectedCar.make} {selectedCar.model} ({selectedCar.registration_no || 'No Reg'})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCar(null)}
                                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {saveError && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span> {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span> {saveSuccess}
                            </div>
                        )}

                        <form onSubmit={handleSaveReprice} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Acquisition Cost</span>
                                    <span className="font-bold text-slate-700 font-mono">
                                        ₹{(Number(selectedCar.purchase_cost) || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Listing</span>
                                    <span className="font-bold text-primary font-mono">
                                        ₹{(Number(selectedCar.price) || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Retail Price (₹)</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                    placeholder="Enter revised selling price"
                                    required
                                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm font-mono font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10"
                                />
                                {Number(newPrice) > 0 && (
                                    <div className="mt-2 text-xs flex justify-between items-center text-slate-500">
                                        <span>New Profit Margin:</span>
                                        <span className={`font-bold font-mono ${
                                            (Number(newPrice) - (Number(selectedCar.purchase_cost) || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            ₹{(Number(newPrice) - (Number(selectedCar.purchase_cost) || 0)).toLocaleString('en-IN')}
                                            {' '}({Math.round(((Number(newPrice) - (Number(selectedCar.purchase_cost) || 0)) / Number(newPrice)) * 100)}%)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjustment Reason / Notes</label>
                                <select
                                    value={adjustmentReason}
                                    onChange={e => setAdjustmentReason(e.target.value)}
                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 outline-none mb-2"
                                >
                                    <option value="Seasonal market demand repricing">Seasonal market demand repricing</option>
                                    <option value="Aging inventory turn-rate acceleration">Aging inventory turn-rate acceleration (&gt;30d)</option>
                                    <option value="Negotiation clearance margin">Negotiation clearance margin</option>
                                    <option value="Post-reconditioning value appreciation">Post-reconditioning value appreciation</option>
                                    <option value="Competitor pricing realignment">Competitor pricing realignment</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCar(null)}
                                    className="flex-1 h-11 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 h-11 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSaving ? 'Updating...' : 'Confirm Reprice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit Log Stream */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] p-5">
                <h3 className="font-bold text-primary font-display text-sm mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent text-lg">history</span>
                    Recent Pricing Adjustments &amp; Reprice Audit Trail
                </h3>
                {loadingLogs ? (
                    <p className="text-xs text-slate-400">Loading audit trail...</p>
                ) : recentLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No price adjustments recorded yet. Repricing actions will be logged here automatically.</p>
                ) : (
                    <div className="space-y-3">
                        {recentLogs.map(log => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                    <span className="font-bold text-primary">{log.target_name}</span>
                                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceHistory;
