import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type AnalyticsEventType = 
    | 'page_view' 
    | 'search' 
    | 'form_start' 
    | 'form_abandon' 
    | 'whatsapp_click' 
    | 'form_submit'
    | 'share_click';

export interface AnalyticsParams {
    vehicleId?: string;
    searchQuery?: string;
}

/**
 * trackEvent - Direct non-blocking helper to fire an event to MySQL website_events
 */
export const trackEvent = async (
    eventType: AnalyticsEventType,
    params?: AnalyticsParams
) => {
    try {
        const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        supabase.from('website_events').insert({
            event_type: eventType,
            device_type: isMobile ? 'mobile' : 'desktop',
            vehicle_id: params?.vehicleId || null,
            search_query: params?.searchQuery || null
        }).then();
    } catch (err) {
        // Non-blocking telemetry
    }
};

/**
 * useAnalytics - High-performance non-blocking hook to track website telemetry on component mount.
 */
export const useAnalytics = (
    eventType: AnalyticsEventType,
    params?: AnalyticsParams
) => {
    useEffect(() => {
        trackEvent(eventType, params);
    }, [eventType, params?.vehicleId, params?.searchQuery]);
};
