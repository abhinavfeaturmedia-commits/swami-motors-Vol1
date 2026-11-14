/**
 * In-Memory Inventory Cache
 * Caches public inventory in browser memory for 5 minutes (TTL)
 * Eliminates redundant network fetches when navigating between /inventory and /car/:id
 */

export interface CachedInventoryItem {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    fuel_type: string;
    transmission: string;
    mileage: number;
    images: string[];
    thumbnail?: string | null;
    status: string;
    created_at: string;
    updated_at?: string | null;
    condition: string;
    body_type?: string;
    source?: string;
    dealer?: { dealer_code: string };
}

let cachedInventory: CachedInventoryItem[] | null = null;
let cacheTime = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedInventory = (): CachedInventoryItem[] | null => {
    if (cachedInventory && (Date.now() - cacheTime) < TTL_MS) {
        return cachedInventory;
    }
    return null;
};

export const setCachedInventory = (data: CachedInventoryItem[]): void => {
    cachedInventory = data;
    cacheTime = Date.now();
};

export const clearCachedInventory = (): void => {
    cachedInventory = null;
    cacheTime = 0;
};

