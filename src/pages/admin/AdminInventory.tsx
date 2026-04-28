import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ShareCarModal from '../../components/ShareCarModal';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Car {
    id: string;
    make: string;
    model: string;
    variant: string | null;
    year: number;
    price: number;
    mileage: number | null;
    fuel_type: string | null;
    transmission: string | null;
    color: string | null;
    body_type: string | null;
    ownership: number | null;
    description: string | null;
    features: string[] | null;
    status: string;
    source: string | null;
    dealer_id: string | null;
    consignment_owner_name: string | null;
    thumbnail: string | null;
    images: string[] | null;
    registration_no: string | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    reserved: 'bg-amber-100 text-amber-700',
    sold: 'bg-slate-200 text-slate-500',
    pending: 'bg-blue-100 text-blue-700',
    archived: 'bg-slate-100 text-slate-400',
};

const tabs = ['All', 'available', 'reserved', 'sold', 'pending', 'archived'];

interface Dealer { id: string; dealer_code: string; name: string; }

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="border-b border-slate-50">
        {[...Array(6)].map((_, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: i === 0 ? '180px' : '80px' }} />
            </td>
        ))}
    </tr>
);

// ─── Component ───────────────────────────────────────────────────────────────
const AdminInventory = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dealerFilter, setDealerFilter] = useState('all');
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [shareCarId, setShareCarId] = useState<string | null>(null);
    const [shareCounts, setShareCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        supabase.from('dealers').select('id, dealer_code, name').then(({ data }) => {
            if (data) setDealers(data as Dealer[]);
        });
    }, []);

    // Fetch share counts per car
    const fetchShareCounts = async () => {
        const { data } = await supabase
            .from('inventory_shares')
            .select('inventory_id');
        if (data) {
            const counts: Record<string, number> = {};
            data.forEach((row: { inventory_id: string }) => {
                counts[row.inventory_id] = (counts[row.inventory_id] || 0) + 1;
            });
            setShareCounts(counts);
        }
    };

    useEffect(() => { fetchShareCounts(); }, []);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCars = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setCars(data as Car[]);
        setLoading(false);
        fetchShareCounts();
    };

    useEffect(() => { fetchCars(); }, []);

    const handleDelete = async (id: string, make: string, model: string) => {
        if (!confirm(`Delete ${make} ${model}? This will permanently remove it from the inventory.`)) return;
        setDeletingId(id);
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) {
            showToast('Failed to delete car. Please try again.', 'error');
        } else {
            showToast(`${make} ${model} deleted successfully.`);
            setCars(prev => prev.filter(c => c.id !== id));
        }
        setDeletingId(null);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('inventory')
            .update({ status: newStatus })
            .eq('id', id);
        if (error) {
            showToast('Failed to update status.', 'error');
        } else {
            setCars(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            showToast('Status updated.');
        }
    };

    const filtered = cars.filter(c => {
        const matchTab = activeTab === 'All' || c.status === activeTab;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || `${c.make} ${c.model} ${c.variant ?? ''} ${c.registration_no ?? ''}`.toLowerCase().includes(q);
        const matchDealer = dealerFilter === 'all'
            ? true
            : dealerFilter === 'purchased'
                ? (!c.source || c.source === 'purchased' || c.source === 'own')
            : dealerFilter === 'consignment'
                ? c.source === 'consignment'
                : c.dealer_id === dealerFilter;
        return matchTab && matchSearch && matchDealer;
    });

    const tabCount = (tab: string) => tab === 'All' ? cars.length : cars.filter(c => c.status === tab).length;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    <span className="material-symbols-outlined text-lg">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Inventory Management</h1>
                    <p className="text-slate-500 text-sm">
                        {loading ? 'Loading…' : `${cars.length} vehicles · ${cars.filter(c => c.status === 'available').length} available`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchCars} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                    <Link to="/admin/inventory/new" className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">add</span> Add New Car
                    </Link>
                </div>
            </div>

            {/* Search + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-1 border-b border-slate-200">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-all ${activeTab === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}
                        >
                            {tab === 'All' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
                            <span className="text-xs text-slate-400 ml-0.5">({tabCount(tab)})</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <select
                        value={dealerFilter}
                        onChange={e => setDealerFilter(e.target.value)}
                        className="h-10 border border-slate-200 rounded-xl px-3 text-sm text-slate-600 bg-white outline-none"
                    >
                        <option value="all">All Sources</option>
                        <option value="purchased">Purchased</option>
                        <option value="consignment">Consignment</option>
                        <optgroup label="Dealer Cars">
                            {dealers.map(d => <option key={d.id} value={d.id}>{d.dealer_code} — {d.name}</option>)}
                        </optgroup>
                    </select>
                    <div className="relative max-w-xs w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-base">search</span>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by make, model, reg…"
                            className="w-full h-10 border border-slate-200 rounded-xl pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <div className="overflow-x-auto relative">
                <table className="w-full min-w-[750px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Price</th>
                            <th className="text-left px-5 py-3">Details</th>
                            <th className="text-left px-5 py-3">Mileage</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-16">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">directions_car</span>
                                    <p className="text-slate-400 font-medium text-sm">
                                        {searchQuery ? `No results for "${searchQuery}"` : 'No vehicles in this category'}
                                    </p>
                                    <Link to="/admin/inventory/new" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-accent hover:underline">
                                        <span className="material-symbols-outlined text-base">add</span> Add first car
                                    </Link>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(car => (
                                <tr key={car.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                                {car.thumbnail ? (
                                                    <img src={car.thumbnail} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-slate-300 text-2xl">directions_car</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{car.year} {car.make} {car.model}</p>
                                                {car.variant && <p className="text-xs text-slate-400">{car.variant}</p>}
                                                {car.registration_no && <p className="text-[10px] text-slate-400 font-mono">{car.registration_no}</p>}
                                                {/* Source badge */}
                                                {car.source === 'dealer' ? (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide mt-0.5" title="Dealer Car">
                                                        <span className="material-symbols-outlined text-[10px]">store</span>
                                                        {dealers.find(d => d.id === car.dealer_id)?.dealer_code || 'Dealer'}
                                                    </span>
                                                ) : car.source === 'consignment' ? (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase tracking-wide mt-0.5" title={`Consignment: ${car.consignment_owner_name || 'Owner'}`}>
                                                        <span className="material-symbols-outlined text-[10px]">handshake</span>
                                                        {car.consignment_owner_name || 'Consignment'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide mt-0.5" title="Purchased by us">
                                                        <span className="material-symbols-outlined text-[10px]">home</span>
                                                        Purchased
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-sm font-bold text-primary">₹{(car.price / 100000).toFixed(2)}L</p>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">
                                        {car.fuel_type ?? '—'} · {car.transmission ?? '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">
                                        {car.mileage ? `${car.mileage.toLocaleString('en-IN')} km` : '—'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <select
                                            value={car.status}
                                            onChange={e => handleStatusChange(car.id, e.target.value)}
                                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase border-0 cursor-pointer outline-none ${statusColors[car.status] ?? 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {['available', 'reserved', 'sold', 'pending', 'archived'].map(s => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1 items-center">
                                            {/* WhatsApp Share button */}
                                            <button
                                                onClick={() => setShareCarId(car.id)}
                                                className="relative p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Share on WhatsApp"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-green-500">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                                {shareCounts[car.id] > 0 && (
                                                    <span className="absolute -top-1 -right-1 size-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                                        {shareCounts[car.id] > 9 ? '9+' : shareCounts[car.id]}
                                                    </span>
                                                )}
                                            </button>
                                            <Link to={`/admin/inventory/${car.id}/edit`} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Edit">
                                                <span className="material-symbols-outlined text-slate-400 text-lg">edit</span>
                                            </Link>
                                            <Link to={`/car/${car.id}`} target="_blank" className="p-1.5 hover:bg-slate-100 rounded-lg" title="View on website">
                                                <span className="material-symbols-outlined text-slate-400 text-lg">open_in_new</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(car.id, car.make, car.model)}
                                                disabled={deletingId === car.id}
                                                className={`p-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500`}
                                                title="Delete Vehicle"
                                            >
                                                {deletingId === car.id
                                                    ? <span className="size-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin block" />
                                                    : <span className="material-symbols-outlined text-lg">delete</span>
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Share Modal */}
            {shareCarId && (() => {
                const car = cars.find(c => c.id === shareCarId);
                return car ? (
                    <ShareCarModal
                        car={car}
                        onClose={() => {
                            setShareCarId(null);
                            fetchShareCounts();
                        }}
                    />
                ) : null;
            })()}
        </div>
    );
};

export default AdminInventory;
