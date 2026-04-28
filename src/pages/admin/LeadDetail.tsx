import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { toWhatsAppUrl } from '../../lib/utils';

// ─── Follow-Up Types ──────────────────────────────────────────────────────────

interface FollowUp {
    id: string;
    lead_id: string;
    contacted_via: 'call' | 'whatsapp' | 'email' | 'visit' | 'meeting';
    outcome: 'answered' | 'no_answer' | 'callback_requested' | 'not_interested' | 'interested' | 'converted' | null;
    notes: string | null;
    next_followup_date: string | null;
    is_done: boolean;
    created_by: string | null;
    assigned_to: string | null;
    created_at: string;
    duration_minutes: number | null;
}

// ─── Car Interest Types ───────────────────────────────────────────────────────

interface CarInterest {
    id: string;
    lead_id: string;
    customer_id: string | null;
    inventory_id: string;
    interest_level: 'hot' | 'warm' | 'cold';
    notes: string | null;
    created_at: string;
    car?: {
        id: string;
        make: string;
        model: string;
        year: number;
        price: number;
        thumbnail: string | null;
        status: string;
    };
}

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
    lost_reason: string | null;
    contacted_at: string | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    negotiation: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-slate-100 text-slate-500',
};

const formatStatus = (val: string) => {
    const map: Record<string, string> = {
        new: 'New',
        contacted: 'Contacted',
        negotiation: 'Negotiating',
        closed_won: 'Closed (Won)',
        closed_lost: 'Closed (Lost)'
    };
    return map[val] || val;
};

const formatType = (val: string) => {
    const map: Record<string, string> = {
        contact: 'General Contact',
        sell_car: 'Sell Car',
        test_drive: 'Test Drive',
        insurance: 'Insurance',
    };
    return map[val] || val;
};

const LeadDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { inventory, activities, refreshData } = useData();
    const { profile } = useAuth();
    
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Lead>>({});

    // Conversion State
    const [isConverting, setIsConverting] = useState(false);
    const [convertForm, setConvertForm] = useState({ inventory_id: '', final_price: '' });

    // Activity State
    const [note, setNote] = useState('');
    const [noteType, setNoteType] = useState('note');

    // Task State
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', due_date: '', priority: 'Medium', description: '' });

    // ─── Follow-Up State ───────────────────────────────────────────────────────
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [followUpsLoading, setFollowUpsLoading] = useState(false);
    const [isLoggingFollowUp, setIsLoggingFollowUp] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({
        contacted_via: 'call' as FollowUp['contacted_via'],
        outcome: 'answered' as NonNullable<FollowUp['outcome']>,
        notes: '',
        next_followup_date: '',
        duration_minutes: '',
    });
    const [followUpSaving, setFollowUpSaving] = useState(false);

    // ─── Car Interest State ────────────────────────────────────────────────────
    const [carInterests, setCarInterests] = useState<CarInterest[]>([]);
    const [carInterestsLoading, setCarInterestsLoading] = useState(false);
    const [isAddingCarInterest, setIsAddingCarInterest] = useState(false);
    const [carInterestForm, setCarInterestForm] = useState({ inventory_id: '', interest_level: 'warm', notes: '' });
    const [carInterestSaving, setCarInterestSaving] = useState(false);

    const fetchFollowUps = useCallback(async () => {
        if (!id) return;
        setFollowUpsLoading(true);
        const { data, error } = await supabase
            .from('follow_ups')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });
        if (!error && data) setFollowUps(data as FollowUp[]);
        setFollowUpsLoading(false);
    }, [id]);

    const fetchCarInterests = useCallback(async () => {
        if (!id) return;
        setCarInterestsLoading(true);
        const { data, error } = await supabase
            .from('lead_car_interests')
            .select('*, car:inventory(id, make, model, year, price, thumbnail, status)')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });
        if (!error && data) setCarInterests(data as CarInterest[]);
        setCarInterestsLoading(false);
    }, [id]);

    const handleLogFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (followUpSaving) return;
        setFollowUpSaving(true);

        const payload: any = {
            lead_id: id,
            contacted_via: followUpForm.contacted_via,
            outcome: followUpForm.outcome,
            notes: followUpForm.notes.trim() || null,
            next_followup_date: followUpForm.next_followup_date
                ? new Date(followUpForm.next_followup_date).toISOString()
                : null,
            duration_minutes: followUpForm.duration_minutes
                ? Number(followUpForm.duration_minutes)
                : null,
            assigned_to: profile?.id ?? null,
            created_by: profile?.id ?? null,
            is_done: false,
        };

        const { error } = await supabase.from('follow_ups').insert(payload);
        if (!error) {
            // Also log an activity for the timeline
            await supabase.from('lead_activities').insert({
                lead_id: id,
                activity_type: followUpForm.contacted_via,
                notes: `Follow-up via ${followUpForm.contacted_via}: ${outcomeLabel(followUpForm.outcome)}${followUpForm.notes ? ' — ' + followUpForm.notes : ''}`,
                created_by: profile?.id ?? null,
            });

            // If outcome is converted, update lead status
            if (followUpForm.outcome === 'converted' && lead?.status !== 'closed_won') {
                await supabase.from('leads').update({ status: 'negotiation' }).eq('id', id);
            }

            setFollowUpForm({ contacted_via: 'call', outcome: 'answered', notes: '', next_followup_date: '', duration_minutes: '' });
            setIsLoggingFollowUp(false);
            fetchFollowUps();
            refreshData();
        } else {
            alert('Failed to save follow-up. Please try again.');
        }
        setFollowUpSaving(false);
    };

    const markFollowUpDone = async (fuId: string) => {
        await supabase.from('follow_ups').update({ is_done: true }).eq('id', fuId);
        fetchFollowUps();
    };

    const outcomeLabel = (val: string) => {
        const map: Record<string, string> = {
            answered: 'Answered',
            no_answer: 'No Answer',
            callback_requested: 'Callback Requested',
            not_interested: 'Not Interested',
            interested: 'Interested',
            converted: 'Converted',
        };
        return map[val] || val;
    };

    const outcomeColor = (val: string | null) => {
        if (!val) return 'bg-slate-100 text-slate-500';
        const map: Record<string, string> = {
            answered: 'bg-blue-100 text-blue-700',
            no_answer: 'bg-slate-100 text-slate-500',
            callback_requested: 'bg-amber-100 text-amber-700',
            not_interested: 'bg-red-100 text-red-600',
            interested: 'bg-green-100 text-green-700',
            converted: 'bg-emerald-100 text-emerald-700',
        };
        return map[val] || 'bg-slate-100 text-slate-500';
    };

    const handleAddCarInterest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!carInterestForm.inventory_id || carInterestSaving) return;
        setCarInterestSaving(true);
        const { error } = await supabase.from('lead_car_interests').insert({
            lead_id: id,
            inventory_id: carInterestForm.inventory_id,
            interest_level: carInterestForm.interest_level,
            notes: carInterestForm.notes.trim() || null,
            added_by: profile?.id ?? null,
        });
        if (!error) {
            setCarInterestForm({ inventory_id: '', interest_level: 'warm', notes: '' });
            setIsAddingCarInterest(false);
            fetchCarInterests();
        } else {
            alert('Failed to save. This car may already be tracked for this lead.');
        }
        setCarInterestSaving(false);
    };

    const handleRemoveCarInterest = async (interestId: string) => {
        const { error } = await supabase.from('lead_car_interests').delete().eq('id', interestId);
        if (!error) setCarInterests(prev => prev.filter(i => i.id !== interestId));
    };

    const viaIcon = (via: string) => {
        const map: Record<string, string> = {
            call: 'call', whatsapp: 'chat', email: 'mail', visit: 'directions_walk', meeting: 'groups',
        };
        return map[via] || 'phone';
    };

    const handleAddActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        try {
            const { error } = await supabase.from('lead_activities').insert({
                lead_id: id,
                activity_type: noteType,
                notes: note.trim(),
                created_by: profile?.id ?? null,
            });

            if (!error) {
                setNote('');
                await refreshData();
            } else {
                alert('Failed to log activity');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLead = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
            if (data) {
                setLead(data as unknown as Lead);
                setEditForm(data);
            }
        } catch (error) {
            console.error("Error fetching lead:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchLead();
            fetchFollowUps();
            fetchCarInterests();
        }
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('leads').update(editForm).eq('id', id);
            if (!error) {
                // Log status change or update
                let activityNote = 'Lead details updated.';
                let type = 'note';
                if (lead?.status !== editForm.status) {
                    type = 'status_change';
                    activityNote = `Lead status changed from ${formatStatus(lead?.status || '')} to ${formatStatus(editForm.status || '')}.`;
                }

                await supabase.from('lead_activities').insert({
                    lead_id: id,
                    activity_type: type,
                    notes: activityNote,
                created_by: profile?.id ?? null,
                });

                setLead({ ...lead, ...editForm } as Lead);
                setIsEditing(false);
                await refreshData();
            } else {
                alert('Error updating lead.');
            }
        } catch (error) {
            console.error("Error updating lead", error);
        }
    };

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!convertForm.inventory_id || !convertForm.final_price) return;

        try {
            // ── 1. Fetch full inventory details (source, purchase_cost, fees) ────
            const { data: carData, error: carFetchErr } = await supabase
                .from('inventory')
                .select('id, make, model, year, price, source, purchase_cost, consignment_fee_type, consignment_fee_value, consignment_agreed_price, consignment_owner_name')
                .eq('id', convertForm.inventory_id)
                .single();
            if (carFetchErr || !carData) throw new Error('Could not fetch car details.');

            const salePrice = Number(convertForm.final_price);
            const source = carData.source || 'purchased';

            // ── 2. Compute profit & sale_type based on source ────────────────────
            let profit = 0;
            let saleType = 'purchased';
            let consignmentFeeCollected: number | null = null;

            if (source === 'consignment') {
                saleType = 'consignment';
                // Swami earns only the fee; buyer pays owner directly
                if (carData.consignment_fee_type === 'fixed') {
                    consignmentFeeCollected = carData.consignment_fee_value || 0;
                } else if (carData.consignment_fee_type === 'percentage' && carData.consignment_fee_value) {
                    consignmentFeeCollected = Math.round(salePrice * carData.consignment_fee_value / 100);
                }
                profit = consignmentFeeCollected || 0;
            } else if (source === 'dealer') {
                saleType = 'dealer';
                profit = salePrice - (carData.purchase_cost || 0);
            } else {
                // purchased
                saleType = 'purchased';
                profit = salePrice - (carData.purchase_cost || 0);
            }

            // ── 3. Duplicate customer check — reuse existing if phone matches ──
            let customerId: string;
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, full_name')
                .eq('phone', lead?.phone || '')
                .maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create new customer
                const { data: custData, error: custErr } = await supabase.from('customers').insert({
                    full_name: lead?.full_name,
                    phone: lead?.phone,
                    email: lead?.email,
                    alternate_phone: lead?.secondary_phone || null,
                    address: lead?.personal_address || null,
                    office_address: lead?.office_address || null,
                    whatsapp_number: lead?.whatsapp_number || null,
                    lead_id: lead?.id || null,
                    loyalty_status: 'silver'
                }).select('id').single();
                if (custErr || !custData) throw new Error('Failed to create customer record.');
                customerId = custData.id;
            }

            // ── 4. Insert Sale (atomic — car NOT marked sold yet) ────────────────
            const { error: saleErr } = await supabase.from('sales').insert({
                customer_id: customerId,
                inventory_id: convertForm.inventory_id,
                lead_id: lead?.id,
                sold_by: profile?.id,
                sale_date: new Date().toISOString().split('T')[0],
                final_price: salePrice,
                sale_type: saleType,
                profit: profit,
                purchase_cost_snapshot: carData.purchase_cost || null,
                consignment_fee_collected: consignmentFeeCollected,
                status: 'completed',
                payment_status: 'paid',
                notes: source === 'consignment'
                    ? `Consignment sale — buyer paid ${carData.consignment_owner_name || 'owner'} directly. Swami fee: ₹${profit.toLocaleString('en-IN')}`
                    : 'Converted from lead workflow'
            });
            if (saleErr) throw new Error('Failed to log sale record.');

            // ── 5. Now mark car as sold (only after sale record confirmed) ───────
            await supabase.from('inventory').update({ status: 'sold' }).eq('id', convertForm.inventory_id);

            // ── 6. Link car interests to customer ────────────────────────────────
            await supabase.from('lead_car_interests')
                .update({ customer_id: customerId })
                .eq('lead_id', lead?.id);

            // ── 7. Update Lead status ────────────────────────────────────────────
            await supabase.from('leads').update({ status: 'closed_won' }).eq('id', lead?.id);

            // ── 8. Log Activity (use profile.id, not name) ────────────────────────
            await supabase.from('lead_activities').insert({
                lead_id: lead?.id,
                activity_type: 'meeting',
                notes: source === 'consignment'
                    ? `Consignment sale ₹${salePrice.toLocaleString('en-IN')} — Swami earned ₹${profit.toLocaleString('en-IN')} fee.`
                    : `Sale closed for ₹${salePrice.toLocaleString('en-IN')}. Profit: ₹${profit.toLocaleString('en-IN')}.`,
                created_by: profile?.id ?? null,
            });

            await refreshData();
            setIsConverting(false);
            fetchLead();

            const customerMsg = existingCustomer
                ? `Linked to existing customer: ${existingCustomer.full_name}.`
                : 'New customer record created.';
            alert(`Sale recorded! ${customerMsg}\nSwami earnings: ₹${profit.toLocaleString('en-IN')}`);
        } catch (error: any) {
            console.error('Error converting lead', error);
            alert(`Conversion failed: ${error.message}`);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!taskForm.title || !taskForm.due_date) return;
        
        const { error } = await supabase.from('tasks').insert({
            lead_id: id,
            title: taskForm.title,
            description: taskForm.description || null,
            due_date: new Date(taskForm.due_date).toISOString(),
            priority: taskForm.priority,
            status: 'todo'
        });
        
        if (!error) {
            setTaskForm({ title: '', due_date: '', priority: 'Medium', description: '' });
            setIsAddingTask(false);
            refreshData(); // To pull tasks 
        } else {
            console.error(error);
            alert("Failed to create task");
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-500 font-medium">Loading lead details...</div>;
    if (!lead) return (
        <div className="text-center py-20">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Lead not found</h3>
            <Link to="/admin/leads" className="text-primary hover:underline">Return to Leads</Link>
        </div>
    );

    const leadActivities = activities.filter(a => a.lead_id === id);
    const activityIcon = (type: string) => {
        if(type === 'call') return {icon: 'call', color: 'bg-green-500'};
        if(type === 'email') return {icon: 'mail', color: 'bg-blue-500'};
        if(type === 'meeting') return {icon: 'groups', color: 'bg-purple-500'};
        return {icon: 'sticky_note_2', color: 'bg-amber-500'};
    };

    const dynamicTimeline = leadActivities.map(a => {
        const style = activityIcon(a.activity_type);
        return {
            icon: style.icon,
            title: a.activity_type.toUpperCase(),
            desc: a.notes,
            time: new Date(a.created_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}),
            color: style.color
        };
    });

    const fullTimeline = [
        ...dynamicTimeline,
        { icon: 'person_add', title: 'LEAD GENERATED', desc: `Inquiry received via ${formatType(lead.type)}`, time: new Date(lead.created_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}), color: 'bg-slate-800' }
    ];

    const availableCars = inventory.filter(c => c.status !== 'sold');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2 gap-3">
                <div className="flex items-center gap-3">
                    <Link to="/admin/leads" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-slate-400">arrow_back</span></Link>
                    <h1 className="text-xl font-bold text-primary font-display">Lead Profile</h1>
                </div>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] max-w-3xl">
                    <h2 className="text-lg font-bold text-primary font-display mb-6">Edit Lead Details</h2>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input required type="text" value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input required type="tel" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Phone <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                            <input type="tel" value={editForm.secondary_phone || ''} onChange={e => setEditForm({ ...editForm, secondary_phone: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="Alternate number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number <span className="text-xs text-slate-400 font-normal">(if different)</span></label>
                            <input type="tel" value={editForm.whatsapp_number || ''} onChange={e => setEditForm({ ...editForm, whatsapp_number: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="WhatsApp number" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                            <input type="text" value={editForm.personal_address || ''} onChange={e => setEditForm({ ...editForm, personal_address: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="Residential address" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Office Address <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                            <input type="text" value={editForm.office_address || ''} onChange={e => setEditForm({ ...editForm, office_address: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="Workplace address" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select value={editForm.status || 'new'} onChange={e => {
                                const updates: any = { status: e.target.value };
                                if (e.target.value !== 'new' && lead?.status === 'new') {
                                    updates.contacted_at = new Date().toISOString();
                                }
                                setEditForm({ ...editForm, ...updates });
                            }} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="negotiation">Negotiating</option>
                                <option value="closed_won">Closed (Won)</option>
                                <option value="closed_lost">Closed (Lost)</option>
                            </select>
                        </div>
                        
                        {editForm.status === 'closed_lost' && (
                            <div>
                                <label className="block text-sm font-medium text-red-700 mb-1">Reason for Lost Lead</label>
                                <select value={editForm.lost_reason || ''} onChange={e => setEditForm({ ...editForm, lost_reason: e.target.value })} className="w-full h-11 border border-red-200 bg-red-50 text-red-800 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-red-500/20">
                                    <option value="" disabled>Select Reason...</option>
                                    <option value="Price too high">Price too high</option>
                                    <option value="Bought elsewhere">Bought elsewhere</option>
                                    <option value="Financing failed">Financing failed</option>
                                    <option value="Lost contact">Lost contact / Ghosted</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select value={editForm.type || 'contact'} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                <option value="contact">General Contact</option>
                                <option value="sell_car">Sell Car</option>
                                <option value="test_drive">Test Drive</option>
                                <option value="insurance">Insurance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                            <select value={editForm.source || 'Walk-in'} onChange={e => setEditForm({ ...editForm, source: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
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

                        {editForm.type === 'sell_car' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Car Make</label>
                                    <input type="text" value={editForm.car_make || ''} onChange={e => setEditForm({ ...editForm, car_make: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Car Model</label>
                                    <input type="text" value={editForm.car_model || ''} onChange={e => setEditForm({ ...editForm, car_model: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Car Year</label>
                                    <input type="number" value={editForm.car_year || ''} onChange={e => setEditForm({ ...editForm, car_year: Number(e.target.value) })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Car Mileage</label>
                                    <input type="number" value={editForm.car_mileage || ''} onChange={e => setEditForm({ ...editForm, car_mileage: Number(e.target.value) })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                                </div>
                            </>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message / Notes</label>
                            <textarea rows={4} value={editForm.message || ''} onChange={e => setEditForm({ ...editForm, message: e.target.value })} className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-light transition-colors">Save Changes</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left - Profile & Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)] relative overflow-hidden">
                            {lead.status === 'closed_won' && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 pb-4 pr-12 -mr-8 -mt-2 rotate-45 transform origin-top-right">
                                    CONVERTED
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-start gap-5">
                                <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-2xl font-bold shadow-lg shrink-0">
                                    {lead.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-black text-primary font-display">{lead.full_name}</h2>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[lead.status] || 'bg-slate-100 text-slate-500'}`}>{formatStatus(lead.status)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">category</span> {formatType(lead.type)}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">event</span> {new Date(lead.created_at).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">Source: {lead.source || 'Website'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">call</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Primary Phone</p>
                                        <p className="text-sm font-bold text-primary">{lead.phone}</p>
                                    </div>
                                </div>
                                {lead.secondary_phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">phone_in_talk</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Secondary Phone</p>
                                            <p className="text-sm font-bold text-primary">{lead.secondary_phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Email Address</p>
                                        <p className="text-sm font-bold text-primary">{lead.email || 'Not provided'}</p>
                                    </div>
                                </div>
                                {lead.whatsapp_number && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">forum</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp</p>
                                            <p className="text-sm font-bold text-primary">{lead.whatsapp_number}</p>
                                        </div>
                                    </div>
                                )}
                                {lead.personal_address && (
                                    <div className="flex items-center gap-3 md:col-span-2">
                                        <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">home</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Personal Address</p>
                                            <p className="text-sm font-bold text-primary">{lead.personal_address}</p>
                                        </div>
                                    </div>
                                )}
                                {lead.office_address && (
                                    <div className="flex items-center gap-3 md:col-span-2">
                                        <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">business</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Office Address</p>
                                            <p className="text-sm font-bold text-primary">{lead.office_address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 mt-6">
                                <a href={`tel:${lead.phone}`} className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"><span className="material-symbols-outlined text-base">call</span> Call Lead</a>
                                <a href={toWhatsAppUrl(lead.whatsapp_number || lead.phone)} target="_blank" rel="noreferrer" className="flex-1 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"><span className="material-symbols-outlined text-base">chat</span> Message</a>
                            </div>
                        </div>

                        {/* Vehicle/Inquiry Info */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                            <h3 className="font-bold text-primary font-display mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">info</span> 
                                {lead.type === 'sell_car' ? 'Vehicle Details' : 'Inquiry Context'}
                            </h3>
                            
                            {lead.type === 'sell_car' && lead.car_make ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Make</p>
                                        <p className="text-sm font-bold text-primary">{lead.car_make}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Model</p>
                                        <p className="text-sm font-bold text-primary">{lead.car_model || '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Year</p>
                                        <p className="text-sm font-bold text-primary">{lead.car_year || '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Km Driven</p>
                                        <p className="text-sm font-bold text-primary">{lead.car_mileage ? `${lead.car_mileage.toLocaleString()}` : '—'}</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="bg-slate-50 p-4 xl:p-5 rounded-xl border border-slate-100">
                                {lead.message ? (
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{lead.message}</p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No message provided.</p>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                            <h3 className="font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-accent text-lg">history</span> Activity Timeline</h3>
                            
                            <form onSubmit={handleAddActivity} className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 font-bold outline-none focus:border-primary/50 cursor-pointer">
                                        <option value="note">Internal Note</option>
                                        <option value="call">Logged Call</option>
                                        <option value="email">Sent Email</option>
                                        <option value="meeting">Meeting</option>
                                    </select>
                                </div>
                                <textarea required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type your notes or call summary..." rows={3} className="w-full text-sm p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 mb-3 bg-white"></textarea>
                                <div className="flex justify-end">
                                    <button type="submit" className="h-9 px-5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors shadow-sm">Log Activity</button>
                                </div>
                            </form>

                            <div className="space-y-6">
                                {fullTimeline.map((event, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`size-10 rounded-xl ${event.color} flex items-center justify-center shadow-inner shrink-0`}><span className="material-symbols-outlined text-white text-[18px]">{event.icon}</span></div>
                                            {i < fullTimeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-2" />}
                                        </div>
                                        <div className="pb-4">
                                            <h4 className="font-bold text-primary text-sm">{event.title}</h4>
                                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{event.desc}</p>
                                            <p className="text-[11px] text-slate-400 mt-1.5 font-bold uppercase">{event.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-4">
                        {lead.status !== 'closed_won' && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-green-600 text-lg">workspace_premium</span>
                                    <h4 className="font-bold text-green-800 text-sm font-display">Mark as Successful</h4>
                                </div>
                                <p className="text-xs text-green-700/80 mb-5 leading-relaxed">
                                    Did this lead purchase a vehicle? Convert them to a Customer and register their sale.
                                </p>
                                
                                {isConverting ? (
                                    <form onSubmit={handleConvert} className="space-y-4 bg-white/60 p-4 rounded-xl border border-green-100/50">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Vehicle Sold</label>
                                            <select required value={convertForm.inventory_id} onChange={e => setConvertForm({ ...convertForm, inventory_id: e.target.value })} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none focus:border-green-400 bg-white shadow-sm">
                                                <option value="">-- Choose Car --</option>
                                                {availableCars.map(car => (
                                                    <option key={car.id} value={car.id}>
                                                        {car.year} {car.make} {car.model}
                                                        {car.source === 'consignment' ? ' 🤝 Consignment' : car.source === 'dealer' ? ' 🏪 Dealer' : ' 🏠 Owned'}
                                                        {' — ₹'}{(car.price / 100000).toFixed(1)}L
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Final Sale Price (₹)</label>
                                            <input required type="number" placeholder="Eg: 550000" value={convertForm.final_price} onChange={e => setConvertForm({ ...convertForm, final_price: e.target.value })} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none focus:border-green-400 bg-white shadow-sm" />
                                        </div>
                                        {convertForm.inventory_id && (() => {
                                            const car = availableCars.find(c => c.id === convertForm.inventory_id);
                                            if (!car) return null;
                                            const price = Number(convertForm.final_price) || 0;
                                            let earningLabel = '';
                                            if (car.source === 'consignment') {
                                                const fee = car.consignment_fee_type === 'fixed'
                                                    ? car.consignment_fee_value || 0
                                                    : car.consignment_fee_type === 'percentage'
                                                        ? Math.round(price * (car.consignment_fee_value || 0) / 100)
                                                        : 0;
                                                earningLabel = `🤝 Consignment — Swami earns ₹${fee.toLocaleString('en-IN')} fee`;
                                            } else {
                                                const profit = price - (car.purchase_cost || 0);
                                                earningLabel = `💰 Est. profit: ₹${profit.toLocaleString('en-IN')}`;
                                            }
                                            return earningLabel ? (
                                                <div className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                                    {earningLabel}
                                                </div>
                                            ) : null;
                                        })()}
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setIsConverting(false)} className="flex-1 bg-slate-200 text-slate-600 font-bold text-xs h-9 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                                            <button type="submit" className="flex-1 bg-green-600 text-white font-bold text-xs h-9 rounded-lg hover:bg-green-700 transition shadow-sm">Confirm Sale</button>
                                        </div>
                                    </form>
                                ) : (
                                    <button onClick={() => setIsConverting(true)} className="w-full flex items-center justify-center gap-2 h-11 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition shadow-sm">
                                        Convert to Sale
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Suggestion */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[var(--shadow-card)]">
                            <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-accent text-lg">lightbulb</span><h4 className="font-bold text-primary text-sm">Suggested Next Step</h4></div>
                            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Reach out via WhatsApp to follow up proactively. Fast follow-ups have a 4x higher conversion rate.</p>
                            <a href={toWhatsAppUrl(lead.whatsapp_number || lead.phone)} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 h-10 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-primary font-bold rounded-xl text-sm transition-all shadow-sm">
                                <span className="material-symbols-outlined text-base">forum</span> Send WhatsApp
                            </a>
                        </div>

                        {/* ── Interested Cars Panel ────────────────────────── */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-500 text-[18px]">directions_car</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-sm leading-none">Interested Cars</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{carInterests.length} car{carInterests.length !== 1 ? 's' : ''} tracked</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddingCarInterest(v => !v)}
                                    className={`flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                                        isAddingCarInterest
                                            ? 'bg-slate-200 text-slate-600'
                                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{isAddingCarInterest ? 'close' : 'add'}</span>
                                    {isAddingCarInterest ? 'Cancel' : 'Add Car'}
                                </button>
                            </div>

                            {/* Add Car Form */}
                            {isAddingCarInterest && (
                                <form onSubmit={handleAddCarInterest} className="p-4 border-b border-slate-100 bg-blue-50/30 space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Car</label>
                                        <select
                                            required
                                            value={carInterestForm.inventory_id}
                                            onChange={e => setCarInterestForm(f => ({ ...f, inventory_id: e.target.value }))}
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs bg-white outline-none focus:border-blue-400 transition"
                                        >
                                            <option value="">-- Choose Available Car --</option>
                                            {availableCars.map(car => (
                                                <option key={car.id} value={car.id}>
                                                    {car.year} {car.make} {car.model} — ₹{car.price?.toLocaleString('en-IN')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Interest Level</label>
                                        <div className="flex gap-1.5">
                                            {(['hot', 'warm', 'cold'] as const).map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setCarInterestForm(f => ({ ...f, interest_level: level }))}
                                                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all capitalize ${
                                                        carInterestForm.interest_level === level
                                                            ? level === 'hot' ? 'bg-red-500 text-white border-red-500'
                                                            : level === 'warm' ? 'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-slate-500 text-white border-slate-500'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {level === 'hot' ? '🔥' : level === 'warm' ? '⭐' : '❄️'} {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notes <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                                        <textarea
                                            value={carInterestForm.notes}
                                            onChange={e => setCarInterestForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="Budget, preferences, specific requirements..."
                                            rows={2}
                                            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-blue-400 transition resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={carInterestSaving}
                                        className="w-full h-9 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {carInterestSaving ? (
                                            <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving...</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-sm">save</span> Save Interest</>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Interests List */}
                            <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                                {carInterestsLoading ? (
                                    <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
                                ) : carInterests.length === 0 ? (
                                    <div className="py-7 text-center">
                                        <span className="material-symbols-outlined text-3xl text-slate-200 block mb-1">garage</span>
                                        <p className="text-xs text-slate-400">No car interests tracked yet.</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Click "Add Car" to record interest.</p>
                                    </div>
                                ) : carInterests.map(interest => (
                                    <div key={interest.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                                        <div className="size-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                            {interest.car?.thumbnail ? (
                                                <img src={interest.car.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-300 text-xl">directions_car</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className="text-xs font-bold text-primary truncate">
                                                    {interest.car?.year} {interest.car?.make} {interest.car?.model}
                                                </p>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                    interest.interest_level === 'hot' ? 'bg-red-100 text-red-600' :
                                                    interest.interest_level === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {interest.interest_level === 'hot' ? '🔥' : interest.interest_level === 'warm' ? '⭐' : '❄️'} {interest.interest_level}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-green-700">₹{interest.car?.price?.toLocaleString('en-IN')}</p>
                                            {interest.notes && (
                                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{interest.notes}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCarInterest(interest.id)}
                                            title="Remove"
                                            className="size-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 transition-colors shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Follow-Up Panel ───────────────────────────────── */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-[18px]">phone_callback</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-sm leading-none">Follow-Up Log</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{followUps.length} contact attempt{followUps.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsLoggingFollowUp(v => !v)}
                                    className={`flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                                        isLoggingFollowUp
                                            ? 'bg-slate-200 text-slate-600'
                                            : 'bg-primary text-white hover:bg-primary-light shadow-sm'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{isLoggingFollowUp ? 'close' : 'add'}</span>
                                    {isLoggingFollowUp ? 'Cancel' : 'Log New'}
                                </button>
                            </div>

                            {/* Log New Form */}
                            {isLoggingFollowUp && (
                                <form onSubmit={handleLogFollowUp} className="p-4 border-b border-slate-100 bg-blue-50/30 space-y-3">
                                    {/* Via */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Contact Method</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(['call','whatsapp','email','visit','meeting'] as const).map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => setFollowUpForm(f => ({ ...f, contacted_via: v }))}
                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                                        followUpForm.contacted_via === v
                                                            ? 'bg-primary text-white border-primary shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">{viaIcon(v)}</span>
                                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Outcome */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Outcome</label>
                                        <select
                                            value={followUpForm.outcome}
                                            onChange={e => setFollowUpForm(f => ({ ...f, outcome: e.target.value as any }))}
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs bg-white outline-none focus:border-primary/50 transition"
                                        >
                                            <option value="answered">✅ Answered</option>
                                            <option value="no_answer">📵 No Answer</option>
                                            <option value="callback_requested">🔄 Callback Requested</option>
                                            <option value="interested">🌟 Interested</option>
                                            <option value="not_interested">❌ Not Interested</option>
                                            <option value="converted">🏆 Converted</option>
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notes <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                                        <textarea
                                            value={followUpForm.notes}
                                            onChange={e => setFollowUpForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="What was discussed..."
                                            rows={2}
                                            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-primary/50 transition resize-none"
                                        />
                                    </div>

                                    {/* Next Follow-Up */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Next Follow-Up <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                                        <input
                                            type="datetime-local"
                                            value={followUpForm.next_followup_date}
                                            onChange={e => setFollowUpForm(f => ({ ...f, next_followup_date: e.target.value }))}
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs bg-white outline-none focus:border-primary/50 transition"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={followUpSaving}
                                        className="w-full h-9 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-light transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {followUpSaving ? (
                                            <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving...</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-sm">save</span> Save Follow-Up</>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* History List */}
                            <div className="divide-y divide-slate-50 max-h-[360px] overflow-y-auto">
                                {followUpsLoading ? (
                                    <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
                                ) : followUps.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <span className="material-symbols-outlined text-3xl text-slate-200 block mb-1">phone_missed</span>
                                        <p className="text-xs text-slate-400">No follow-ups logged yet.</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Click "Log New" to record first contact.</p>
                                    </div>
                                ) : followUps.map(fu => (
                                    <div key={fu.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50/60 transition-colors ${fu.is_done ? 'opacity-60' : ''}`}>
                                        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                            fu.outcome === 'no_answer' ? 'bg-slate-100' :
                                            fu.outcome === 'converted' ? 'bg-emerald-100' :
                                            fu.outcome === 'interested' ? 'bg-green-100' :
                                            fu.outcome === 'not_interested' ? 'bg-red-50' :
                                            'bg-blue-50'
                                        }`}>
                                            <span className={`material-symbols-outlined text-[16px] ${
                                                fu.outcome === 'no_answer' ? 'text-slate-400' :
                                                fu.outcome === 'converted' ? 'text-emerald-600' :
                                                fu.outcome === 'interested' ? 'text-green-600' :
                                                fu.outcome === 'not_interested' ? 'text-red-400' :
                                                'text-blue-500'
                                            }`}>{viaIcon(fu.contacted_via)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-xs font-bold text-primary capitalize">{fu.contacted_via}</span>
                                                {fu.outcome && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${outcomeColor(fu.outcome)}`}>
                                                        {outcomeLabel(fu.outcome)}
                                                    </span>
                                                )}
                                                {fu.is_done && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">Done</span>}
                                            </div>
                                            {fu.notes && <p className="text-[11px] text-slate-500 truncate">{fu.notes}</p>}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(fu.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {fu.next_followup_date && (
                                                    <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[11px]">event</span>
                                                        Next: {new Date(fu.next_followup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!fu.is_done && (
                                            <button
                                                onClick={() => markFollowUpDone(fu.id)}
                                                title="Mark Done"
                                                className="size-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-green-100 hover:text-green-600 text-slate-400 transition-colors shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Next follow-up summary bar */}
                            {followUps.some(fu => fu.next_followup_date && !fu.is_done) && (() => {
                                const next = followUps
                                    .filter(fu => fu.next_followup_date && !fu.is_done)
                                    .sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime())[0];
                                const isOverdue = new Date(next.next_followup_date!) < new Date();
                                return (
                                    <div className={`px-4 py-2.5 flex items-center gap-2 border-t ${
                                        isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                                    }`}>
                                        <span className={`material-symbols-outlined text-[15px] ${
                                            isOverdue ? 'text-red-500' : 'text-amber-500'
                                        }`}>alarm</span>
                                        <p className={`text-[11px] font-semibold ${
                                            isOverdue ? 'text-red-600' : 'text-amber-700'
                                        }`}>
                                            {isOverdue ? 'Overdue: ' : 'Next follow-up: '}
                                            {new Date(next.next_followup_date!).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Add Task Module (kept for reminders) */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[var(--shadow-card)]">
                            <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-amber-500 text-lg">task</span><h4 className="font-bold text-primary text-sm">Schedule Reminder Task</h4></div>
                            
                            {isAddingTask ? (
                                <form onSubmit={handleAddTask} className="space-y-3">
                                    <input required type="text" placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-amber-400 bg-white" />
                                    <input required type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-amber-400 bg-white" />
                                    <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-amber-400 bg-white">
                                        <option value="Hot">High Priority</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Cold">Low</option>
                                    </select>
                                    <textarea placeholder="Description (Optional)" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={2} className="w-full border border-slate-200 rounded-lg p-3 text-xs outline-none focus:border-amber-400 bg-white"></textarea>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setIsAddingTask(false)} className="flex-1 bg-slate-100 text-slate-500 h-8 rounded-lg text-xs font-bold hover:bg-slate-200 transition">Cancel</button>
                                        <button type="submit" className="flex-1 bg-amber-500 text-white h-8 rounded-lg text-xs font-bold hover:bg-amber-600 transition shadow-sm">Save Task</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">Set a calendar reminder separate from follow-up calls.</p>
                                    <button onClick={() => setIsAddingTask(true)} className="w-full flex items-center justify-center gap-2 h-10 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 text-amber-600 font-bold rounded-xl text-sm transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-base">add_task</span> Add Reminder Task
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadDetail;
