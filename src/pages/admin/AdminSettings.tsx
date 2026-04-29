import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: Record<string, { start: string; end: string; status: string }> = {
    Monday:    { start: '09:30', end: '19:30', status: 'Open' },
    Tuesday:   { start: '09:30', end: '19:30', status: 'Open' },
    Wednesday: { start: '09:30', end: '19:30', status: 'Open' },
    Thursday:  { start: '09:30', end: '19:30', status: 'Open' },
    Friday:    { start: '09:30', end: '19:30', status: 'Open' },
    Saturday:  { start: '09:30', end: '14:00', status: 'Half Day' },
    Sunday:    { start: '',      end: '',       status: 'Closed' },
};

const DEFAULT_BUSINESS = { name: '', address: '', phone: '', email: '', gst_number: '', city: '' };

const DEFAULT_NOTIFICATIONS = {
    newLead:     true,
    booking:     true,
    followUp:    true,
    stockAlert:  true,
    dailyReport: true,
};

const DEFAULT_OPERATIONS = {
    stockLowThreshold: 3,
    leadAutoAssign:    false,
    requireInspection: true,
    allowSelfAssign:   false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert a single setting key to Supabase (v2 schema: setting_key / setting_value) */
const upsertSetting = (key: string, value: any) =>
    supabase
        .from('dealership_settings')
        .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard: React.FC<{ icon: string; title: string; subtitle: string; children: React.ReactNode }> = ({
    icon, title, subtitle, children,
}) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
            </div>
            <div>
                <h2 className="font-bold text-primary font-display text-sm">{title}</h2>
                <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{children}</label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-primary outline-none focus:border-primary/40 focus:bg-white transition-colors"
    />
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-slate-300'}`}
    >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
);

const SkeletonLine: React.FC<{ w?: string }> = ({ w = 'w-full' }) => (
    <div className={`h-10 ${w} bg-slate-100 animate-pulse rounded-xl`} />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminSettings: React.FC = () => {
    const { settings, loading: globalLoading, refreshData } = useData();

    // Local state — all empty/default until DB resolves
    const [businessProfile, setBusinessProfile]   = useState({ ...DEFAULT_BUSINESS });
    const [workingHours,    setWorkingHours]       = useState<Record<string, { start: string; end: string; status: string }>>({});
    const [notifications,   setNotifications]      = useState({ ...DEFAULT_NOTIFICATIONS });
    const [operations,      setOperations]         = useState({ ...DEFAULT_OPERATIONS });

    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);
    const [error,  setError]  = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false); // prevents flash of defaults

    // ── Sync from DB once settings are fetched ────────────────────────────────
    useEffect(() => {
        if (globalLoading) return; // wait for DataContext to finish
        setLoaded(true);

        if (settings.business_profile) {
            setBusinessProfile({ ...DEFAULT_BUSINESS, ...settings.business_profile });
        }
        if (settings.working_hours && Object.keys(settings.working_hours).length > 0) {
            setWorkingHours(settings.working_hours);
        } else {
            setWorkingHours({ ...DEFAULT_HOURS });
        }
        if (settings.notifications) {
            setNotifications({ ...DEFAULT_NOTIFICATIONS, ...settings.notifications });
        }
        if (settings.operations) {
            setOperations({ ...DEFAULT_OPERATIONS, ...settings.operations });
        }
    }, [globalLoading, settings]);

    // ── Save all sections to Supabase ─────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const results = await Promise.all([
                upsertSetting('business_profile', businessProfile),
                upsertSetting('working_hours',    workingHours),
                upsertSetting('notifications',    notifications),
                upsertSetting('operations',       operations),
            ]);

            const firstError = results.find(r => r.error);
            if (firstError?.error) throw new Error(firstError.error.message);

            await refreshData();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const patchProfile    = (k: string, v: string)  => setBusinessProfile(p => ({ ...p, [k]: v }));
    const patchHour       = (day: string, k: string, v: string) =>
        setWorkingHours(p => ({ ...p, [day]: { ...DEFAULT_HOURS[day], ...p[day], [k]: v } }));
    const patchNotif      = (k: string) => setNotifications(p => ({ ...p, [k]: !p[k as keyof typeof p] }));
    const patchOps        = (k: string, v: any) => setOperations(p => ({ ...p, [k]: v }));

    const isLoading = globalLoading || !loaded;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Settings</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Global configuration synced across the entire system.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Saved to database
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || isLoading}
                        className="h-10 px-6 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>
                            {saved ? 'check' : saving ? 'sync' : 'cloud_upload'}
                        </span>
                        {saved ? 'Synced!' : saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            )}

            {/* ── 1. Business Profile ─────────────────────────────────────── */}
            <SectionCard icon="store" title="Business Profile" subtitle="Dealership identity shown on invoices, reports, and the customer portal">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => <SkeletonLine key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Business Name *</FieldLabel>
                            <TextInput
                                value={businessProfile.name}
                                onChange={e => patchProfile('name', e.target.value)}
                                placeholder="e.g. Shree Swami Samarth Motors"
                            />
                        </div>
                        <div>
                            <FieldLabel>City</FieldLabel>
                            <TextInput
                                value={businessProfile.city}
                                onChange={e => patchProfile('city', e.target.value)}
                                placeholder="e.g. Kolhapur"
                            />
                        </div>
                        <div>
                            <FieldLabel>Contact Phone</FieldLabel>
                            <TextInput
                                value={businessProfile.phone}
                                onChange={e => patchProfile('phone', e.target.value)}
                                placeholder="e.g. +91 98232 37975"
                                type="tel"
                            />
                        </div>
                        <div>
                            <FieldLabel>Contact Email</FieldLabel>
                            <TextInput
                                value={businessProfile.email}
                                onChange={e => patchProfile('email', e.target.value)}
                                placeholder="e.g. contact@sssmotors.com"
                                type="email"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FieldLabel>Full Address</FieldLabel>
                            <TextInput
                                value={businessProfile.address}
                                onChange={e => patchProfile('address', e.target.value)}
                                placeholder="e.g. Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur - 416006"
                            />
                        </div>
                        <div>
                            <FieldLabel>GST Number</FieldLabel>
                            <TextInput
                                value={businessProfile.gst_number}
                                onChange={e => patchProfile('gst_number', e.target.value.toUpperCase())}
                                placeholder="e.g. 27AABCU9603R1ZX"
                                maxLength={15}
                            />
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 2. Working Hours ────────────────────────────────────────── */}
            <SectionCard icon="schedule" title="Operating Hours" subtitle="Shown on the customer portal and used for booking availability checks">
                {isLoading ? (
                    <div className="space-y-3">{[...Array(7)].map((_, i) => <SkeletonLine key={i} />)}</div>
                ) : (
                    <div className="space-y-3 overflow-x-auto pb-1">
                        {WEEKDAYS.map(day => {
                            const d = workingHours[day] || { ...DEFAULT_HOURS[day] };
                            const isClosed  = d.status === 'Closed';
                            return (
                                <div key={day} className="flex items-center gap-3 min-w-[520px]">
                                    <span className="text-sm font-semibold text-slate-700 w-24 shrink-0">{day}</span>

                                    <select
                                        value={d.status}
                                        onChange={e => patchHour(day, 'status', e.target.value)}
                                        className={`h-9 shrink-0 border border-transparent rounded-lg px-2 text-xs font-bold outline-none cursor-pointer w-28 ${
                                            d.status === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                                            d.status === 'Closed'   ? 'bg-red-100 text-red-700' :
                                                                       'bg-green-100 text-green-700'
                                        }`}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="Closed">Closed</option>
                                    </select>

                                    {!isClosed ? (
                                        <>
                                            <input
                                                type="time"
                                                value={d.start}
                                                onChange={e => patchHour(day, 'start', e.target.value)}
                                                className="h-9 w-[110px] shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm text-primary outline-none focus:border-primary/40 transition-colors"
                                            />
                                            <span className="text-xs text-slate-400 shrink-0">to</span>
                                            <input
                                                type="time"
                                                value={d.end}
                                                onChange={e => patchHour(day, 'end', e.target.value)}
                                                className="h-9 w-[110px] shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm text-primary outline-none focus:border-primary/40 transition-colors"
                                            />
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic ml-2">Dealership closed</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            {/* ── 3. Notification Preferences ─────────────────────────────── */}
            <SectionCard icon="notifications" title="Notification Preferences" subtitle="Control which system-wide alert types are active for admin staff">
                {isLoading ? (
                    <div className="space-y-4">{[...Array(5)].map((_, i) => <SkeletonLine key={i} />)}</div>
                ) : (
                    <div className="space-y-4">
                        {([
                            { key: 'newLead',     label: 'New Lead Alerts',       desc: 'Notify when a new customer enquiry arrives' },
                            { key: 'booking',     label: 'Booking Notifications', desc: 'Alerts for new test drives and service bookings' },
                            { key: 'followUp',    label: 'Follow-Up Reminders',   desc: 'Reminders for scheduled follow-ups and tasks' },
                            { key: 'stockAlert',  label: 'Low Stock Alerts',      desc: 'Notify when inventory drops below threshold' },
                            { key: 'dailyReport', label: 'Daily Briefing',        desc: 'Morning summary of tasks and follow-ups for the day' },
                        ] as { key: keyof typeof notifications; label: string; desc: string }[]).map(n => (
                            <div key={n.key} className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{n.label}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                                </div>
                                <Toggle
                                    checked={notifications[n.key]}
                                    onChange={() => patchNotif(n.key)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* ── 4. Operational Rules ────────────────────────────────────── */}
            <SectionCard icon="tune" title="Operational Rules" subtitle="Business logic that affects workflows across CRM, inventory, and bookings">
                {isLoading ? (
                    <div className="space-y-4">{[...Array(4)].map((_, i) => <SkeletonLine key={i} />)}</div>
                ) : (
                    <div className="space-y-5">
                        {/* Stock low threshold */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-primary">Low Stock Threshold</p>
                                <p className="text-xs text-slate-400 mt-0.5">Trigger stock alert when a model has ≤ N units available</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => patchOps('stockLowThreshold', Math.max(1, operations.stockLowThreshold - 1))}
                                    className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors"
                                >−</button>
                                <span className="w-10 text-center font-black text-primary text-lg font-display">
                                    {operations.stockLowThreshold}
                                </span>
                                <button
                                    onClick={() => patchOps('stockLowThreshold', Math.min(20, operations.stockLowThreshold + 1))}
                                    className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors"
                                >+</button>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {([
                            { key: 'requireInspection', label: 'Require Inspection Before Listing',  desc: 'Block inventory listings until an inspection is filed for that vehicle' },
                            { key: 'leadAutoAssign',    label: 'Auto-Assign Leads to Staff',         desc: 'Automatically assign new leads in round-robin to available staff members' },
                            { key: 'allowSelfAssign',   label: 'Allow Staff to Self-Assign Leads',   desc: 'Staff members can claim unassigned leads from the CRM queue' },
                        ] as { key: keyof typeof operations; label: string; desc: string }[]).map((r, i, arr) => (
                            <React.Fragment key={r.key}>
                                <div className="flex items-center justify-between py-1">
                                    <div>
                                        <p className="text-sm font-semibold text-primary">{r.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                                    </div>
                                    <Toggle
                                        checked={!!operations[r.key]}
                                        onChange={() => patchOps(r.key, !operations[r.key])}
                                    />
                                </div>
                                {i < arr.length - 1 && <hr className="border-slate-100" />}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* ── 5. System Info ──────────────────────────────────────────── */}
            <SectionCard icon="info" title="System Information" subtitle="Read-only metadata about this deployment">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: 'Application',   value: 'Swami Motors Admin Panel' },
                        { label: 'Version',        value: 'v2.4.0' },
                        { label: 'Database',       value: 'Supabase (PostgreSQL)' },
                        { label: 'Last Sync',      value: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
                    ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-primary">{item.value}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* ── Sticky Save Bar ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 pb-4">
                {error ? (
                    <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                    </p>
                ) : saved ? (
                    <p className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        All settings saved to database successfully.
                    </p>
                ) : (
                    <p className="text-xs text-slate-400">Changes are written directly to Supabase and apply globally.</p>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving || isLoading}
                    className="h-10 px-8 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm ml-4 shrink-0"
                >
                    <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>
                        {saved ? 'check' : saving ? 'sync' : 'cloud_upload'}
                    </span>
                    {saved ? 'Synced!' : saving ? 'Saving…' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
