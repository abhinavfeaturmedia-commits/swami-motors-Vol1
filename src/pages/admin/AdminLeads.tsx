import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LEADS = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', car: 'Hyundai Creta 2022', budget: '₹14-16L', source: 'Walk-in', status: 'New', score: 85, avatar: 'RK', date: 'Today' },
    { id: '2', name: 'Priya Deshmukh', phone: '+91 87654 32109', car: 'Toyota Fortuner', budget: '₹30-35L', source: 'Website', status: 'Contacted', score: 72, avatar: 'PD', date: 'Yesterday' },
    { id: '3', name: 'Amit Joshi', phone: '+91 76543 21098', car: 'Tata Nexon XZ+', budget: '₹10-12L', source: 'Referral', status: 'Test Drive', score: 90, avatar: 'AJ', date: '2 days ago' },
    { id: '4', name: 'Sanjay Patil', phone: '+91 65432 10987', car: 'Honda City ZX', budget: '₹11-13L', source: 'OLX', status: 'Negotiation', score: 88, avatar: 'SP', date: '3 days ago' },
    { id: '5', name: 'Meera Shah', phone: '+91 54321 09876', car: 'Maruti Swift', budget: '₹6-8L', source: 'Instagram', status: 'New', score: 65, avatar: 'MS', date: 'Today' },
    { id: '6', name: 'Ravi Shinde', phone: '+91 43210 98765', car: 'Kia Seltos', budget: '₹15-18L', source: 'Walk-in', status: 'Contacted', score: 78, avatar: 'RS', date: '1 day ago' },
];

const pipeline: Record<string, string> = { 'New': 'New Leads', 'Contacted': 'Contacted', 'Test Drive': 'Test Drive', 'Negotiation': 'Negotiation' };
const statusColors: Record<string, string> = {
    'New': 'bg-blue-500', 'Contacted': 'bg-amber-500', 'Test Drive': 'bg-purple-500', 'Negotiation': 'bg-green-500',
};
const filterTabs = ['All Leads', 'Hot', 'New', 'Follow-up'];

const AdminLeads = () => {
    const [view, setView] = useState<'pipeline' | 'list'>('pipeline');
    const [activeFilter, setActiveFilter] = useState('All Leads');
    const [selectedLead, setSelectedLead] = useState<typeof LEADS[0] | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Lead Management</h1>
                    <p className="text-slate-500 text-sm">Track and manage your sales pipeline.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button onClick={() => setView('pipeline')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'pipeline' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-sm mr-1 align-text-bottom">view_kanban</span> Pipeline
                        </button>
                        <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-sm mr-1 align-text-bottom">view_list</span> List
                        </button>
                    </div>
                    <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">person_add</span> New Lead
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {filterTabs.map(tab => (
                    <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeFilter === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {tab} <span className="text-xs text-slate-400 ml-1">({tab === 'All Leads' ? LEADS.length : tab === 'Hot' ? 2 : tab === 'New' ? 2 : 1})</span>
                    </button>
                ))}
            </div>

            {/* Pipeline View */}
            {view === 'pipeline' && (
                <div className="grid grid-cols-4 gap-4 overflow-x-auto">
                    {Object.entries(pipeline).map(([status, title]) => (
                        <div key={status}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                                <h3 className="text-sm font-bold text-primary">{title}</h3>
                                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{LEADS.filter(l => l.status === status).length}</span>
                            </div>
                            <div className="space-y-3">
                                {LEADS.filter(l => l.status === status).map(lead => (
                                    <button key={lead.id} onClick={() => setSelectedLead(lead)} className="w-full text-left bg-white rounded-xl border border-slate-100 p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xs font-bold">{lead.avatar}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-primary truncate">{lead.name}</p>
                                                <p className="text-[10px] text-slate-400">{lead.date}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-slate-400">directions_car</span> {lead.car}</p>
                                        <p className="text-xs text-slate-600 flex items-center gap-1"><span className="material-symbols-outlined text-xs text-slate-400">payments</span> {lead.budget}</p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                            <span className="text-[10px] text-slate-400">{lead.source}</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${lead.score}%` }} /></div>
                                                <span className="text-[10px] font-bold text-slate-500">{lead.score}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Lead</th>
                                <th className="text-left px-5 py-3">Car Interest</th>
                                <th className="text-left px-5 py-3">Budget</th>
                                <th className="text-left px-5 py-3">Source</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-left px-5 py-3">Score</th>
                                <th className="text-left px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LEADS.map(lead => (
                                <tr key={lead.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xs font-bold">{lead.avatar}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{lead.name}</p>
                                                <p className="text-xs text-slate-400">{lead.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-700">{lead.car}</td>
                                    <td className="px-5 py-3.5 text-sm font-medium text-primary">{lead.budget}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">{lead.source}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase text-white ${statusColors[lead.status]}`}>{lead.status}</span></td>
                                    <td className="px-5 py-3.5"><div className="flex items-center gap-1"><div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${lead.score}%` }} /></div><span className="text-xs font-bold text-slate-500">{lead.score}</span></div></td>
                                    <td className="px-5 py-3.5"><button className="p-1.5 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-lg">more_horiz</span></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Lead Detail Drawer */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
                    <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary font-display">Lead Details</h2>
                            <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-lg font-bold">{selectedLead.avatar}</div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary font-display">{selectedLead.name}</h3>
                                    <p className="text-sm text-slate-500">{selectedLead.phone}</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                                <button className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">call</span> Call</button>
                                <button className="flex-1 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">chat</span> WhatsApp</button>
                                <button className="flex-1 h-10 bg-slate-100 text-primary text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">mail</span> Email</button>
                            </div>

                            {/* Info */}
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">Vehicle Interest</h4>
                                <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Car</span><span className="text-sm font-bold text-primary">{selectedLead.car}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Budget</span><span className="text-sm font-bold text-primary">{selectedLead.budget}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Source</span><span className="text-sm font-bold text-primary">{selectedLead.source}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Lead Score</span><span className="text-sm font-bold text-accent">{selectedLead.score}/100</span></div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Activity Timeline</h4>
                                <div className="space-y-4">
                                    {[
                                        { icon: 'person_add', text: 'Lead created from ' + selectedLead.source, time: '3 days ago', color: 'bg-blue-500' },
                                        { icon: 'call', text: 'First contact call made', time: '2 days ago', color: 'bg-green-500' },
                                        { icon: 'directions_car', text: 'Test drive scheduled', time: '1 day ago', color: 'bg-purple-500' },
                                    ].map((event, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={`size-7 rounded-full ${event.color} flex items-center justify-center shrink-0`}>
                                                <span className="material-symbols-outlined text-white text-sm">{event.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-primary">{event.text}</p>
                                                <p className="text-xs text-slate-400">{event.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
