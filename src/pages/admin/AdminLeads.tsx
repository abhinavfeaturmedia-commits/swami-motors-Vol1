import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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
    created_at: string;
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    negotiation: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-slate-100 text-slate-500',
};

const filterTabs = ['All Leads', 'contact', 'sell_car', 'test_drive', 'insurance'];
const statusTabs = ['All Statuses', 'new', 'contacted', 'negotiation', 'closed_won', 'closed_lost'];

const AdminLeads = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All Leads');
    const [activeStatusFilter, setActiveStatusFilter] = useState('All Statuses');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const leadsPerPage = 15;
    
    // Bulk Actions state
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    
    const navigate = useNavigate();
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [manualForm, setManualForm] = useState<Partial<Lead>>({ full_name: '', phone: '', type: 'contact', status: 'new', source: 'Walk-in', email: '', message: '' });

    // Import logic
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

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
                if (lines.length < 2) throw new Error("Empty CSV");

                const newLeads = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    // Parse our exported format: "Date","Name","Phone","Type","Status","Source"
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
                            source: cols[5]
                        });
                    }
                }

                if (newLeads.length > 0) {
                    const { error } = await supabase.from('leads').insert(newLeads);
                    if (error) throw error;
                    alert(`Successfully imported ${newLeads.length} leads.`);
                    fetchLeads();
                } else {
                    alert("No valid formatted data found.");
                }
            } catch (error) {
                console.error("Import error:", error);
                alert("Failed to import leads. Check format.");
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) setLeads(data as unknown as Lead[]);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('leads').insert(manualForm);
        if (!error) {
            setIsAddingManual(false);
            setManualForm({ full_name: '', phone: '', type: 'contact', status: 'new', source: 'Walk-in', email: '', message: '' });
            fetchLeads();
        } else {
            alert('Error adding lead. Try again.');
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const updateLeadStatus = async (id: string, newStatus: string) => {
        const lead = leads.find(l => l.id === id);
        const updates: any = { status: newStatus };
        
        if (newStatus !== 'new' && lead?.status === 'new') {
            updates.contacted_at = new Date().toISOString();
        }
        
        if (newStatus === 'closed_lost') {
            const reason = window.prompt("Reason for lost lead? (e.g., Price too high, Bought elsewhere, Financing failed, Lost contact)");
            if (reason) updates.lost_reason = reason;
        }

        const { error } = await supabase.from('leads').update(updates).eq('id', id);
        if (!error) {
            setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
        }
    };

    const deleteLead = async (id: string) => {
        if(window.confirm("Are you sure you want to permanently delete this lead?")) {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (!error) {
                setLeads(prev => prev.filter(l => l.id !== id));
                setSelectedLeads(prev => prev.filter(selectedId => selectedId !== id));
            } else {
                alert('Error deleting lead');
            }
        }
    };

    const deleteSelectedLeads = async () => {
        if(window.confirm(`Are you sure you want to permanently delete ${selectedLeads.length} leads?`)) {
            const { error } = await supabase.from('leads').delete().in('id', selectedLeads);
            if (!error) {
                setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
                setSelectedLeads([]);
            } else {
                alert('Error deleting leads');
            }
        }
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Name', 'Phone', 'Type', 'Status', 'Source'];
        const csvContent = [
            headers.join(','),
            ...filteredAndSearchedLeads.map(l => 
                `"${new Date(l.created_at).toLocaleDateString()}","${l.full_name}","${l.phone}","${l.type}","${l.status}","${l.source}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "leads_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    // Filter by Tab and Search
    const filteredAndSearchedLeads = leads.filter(l => {
        const matchesTab = activeFilter === 'All Leads' || l.type === activeFilter;
        const matchesStatus = activeStatusFilter === 'All Statuses' || l.status === activeStatusFilter;
        const matchesSearch = l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              l.phone.includes(searchQuery);
        return matchesTab && matchesStatus && matchesSearch;
    });

    // Pagination
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
            setSelectedLeads([]); // Deselect all visible
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id)); // Select all visible
        }
    };

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev => 
            prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Lead Management</h1>
                    <p className="text-slate-500 text-sm">Track website enquiries, test drives, and car sales.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input 
                            type="text" 
                            placeholder="Search names or phone..." 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64 transition-all"
                        />
                    </div>
                    
                    {/* Hidden file input for import */}
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

                    <button onClick={exportToCSV} className="h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm gap-2" title="Export to CSV">
                        <span className="material-symbols-outlined text-lg">download</span> Export
                    </button>
                    
                    <button onClick={fetchLeads} className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                    <button onClick={() => setIsAddingManual(true)} className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">person_add</span> Manual Lead
                    </button>
                </div>
            </div>

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
                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-primary">{selectedLeads.length} Selected</span>
                            <button onClick={deleteSelectedLeads} className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-sm">delete</span> Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Sub Status Tabs */}
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

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto min-h-[400px]">
                <table className="w-full min-w-[1000px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
                            <th className="px-5 py-3 w-12 text-center border-r border-slate-100">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                                    checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="text-left px-5 py-3">Lead Date</th>
                            <th className="text-left px-5 py-3">Customer</th>
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-left px-5 py-3">Details</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-right px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading leads...</td></tr>
                        ) : paginatedLeads.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-500">No leads found.</td></tr>
                        ) : (
                            paginatedLeads.map(lead => (
                                <tr key={lead.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedLeads.includes(lead.id) ? 'bg-primary/5' : ''}`} onClick={() => navigate(`/admin/leads/${lead.id}`)}>
                                    <td className="px-5 py-4 w-12 text-center border-r border-slate-50" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                                            checked={selectedLeads.includes(lead.id)}
                                            onChange={() => toggleSelectLead(lead.id)}
                                        />
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                                        <span className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
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
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600">{formatLabel(lead.type)}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-primary font-medium line-clamp-1">
                                            {lead.type === 'sell_car' && `${lead.car_make || ''} ${lead.car_model || ''}`}
                                            {lead.type === 'contact' && (lead.message ? lead.message : '—')}
                                            {lead.type === 'test_drive' && 'Test Drive Booking'}
                                            {lead.type === 'insurance' && 'Insurance Inquiry'}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate max-w-[200px]">From: {lead.source}</p>
                                    </td>
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
                                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <a href={`tel:${lead.phone}`} title="Call" className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">call</span>
                                            </a>
                                            <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-green-100 hover:text-green-600 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">chat</span>
                                            </a>
                                            <button onClick={() => deleteLead(lead.id)} title="Delete Lead" className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
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

            {/* Manual Lead Modal */}
            {isAddingManual && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddingManual(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col mx-4 max-h-full">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-primary font-display">Add Manual Lead</h2>
                            <button type="button" onClick={() => setIsAddingManual(false)} className="p-1 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="p-5 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input required type="text" value={manualForm.full_name || ''} onChange={e => setManualForm(prev => ({...prev, full_name: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="e.g. Ramesh Patil" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                                    <input required type="tel" value={manualForm.phone || ''} onChange={e => setManualForm(prev => ({...prev, phone: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="98XXX XXXXX" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input type="email" value={manualForm.email || ''} onChange={e => setManualForm(prev => ({...prev, email: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="ramesh@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Enquiry Type</label>
                                    <select value={manualForm.type || 'contact'} onChange={e => setManualForm(prev => ({...prev, type: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                        <option value="contact">General Contact</option>
                                        <option value="sell_car">Sell Car</option>
                                        <option value="test_drive">Test Drive</option>
                                        <option value="insurance">Insurance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                                    <select value={manualForm.source || 'Walk-in'} onChange={e => setManualForm(prev => ({...prev, source: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select value={manualForm.status || 'new'} onChange={e => setManualForm(prev => ({...prev, status: e.target.value}))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 bg-white">
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="negotiation">Negotiating</option>
                                        <option value="closed_won">Closed (Won)</option>
                                        <option value="closed_lost">Closed (Lost)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Message</label>
                                <textarea rows={3} value={manualForm.message || ''} onChange={e => setManualForm(prev => ({...prev, message: e.target.value}))} className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" placeholder="Any initial notes or requirements about this lead..." />
                            </div>
                            
                            <div className="pt-2">
                                <button type="submit" className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors">
                                    Save Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
