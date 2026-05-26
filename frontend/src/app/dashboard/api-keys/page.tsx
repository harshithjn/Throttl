'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { fetchApi, getAdminKey } from '@/lib/api';

interface APIKey {
    id: number;
    key_hash: string;
    client_id: string;
	name: string;
	key_type: 'client' | 'admin';
	created_at: string;
	last_used_at?: string;
	is_active: boolean;
}

interface Client {
    name: string;
}

export default function APIKeysPage() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyClient, setNewKeyClient] = useState('');
    const [newKeyType, setNewKeyType] = useState<'client' | 'admin'>('client');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const adminKey = typeof window !== 'undefined' ? getAdminKey() : '';
    const isAdmin = adminKey ? adminKey.startsWith('admin-') : false;

    const fetchAPIKeys = async () => {
        try {
            const data = await fetchApi<{ keys: APIKey[] }>('/admin/keys/list');
            setKeys(data.keys || []);
        } catch (error) {
            console.error('Failed to fetch keys:', error);
            toast.error('Failed to load API keys');
        }
    };

    const fetchClients = async () => {
        try {
            const data = await fetchApi<{ clients: Client[] }>('/admin/clients/list');
            const list = data.clients || [];
            setClients(list);
            if (list.length === 1) {
                setNewKeyClient(list[0].name);
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchAPIKeys(), fetchClients()]);
            setLoading(false);
        };
        load();
    }, []);

    const toggleVisibility = (keyId: string) => {
        const next = new Set(visibleKeys);
        next.has(keyId) ? next.delete(keyId) : next.add(keyId);
        setVisibleKeys(next);
    };

    const maskKey = (key: string) => {
        return key.substring(0, Math.min(key.length, 14)) + '•'.repeat(16);
    };

    const timeAgo = (iso: string) => {
        if (!iso) return 'Never';
        const parsed = new Date(iso);
        if (isNaN(parsed.getTime()) || parsed.getFullYear() < 2000) return 'Never';
        
        const diff = Date.now() - parsed.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const handleDelete = async (keyHash: string) => {
        if (!confirm('Delete this API key permanently? This cannot be undone.')) return;
        try {
            await fetchApi(`/admin/keys/delete?key_hash=${encodeURIComponent(keyHash)}`, {
                method: 'DELETE',
            });
            toast.success('API key deleted');
            fetchAPIKeys();
        } catch (error) {
            console.error('Failed to delete key:', error);
            toast.error('Failed to delete key');
        }
    };

    const handleRotate = async (keyHash: string) => {
        if (!confirm('Rotate this key? The old key will stop working immediately.')) return;
        try {
            const res = await fetchApi<{ new_api_key: string }>('/admin/keys/rotate', {
                method: 'POST',
                body: JSON.stringify({ key_hash: keyHash }),
            });
            setGeneratedKey(res.new_api_key);
            setShowCreate(true);
            toast.success('Key rotated successfully');
            fetchAPIKeys();
        } catch (error) {
            console.error('Failed to rotate key:', error);
            toast.error('Failed to rotate key');
        }
    };

    const handleRevoke = async (keyHash: string, isActive: boolean) => {
        if (isActive) {
            if (!confirm('Deactivate this API key? Applications using it will fail to check rate limits.')) return;
            try {
                await fetchApi(`/admin/keys/revoke?key_hash=${encodeURIComponent(keyHash)}`, {
                    method: 'POST',
                });
                toast.success('API key deactivated');
                fetchAPIKeys();
            } catch (error) {
                console.error('Failed to deactivate key:', error);
                toast.error('Failed to deactivate key');
            }
        } else {
            toast.error('Re-activating key is not supported. Please generate a new key.');
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim()) {
            toast.error('Key Name is required');
            return;
        }

        const adminKey = getAdminKey();
        const isAdmin = adminKey ? adminKey.startsWith('admin-') : false;
        const finalKeyType = isAdmin ? newKeyType : 'client';
        const clientVal = finalKeyType === 'admin' ? 'admin' : (isAdmin ? newKeyClient : (clients[0]?.name || ''));

        if (!clientVal) {
            toast.error('Client workspace is not resolved. Please reload the page.');
            return;
        }

        try {
            const data = await fetchApi<{ api_key: string }>('/admin/keys/create', {
                method: 'POST',
                body: JSON.stringify({
                    client_id: clientVal,
                    name: newKeyName.trim(),
                    key_type: finalKeyType,
                }),
            });
            setGeneratedKey(data.api_key);
            setNewKeyName('');
            setNewKeyClient(isAdmin ? '' : (clients[0]?.name || ''));
            setNewKeyType('client');
            toast.success('API key generated');
            fetchAPIKeys();
        } catch (error) {
            console.error('Failed to generate key:', error);
            toast.error('Failed to generate API key');
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">API Keys</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage authentication keys for your clients</p>
                </div>
                <button
                    onClick={() => {
                        setGeneratedKey(null);
                        setShowCreate(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    Create Key
                </button>
            </div>

            {/* Keys List */}
            <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800/60 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Key</div>
                    <div className="col-span-2">Client</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-2">Created / Used</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Rows */}
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500 animate-pulse">
                        Loading API keys...
                    </div>
                ) : keys.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-600">
                        No API Keys found. Click "Create Key" to get started.
                    </div>
                ) : (
                    keys.map((key, i) => (
                        <div
                            key={key.id}
                            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${
                                i !== keys.length - 1 ? 'border-b border-gray-800/40' : ''
                            }`}
                        >
                            {/* Key Hash */}
                            <div className="col-span-4">
                                <div className="flex items-center gap-2">
                                    <code className="text-[12px] font-mono text-gray-300 bg-white/[0.03] px-2 py-0.5 rounded border border-gray-800/60">
                                        {visibleKeys.has(key.key_hash) ? key.key_hash : maskKey(key.key_hash)}
                                    </code>
                                    <button
                                        onClick={() => toggleVisibility(key.key_hash)}
                                        className="text-gray-600 hover:text-gray-400 transition-colors"
                                    >
                                        {visibleKeys.has(key.key_hash) ? (
                                            <EyeSlashIcon className="h-3.5 w-3.5" />
                                        ) : (
                                            <EyeIcon className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                                <div className="text-[11px] text-gray-600 mt-0.5">{key.name}</div>
                            </div>

                            {/* Client */}
                            <div className="col-span-2 text-[13px] text-gray-400 font-mono">{key.client_id}</div>

                            {/* Type */}
                            <div className="col-span-1">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                    key.key_type === 'admin'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {key.key_type}
                                </span>
                            </div>

                            {/* Created / Used */}
                            <div className="col-span-2 text-[12px] text-gray-500 space-y-0.5">
                                <div>Created: {timeAgo(key.created_at)}</div>
                                <div className="text-[11px] text-gray-600">
                                    Used: {key.last_used_at ? timeAgo(key.last_used_at) : 'Never'}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                                <button
                                    onClick={() => handleRevoke(key.key_hash, key.is_active)}
                                    className="flex items-center gap-1.5 hover:opacity-85 transition-opacity text-left"
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${key.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    <span className="text-[12px] text-gray-500">{key.is_active ? 'Active' : 'Inactive'}</span>
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-end gap-1">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(key.key_hash);
                                        toast.success('Copied hash to clipboard');
                                    }}
                                    className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-md hover:bg-white/[0.05]"
                                    title="Copy Key Hash"
                                >
                                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleRotate(key.key_hash)}
                                    className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors rounded-md hover:bg-white/[0.05]"
                                    title="Rotate Key"
                                >
                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(key.key_hash)}
                                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-white/[0.05]"
                                    title="Delete Key"
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCreate(false)}>
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-white mb-1">Create API Key</h3>
                        <p className="text-[12px] text-gray-500 mb-5">
                            Generate a new secure authentication token to access Throttl services.
                        </p>

                        {generatedKey ? (
                            <div className="space-y-4">
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                                    <p className="text-[12px] text-blue-400 font-medium mb-2">Key generated successfully!</p>
                                    <p className="text-[11px] text-gray-500 mb-3">Copy this key now. For security, you won't be able to see it again.</p>
                                    
                                    <div className="flex items-center gap-2 bg-[#050505] p-3 rounded border border-gray-800 font-mono text-[12px] text-white">
                                        <span className="truncate flex-1">{generatedKey}</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedKey);
                                                toast.success('Key copied to clipboard');
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-white transition-colors hover:bg-white/[0.05] rounded"
                                            title="Copy"
                                        >
                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => {
                                            setGeneratedKey(null);
                                            setShowCreate(false);
                                        }}
                                        className="text-[13px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateKey} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Key Name</label>
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={e => setNewKeyName(e.target.value)}
                                        placeholder="e.g. Production Mobile App"
                                        className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                                        required
                                    />
                                </div>

                                {isAdmin ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Key Type</label>
                                            <select
                                                value={newKeyType}
                                                onChange={e => {
                                                    const type = e.target.value as 'client' | 'admin';
                                                    setNewKeyType(type);
                                                    if (type === 'admin') setNewKeyClient('admin');
                                                    else setNewKeyClient('');
                                                }}
                                                className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all"
                                            >
                                                <option value="client">Client Key</option>
                                                <option value="admin">Admin Key</option>
                                            </select>
                                        </div>

                                        {newKeyType === 'client' && (
                                            <div>
                                                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Associated Client</label>
                                                <select
                                                    value={newKeyClient}
                                                    onChange={e => setNewKeyClient(e.target.value)}
                                                    className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                                    required
                                                >
                                                    <option value="">Select client...</option>
                                                    {clients.map(c => (
                                                        <option key={c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Workspace Client Scope</label>
                                        <input
                                            type="text"
                                            value={clients[0]?.name || 'Loading client workspace...'}
                                            disabled
                                            className="w-full bg-[#161616]/50 border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-gray-500 font-mono focus:outline-none cursor-not-allowed"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="text-[13px] px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="text-[13px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Generate Key
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
