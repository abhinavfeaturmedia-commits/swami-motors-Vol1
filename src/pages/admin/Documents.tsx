import React, { useState } from 'react';

const DOCS = [
    { id: '1', vehicle: 'Hyundai Creta 2022', type: 'RC (Registration)', status: 'Valid', expiry: '15 Mar 2037', file: 'rc_creta_2022.pdf' },
    { id: '2', vehicle: 'Hyundai Creta 2022', type: 'Insurance', status: 'Expiring', expiry: '12 Dec 2024', file: 'insurance_creta.pdf' },
    { id: '3', vehicle: 'Toyota Fortuner 2021', type: 'RC (Registration)', status: 'Valid', expiry: '22 Jun 2036', file: 'rc_fortuner.pdf' },
    { id: '4', vehicle: 'Toyota Fortuner 2021', type: 'Loan Clearance', status: 'Missing', expiry: '—', file: '' },
    { id: '5', vehicle: 'Tata Nexon 2023', type: 'Insurance', status: 'Valid', expiry: '08 Aug 2025', file: 'insurance_nexon.pdf' },
    { id: '6', vehicle: 'Tata Nexon 2023', type: 'Pollution (PUC)', status: 'Expiring', expiry: '05 Nov 2024', file: 'puc_nexon.pdf' },
    { id: '7', vehicle: 'Honda City 2020', type: 'NOC', status: 'Missing', expiry: '—', file: '' },
    { id: '8', vehicle: 'Honda City 2020', type: 'RC (Registration)', status: 'Valid', expiry: '10 Jan 2035', file: 'rc_city.pdf' },
];

const statusColors: Record<string, string> = { Valid: 'bg-green-100 text-green-700', Expiring: 'bg-amber-100 text-amber-700', Missing: 'bg-red-100 text-red-700' };
const DOC_TYPES = ['All', 'RC (Registration)', 'Insurance', 'Pollution (PUC)', 'NOC', 'Loan Clearance'];

const Documents = () => {
    const [filter, setFilter] = useState('All');
    const filtered = filter === 'All' ? DOCS : DOCS.filter(d => d.type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Document Manager</h1>
                    <p className="text-slate-500 text-sm">Track RC, insurance, NOC, and more for every vehicle.</p>
                </div>
                <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">upload_file</span> Upload Document
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Valid', val: DOCS.filter(d => d.status === 'Valid').length, icon: 'check_circle', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Expiring Soon', val: DOCS.filter(d => d.status === 'Expiring').length, icon: 'warning', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Missing', val: DOCS.filter(d => d.status === 'Missing').length, icon: 'error', color: 'bg-red-500/10 text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {DOC_TYPES.map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${filter === t ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary'}`}>{t}</button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Document Type</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Expiry Date</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(d => (
                            <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{d.vehicle}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-base">description</span>
                                        <span className="text-sm text-slate-700">{d.type}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[d.status]}`}>{d.status}</span></td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{d.expiry}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex gap-1">
                                        {d.file ? (
                                            <>
                                                <button className="p-1.5 hover:bg-blue-50 rounded-lg" title="View"><span className="material-symbols-outlined text-blue-500 text-lg">visibility</span></button>
                                                <button className="p-1.5 hover:bg-blue-50 rounded-lg" title="Download"><span className="material-symbols-outlined text-blue-500 text-lg">download</span></button>
                                            </>
                                        ) : (
                                            <button className="p-1.5 hover:bg-green-50 rounded-lg" title="Upload"><span className="material-symbols-outlined text-green-600 text-lg">upload</span></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Documents;
