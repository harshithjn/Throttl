'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { fetchApi, getAdminKey } from '@/lib/api';

interface Client {
    name: string;
    description: string;
    created_at: string;
}

interface APIKey {
    client_id: string;
}

interface RateLimitConfig {
    client_id: string;
}

export default function ClientsPage() {
    const adminKey = typeof window !== 'undefined' ? getAdminKey() : '';
    const isAdmin = adminKey ? adminKey.startsWith('admin-') : false;

    const [clients, setClients] = useState<Client[]>([]);
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const fetchData = async () => {
        try {
            const [clientsData, keysData, configsData] = await Promise.all([
                fetchApi<{ clients: Client[] }>('/admin/clients/list'),
                fetchApi<{ keys: APIKey[] }>('/admin/keys/list'),
                fetchApi<{ configs: RateLimitConfig[] }>('/admin/config/list')
            ]);
            
            setClients(clientsData.clients || []);
            setKeys(keysData.keys || []);
            setRateLimits(configsData.configs || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load clients data');
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        const load = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        load();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Access Restricted</h2>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                    This section is reserved for Throttl Administrators. Regular client workspaces are automatically isolated to safeguard multi-tenant data.
                </p>
                <Link
                    href="/dashboard"
                    className="bg-white/[0.03] border border-gray-800/80 hover:bg-white/[0.06] text-gray-300 hover:text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-all"
                >
                    Return to Overview
                </Link>
            </div>
        );
    }

    const handleOpenAdd = () => {
        setEditingClient(null);
        setName('');
        setDescription('');
        setShowModal(true);
    };

    const handleOpenEdit = (client: Client) => {
        setEditingClient(client);
        setName(client.name);
        setDescription(client.description);
        setShowModal(true);
    };

    const handleDelete = async (clientName: string) => {
        if (clientName === 'default') {
            toast.error('The default client cannot be deleted.');
            return;
        }
        if (!confirm(`Delete client "${clientName}"? This will also cascade delete all associated API keys and rate limit rules.`)) return;
        try {
            await fetchApi(`/admin/clients/delete?name=${encodeURIComponent(clientName)}`, {
                method: 'DELETE',
            });
            toast.success(`Client "${clientName}" deleted successfully`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete client:', error);
            toast.error('Failed to delete client');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const clientNameNormalized = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        
        if (!clientNameNormalized) {
            toast.error('Client name is required');
            return;
        }

        // Validate uniqueness of name
        const duplicate = clients.find(c => c.name === clientNameNormalized && (!editingClient || c.name !== editingClient.name));
        if (duplicate) {
            toast.error(`A client with name "${clientNameNormalized}" already exists.`);
            return;
        }

        try {
            if (editingClient) {
                await fetchApi('/admin/clients/update', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: clientNameNormalized,
                        description: description.trim(),
                    }),
                });
                toast.success('Client updated successfully');
            } else {
                await fetchApi('/admin/clients/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: clientNameNormalized,
                        description: description.trim(),
                    }),
                });
                toast.success('Client created successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save client:', error);
            toast.error('Failed to save client profile');
        }
    };

    const getAPIKeyCount = (clientName: string) => {
        return keys.filter(k => k.client_id === clientName).length;
    };

    const getRuleCount = (clientName: string) => {
        return rateLimits.filter(r => r.client_id === clientName).length;
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Clients</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage API clients and their configurations</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Client
                </button>
            </div>

            {/* Client Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full p-8 text-center text-sm text-gray-500 animate-pulse">
                        Loading clients...
                    </div>
                ) : clients.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-sm text-gray-600 bg-white/[0.01] border border-gray-800/40 rounded-xl">
                        No clients found. Click "Add Client" to get started.
                    </div>
                ) : (
                    clients.map((client) => {
                        const keyCount = getAPIKeyCount(client.name);
                        const ruleCount = getRuleCount(client.name);
                        return (
                            <div
                                key={client.name}
                                className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-5 hover:bg-white/[0.04] transition-colors duration-200 group relative flex flex-col justify-between min-h-[170px]"
                            >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-[14px] font-medium text-white font-mono">{client.name}</h3>
                                            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                {client.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenEdit(client)}
                                                className="p-1 text-gray-600 hover:text-blue-400 transition-colors rounded hover:bg-white/[0.05]"
                                                title="Edit Client"
                                            >
                                                <PencilIcon className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.name)}
                                                className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded hover:bg-white/[0.05]"
                                                title="Delete Client"
                                            >
                                                <TrashIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {/* Stats */}
                                    <div className="flex items-center gap-6 mt-4">
                                        <div>
                                            <div className="text-lg font-semibold text-white tracking-tight">{keyCount}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">API Keys</div>
                                        </div>
                                        <div className="w-px h-6 bg-gray-800/80"></div>
                                        <div>
                                            <div className="text-lg font-semibold text-white tracking-tight">{ruleCount}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rules</div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between text-[11px] text-gray-600">
                                        <span>
                                            Created {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-white mb-1">
                            {editingClient ? 'Edit Client Profile' : 'Add Client Profile'}
                        </h3>
                        <p className="text-[12px] text-gray-500 mb-5">
                            Define isolated spaces for distinct products or operational environments.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-400 mb-1.5 font-sans">Client Identifier (Slug)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. billing-service"
                                    className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                    required
                                    disabled={editingClient?.name === 'default'}
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Lowercase letters, numbers, hyphens or underscores only.</p>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-400 mb-1.5 font-sans">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief description of client context..."
                                    rows={3}
                                    className="w-full bg-[#161616] border border-gray-800/80 rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans resize-none"
                                />
                            </div>

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
                                    {editingClient ? 'Save Changes' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
