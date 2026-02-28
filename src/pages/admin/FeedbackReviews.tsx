import React, { useState } from 'react';

const REVIEWS = [
    { id: '1', name: 'Pradeep Mane', avatar: 'PM', rating: 5, text: 'Nice behaviour with customer', date: '25 Oct 2024', source: 'Google', responded: true, featured: true },
    { id: '2', name: 'Hezekial Bhosale', avatar: 'HB', rating: 5, text: "Very Good service as well as car is good I'm very happy thank you 😊", date: '22 Oct 2024', source: 'Google', responded: true, featured: true },
    { id: '3', name: 'Isha Kadam', avatar: 'IK', rating: 5, text: 'Right place for dream car', date: '18 Oct 2024', source: 'Google', responded: true, featured: true },
];

const FeedbackReviews = () => {
    const [filter, setFilter] = useState('All');
    const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
    const filtered = filter === 'All' ? REVIEWS : filter === 'Responded' ? REVIEWS.filter(r => r.responded) : REVIEWS.filter(r => !r.responded);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Feedback & Reviews</h1>
                    <p className="text-slate-500 text-sm">Manage customer reviews and ratings.</p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-amber-400 text-xl">star</span>
                        <span className="text-3xl font-black text-primary font-display">{avgRating}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Average Rating</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <p className="text-2xl font-black text-primary font-display">{REVIEWS.length}</p>
                    <p className="text-xs text-slate-400 font-medium">Total Reviews</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <p className="text-2xl font-black text-green-600 font-display">{REVIEWS.filter(r => r.responded).length}</p>
                    <p className="text-xs text-slate-400 font-medium">Responded</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <p className="text-2xl font-black text-amber-600 font-display">{REVIEWS.filter(r => !r.responded).length}</p>
                    <p className="text-xs text-slate-400 font-medium">Pending Reply</p>
                </div>
            </div>

            {/* Rating Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-bold text-primary font-display text-sm mb-4">Rating Breakdown</h2>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = REVIEWS.filter(r => r.rating === star).length;
                        const pct = (count / REVIEWS.length) * 100;
                        return (
                            <div key={star} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600 w-6">{star}★</span>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-slate-400 w-6">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter + Reviews */}
            <div className="flex gap-1 border-b border-slate-200">
                {['All', 'Responded', 'Pending'].map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${filter === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent'}`}>{t}</button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-sm">{r.avatar}</div>
                                <div>
                                    <p className="text-sm font-bold text-primary">{r.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-amber-400' : 'text-slate-200'}`}>star</span>)}</div>
                                        <span className="text-[10px] text-slate-400">{r.date}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{r.source}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {r.featured && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">Featured</span>}
                                {r.responded ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Replied</span> : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{r.text}</p>
                        <div className="flex gap-2 mt-4">
                            {!r.responded && <button className="h-8 px-4 bg-primary text-white text-[10px] font-bold rounded-lg">Reply</button>}
                            <button className={`h-8 px-4 text-[10px] font-bold rounded-lg border ${r.featured ? 'bg-accent/10 text-accent border-accent/20' : 'bg-white text-slate-500 border-slate-200'}`}>
                                {r.featured ? '★ Featured' : 'Feature'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackReviews;
