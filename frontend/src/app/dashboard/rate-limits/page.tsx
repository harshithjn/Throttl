'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { fetchApi, getAdminKey } from '@/lib/api';

interface RateLimit {
    id: number;
    client_id: string;
    route: string;
    algorithm: 'token_bucket' | 'sliding_window';
    limit: number;
    refill_rate?: number;
    capacity?: number;
    window_size?: number;
    created_at?: string;
    is_active?: boolean; // implicit from presence in database
}

interface Client {
    name: string;
}

export default function RateLimitsPage() {
    const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<RateLimit | null>(null);

    const adminKey = typeof window !== 'undefined' ? getAdminKey() : '';
    const isAdmin = adminKey ? adminKey.startsWith('admin-') : false;

    // Form inputs
    const [clientName, setClientName] = useState('default');
    const [routePattern, setRoutePattern] = useState('');
    const [algorithm, setAlgorithm] = useState<'token_bucket' | 'sliding_window'>('token_bucket');
    const [limitValue, setLimitValue] = useState(100);
    const [refillRate, setRefillRate] = useState(1);
    const [burstCapacity, setBurstCapacity] = useState(10);
    const [windowSeconds, setWindowSeconds] = useState(60);

    const fetchRateLimits = async () => {
        try {
            const data = await fetchApi<{ configs: RateLimit[] }>('/admin/config/list');
            // Mock implicit is_active as true since it resides in DB
            const formatted = (data.configs || []).map(item => ({ ...item, is_active: true }));
            setRateLimits(formatted);
        } catch (error) {
            console.error('Failed to fetch rate limits:', error);
            toast.error('Failed to load rate limits');
        }
    };

    const fetchClients = async () => {
        try {
            const data = await fetchApi<{ clients: Client[] }>('/admin/clients/list');
            const list = data.clients || [];
            setClients(list);
            if (list.length === 1) {
                setClientName(list[0].name);
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchRateLimits(), fetchClients()]);
            setLoading(false);
        };
        load();
    }, []);

    const formatWindow = (seconds: number) => {
        if (!seconds) return '1m';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${seconds / 60}m`;
        return `${seconds / 3600}h`;
    };

    const handleOpenAdd = () => {
        setEditingRule(null);
        setClientName(clients.length > 0 ? clients[0].name : 'default');
        setRoutePattern('*');
        setAlgorithm('token_bucket');
        setLimitValue(100);
        setRefillRate(1);
        setBurstCapacity(10);
        setWindowSeconds(60);
        setShowModal(true);
    };

    const handleOpenEdit = (rule: RateLimit) => {
        setEditingRule(rule);
        setClientName(rule.client_id);
        setRoutePattern(rule.route);
        setAlgorithm(rule.algorithm);
        setLimitValue(rule.limit);
        setRefillRate(rule.refill_rate || 1);
        setBurstCapacity(rule.capacity || 10);
        setWindowSeconds(rule.window_size || 60);
        setShowModal(true);
    };

    const handleDelete = async (clientId: string, route: string) => {
        if (!confirm(`Delete rate limit rule for route "${route}"? This cannot be undone.`)) return;
        try {
            await fetchApi(`/admin/config/delete?client_id=${encodeURIComponent(clientId)}&route=${encodeURIComponent(route)}`, {
                method: 'DELETE',
            });
            toast.success('Rate limit rule deleted');
            fetchRateLimits();
        } catch (error) {
            console.error('Failed to delete rate limit:', error);
            toast.error('Failed to delete rate limit rule');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!routePattern.trim()) {
            toast.error('Route pattern is required');
            return;
        }

        const finalClientId = isAdmin ? clientName : (clients[0]?.name || clientName);

        const isTokenBucket = algorithm === 'token_bucket';
        const bodyPayload = {
            client_id: finalClientId,
            route: routePattern.trim(),
            algorithm: algorithm,
            limit: limitValue,
            refill_rate: isTokenBucket ? refillRate : 0,
            capacity: isTokenBucket ? burstCapacity : 0,
            window_size: isTokenBucket ? 0 : windowSeconds,
        };

        try {
            // UpsertConfigHandler handles POST and PUT the same way
            await fetchApi('/admin/config/create', {
                method: 'POST',
                body: JSON.stringify(bodyPayload),
            });

            toast.success(editingRule ? 'Rate limit rule updated' : 'Rate limit rule created');
            setShowModal(false);
            fetchRateLimits();
        } catch (error) {
            console.error('Failed to save rate limit:', error);
            toast.error('Failed to save rate limit configuration');
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Rate Limits</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure rate limiting rules for routes and clients</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Rule
                </button>
            </div>

            {/* Rules */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500 animate-pulse">
                        Loading rate limit rules...
                    </div>
                ) : rateLimits.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-600 bg-white/[0.01] border border-gray-800/40 rounded-xl">
                        No rate limit rules found. Click "Add Rule" to configure one.
                    </div>
                ) : (
                    rateLimits.map((rule) => (
                        <div
                            key={rule.id || `${rule.client_id}-${rule.route}`}
                            className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-5 hover:bg-white/[0.04] transition-colors duration-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    {/* Top row */}
                                    <div className="flex items-center gap-3">
                                        <code className="text-[13px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/10">
                                            {rule.route}
                                        </code>
                                        <span className="text-[11px] font-medium text-gray-400 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-gray-800/40 font-mono">
                                            {rule.algorithm === 'token_bucket' ? 'token bucket' : 'sliding window'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-[11px] text-gray-500">Active</span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex items-center gap-6 text-[13px]">
                                        <div>
                                            <span className="text-gray-600 font-medium">Client:</span>{' '}
                                            <span className="text-gray-300 font-mono">{rule.client_id}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 font-medium">Limit:</span>{' '}
                                            <span className="text-gray-300">
                                                {rule.limit} req / {rule.algorithm === 'token_bucket' ? '1m' : formatWindow(rule.window_size || 60)}
                                            </span>
                                        </div>
                                        {rule.algorithm === 'token_bucket' && (
                                            <>
                                                <div>
                                                    <span className="text-gray-600 font-medium">Burst Capacity:</span>{' '}
                                                    <span className="text-gray-300">{rule.capacity}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 font-medium">Refill Rate:</span>{' '}
                                                    <span className="text-gray-300">{rule.refill_rate}/s</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 ml-4">
                                    <button
                                        onClick={() => handleOpenEdit(rule)}
                                        className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors rounded-md hover:bg-white/[0.05]"
                                        title="Edit Rule"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.client_id, rule.route)}
                                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-white/[0.05]"
                                        title="Delete Rule"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-white mb-1">
                            {editingRule ? 'Edit Rate Limit Rule' : 'Add Rate Limit Rule'}
                        </h3>
                        <p className="text-[12px] text-gray-500 mb-5">
                            Define thresholds and sliding windows to safeguard API performance.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Client scope</label>
                                    {isAdmin ? (
                                        <select
                                            value={clientName}
                                            onChange={e => setClientName(e.target.value)}
                                            className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                            disabled={!!editingRule}
                                        >
                                            {clients.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={clients[0]?.name || clientName || 'Loading...'}
                                            disabled
                                            className="w-full bg-[#161616]/50 border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-gray-500 font-mono focus:outline-none cursor-not-allowed"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Route pattern</label>
                                    <input
                                        type="text"
                                        value={routePattern}
                                        onChange={e => setRoutePattern(e.target.value)}
                                        placeholder="e.g. /api/v1/*"
                                        className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                        required
                                        disabled={!!editingRule}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Algorithm</label>
                                    <select
                                        value={algorithm}
                                        onChange={e => setAlgorithm(e.target.value as 'token_bucket' | 'sliding_window')}
                                        className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="token_bucket">Token Bucket</option>
                                        <option value="sliding_window">Sliding Window</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Limit Value (Requests)</label>
                                    <input
                                        type="number"
                                        value={limitValue}
                                        onChange={e => setLimitValue(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                        min={1}
                                        required
                                    />
                                </div>
                            </div>

                            {algorithm === 'token_bucket' ? (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                    <div>
                                        <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Refill Rate (/sec)</label>
                                        <input
                                            type="number"
                                            value={refillRate}
                                            onChange={e => setRefillRate(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                            min={1}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Burst Capacity</label>
                                        <input
                                            type="number"
                                            value={burstCapacity}
                                            onChange={e => setBurstCapacity(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                            min={1}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                    <div>
                                        <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Window Size (Seconds)</label>
                                        <input
                                            type="number"
                                            value={windowSeconds}
                                            onChange={e => setWindowSeconds(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                            min={1}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="text-[13px] px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="text-[13px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingRule ? 'Save Changes' : 'Add Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
