import React, { useState } from 'react';

const GST_DATA = [
    { month: 'October 2024', taxable: '₹14,00,000', cgst: '₹1,26,000', sgst: '₹1,26,000', igst: '—', input: '₹85,000', net: '₹1,67,000', status: 'Due' },
    { month: 'September 2024', taxable: '₹18,50,000', cgst: '₹1,66,500', sgst: '₹1,66,500', igst: '—', input: '₹1,12,000', net: '₹2,21,000', status: 'Filed' },
    { month: 'August 2024', taxable: '₹12,75,000', cgst: '₹1,14,750', sgst: '₹1,14,750', igst: '—', input: '₹72,000', net: '₹1,57,500', status: 'Filed' },
];

const TDS_DATA = [
    { section: '194C', desc: 'Contractor Payments', amount: '₹2,50,000', tds: '₹5,000', depositDate: '07 Nov 2024', status: 'Pending' },
    { section: '194H', desc: 'Commission (Insurance)', amount: '₹85,000', tds: '₹4,250', depositDate: '07 Oct 2024', status: 'Deposited' },
    { section: '194J', desc: 'Professional Fees (CA)', amount: '₹1,20,000', tds: '₹12,000', depositDate: '07 Oct 2024', status: 'Deposited' },
];

const statusColors: Record<string, string> = { Filed: 'bg-green-100 text-green-700', Due: 'bg-amber-100 text-amber-700', Overdue: 'bg-red-100 text-red-700', Deposited: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700' };

const TaxCompliance = () => {
    const [tab, setTab] = useState<'gst' | 'tds'>('gst');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-primary font-display">Tax & Compliance</h1>
                <p className="text-slate-500 text-sm">GST reports, TDS tracking, and filing status.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'GST Payable (Oct)', val: '₹1.67L', icon: 'receipt', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Input Credit', val: '₹0.85L', icon: 'credit_score', color: 'bg-green-500/10 text-green-600' },
                    { label: 'TDS Pending', val: '₹5,000', icon: 'pending_actions', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Next Filing', val: '20 Nov', icon: 'event', color: 'bg-red-500/10 text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                <button onClick={() => setTab('gst')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === 'gst' ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>GST Summary</button>
                <button onClick={() => setTab('tds')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === 'tds' ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>TDS Tracker</button>
            </div>

            {tab === 'gst' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Month</th>
                                <th className="text-left px-5 py-3">Taxable Sales</th>
                                <th className="text-left px-5 py-3">CGST</th>
                                <th className="text-left px-5 py-3">SGST</th>
                                <th className="text-left px-5 py-3">Input Credit</th>
                                <th className="text-left px-5 py-3">Net Payable</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-left px-5 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {GST_DATA.map(g => (
                                <tr key={g.month} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-sm font-semibold text-primary">{g.month}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{g.taxable}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{g.cgst}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{g.sgst}</td>
                                    <td className="px-5 py-3.5 text-sm text-green-600">{g.input}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-primary">{g.net}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[g.status]}`}>{g.status}</span></td>
                                    <td className="px-5 py-3.5">
                                        <button className="p-1.5 hover:bg-blue-50 rounded-lg" title="Download"><span className="material-symbols-outlined text-blue-500 text-lg">download</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                <th className="text-left px-5 py-3">Section</th>
                                <th className="text-left px-5 py-3">Description</th>
                                <th className="text-left px-5 py-3">Amount</th>
                                <th className="text-left px-5 py-3">TDS</th>
                                <th className="text-left px-5 py-3">Deposit Date</th>
                                <th className="text-left px-5 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TDS_DATA.map(t => (
                                <tr key={t.section + t.desc} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-sm font-bold text-primary">{t.section}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{t.desc}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{t.amount}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-red-600">{t.tds}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">{t.depositDate}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[t.status]}`}>{t.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TaxCompliance;
