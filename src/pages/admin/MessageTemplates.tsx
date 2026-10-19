import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Template {
    id: string;
    title: string;
    category: 'lead' | 'test_drive' | 'service' | 'finance' | 'delivery';
    channel: 'whatsapp' | 'sms' | 'both';
    text: string;
}

const DEFAULT_TEMPLATES: Template[] = [
    {
        id: 'lead-welcome',
        title: 'New Vehicle Inquiry Welcome',
        category: 'lead',
        channel: 'whatsapp',
        text: 'Namaste {customer_name}! 🙏\nThank you for your interest in the {car_name} at Shree Swami Samarth Motors, Kolhapur.\n\nOur vehicle has undergone a comprehensive 120-point inspection and comes with guaranteed clear documentation.\n\nWould you like us to share the inspection report, photos, or arrange a test drive this week?\n\n📍 Showroom: Old Pune-Bangalore Rd, Kolhapur\n📞 Call/WhatsApp: +91 98220 00000'
    },
    {
        id: 'lead-followup',
        title: 'Missed Call Follow-Up',
        category: 'lead',
        channel: 'whatsapp',
        text: 'Hello {customer_name},\nWe attempted to reach you regarding your inquiry about the {car_name}.\n\nPlease let us know what time works best for a brief 2-minute call, or feel free to message us your questions right here!\n\nRegards,\nSales Team — Shree Swami Samarth Motors'
    },
    {
        id: 'td-confirmation',
        title: 'Test Drive Appointment Confirmation',
        category: 'test_drive',
        channel: 'whatsapp',
        text: 'Namaste {customer_name}! 🚗\nYour test drive appointment is confirmed:\n\n• Vehicle: {car_name}\n• Date: {booking_date}\n• Time: {booking_time}\n• Location: Shree Swami Samarth Motors Showroom, Kolhapur\n\nShowroom Location Pin: https://maps.google.com/?q=Swami+Motors+Kolhapur\n\nPlease carry your valid driving license. We look forward to hosting you!'
    },
    {
        id: 'td-reminder',
        title: 'Test Drive Morning Reminder',
        category: 'test_drive',
        channel: 'whatsapp',
        text: 'Good morning {customer_name}! ☀️\nThis is a quick reminder about your scheduled test drive for the {car_name} today at {booking_time}.\n\nThe car has been cleaned, sanitized, and fueled ready for your drive. See you soon!'
    },
    {
        id: 'service-booking',
        title: 'Service Appointment Confirmed',
        category: 'service',
        channel: 'whatsapp',
        text: 'Namaste {customer_name},\nYour car service appointment is scheduled for {booking_date} at {booking_time} at Swami Motors Service Center.\n\nOur certified technicians will conduct complete multipoint diagnostics, oil inspection, and full wash.\n\nContact Service Desk: +91 98221 11111'
    },
    {
        id: 'service-ready',
        title: 'Service Completed & Pickup Ready',
        category: 'service',
        channel: 'whatsapp',
        text: 'Namaste {customer_name}! 🎉\nYour vehicle service is completed and ready for pickup!\n\n• Vehicle: {car_name}\n• Final Bill Amount: ₹{amount}\n• Status: Quality Check Passed & Washed\n\nYou can collect the vehicle today before 7:30 PM. Thank you for choosing Swami Motors!'
    },
    {
        id: 'finance-docs',
        title: 'Car Loan Document Checklist',
        category: 'finance',
        channel: 'whatsapp',
        text: 'Namaste {customer_name},\nTo process your car loan application for the {car_name} with our banking partners (SBI / HDFC / ICICI) at attractive rates, please keep the following documents ready:\n\n1. PAN Card & Aadhaar Card\n2. Last 6 Months Bank Statement\n3. Last 3 Months Salary Slips (or 2-yr ITR for business)\n4. Electricity Bill / Address Proof\n\nYou can reply with clear photos or PDFs directly on this chat!'
    },
    {
        id: 'delivery-congrats',
        title: 'Vehicle Delivery Congratulations',
        category: 'delivery',
        channel: 'whatsapp',
        text: 'Hearty Congratulations {customer_name}! 🎊✨\nCongratulations on the delivery of your {car_name}!\n\nThank you for placing your trust in Shree Swami Samarth Motors. We wish you and your family safe, joyful, and memorable journeys.\n\nFor any future service or queries, we are always just a call away!'
    }
];

const MessageTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTemplate, setActiveTemplate] = useState<Template>(DEFAULT_TEMPLATES[0]);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Omit<Template, 'id'>>({
        title: '',
        category: 'lead',
        channel: 'whatsapp',
        text: ''
    });

    // Fetch saved templates from MySQL dealership_settings
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data } = await supabase
                    .from('dealership_settings')
                    .select('setting_value')
                    .eq('setting_key', 'message_templates')
                    .maybeSingle();

                if (data?.setting_value) {
                    const parsed = typeof data.setting_value === 'string'
                        ? JSON.parse(data.setting_value)
                        : data.setting_value;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setTemplates(parsed);
                        setActiveTemplate(parsed[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load templates from DB, using defaults:', err);
            }
        };

        fetchTemplates();
    }, []);

    // Save templates list to MySQL
    const handleSaveTemplates = async (templatesToSave: Template[]) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('dealership_settings')
                .upsert({
                    setting_key: 'message_templates',
                    setting_value: JSON.stringify(templatesToSave),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'setting_key' });

            if (error) throw error;
            setTemplates(templatesToSave);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            alert('Failed to save templates to database: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEditedTemplate = () => {
        if (!editingTemplate) return;
        const updated = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
        setActiveTemplate(editingTemplate);
        setEditingTemplate(null);
        handleSaveTemplates(updated);
    };

    const handleAddNewTemplate = () => {
        if (!newTemplate.title.trim() || !newTemplate.text.trim()) {
            alert('Title and Message Text are required.');
            return;
        }
        const created: Template = {
            ...newTemplate,
            id: 'tmpl-' + Date.now()
        };
        const updated = [created, ...templates];
        setActiveTemplate(created);
        setIsAddOpen(false);
        setNewTemplate({ title: '', category: 'lead', channel: 'whatsapp', text: '' });
        handleSaveTemplates(updated);
    };

    // Live Variable Replacements
    const [variables, setVariables] = useState({
        customer_name: 'Ramesh Patil',
        customer_phone: '9822334455',
        car_name: '2022 Maruti Swift ZXI',
        booking_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        booking_time: '11:00 AM',
        amount: '4,500'
    });

    const [copied, setCopied] = useState(false);

    const updateVar = (key: string, val: string) => {
        setVariables(prev => ({ ...prev, [key]: val }));
    };

    // Rendered message with variables replaced
    const renderMessage = (text: string) => {
        return text
            .replace(/{customer_name}/g, variables.customer_name || 'Customer')
            .replace(/{car_name}/g, variables.car_name || 'Vehicle')
            .replace(/{booking_date}/g, variables.booking_date || 'Date')
            .replace(/{booking_time}/g, variables.booking_time || 'Time')
            .replace(/{amount}/g, variables.amount || '0');
    };

    const currentRenderedText = renderMessage(activeTemplate.text);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentRenderedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendWhatsApp = () => {
        const phone = (variables.customer_phone || '').replace(/\D/g, '');
        const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
        const encoded = encodeURIComponent(currentRenderedText);
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    };

    const filteredTemplates = templates.filter(t => {
        const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.text.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Communication Templates</h1>
                    <p className="text-slate-500 text-sm">Pre-approved WhatsApp and SMS message formats with dynamic customer and vehicle data.</p>
                </div>
                <div className="flex items-center gap-2">
                    {saveSuccess && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl flex items-center gap-1 animate-fade-in">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Saved to MySQL!
                        </span>
                    )}
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="h-10 px-4 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition-all shadow-sm cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        New Template
                    </button>
                    <button
                        onClick={() => handleSaveTemplates(templates)}
                        disabled={saving}
                        className="h-10 px-4 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-base">{saving ? 'sync' : 'save'}</span>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
                {/* Left: Template Catalog (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Search & Category Pills */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)] space-y-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search templates..."
                                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'lead', label: 'Inquiries' },
                                { id: 'test_drive', label: 'Test Drives' },
                                { id: 'service', label: 'Service' },
                                { id: 'finance', label: 'Finance' },
                                { id: 'delivery', label: 'Delivery' },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        selectedCategory === cat.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template List */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {filteredTemplates.map(tmpl => {
                            const isSelected = activeTemplate.id === tmpl.id;
                            return (
                                <div
                                    key={tmpl.id}
                                    onClick={() => setActiveTemplate(tmpl)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-white border-primary shadow-md ring-2 ring-primary/10'
                                            : 'bg-white border-slate-100 hover:border-slate-300 shadow-[var(--shadow-card)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-primary text-xs font-display">{tmpl.title}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                            tmpl.category === 'lead' ? 'bg-blue-50 text-blue-600' :
                                            tmpl.category === 'test_drive' ? 'bg-amber-50 text-amber-600' :
                                            tmpl.category === 'service' ? 'bg-purple-50 text-purple-600' :
                                            tmpl.category === 'finance' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {tmpl.category}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                        {tmpl.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Preview & Dynamic Customizer (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Variable Customizer */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] space-y-4">
                        <h3 className="font-bold text-primary font-display text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-accent">edit_note</span>
                            Dynamic Fill Parameters
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={variables.customer_name}
                                    onChange={e => updateVar('customer_name', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Phone</label>
                                <input
                                    type="text"
                                    value={variables.customer_phone}
                                    onChange={e => updateVar('customer_phone', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Details</label>
                                <input
                                    type="text"
                                    value={variables.car_name}
                                    onChange={e => updateVar('car_name', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                                <input
                                    type="text"
                                    value={variables.booking_date}
                                    onChange={e => updateVar('booking_date', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time</label>
                                <input
                                    type="text"
                                    value={variables.booking_time}
                                    onChange={e => updateVar('booking_time', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                                <input
                                    type="text"
                                    value={variables.amount}
                                    onChange={e => updateVar('amount', e.target.value)}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp-Style Message Preview */}
                    <div className="bg-[#efeae2] rounded-3xl p-6 border border-stone-300 shadow-lg relative overflow-hidden">
                        {/* WhatsApp Header Mockup */}
                        <div className="bg-[#075e54] text-white px-4 py-3 rounded-2xl mb-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                                    SM
                                </div>
                                <div>
                                    <p className="font-bold text-xs">Swami Motors Kolhapur</p>
                                    <p className="text-[10px] text-emerald-200">To: {variables.customer_name} (+91 {variables.customer_phone})</p>
                                </div>
                            </div>
                            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono">Live Preview</span>
                        </div>

                        {/* Speech Bubble */}
                        <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-lg mb-4 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {currentRenderedText}
                            <div className="text-right mt-2 text-[10px] text-slate-400 font-mono">
                                Just now ✓✓
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleSendWhatsApp}
                                className="h-11 px-5 bg-[#25D366] text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-[#20ba5a] transition-all shadow-md cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">chat</span>
                                Send via WhatsApp Web / App
                            </button>
                            <button
                                onClick={() => setEditingTemplate({ ...activeTemplate })}
                                className="h-11 px-4 border border-slate-300 bg-white text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                                Edit This Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Template Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary font-display">Edit Template</h3>
                            <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Title</label>
                            <input
                                type="text"
                                value={editingTemplate.title}
                                onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            <select
                                value={editingTemplate.category}
                                onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary"
                            >
                                <option value="lead">Inquiries (Lead)</option>
                                <option value="test_drive">Test Drive</option>
                                <option value="service">Service</option>
                                <option value="finance">Finance</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Text</label>
                            <textarea
                                rows={6}
                                value={editingTemplate.text}
                                onChange={e => setEditingTemplate({ ...editingTemplate, text: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Variables: {'{customer_name}'}, {'{car_name}'}, {'{booking_date}'}, {'{booking_time}'}, {'{amount}'}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setEditingTemplate(null)}
                                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEditedTemplate}
                                className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light"
                            >
                                Save Template to Database
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Template Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary font-display">Create New Template</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Title</label>
                            <input
                                type="text"
                                placeholder="e.g., Festival Offer Broadcast"
                                value={newTemplate.title}
                                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            <select
                                value={newTemplate.category}
                                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary"
                            >
                                <option value="lead">Inquiries (Lead)</option>
                                <option value="test_drive">Test Drive</option>
                                <option value="service">Service</option>
                                <option value="finance">Finance</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Text</label>
                            <textarea
                                rows={6}
                                placeholder="Write message with placeholders like {customer_name}..."
                                value={newTemplate.text}
                                onChange={e => setNewTemplate({ ...newTemplate, text: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Variables: {'{customer_name}'}, {'{car_name}'}, {'{booking_date}'}, {'{booking_time}'}, {'{amount}'}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddNewTemplate}
                                className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light"
                            >
                                Add & Save to Database
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageTemplates;
