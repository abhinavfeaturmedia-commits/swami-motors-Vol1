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

export const FALLBACK_CAR_IMAGE = 'https://placehold.co/800x500/e2e8f0/94a3b8?text=Vehicle+Photo';

/** Resolves a car image to a full URL (supports Supabase storage paths, uploads, and full URLs) */
export const getPrimaryImage = (images: string[] | string | null | undefined): string => {
    if (!images) return FALLBACK_CAR_IMAGE;
    if (Array.isArray(images)) {
        if (images.length === 0) return FALLBACK_CAR_IMAGE;
        return resolveImage(images[0]);
    }
    return resolveImage(images);
};

export const resolveImage = (img: string | string[] | null | undefined): string => {
    if (!img) return FALLBACK_CAR_IMAGE;
    if (Array.isArray(img)) {
        if (img.length === 0) return FALLBACK_CAR_IMAGE;
        img = img[0];
    }
    if (typeof img !== 'string' || !img.trim()) return FALLBACK_CAR_IMAGE;
    const cleanImg = img.trim();

    if (cleanImg.startsWith('http://') || cleanImg.startsWith('https://') || cleanImg.startsWith('data:')) {
        return cleanImg;
    }
    
    // Check if it is a local upload path on Hostinger Express / LiteSpeed server
    if (cleanImg.startsWith('/uploads/')) {
        const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : ''));
        return `${apiBase}${cleanImg}`;
    }
    if (cleanImg.startsWith('uploads/')) {
        const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : ''));
        return `${apiBase}/${cleanImg}`;
    }

    const base = import.meta.env.VITE_SUPABASE_URL as string;
    if (base && !base.includes('missing-url')) {
        const cleanPath = cleanImg.replace(/^\/+/, '');
        return `${base}/storage/v1/object/public/car-images/${cleanPath}`;
    }
    return cleanImg;
};

/**
 * Graceful image error handler that sets a reliable fallback placeholder without infinite loops
 */
export const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    fallback: string = FALLBACK_CAR_IMAGE
) => {
    const target = e.currentTarget;
    if (target.src !== fallback) {
        target.onerror = null;
        target.src = fallback;
    }
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

// ─── WhatsApp URL ─────────────────────────────────────────────────────────────

/**
 * Builds a wa.me URL for an Indian phone number.
 * Always strips non-digits and prepends +91 if not already present.
 * @param phone  Raw phone string (any format)
 * @param message Optional pre-filled message (URL-encoded automatically)
 */
export const toWhatsAppUrl = (phone: string, message?: string): string => {
    const digits = (phone || '').replace(/\D/g, '');
    const with91 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
    const base = `https://wa.me/${with91}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
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

// ─── YouTube / Shorts Utilities ──────────────────────────────────────────────────

/** Extracts the 11-character video ID from YouTube/Shorts URLs */
export const getYouTubeVideoId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

/** Returns the standard embed URL for standard videos or Shorts */
export const getYouTubeEmbedUrl = (url: string | null | undefined): string | null => {
    const id = getYouTubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

/** Returns the URL of the YouTube thumbnail image */
export const getYouTubeThumbnail = (url: string | null | undefined): string => {
    const id = getYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'https://placehold.co/800x450/e2e8f0/94a3b8?text=No+Video';
};

/** Automatically detects if a URL is a Shorts URL */
export const detectVideoType = (url: string | null | undefined): 'video' | 'short' => {
    if (!url) return 'video';
    return url.toLowerCase().includes('/shorts/') ? 'short' : 'video';
};
