import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface Lead {
    id: string;
    type: string;
    full_name: string;
    phone: string;
    email: string | null;
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

    const handleAddActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        try {
            const { error } = await supabase.from('lead_activities').insert({
                lead_id: id,
                activity_type: noteType,
                notes: note.trim(),
                created_by: profile?.full_name || 'Admin'
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
        if (id) fetchLead();
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
                    created_by: profile?.full_name || 'Admin'
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
            // 1. Create Customer
            const { data: custData, error: custErr } = await supabase.from('customers').insert({
                full_name: lead?.full_name,
                phone: lead?.phone,
                email: lead?.email,
                loyalty_status: 'silver'
            }).select('id').single();

            if (custErr || !custData) throw new Error("Failed to create customer");

            // 2. Create Sale
            const { error: saleErr } = await supabase.from('sales').insert({
                customer_id: custData.id,
                inventory_id: convertForm.inventory_id,
                lead_id: lead?.id,
                sold_by: profile?.id,
                sale_date: new Date().toISOString().split('T')[0],
                final_price: Number(convertForm.final_price),
                status: 'completed',
                payment_status: 'paid',
                notes: 'Converted from lead workflow'
            });
            if (saleErr) throw new Error("Failed to log sale");

            // 3. Mark Car as Sold
            await supabase.from('inventory').update({ status: 'sold' }).eq('id', convertForm.inventory_id);

            // 4. Update Lead
            await supabase.from('leads').update({ status: 'closed_won' }).eq('id', lead?.id);

            // 5. Log Activity
            await supabase.from('lead_activities').insert({
                lead_id: lead?.id,
                activity_type: 'meeting',
                notes: `Sale completed for ${convertForm.final_price}. Vehicle marked as sold.`,
                created_by: profile?.full_name || 'Admin'
            });

            // Refresh global data
            await refreshData();
            
            setIsConverting(false);
            fetchLead(); // refresh UI
            
            alert('Lead successfully converted into a Customer and Sale logged!');
        } catch (error) {
            console.error("Error converting lead", error);
            alert('An error occurred during conversion.');
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input required type="tel" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
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
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Contact Number</p>
                                        <p className="text-sm font-bold text-primary">{lead.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Email Address</p>
                                        <p className="text-sm font-bold text-primary">{lead.email || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-6">
                                <a href={`tel:${lead.phone}`} className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"><span className="material-symbols-outlined text-base">call</span> Call Lead</a>
                                <a href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"><span className="material-symbols-outlined text-base">chat</span> Message</a>
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
                                                    <option key={car.id} value={car.id}>{car.year} {car.make} {car.model} ({car.price.toLocaleString()})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Final Sale Price (₹)</label>
                                            <input required type="number" placeholder="Eg: 550000" value={convertForm.final_price} onChange={e => setConvertForm({ ...convertForm, final_price: e.target.value })} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-primary outline-none focus:border-green-400 bg-white shadow-sm" />
                                        </div>
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
                            <a href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 h-10 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-primary font-bold rounded-xl text-sm transition-all shadow-sm">
                                <span className="material-symbols-outlined text-base">forum</span> Send WhatsApp
                            </a>
                        </div>
                        
                        {/* Add Task Module */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[var(--shadow-card)]">
                            <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-amber-500 text-lg">task</span><h4 className="font-bold text-primary text-sm">Schedule Task</h4></div>
                            
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
                                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">Ensure you never miss a follow-up. Add a reminder to your daily planner.</p>
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
