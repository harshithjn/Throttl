'use client';

export class UnauthorizedError extends Error {
    constructor() {
        super('Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

export function getAdminKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('throttl_admin_key');
}

export function setAdminKey(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('throttl_admin_key', key);
    window.dispatchEvent(new Event('throttl_auth_change'));
}

export function removeAdminKey() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('throttl_admin_key');
    window.dispatchEvent(new Event('throttl_auth_change'));
}

// Global API url builder
function getApiUrl(endpoint: string): string {
    // Relative URL is proxied by Nginx to the Go backend
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `/api${cleanEndpoint}`;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const key = getAdminKey();
    const headers = new Headers(options.headers || {});
    
    if (key) {
        headers.set('Authorization', `Bearer ${key}`);
    }
    
    // Set default headers for content type if body is present
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
    });

    if (response.status === 401) {
        removeAdminKey();
        throw new UnauthorizedError();
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API request failed with status ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text) as T;
}
