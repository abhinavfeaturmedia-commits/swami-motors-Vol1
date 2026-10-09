/**
 * Hostinger Node.js & MySQL API Client
 * Drop-in replacement / proxy for @supabase/supabase-js
 * Connects directly to the self-hosted Express backend on Hostinger (autokundali.com)
 */

// In development, use relative path ('') so Vite proxy routes requests seamlessly without CORS restrictions on LAN/local IPs
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

class QueryBuilder {
    private table: string;
    private selectedColumns: string = '*';
    private filters: Array<{ column: string; operator: string; value: any; subOp?: string }> = [];
    private orderConfig: { column: string; ascending: boolean } | null = null;
    private limitCount: number | null = null;
    private offsetCount: number | null = null;
    private isSingle: boolean = false;
    private isMaybeSingle: boolean = false;
    private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    private mutateValues: any = null;
    private matchValues: Record<string, any> = {};
    private onConflictField?: string;

    constructor(table: string) {
        this.table = table;
    }

    select(columns: string = '*') {
        if (this.action !== 'insert' && this.action !== 'update' && this.action !== 'delete' && this.action !== 'upsert') {
            this.action = 'select';
        }
        this.selectedColumns = columns;
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push({ column, operator: 'eq', value });
        this.matchValues[column] = value;
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push({ column, operator: 'neq', value });
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push({ column, operator: 'gt', value });
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push({ column, operator: 'gte', value });
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push({ column, operator: 'lt', value });
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push({ column, operator: 'lte', value });
        return this;
    }

    like(column: string, value: any) {
        this.filters.push({ column, operator: 'like', value });
        return this;
    }

    ilike(column: string, value: any) {
        this.filters.push({ column, operator: 'ilike', value });
        return this;
    }

    contains(column: string, value: any) {
        this.filters.push({ column, operator: 'like', value: `%${value}%` });
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push({ column, operator: 'in', value: values });
        return this;
    }

    is(column: string, value: any) {
        if (value === null || value === 'null') {
            this.filters.push({ column, operator: 'is_null', value: null });
        } else {
            this.filters.push({ column, operator: 'is', value });
        }
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'is' && (value === null || value === 'null')) {
            this.filters.push({ column, operator: 'not_null', value: null });
        } else if (operator === 'eq') {
            this.filters.push({ column, operator: 'neq', value });
        } else if (operator === 'in') {
            this.filters.push({ column, operator: 'not_in', value });
        } else if (operator === 'like' || operator === 'ilike') {
            this.filters.push({ column, operator: 'not_like', value });
        } else {
            this.filters.push({ column, operator: 'not', subOp: operator, value });
        }
        return this;
    }

    or(filters: string) {
        this.filters.push({ column: '__or__', operator: 'or', value: filters });
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.orderConfig = { column, ascending: options?.ascending !== false };
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    range(from: number, to: number) {
        this.offsetCount = from;
        this.limitCount = to - from + 1;
        return this;
    }

    single() {
        this.isSingle = true;
        this.limitCount = 1;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        this.limitCount = 1;
        return this;
    }

    insert(values: any) {
        this.action = 'insert';
        this.mutateValues = values;
        return this;
    }

    upsert(values: any, options?: { onConflict?: string }) {
        this.action = 'upsert';
        this.mutateValues = values;
        if (options?.onConflict) {
            this.onConflictField = options.onConflict;
        }
        return this;
    }

    update(values: any) {
        this.action = 'update';
        this.mutateValues = values;
        return this;
    }

    match(conditions: Record<string, any>) {
        for (const [k, v] of Object.entries(conditions)) {
            this.matchValues[k] = v;
            this.filters.push({ column: k, operator: 'eq', value: v });
        }
        return this;
    }

    filter(column: string, operator: string, value: any) {
        this.filters.push({ column, operator, value });
        return this;
    }

    overlaps(column: string, values: any[]) {
        this.filters.push({ column, operator: 'in', value: values });
        return this;
    }

    delete() {
        this.action = 'delete';
        return this;
    }

    async execute(): Promise<{ data: any; error: any; count?: number }> {
        const token = localStorage.getItem('swami_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            if (this.action === 'select') {
                const res = await fetch(`${API_BASE}/api/data/select`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        table: this.table,
                        columns: this.selectedColumns,
                        filters: this.filters,
                        order: this.orderConfig,
                        limit: this.limitCount,
                        offset: this.offsetCount,
                        single: this.isSingle || this.isMaybeSingle,
                    }),
                });
                const json = await res.json();
                return json;
            }

            if (this.action === 'insert') {
                const res = await fetch(`${API_BASE}/api/data/insert`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        table: this.table,
                        values: this.mutateValues,
                    }),
                });
                const json = await res.json();
                if (this.isSingle && Array.isArray(json.data)) {
                    json.data = json.data.length > 0 ? json.data[0] : null;
                }
                return json;
            }

            if (this.action === 'upsert') {
                const res = await fetch(`${API_BASE}/api/data/upsert`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        table: this.table,
                        values: this.mutateValues,
                        onConflict: this.onConflictField,
                    }),
                });
                const json = await res.json();
                if (this.isSingle && Array.isArray(json.data)) {
                    json.data = json.data.length > 0 ? json.data[0] : null;
                }
                return json;
            }

            if (this.action === 'update') {
                const res = await fetch(`${API_BASE}/api/data/update`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        table: this.table,
                        values: this.mutateValues,
                        match: this.matchValues,
                    }),
                });
                const json = await res.json();
                if (this.isSingle && Array.isArray(json.data)) {
                    json.data = json.data.length > 0 ? json.data[0] : null;
                }
                return json;
            }

            if (this.action === 'delete') {
                const res = await fetch(`${API_BASE}/api/data/delete`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        table: this.table,
                        match: this.matchValues,
                    }),
                });
                const json = await res.json();
                return json;
            }

            return { data: null, error: new Error('Unknown query action') };
        } catch (err: any) {
            return { data: null, error: err };
        }
    }

    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        return this.execute().then(onfulfilled, onrejected);
    }
}

const authListeners = new Set<(event: string, session: any) => void>();

export const hostingerAuth = {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                return { data: { user: null, session: null }, error: new Error(data.error || 'Login failed') };
            }
            localStorage.setItem('swami_token', data.access_token);
            localStorage.setItem('swami_user', JSON.stringify(data.user));
            localStorage.setItem('swami_session', JSON.stringify({
                access_token: data.access_token,
                user: data.user,
                expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 604800)
            }));
            authListeners.forEach(cb => cb('SIGNED_IN', data));
            return { data: { user: data.user, session: data }, error: null };
        } catch (err: any) {
            return { data: { user: null, session: null }, error: err };
        }
    },

    async getSession() {
        const rawSession = localStorage.getItem('swami_session');
        if (!rawSession) return { data: { session: null }, error: null };
        try {
            const session = JSON.parse(rawSession);
            return { data: { session }, error: null };
        } catch {
            return { data: { session: null }, error: null };
        }
    },

    async getUser() {
        const rawUser = localStorage.getItem('swami_user');
        if (!rawUser) return { data: { user: null }, error: null };
        try {
            return { data: { user: JSON.parse(rawUser) }, error: null };
        } catch {
            return { data: { user: null }, error: null };
        }
    },

    async signOut() {
        localStorage.removeItem('swami_token');
        localStorage.removeItem('swami_user');
        localStorage.removeItem('swami_session');
        authListeners.forEach(cb => cb('SIGNED_OUT', null));
        try {
            await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
        } catch (e) {
            // Ignore offline logout error
        }
        return { error: null };
    },

    async signUp({ email, password, options }: any) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: options?.data?.full_name || '',
                    phone: options?.data?.phone || ''
                })
            });
            const data = await res.json();
            if (!res.ok) {
                return { data: { user: null, session: null }, error: new Error(data.error || 'Registration failed') };
            }
            if (data.access_token && data.user) {
                localStorage.setItem('swami_token', data.access_token);
                localStorage.setItem('swami_user', JSON.stringify(data.user));
                localStorage.setItem('swami_profile', JSON.stringify(data.profile));
                authListeners.forEach(cb => cb('SIGNED_IN', { user: data.user, access_token: data.access_token }));
                return {
                    data: {
                        user: data.user,
                        session: { user: data.user, access_token: data.access_token }
                    },
                    error: null
                };
            }
            return { data: { user: null, session: null }, error: new Error('Registration failed') };
        } catch (e: any) {
            return { data: { user: null, session: null }, error: e };
        }
    },

    async resetPasswordForEmail(_email: string, _options?: any) {
        return { data: null, error: null };
    },

    async updateUser(attributes: any) {
        const rawUser = localStorage.getItem('swami_user');
        const user = rawUser ? JSON.parse(rawUser) : {};
        const updated = { ...user, ...attributes };
        localStorage.setItem('swami_user', JSON.stringify(updated));
        return { data: { user: updated }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.add(callback);
        this.getSession().then(({ data: { session } }) => {
            callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
        });
        return {
            data: {
                subscription: {
                    unsubscribe: () => authListeners.delete(callback)
                }
            }
        };
    }
};

class RealtimeChannel {
    private name: string;
    constructor(name: string) {
        this.name = name;
    }
    on(_event: string, _filter: any, _callback?: any) {
        return this;
    }
    subscribe(callback?: (status: string) => void) {
        if (callback) {
            setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return this;
    }
    unsubscribe() {
        return Promise.resolve();
    }
    send(_payload: any) {
        return Promise.resolve('ok');
    }
    track(_payload: any) {
        return Promise.resolve('ok');
    }
    untrack() {
        return Promise.resolve('ok');
    }
}

export const hostingerStorage = {
    from(_bucket: string = 'car-images') {
        return {
            async upload(_filePath: string, file: File) {
                const formData = new FormData();
                formData.append('file', file);
                const token = localStorage.getItem('swami_token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${API_BASE}/api/upload/single`, {
                    method: 'POST',
                    headers,
                    body: formData
                });
                const json = await res.json();
                if (!res.ok) {
                    return { data: null, error: new Error(json.error || 'Upload failed') };
                }
                return { data: { path: json.url }, error: null };
            },
            async download(path: string) {
                try {
                    const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    return { data: blob, error: null };
                } catch (err: any) {
                    return { data: null, error: err };
                }
            },
            getPublicUrl(path: string) {
                if (!path) return { data: { publicUrl: '' } };
                if (path.startsWith('http://') || path.startsWith('https://')) {
                    return { data: { publicUrl: path } };
                }
                const base = API_BASE || window.location.origin;
                return { data: { publicUrl: `${base}${path.startsWith('/') ? '' : '/'}${path}` } };
            }
        };
    }
};

export const hostingerClient = {
    from(tableName: string) {
        return new QueryBuilder(tableName);
    },
    auth: hostingerAuth,
    storage: hostingerStorage,
    channel(name: string) {
        return new RealtimeChannel(name);
    },
    removeChannel(_channel: any) {
        return Promise.resolve();
    },
    removeAllChannels() {
        return Promise.resolve();
    },
    getChannels() {
        return [];
    },
    rpc(fnName: string, args?: any) {
        return {
            async then(resolve: (result: { data: any; error: any }) => void) {
                try {
                    const token = localStorage.getItem('swami_auth_token');
                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json'
                    };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch(`${API_BASE}/api/data/rpc`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ fnName, args: args || {} })
                    });
                    if (!res.ok) {
                        resolve({ data: null, error: new Error(`RPC error: ${res.statusText}`) });
                        return;
                    }
                    const result = await res.json();
                    resolve(result);
                } catch (err: any) {
                    resolve({ data: null, error: err });
                }
            }
        };
    }
};
