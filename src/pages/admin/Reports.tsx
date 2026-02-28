import React, { useState } from 'react';

const REPORT_TYPES = ['Sales Report', 'Inventory Report', 'Lead Analysis', 'Financial Summary'];
const RECENT_REPORTS = [
    { name: 'Monthly Sales — October 2024', type: 'Sales', date: '01 Nov 2024', size: '2.4 MB', format: 'PDF' },
    { name: 'Inventory Snapshot — Q3 2024', type: 'Inventory', date: '28 Oct 2024', size: '1.8 MB', format: 'CSV' },
    { name: 'Lead Conversion — September', type: 'Leads', date: '15 Oct 2024', size: '890 KB', format: 'PDF' },
    { name: 'Financial Summary — H1 2024', type: 'Financial', date: '05 Oct 2024', size: '3.1 MB', format: 'PDF' },
    { name: 'Team Performance — October', type: 'Sales', date: '01 Oct 2024', size: '1.2 MB', format: 'CSV' },
];

const SCHEDULED = [
    { name: 'Weekly Sales Summary', frequency: 'Every Monday', nextRun: '04 Nov 2024', status: 'Active' },
    { name: 'Monthly Inventory Report', frequency: '1st of month', nextRun: '01 Dec 2024', status: 'Active' },
    { name: 'Quarterly Financial', frequency: 'Quarterly', nextRun: '01 Jan 2025', status: 'Paused' },
];

const Reports = () => {
    const [reportType, setReportType] = useState('Sales Report');
    const [dateFrom, setDateFrom] = useState('2024-10-01');
    const [dateTo, setDateTo] = useState('2024-10-31');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Reports Generator</h1>
                <p className="text-slate-500 text-sm">Generate, download, and schedule automated reports.</p>
            </div>

            {/* Generator */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-lg mb-5">Generate New Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Report Type</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary font-medium outline-none">
                            {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">From Date</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">To Date</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 h-10 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary-light transition-colors">
                            <span className="material-symbols-outlined text-lg">description</span> Generate
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Reports */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="p-5 pb-0 flex items-center justify-between">
                        <h2 className="font-bold text-primary font-display text-lg">Recent Reports</h2>
                    </div>
                    <table className="w-full mt-3">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-2.5">Report Name</th>
                                <th className="text-left px-5 py-2.5">Type</th>
                                <th className="text-left px-5 py-2.5">Date</th>
                                <th className="text-left px-5 py-2.5">Size</th>
                                <th className="text-left px-5 py-2.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_REPORTS.map((r, i) => (
                                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-lg ${r.format === 'PDF' ? 'text-red-500' : 'text-green-600'}`}>{r.format === 'PDF' ? 'picture_as_pdf' : 'table_chart'}</span>
                                            <span className="text-sm font-medium text-primary">{r.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3"><span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-slate-100 text-slate-600">{r.type}</span></td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{r.date}</td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{r.size}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-1">
                                            <button className="p-1.5 hover:bg-blue-50 rounded-lg" title="Download"><span className="material-symbols-outlined text-blue-500 text-lg">download</span></button>
                                            <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Share"><span className="material-symbols-outlined text-slate-400 text-lg">share</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Scheduled Reports */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-primary font-display text-lg">Scheduled</h2>
                        <button className="text-xs font-semibold text-accent hover:underline">+ Add</button>
                    </div>
                    <div className="space-y-4">
                        {SCHEDULED.map((s, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-primary">{s.name}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{s.status}</span>
                                </div>
                                <p className="text-[11px] text-slate-500"><span className="material-symbols-outlined text-xs align-middle mr-1">schedule</span>{s.frequency}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Next: {s.nextRun}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
