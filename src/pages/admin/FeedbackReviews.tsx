import React from 'react';

const FeedbackReviews = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Customer Feedback</h1>
                    <p className="text-slate-500 text-sm">Monitor public sentiment from connected platforms.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] p-12 flex flex-col items-center justify-center text-center h-[50vh]">
                <div className="size-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl">travel_explore</span>
                </div>
                <h2 className="text-2xl font-black text-primary font-display mb-2">Web Integrations Pending</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    This module is currently awaiting integration with your public-facing Google Reviews and Website Portals.
                    Once connected via API in Phase 2, authentic customer feedback will stream here automatically.
                </p>
                <button className="mt-8 h-10 px-6 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm" disabled>
                    Awaiting API Integration
                </button>
            </div>
        </div>
    );
};

export default FeedbackReviews;
