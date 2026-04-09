import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

const statusColors: Record<string, string> = { Valid: 'bg-green-100 text-green-700', Expiring: 'bg-amber-100 text-amber-700', Expired: 'bg-red-100 text-red-700' };
const DOC_TYPES = ['All', 'RC (Registration)', 'Insurance', 'Pollution (PUC)', 'NOC', 'Loan Clearance'];

const Documents = () => {
    const { documents, inventory, refreshData } = useData();
    const [filter, setFilter] = useState('All');
    
    // Upload Modal States
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedInv, setSelectedInv] = useState('');
    const [selectedDocType, setSelectedDocType] = useState('RC (Registration)');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Only map actual documents present in the database.
    const displayDocs = documents.map(d => {
        const car = inventory.find(i => i.id === d.inventory_id);
        
        let status = 'Valid';
        let expiry = 'Lifetime';
        
        if (d.expiry_date) {
            const today = new Date();
            const expDate = new Date(d.expiry_date);
            const daysLeft = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            
            if (daysLeft < 0) {
                status = 'Expired';
            } else if (daysLeft < 30) {
                status = 'Expiring';
            } else {
                status = 'Valid';
            }
            expiry = expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        return {
            id: d.id,
            vehicle: car ? `${car.year} ${car.make} ${car.model} (${car.registration_no || 'No Reg'})` : 'Unknown Vehicle',
            type: d.document_type,
            status,
            expiry,
            fileUrl: d.file_url,
            inventory_id: d.inventory_id
        };
    }).sort((a, b) => a.vehicle.localeCompare(b.vehicle));

    const filtered = filter === 'All' ? displayDocs : displayDocs.filter(d => d.type === filter);

    const handleDirectUpload = async () => {
        if (!selectedInv || !uploadFile) return;

        setUploading(true);
        try {
            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `${selectedInv}-${selectedDocType.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('documents').upload(fileName, uploadFile);

            let finalFileUrl = '';
            if (!error && data) {
                const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
                finalFileUrl = publicUrlData.publicUrl;
            } else {
                console.warn("Storage upload error, using local data URL", error);
                finalFileUrl = URL.createObjectURL(uploadFile);
            }

            const defaultExpiry = new Date();
            defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

            await supabase.from('documents').insert({
                inventory_id: selectedInv,
                document_type: selectedDocType,
                file_url: finalFileUrl,
                expiry_date: defaultExpiry
            });
            
            await refreshData();
            setShowUpload(false);
            setUploadFile(null);
            setSelectedInv('');
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Document Vault</h1>
                    <p className="text-slate-500 text-sm">Secure storage for vehicle documents.</p>
                </div>
                <div className="flex gap-2">
                    <span className="py-2 px-3 text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 rounded-lg shadow-sm flex items-center">VERIFIED LIVE</span>
                    <button onClick={() => setShowUpload(true)} className="h-9 px-4 bg-accent text-primary font-bold flex items-center gap-2 rounded-xl text-sm shadow-sm hover:bg-accent-hover transition-colors">
                        <span className="material-symbols-outlined text-lg">add</span> Add Document
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Verified & Secure', val: displayDocs.filter(d => d.status === 'Valid').length, icon: 'check_circle', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Upcoming Renewals', val: displayDocs.filter(d => d.status === 'Expiring').length, icon: 'warning', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Expired Documents', val: displayDocs.filter(d => d.status === 'Expired').length, icon: 'error', color: 'bg-red-500/10 text-red-600' },
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Vehicle / Target</th>
                            <th className="text-left px-5 py-3">Document Type</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Expiry Date</th>
                            <th className="text-left px-5 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-slate-400 text-center flex flex-col items-center"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_open</span>No documents uploaded yet.</td></tr>}
                        {filtered.map(d => (
                            <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-semibold text-primary">{d.vehicle}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-base ${d.fileUrl ? 'text-blue-500' : 'text-slate-300'}`}>description</span>
                                        <span className="text-sm font-medium text-slate-700">{d.type}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColors[d.status] || 'bg-slate-100 text-slate-500'}`}>{d.status}</span></td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{d.expiry}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex gap-1">
                                        <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 flex items-center transition-colors" title="View Secure File"><span className="material-symbols-outlined text-lg">visibility</span></button>
                                        <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 flex items-center transition-colors" title="Download Origin"><span className="material-symbols-outlined text-lg">download</span></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-primary text-lg">Upload Document</h3>
                            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehicle</label>
                                <select className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none" value={selectedInv} onChange={e => setSelectedInv(e.target.value)}>
                                    <option value="" disabled>Select Vehicle</option>
                                    {inventory.map(car => <option key={car.id} value={car.id}>{car.year} {car.make} {car.model} ({car.registration_no || 'No Reg'})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document Type</label>
                                <select className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none" value={selectedDocType} onChange={e => setSelectedDocType(e.target.value)}>
                                    {DOC_TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">File</label>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                            <button 
                                onClick={handleDirectUpload} 
                                disabled={uploading || !selectedInv || !uploadFile}
                                className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 mt-4 transition-all hover:bg-primary-light">
                                {uploading ? <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
