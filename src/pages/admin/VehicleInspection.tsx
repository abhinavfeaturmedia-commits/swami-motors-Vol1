import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
    { name: 'Engine & Transmission', items: ['Oil Level & Quality', 'Coolant Level', 'Belt Condition', 'Transmission Fluid', 'Clutch Operation', 'Engine Mount', 'Exhaust System'] },
    { name: 'Exterior Body', items: ['Paint Condition', 'Dent / Scratch Check', 'Windshield', 'Headlights', 'Tail Lights', 'Bumpers', 'Side Mirrors'] },
    { name: 'Interior & Comfort', items: ['Seat Condition', 'Dashboard', 'AC / Heater', 'Infotainment System', 'Power Windows', 'Central Locking', 'Boot Space'] },
    { name: 'Electrical System', items: ['Battery Health', 'Wiring Harness', 'Horn', 'Wipers', 'Indicators', 'Camera System', 'Key / Remote'] },
    { name: 'Tyres & Brakes', items: ['Front Tyres', 'Rear Tyres', 'Spare Tyre', 'Brake Pads', 'Brake Discs', 'Handbrake'] },
];

type Status = 'Pass' | 'Fail' | 'NA' | '';

const VehicleInspection = () => {
    const { inventory, inspections, refreshData } = useData();
    const { profile, user } = useAuth();
    const toast = useToast();
    const availableInventory = inventory.filter(c => c.status !== 'sold');
    
    const [selectedVehicleId, setSelectedVehicleId] = useState(availableInventory.length > 0 ? availableInventory[0].id : '');
    const [statuses, setStatuses] = useState<Record<string, Status>>({});
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedVehicleId && availableInventory.length > 0) {
            setSelectedVehicleId(availableInventory[0].id);
        }
    }, [availableInventory, selectedVehicleId]);

    const total = CATEGORIES.reduce((s, c) => s + c.items.length, 0);
    const passed = Object.values(statuses).filter(v => v === 'Pass').length;
    const failed = Object.values(statuses).filter(v => v === 'Fail').length;
    const checked = Object.values(statuses).filter(v => v !== '' && v !== undefined).length;
    const score = checked > 0 ? Math.round((passed / ((passed + failed) || 1)) * 100) : 0;

    const setStatus = (item: string, status: Status) => setStatuses(prev => ({ ...prev, [item]: status }));

    const handleSave = async () => {
        if (!selectedVehicleId) return;
        setIsSaving(true);
        
        try {
            // Serialize checklist items to JSON string since schema stores structured summary in notes
            const formattedNotes = `Score: ${score}% (${passed} Pass, ${failed} Fail)\n\nInspector Notes:\n${notes}\n\nChecklist:\n${JSON.stringify(statuses)}`;
            const finalStatus = score >= 80 ? 'passed' : 'failed';
            const inspectorName = profile?.full_name || user?.email?.split('@')[0] || 'Admin Inspector';
            const todayStr = new Date().toISOString().split('T')[0];

            const { error } = await supabase.from('inspections').insert({
                inventory_id: selectedVehicleId,
                inspector_name: inspectorName,
                status: finalStatus,
                inspection_date: todayStr,
                notes: formattedNotes
            });

            if (error) {
                toast.error('Error saving inspection report.');
                console.error(error);
            } else {
                // If inspection passed >= 80%, certify vehicle condition and tag certified in inventory notes
                if (score >= 80) {
                    await supabase.from('inventory').update({
                        condition: 'Certified Excellent',
                        notes: `200-Pt Verified Inspection Passed (${score}%) by ${inspectorName} on ${todayStr}`
                    }).eq('id', selectedVehicleId);
                }

                toast.success(`Inspection recorded successfully (${score}% - ${finalStatus.toUpperCase()})`);
                setStatuses({});
                setNotes('');
                refreshData();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to complete inspection save.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Vehicle Inspection</h1>
                    <p className="text-slate-500 text-sm">Log assessments and quality checklists for active inventory.</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">save</span> {isSaving ? 'Saving...' : 'Save Report'}
                </button>
            </div>

            {/* Vehicle selector + score */}
            <div className="grid lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Internal Vehicle</label>
                    <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="w-full max-w-md h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary font-medium outline-none">
                        {availableInventory.length === 0 && <option value="">No available inventory</option>}
                        {availableInventory.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.year} {car.make} {car.model} — {car.registration_no || 'No Plate'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] text-center">
                    <div className="relative size-20 mx-auto mb-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke={score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeDasharray={`${(score / 100) * 264} 264`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-primary font-display">{score}%</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{checked}/{total} checked</p>
                </div>
            </div>

            {/* Checklists */}
            {CATEGORIES.map(cat => (
                <div key={cat.name} className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-primary font-display text-sm">{cat.name}</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{cat.items.filter(i => statuses[i]).length}/{cat.items.length} Scored</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {cat.items.map(item => (
                            <div key={item} className="px-5 py-3 flex items-center justify-between">
                                <span className="text-sm text-slate-700">{item}</span>
                                <div className="flex gap-1">
                                    {(['Pass', 'Fail', 'NA'] as Status[]).map(s => (
                                        <button key={s} onClick={() => setStatus(item, s)} className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${statuses[item] === s
                                            ? s === 'Pass' ? 'bg-green-500 text-white border-green-500' : s === 'Fail' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-400 text-white border-slate-400'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Inspector Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add any major concerns or observations..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-primary outline-none resize-none focus:border-primary/50" />
            </div>

            {/* Past Inspections History */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="font-bold text-primary font-display text-sm">Recent Quality Inspections</h3>
                        <p className="text-xs text-slate-400">Past audits and certification records across vehicles</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {inspections.length} Total Inspections
                    </span>
                </div>

                {inspections.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                        No inspection records found yet. Submit the form above to record your first vehicle audit.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-2.5 px-3">Vehicle</th>
                                    <th className="py-2.5 px-3">Inspector</th>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Summary / Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inspections.slice(0, 10).map((insp: any) => {
                                    const car = insp.car || inventory.find(c => c.id === insp.inventory_id);
                                    const isPass = insp.status === 'passed';
                                    return (
                                        <tr key={insp.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-3 px-3 font-bold text-primary">
                                                {car ? `${car.year} ${car.make} ${car.model}` : `Vehicle #${insp.inventory_id?.slice(0, 8)}`}
                                            </td>
                                            <td className="py-3 px-3 text-slate-600 font-medium">
                                                {insp.inspector_name || 'Inspector'}
                                            </td>
                                            <td className="py-3 px-3 text-slate-500">
                                                {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString('en-IN') : 'Recent'}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                    {insp.status || 'evaluated'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={insp.notes}>
                                                {insp.notes?.split('\n')[0] || 'Inspection logged'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleInspection;
