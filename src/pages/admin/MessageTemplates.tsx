import React, { useState } from 'react';

const TEMPLATES = [
    { id: '1', name: 'Follow-Up Reminder', category: 'Follow-Up', channel: 'WhatsApp', body: 'Hi {name}, this is from SSSM Motors. We noticed you were interested in the {car}. Would you like to schedule a visit to our showroom? We have some exciting offers this month! Reply YES to know more.' },
    { id: '2', name: 'Test Drive Confirmation', category: 'Booking', channel: 'SMS', body: 'Dear {name}, your test drive for {car} is confirmed for {date} at {time}. Location: SSSM Motors, Station Road, Kolhapur. Please carry a valid driving license. See you soon!' },
    { id: '3', name: 'Festival Offer', category: 'Offer', channel: 'WhatsApp', body: 'Dear {name},\n🎉 Festival Special at SSSM Motors!\nGet up to ₹50,000 off on certified pre-owned cars.\n✅ 0% processing fee\n✅ Free insurance for 1 year\nVisit us today or call +91 98765 43210.\nOffer valid till {date}.' },
    { id: '4', name: 'Delivery Congratulations', category: 'Delivery', channel: 'WhatsApp', body: 'Congratulations {name}! 🎊\nYour {car} is ready for delivery at SSSM Motors. Please visit with the following documents:\n- Aadhar Card\n- PAN Card\n- Insurance Copy\n\nWe look forward to handing over the keys! 🔑' },
    { id: '5', name: 'Service Reminder', category: 'Service', channel: 'SMS', body: 'Hi {name}, your {car} is due for service. Book your appointment at SSSM Motors, Kolhapur. Call +91 98765 43210 or reply BOOK.' },
    { id: '6', name: 'Price Drop Alert', category: 'Offer', channel: 'WhatsApp', body: 'Hi {name}! Great news — the {car} you were looking at just got a price drop! 📉\nNew Price: ₹{price}\nThis won\'t last long. Call us or visit our showroom today!' },
];

const CATEGORIES = ['All', 'Follow-Up', 'Booking', 'Offer', 'Delivery', 'Service'];
const channelColors: Record<string, string> = { WhatsApp: 'bg-green-100 text-green-700', SMS: 'bg-blue-100 text-blue-700' };

const MessageTemplates = () => {
    const [category, setCategory] = useState('All');
    const [selected, setSelected] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const filtered = category === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);
    const activeTemplate = TEMPLATES.find(t => t.id === selected);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Message Templates</h1>
                    <p className="text-slate-500 text-sm">Pre-built WhatsApp & SMS templates for quick communication.</p>
                </div>
                <button className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> New Template
                </button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${category === c ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary'}`}>{c}</button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                    {filtered.map(t => (
                        <div key={t.id} onClick={() => setSelected(t.id)} className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-sm ${selected === t.id ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-primary font-display">{t.name}</h3>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${channelColors[t.channel]}`}>{t.channel}</span>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">{t.category}</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{t.body}</p>
                        </div>
                    ))}
                </div>

                {/* Preview Panel */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] sticky top-24">
                    {activeTemplate ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-primary font-display">{activeTemplate.name}</h3>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${channelColors[activeTemplate.channel]}`}>{activeTemplate.channel}</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{activeTemplate.body}</pre>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4">
                                <span className="material-symbols-outlined text-xs">info</span>
                                <span>Variables like <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> are replaced automatically</span>
                            </div>
                            <button onClick={() => copyToClipboard(activeTemplate.body)} className="w-full h-10 bg-accent text-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
                                <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                                {copied ? 'Copied!' : 'Copy Template'}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">article</span>
                            <p className="text-sm text-slate-400">Select a template to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageTemplates;
