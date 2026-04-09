import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ─── Price Formatting ─────────────────────────────────────────────────────────

/** Returns price in Lakh string: "10.50" */
export const formatPriceLakh = (price: number): string => {
    return (price / 100000).toFixed(2);
};

/** Returns formatted currency: ₹10.50 L, ₹1.25 Cr */
export const formatCurrency = (val: number): string => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
};

// ─── Image Resolution ─────────────────────────────────────────────────────────

/** Resolves a car image to a full URL (supports Supabase storage paths and full URLs) */
export const getPrimaryImage = (images: string[] | null | undefined): string => {
    if (!images || images.length === 0) {
        return 'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Photo';
    }
    const img = images[0];
    return resolveImage(img);
};

export const resolveImage = (img: string | null | undefined): string => {
    if (!img) return 'https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Photo';
    if (img.startsWith('http')) return img;
    const base = import.meta.env.VITE_SUPABASE_URL as string;
    return `${base}/storage/v1/object/public/car-images/${img}`;
};

// ─── Date Formatting ──────────────────────────────────────────────────────────

export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
};

export const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

// ─── Lead Status ──────────────────────────────────────────────────────────────

/** Canonical status values used across admin pages */
export const LEAD_STATUSES = ['new', 'contacted', 'negotiation', 'closed_won', 'closed_lost'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

export const LEAD_STATUS_LABELS: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    negotiation: 'Negotiating',
    closed_won: 'Closed (Won)',
    closed_lost: 'Closed (Lost)',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    negotiation: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-slate-200 text-slate-500',
};
