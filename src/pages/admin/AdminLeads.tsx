import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
    id: string;
    type: string;
    full_name: string;
    phone: string;
    email: string | null;
    secondary_phone: string | null;
    whatsapp_number: string | null;
    personal_address: string | null;
    office_address: string | null;
    car_make: string | null;
    car_model: string | null;
    car_year: number | null;
    car_mileage: number | null;
    message: string | null;
    source: string;
    status: string;
    created_at: string;
    assigned_to: string | null;
    created_by: string | null;
}

interface StaffProfile {
    id: string;
    full_name: string | null;
    role: string;
}

interface DuplicateLead {
    id: string;
    full_name: string;
    status: string;
    type: string;
    created_at: string;
    assignedName: string; // resolved display name of the assigned staff
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    negotiation: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-slate-100 text-slate-500',
};

const filterTabs = ['All Leads', 'contact', 'sell_car', 'test_drive', 'insurance'];
const statusTabs = ['All Statuses', 'new', 'contacted', 'negotiation', 'closed_won', 'closed_lost'];

// ─── Component ─────────────────────────────────────────────────────────────────

const AdminLeads = () => {
    const { user, isAdmin } = useAuth();
    const { inventory } = useData();
    const availableInventory = inventory.filter((c: any) => c.status === 'available');

    const [leads, setLeads] = useState<Lead[]>([]);
    const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
    const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All Leads');
    const [activeStatusFilter, setActiveStatusFilter] = useState('All Statuses');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // leadCarMap: leadId → [{make, model, registration_no}] built from lead_car_interests + inventory
    const [leadCarMap, setLeadCarMap] = useState<Record<string, Array<{ make: string; model: string; registration_no: string }>>>({});
    const leadsPerPage = 15;

    // Bulk Actions state
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    // ─── Delete Confirmation Modal ─────────────────────────────────────────────
    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        leadId: string | null;   // null = bulk delete
        count: number;
    }>({ open: false, leadId: null, count: 1 });

    // ─── Lost-Reason Prompt Modal ──────────────────────────────────────────────
    const [lostModal, setLostModal] = useState<{
        open: boolean;
        leadId: string;
        reason: string;
    }>({ open: false, leadId: '', reason: '' });

    // ─── Duplicate Phone Detection ─────────────────────────────────────────────
    const [phoneCheckState, setPhoneCheckState] = useState<'idle' | 'checking' | 'duplicate' | 'clear'>('idle');
    const [duplicateLeads, setDuplicateLeads] = useState<DuplicateLead[]>([]);
    const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
    const phoneCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useNavigate();
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [manualForm, setManualForm] = useState<Partial<Lead>>({
        full_name: '',
        phone: '',
        secondary_phone: '',
        whatsapp_number: '',
        personal_address: '',
        office_address: '',
        type: 'contact',
        status: 'new',
        source: 'Walk-in',
        email: '',
        message: '',
        assigned_to: null,
    });

    // ─── Pending Car Interests (manual lead form) ────────────────────────────
    const [pendingCarInterests, setPendingCarInterests] = useState<Array<{
        inventory_id: string; interest_level: string; notes: string; carLabel: string;
    }>>([]);
    const [showCarSelector, setShowCarSelector] = useState(false);
    const [carSelectorForm, setCarSelectorForm] = useState({ inventory_id: '', interest_level: 'warm', notes: '' });

    // Import logic
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    // ─── Helpers ───────────────────────────────────────────────────────────────

    /** Look up a staff member's display name from their UUID */
    const getAssignedName = (assignedId: string | null): string => {
        if (!assignedId) return '—';
        const found = staffMembers.find(s => s.id === assignedId);
        return found?.full_name || 'Unknown';
    };

    /** Get avatar initials for assigned staff */
    const getInitials = (name: string | null): string => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ─── Data fetching ─────────────────────────────────────────────────────────

    /**
     * Fetch all staff + admin profiles for the "Assign To" dropdown
     * and for resolving assigned_to names in the table.
     * Staff can read profiles because of the "Staff can view profiles" RLS policy.
     */
    const fetchStaff = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('role', ['admin', 'staff'])
            .eq('is_active', true)
            .order('full_name');
        if (!error && data) setStaffMembers(data as StaffProfile[]);
    };

    /**
     * Fetch leads from Supabase.
     * - Admin: Supabase RLS returns ALL leads.
     * - Staff: Supabase RLS automatically filters to only leads where
     *   created_by = auth.uid() OR assigned_to = auth.uid().
     * No frontend filtering needed — the database handles it.
     */
    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) setLeads(data as unknown as Lead[]);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInterestCounts = useCallback(async () => {
        // Fetch car details from inventory so we can search leads by car name/reg
        const { data } = await supabase
            .from('lead_car_interests')
            .select('lead_id, car:inventory(make, model, registration_no)');
        if (data) {
            const counts: Record<string, number> = {};
            const carMap: Record<string, Array<{ make: string; model: string; registration_no: string }>> = {};
            data.forEach((r: any) => {
                if (!r.lead_id) return;
                counts[r.lead_id] = (counts[r.lead_id] || 0) + 1;
                if (r.car) {
                    if (!carMap[r.lead_id]) carMap[r.lead_id] = [];
                    carMap[r.lead_id].push({
                        make:            (r.car.make            || '').toLowerCase(),
                        model:           (r.car.model           || '').toLowerCase(),
                        registration_no: (r.car.registration_no || '').toLowerCase(),
                    });
                }
            });
            setInterestCounts(counts);
            setLeadCarMap(carMap);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        fetchLeads();
        fetchInterestCounts();
    }, []);

    // ─── CSV Import ────────────────────────────────────────────────────────────

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) return;

                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error('Empty CSV');

                const newLeads = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    let cols = [];
                    if (line.startsWith('"') && line.endsWith('"')) {
                        cols = line.substring(1, line.length - 1).split('","');
                    } else {
                        cols = line.split(',');
                    }

                    if (cols.length >= 6) {
                        newLeads.push({
                            full_name: cols[1],
                            phone: cols[2],
                            type: cols[3] || 'contact',
                            status: Object.keys(statusColors).includes(cols[4]) ? cols[4] : 'new',
                            source: cols[5],
                            created_by: user?.id ?? null,
                        });
                    }
                }

                if (newLeads.length > 0) {
                    const { error } = await supabase.from('leads').insert(newLeads);
                    if (error) throw error;
                    alert(`Successfully imported ${newLeads.length} leads.`);
                    fetchLeads();
                } else {
                    alert('No valid formatted data found.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to import leads. Check format.');
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    // ─── Manual Lead ───────────────────────────────────────────────────────────

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...manualForm,
            created_by: user?.id ?? null,
            assigned_to: manualForm.assigned_to ?? (isAdmin ? null : (user?.id ?? null)),
        };

        const { data: newLead, error } = await supabase.from('leads').insert(payload).select('id').single();
        if (!error && newLead) {
            // Insert pending car interests
            if (pendingCarInterests.length > 0) {
                await supabase.from('lead_car_interests').insert(
                    pendingCarInterests.map(i => ({
                        lead_id: newLead.id,
                        inventory_id: i.inventory_id,
                        interest_level: i.interest_level,
                        notes: i.notes || null,
                        added_by: user?.id ?? null,
                    }))
                );
            }
            setIsAddingManual(false);
            setPendingCarInterests([]);
            setManualForm({ full_name: '', phone: '', secondary_phone: '', whatsapp_number: '', personal_address: '', office_address: '', type: 'contact', status: 'new', source: 'Walk-in', email: '', message: '', assigned_to: null });
            fetchLeads();
            fetchInterestCounts();
        } else {
            alert('Error adding lead. Try again.');
        }
    };

    // Open manual form with sensible defaults per role
    const openManualForm = () => {
        setManualForm({
            full_name: '', phone: '', secondary_phone: '', whatsapp_number: '',
            personal_address: '', office_address: '',
            type: 'contact', status: 'new',
            source: 'Walk-in', email: '', message: '',
            // Staff automatically assigned to themselves
            assigned_to: isAdmin ? null : (user?.id ?? null),
        });
        // Reset duplicate state each time the form opens
        setPhoneCheckState('idle');
        setDuplicateLeads([]);
        setDuplicateAcknowledged(false);
        // Reset pending car interests
        setPendingCarInterests([]);
        setShowCarSelector(false);
        setCarSelectorForm({ inventory_id: '', interest_level: 'warm', notes: '' });
        setIsAddingManual(true);
    };

    /**
     * Normalize phone: strip spaces, dashes, parentheses, leading +91 / 0
     * so "98123 45678" and "9812345678" are treated as the same number.
     */
    const normalizePhone = (raw: string): string => {
        let n = raw.replace(/[\s\-().+]/g, '');
        if (n.startsWith('91') && n.length === 12) n = n.slice(2); // strip country code
        if (n.startsWith('0') && n.length === 11) n = n.slice(1);  // strip leading 0
        return n;
    };

    /**
     * Debounced duplicate check — fires 600 ms after the user stops typing.
     * Queries Supabase leads for any row whose phone (normalized) matches,
     * then resolves the assigned staff name from the in-memory staffMembers list.
     */
    const checkPhoneDuplicate = useCallback(async (rawPhone: string) => {
        const normalized = normalizePhone(rawPhone);
        if (normalized.length < 7) {
            setPhoneCheckState('idle');
            setDuplicateLeads([]);
            return;
        }

        setPhoneCheckState('checking');

        // We use ilike with a wildcard to catch numbers stored with/without spaces
        const { data, error } = await supabase
            .from('leads')
            .select('id, full_name, status, type, created_at, assigned_to')
            .or(`phone.ilike.%${normalized}%,phone.ilike.%${rawPhone.trim()}%`)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !data || data.length === 0) {
            setPhoneCheckState('clear');
            setDuplicateLeads([]);
            return;
        }

        // Resolve assigned staff name from local staffMembers cache
        const resolved: DuplicateLead[] = data.map((l: any) => ({
            id: l.id,
            full_name: l.full_name,
            status: l.status,
            type: l.type,
            created_at: l.created_at,
            assignedName: staffMembers.find(s => s.id === l.assigned_to)?.full_name || 'Unassigned',
        }));

        setDuplicateLeads(resolved);
        setPhoneCheckState('duplicate');
        setDuplicateAcknowledged(false);
    }, [staffMembers]);

    // Watch phone field in manualForm and debounce the check
    useEffect(() => {
        if (!isAddingManual) return;
        const phone = manualForm.phone || '';

        if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);

        if (phone.length < 7) {
            setPhoneCheckState('idle');
            setDuplicateLeads([]);
            return;
        }

        setPhoneCheckState('checking');
        phoneCheckTimer.current = setTimeout(() => {
            checkPhoneDuplicate(phone);
        }, 600);

        return () => {
            if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
        };
    }, [manualForm.phone, isAddingManual]);

    // ─── Lead Actions ──────────────────────────────────────────────────────────

    const updateLeadStatus = async (id: string, newStatus: string) => {
        const lead = leads.find(l => l.id === id);
        const updates: any = { status: newStatus };

        if (newStatus !== 'new' && lead?.status === 'new') {
            updates.contacted_at = new Date().toISOString();
        }

        if (newStatus === 'closed_lost') {
            // Open lost-reason modal instead of window.prompt
            setLostModal({ open: true, leadId: id, reason: '' });
            return; // actual update happens when modal is submitted
        }

        const { error } = await supabase.from('leads').update(updates).eq('id', id);
        if (!error) {
            setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
        }
    };

    const confirmLostReason = async () => {
        const updates: any = { status: 'closed_lost' };
        const lead = leads.find(l => l.id === lostModal.leadId);
        if (lead?.status === 'new') updates.contacted_at = new Date().toISOString();
        if (lostModal.reason.trim()) updates.lost_reason = lostModal.reason.trim();
        const { error } = await supabase.from('leads').update(updates).eq('id', lostModal.leadId);
        if (!error) {
            setLeads(prev => prev.map(l => l.id === lostModal.leadId ? { ...l, ...updates } : l));
        }
        setLostModal({ open: false, leadId: '', reason: '' });
    };

    const updateLeadAssignment = async (id: string, assignedTo: string | null) => {
        const { error } = await supabase
            .from('leads')
            .update({ assigned_to: assignedTo })
            .eq('id', id);
        if (!error) {
            setLeads(prev => prev.map(l => (l.id === id ? { ...l, assigned_to: assignedTo } : l)));
        }
    };

    const requestDeleteLead = (id: string) => {
        setDeleteModal({ open: true, leadId: id, count: 1 });
    };

    const requestDeleteSelected = () => {
        setDeleteModal({ open: true, leadId: null, count: selectedLeads.length });
    };

    const confirmDelete = async () => {
        if (deleteModal.leadId) {
            // Single lead delete
            const { error } = await supabase.from('leads').delete().eq('id', deleteModal.leadId);
            if (!error) {
                setLeads(prev => prev.filter(l => l.id !== deleteModal.leadId));
                setSelectedLeads(prev => prev.filter(id => id !== deleteModal.leadId));
            }
        } else {
            // Bulk delete
            const { error } = await supabase.from('leads').delete().in('id', selectedLeads);
            if (!error) {
                setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
                setSelectedLeads([]);
            }
        }
        setDeleteModal({ open: false, leadId: null, count: 1 });
    };

    // ─── CSV Export ────────────────────────────────────────────────────────────

    const exportToCSV = () => {
        const headers = ['Date', 'Name', 'Phone', 'Type', 'Status', 'Source', 'Assigned To'];
        const csvContent = [
            headers.join(','),
            ...filteredAndSearchedLeads.map(l =>
                `"${new Date(l.created_at).toLocaleDateString()}","${l.full_name}","${l.phone}","${l.type}","${l.status}","${l.source}","${getAssignedName(l.assigned_to)}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Formatting ────────────────────────────────────────────────────────────

    const formatLabel = (val: string) => {
        const map: Record<string, string> = {
            contact: 'General Contact',
            sell_car: 'Sell Car',
            test_drive: 'Test Drive',
            insurance: 'Insurance',
            new: 'New',
            contacted: 'Contacted',
            negotiation: 'Negotiating',
            closed_won: 'Closed (Won)',
            closed_lost: 'Closed (Lost)'
        };
        return map[val] || val;
    };

    // ─── Filtering & Pagination ─────────────────────────────────────────────────

    const filteredAndSearchedLeads = leads.filter(l => {
        const matchesTab = activeFilter === 'All Leads' || l.type === activeFilter;
        const matchesStatus = activeStatusFilter === 'All Statuses' || l.status === activeStatusFilter;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesTab && matchesStatus;

        // 1. Standard personal fields
        if ((l.full_name || '').toLowerCase().includes(q)) return matchesTab && matchesStatus;
        if ((l.phone || '').includes(q))                   return matchesTab && matchesStatus;
        if ((l.secondary_phone || '').includes(q))         return matchesTab && matchesStatus;

        // 2. sell_car lead — car the customer wants to sell (stored directly on lead row)
        if ((l.car_make  || '').toLowerCase().includes(q)) return matchesTab && matchesStatus;
        if ((l.car_model || '').toLowerCase().includes(q)) return matchesTab && matchesStatus;
        if (`${(l.car_make || '')} ${(l.car_model || '')}`.toLowerCase().includes(q)) return matchesTab && matchesStatus;

        // 3. Inventory car interests (test_drive / contact / insurance leads)
        //    leadCarMap is keyed by lead_id and holds cars from lead_car_interests + inventory join
        const interestedCars = leadCarMap[l.id] || [];
        const matchesCar = interestedCars.some(car =>
            car.make.includes(q) ||
            car.model.includes(q) ||
            car.registration_no.includes(q) ||
            `${car.make} ${car.model}`.includes(q)
        );
        return matchesTab && matchesStatus && matchesCar;
    });

    const totalPages = Math.ceil(filteredAndSearchedLeads.length / leadsPerPage);
    const paginatedLeads = filteredAndSearchedLeads.slice(
        (currentPage - 1) * leadsPerPage,
        currentPage * leadsPerPage
    );

    const tabCount = (tab: string) => tab === 'All Leads' ? leads.length : leads.filter(l => l.type === tab).length;
    const statusCount = (status: string) => {
        const baseLeads = activeFilter === 'All Leads' ? leads : leads.filter(l => l.type === activeFilter);
        return status === 'All Statuses' ? baseLeads.length : baseLeads.filter(l => l.status === status).length;
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id));
        }
    };

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
        );
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Lead Management</h1>
                    <p className="text-slate-500 text-sm">
                        {isAdmin
                            ? 'All customer enquiries across your team.'
                            : 'Leads assigned to you or created by you.'
                        }
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search name, phone, car brand or model…"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64 transition-all"
                        />
                    </div>

                    {/* Import — admin only */}
                    {isAdmin && (
                        <>
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                                className="h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm gap-2 disabled:opacity-50"
                                title="Import from CSV"
                            >
                                <span className="material-symbols-outlined text-lg">{importing ? 'hourglass_empty' : 'upload'}</span>
                                {importing ? 'Importing...' : 'Import'}
                            </button>
                        </>
                    )}

                    <button onClick={exportToCSV} className="h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm gap-2" title="Export to CSV">
                        <span className="material-symbols-outlined text-lg">download</span> Export
                    </button>

                    <button onClick={fetchLeads} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>

                    <button onClick={openManualForm} className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">person_add</span> Manual Lead
                    </button>
                </div>
            </div>

            {/* Staff scope banner */}
            {!isAdmin && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="material-symbols-outlined text-amber-500 text-base shrink-0">info</span>
                    <p className="text-xs text-amber-700 font-medium">
                        Showing leads <strong>assigned to you</strong> or <strong>created by you</strong>. Contact an admin to get new leads assigned.
                    </p>
                </div>
            )}

            {/* Tabs & Bulk Actions */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-1 overflow-x-auto pb-px w-full sm:w-auto">
                        {filterTabs.map(tab => (
                            <button key={tab} onClick={() => { setActiveFilter(tab); setCurrentPage(1); setSelectedLeads([]); }} className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeFilter === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                                {formatLabel(tab)} <span className="text-xs text-slate-400 ml-1">({tabCount(tab)})</span>
                            </button>
                        ))}
                    </div>
                    {selectedLeads.length > 0 && isAdmin && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-primary">{selectedLeads.length} Selected</span>
                            <button onClick={requestDeleteSelected} className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-sm">delete</span> Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Status sub-tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 w-full">
                    {statusTabs.map(status => (
                        <button
                            key={status}
                            onClick={() => { setActiveStatusFilter(status); setCurrentPage(1); setSelectedLeads([]); }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all border ${activeStatusFilter === status ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                        >
                            {status === 'All Statuses' ? 'All Statuses' : formatLabel(status)} <span className="opacity-70 ml-1">({statusCount(status)})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto min-h-[400px]">
                <table className="w-full min-w-[1100px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
                            {isAdmin && (
                                <th className="px-5 py-3 w-12 text-center border-r border-slate-100">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                                        checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                            )}
                            <th className="text-left px-5 py-3">Lead Date</th>
                            <th className="text-left px-5 py-3">Customer</th>
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-left px-5 py-3">Details</th>
                            <th className="text-left px-5 py-3">Assigned To</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-right px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-10 text-slate-500">Loading leads...</td></tr>
                        ) : paginatedLeads.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 8 : 7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined text-4xl">people</span>
                                        <p className="font-semibold text-slate-500">No leads found</p>
                                        <p className="text-xs">
                                            {!isAdmin ? 'No leads are assigned to you yet. Contact your admin.' : 'Try adjusting your filters.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedLeads.map(lead => {
                                const assignedName = getAssignedName(lead.assigned_to);
                                const assignedInitials = getInitials(staffMembers.find(s => s.id === lead.assigned_to)?.full_name ?? null);
                                return (
                                    <tr
                                        key={lead.id}
                                        className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedLeads.includes(lead.id) ? 'bg-primary/5' : ''}`}
                                        onClick={() => navigate(`/admin/leads/${lead.id}`)}
                                    >
                                        {/* Checkbox — admin only */}
                                        {isAdmin && (
                                            <td className="px-5 py-4 w-12 text-center border-r border-slate-50" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => toggleSelectLead(lead.id)}
                                                />
                                            </td>
                                        )}

                                        {/* Date */}
                                        <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br />
                                            <span className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>

                                        {/* Customer */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary-light/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                                    {lead.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{lead.full_name}</p>
                                                    <p className="text-xs font-medium text-slate-500">{lead.phone}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600">{formatLabel(lead.type)}</span>
                                        </td>

                                        {/* Details */}
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-primary font-medium line-clamp-1">
                                                {lead.type === 'sell_car' && `${lead.car_make || ''} ${lead.car_model || ''}`}
                                                {lead.type === 'contact' && (lead.message ? lead.message : '—')}
                                                {lead.type === 'test_drive' && 'Test Drive Booking'}
                                                {lead.type === 'insurance' && 'Insurance Inquiry'}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate max-w-[180px]">From: {lead.source}</p>
                                            {(interestCounts[lead.id] ?? 0) > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mt-1">
                                                    <span className="material-symbols-outlined text-[10px]">directions_car</span>
                                                    {interestCounts[lead.id]} interested
                                                </span>
                                            )}
                                        </td>

                                        {/* Assigned To — admin can reassign inline */}
                                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                            {isAdmin ? (
                                                <select
                                                    value={lead.assigned_to ?? ''}
                                                    onChange={(e) => updateLeadAssignment(lead.id, e.target.value || null)}
                                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none bg-white text-slate-600 hover:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer max-w-[130px] truncate"
                                                    title={assignedName}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {staffMembers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.full_name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                /* Staff: read-only assigned name */
                                                <div className="flex items-center gap-2">
                                                    {lead.assigned_to ? (
                                                        <>
                                                            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                {assignedInitials}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{assignedName}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase border outline-none cursor-pointer ${statusColors[lead.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="negotiation">Negotiating</option>
                                                <option value="closed_won">Closed (Won)</option>
                                                <option value="closed_lost">Closed (Lost)</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`tel:${lead.phone}`} title="Call" className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">call</span>
                                                </a>
                                                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-green-100 hover:text-green-600 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">chat</span>
                                                </a>
                                                {/* Delete — only admin OR staff managing their own lead */}
                                                {(isAdmin || lead.created_by === user?.id) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); requestDeleteLead(lead.id); }}
                                                        title="Delete Lead"
                                                        className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Showing {(currentPage - 1) * leadsPerPage + 1} to {Math.min(currentPage * leadsPerPage, filteredAndSearchedLeads.length)} of {filteredAndSearchedLeads.length} entries
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ── Manual Lead Modal ── */}
            {isAddingManual && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddingManual(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col mx-4 max-h-full">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-primary font-display">Add Manual Lead</h2>
                                {!isAdmin && (
                                    <p className="text-xs text-slate-400 mt-0.5">This lead will be assigned to you automatically.</p>
                                )}
                            </div>
                            <button type="button" onClick={() => setIsAddingManual(false)} className="p-1 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="p-5 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input required type="text" value={manualForm.full_name || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="e.g. Ramesh Patil" />
                                </div>

                                {/* Phone — with real-time duplicate detection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="tel"
                                            value={manualForm.phone || ''}
                                            onChange={e => setManualForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className={`w-full h-11 border rounded-xl px-4 pr-10 text-sm outline-none focus:ring-2 transition-colors ${
                                                phoneCheckState === 'duplicate'
                                                    ? 'border-amber-400 bg-amber-50 focus:ring-amber-200'
                                                    : phoneCheckState === 'clear'
                                                    ? 'border-green-400 bg-green-50 focus:ring-green-200'
                                                    : 'border-slate-200 focus:ring-primary/10'
                                            }`}
                                            placeholder="98XXX XXXXX"
                                        />
                                        {/* Status icon inside the input */}
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-base material-symbols-outlined ${
                                            phoneCheckState === 'checking' ? 'animate-spin text-slate-400' :
                                            phoneCheckState === 'duplicate' ? 'text-amber-500' :
                                            phoneCheckState === 'clear' ? 'text-green-500' : 'hidden'
                                        }`}>
                                            {phoneCheckState === 'checking' ? 'autorenew' :
                                             phoneCheckState === 'duplicate' ? 'warning' :
                                             phoneCheckState === 'clear' ? 'check_circle' : ''}
                                        </span>
                                    </div>

                                    {/* ── Duplicate Warning Banner ── */}
                                    {phoneCheckState === 'duplicate' && duplicateLeads.length > 0 && (
                                        <div className={`mt-2 rounded-xl border p-3 flex flex-col gap-2 ${
                                            duplicateAcknowledged
                                                ? 'border-slate-200 bg-slate-50'
                                                : 'border-amber-300 bg-amber-50'
                                        }`}>
                                            <div className="flex items-start gap-2">
                                                <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                                                    duplicateAcknowledged ? 'text-slate-400' : 'text-amber-500'
                                                }`}>
                                                    {duplicateAcknowledged ? 'info' : 'warning'}
                                                </span>
                                                <div className="flex-1">
                                                    <p className={`text-xs font-bold ${
                                                        duplicateAcknowledged ? 'text-slate-600' : 'text-amber-800'
                                                    }`}>
                                                        {duplicateAcknowledged
                                                            ? 'Duplicate acknowledged — proceed with caution'
                                                            : `⚠️ This phone number already exists in ${duplicateLeads.length > 1 ? `${duplicateLeads.length} leads` : '1 lead'}`
                                                        }
                                                    </p>
                                                    {/* List each duplicate */}
                                                    <div className="mt-1.5 flex flex-col gap-1.5">
                                                        {duplicateLeads.map(dl => (
                                                            <div key={dl.id} className="flex items-center justify-between bg-white/70 rounded-lg px-2.5 py-1.5 border border-amber-100">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                        {dl.full_name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-slate-800">{dl.full_name}</p>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {formatLabel(dl.type)} · {new Date(dl.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                        statusColors[dl.status] || 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                        {formatLabel(dl.status)}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                                        Assigned: <span className="text-slate-700 font-semibold">{dl.assignedName}</span>
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigate(`/admin/leads/${dl.id}`)}
                                                                        className="text-[10px] text-primary font-bold hover:underline"
                                                                    >
                                                                        View →
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Acknowledge checkbox */}
                                            {!duplicateAcknowledged && (
                                                <label className="flex items-center gap-2 cursor-pointer mt-1 pl-1">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-amber-400 text-amber-500 focus:ring-amber-300 w-4 h-4"
                                                        checked={duplicateAcknowledged}
                                                        onChange={e => setDuplicateAcknowledged(e.target.checked)}
                                                    />
                                                    <span className="text-xs text-amber-700 font-semibold">
                                                        I understand this is a duplicate and want to create a new lead anyway
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input type="email" value={manualForm.email || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="ramesh@example.com" />
                                </div>

                                {/* Secondary Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Phone <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="tel" value={manualForm.secondary_phone || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, secondary_phone: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="Alternate number" />
                                </div>

                                {/* WhatsApp Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number <span className="text-xs text-slate-400 font-normal">(if different)</span></label>
                                    <input type="tel" value={manualForm.whatsapp_number || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                                        onFocus={e => { if (!e.target.value && manualForm.phone) setManualForm(prev => ({ ...prev, whatsapp_number: prev.phone || '' })); }}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="WhatsApp number (auto-fills from phone)" />
                                </div>

                                {/* Personal Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Personal Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="text" value={manualForm.personal_address || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, personal_address: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="Home / Residential address" />
                                </div>

                                {/* Office Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Office Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                    <input type="text" value={manualForm.office_address || ''}
                                        onChange={e => setManualForm(prev => ({ ...prev, office_address: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="Workplace / Office address" />
                                </div>

                                {/* Enquiry Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Enquiry Type</label>
                                    <select value={manualForm.type || 'contact'}
                                        onChange={e => setManualForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                        <option value="contact">General Contact</option>
                                        <option value="sell_car">Sell Car</option>
                                        <option value="test_drive">Test Drive</option>
                                        <option value="insurance">Insurance</option>
                                    </select>
                                </div>

                                {/* Lead Source */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                                    <select value={manualForm.source || 'Walk-in'}
                                        onChange={e => setManualForm(prev => ({ ...prev, source: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Website Inquiry">Website Inquiry</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Referral">Referral</option>
                                        <option value="OLX">OLX</option>
                                        <option value="Google Ads">Google Ads</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select value={manualForm.status || 'new'}
                                        onChange={e => setManualForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="negotiation">Negotiating</option>
                                        <option value="closed_won">Closed (Won)</option>
                                        <option value="closed_lost">Closed (Lost)</option>
                                    </select>
                                </div>

                                {/* Assign To — admin only */}
                                {isAdmin && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Assign To
                                            <span className="text-xs text-slate-400 font-normal ml-1">(optional)</span>
                                        </label>
                                        <select
                                            value={manualForm.assigned_to ?? ''}
                                            onChange={e => setManualForm(prev => ({ ...prev, assigned_to: e.target.value || null }))}
                                            className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white"
                                        >
                                            <option value="">Unassigned</option>
                                            {staffMembers.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.full_name} {s.role === 'admin' ? '(Admin)' : '(Staff)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* ── Car Interests ── */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-base">directions_car</span>
                                        <span className="text-sm font-semibold text-slate-700">Interested Cars</span>
                                        <span className="text-xs text-slate-400 font-normal">(optional)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCarSelector(v => !v)}
                                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition"
                                    >
                                        <span className="material-symbols-outlined text-sm">{showCarSelector ? 'close' : 'add'}</span>
                                        {showCarSelector ? 'Cancel' : 'Add Car'}
                                    </button>
                                </div>

                                {showCarSelector && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3 space-y-2">
                                        <select
                                            value={carSelectorForm.inventory_id}
                                            onChange={e => setCarSelectorForm(f => ({ ...f, inventory_id: e.target.value }))}
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            <option value="">-- Select Available Car --</option>
                                            {availableInventory.map((car: any) => (
                                                <option key={car.id} value={car.id}>
                                                    {car.year} {car.make} {car.model} — ₹{car.price?.toLocaleString('en-IN')}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex gap-1.5">
                                            {(['hot', 'warm', 'cold'] as const).map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setCarSelectorForm(f => ({ ...f, interest_level: level }))}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                                                        carSelectorForm.interest_level === level
                                                            ? level === 'hot' ? 'bg-red-500 text-white border-red-500'
                                                            : level === 'warm' ? 'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-slate-500 text-white border-slate-500'
                                                            : 'bg-white text-slate-500 border-slate-200'
                                                    }`}
                                                >
                                                    {level === 'hot' ? '🔥' : level === 'warm' ? '⭐' : '❄️'} {level}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={carSelectorForm.notes}
                                            onChange={e => setCarSelectorForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="Notes (optional)"
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!carSelectorForm.inventory_id) return;
                                                if (pendingCarInterests.some(p => p.inventory_id === carSelectorForm.inventory_id)) {
                                                    alert('This car is already added.'); return;
                                                }
                                                const car = availableInventory.find((c: any) => c.id === carSelectorForm.inventory_id);
                                                setPendingCarInterests(prev => [...prev, {
                                                    inventory_id: carSelectorForm.inventory_id,
                                                    interest_level: carSelectorForm.interest_level,
                                                    notes: carSelectorForm.notes,
                                                    carLabel: car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car',
                                                }]);
                                                setCarSelectorForm({ inventory_id: '', interest_level: 'warm', notes: '' });
                                                setShowCarSelector(false);
                                            }}
                                            className="w-full h-9 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition"
                                        >
                                            Add to List
                                        </button>
                                    </div>
                                )}

                                {pendingCarInterests.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {pendingCarInterests.map((interest, idx) => (
                                            <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
                                                interest.interest_level === 'hot' ? 'bg-red-50 text-red-600 border-red-200' :
                                                interest.interest_level === 'warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                <span>{interest.interest_level === 'hot' ? '🔥' : interest.interest_level === 'warm' ? '⭐' : '❄️'}</span>
                                                <span>{interest.carLabel}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingCarInterests(prev => prev.filter((_, i) => i !== idx))}
                                                    className="ml-0.5 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : !showCarSelector && (
                                    <p className="text-xs text-slate-400 text-center py-1">No cars added yet. Click "Add Car" to record interest.</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Message</label>
                                <textarea
                                    rows={3}
                                    value={manualForm.message || ''}
                                    onChange={e => setManualForm(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                                    placeholder="Any initial notes or requirements about this lead..."
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={phoneCheckState === 'duplicate' && !duplicateAcknowledged}
                                    className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={phoneCheckState === 'duplicate' && !duplicateAcknowledged ? 'Acknowledge the duplicate warning above to save' : ''}
                                >
                                    Save Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ── Delete Confirmation Modal ── */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, leadId: null, count: 1 })} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                        <div className="size-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-red-600 text-2xl">delete_forever</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {deleteModal.leadId ? 'Delete Lead?' : `Delete ${deleteModal.count} Leads?`}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                This action is permanent and cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, leadId: null, count: 1 })}
                                className="flex-1 h-10 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 h-10 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lost Reason Modal ── */}
            {lostModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLostModal({ open: false, leadId: '', reason: '' })} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-500 text-xl">sentiment_dissatisfied</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Mark as Closed (Lost)</h3>
                                <p className="text-xs text-slate-500">Why was this lead lost?</p>
                            </div>
                        </div>
                        <select
                            value={lostModal.reason}
                            onChange={e => setLostModal(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white"
                        >
                            <option value="">Select a reason (optional)</option>
                            <option value="Price too high">Price too high</option>
                            <option value="Bought elsewhere">Bought elsewhere</option>
                            <option value="Financing failed">Financing failed</option>
                            <option value="Lost contact">Lost contact</option>
                            <option value="Not interested anymore">Not interested anymore</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLostModal({ open: false, leadId: '', reason: '' })}
                                className="flex-1 h-10 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLostReason}
                                className="flex-1 h-10 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-light transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
