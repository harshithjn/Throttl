'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Client {
    id: number;
    name: string;
    description: string;
    api_key_count: number;
    rate_limit_count: number;
    created_at: string;
    updated_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            // Mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));
            setClients([
                {
                    id: 1,
                    name: 'default',
                    description: 'Default client for testing',
                    api_key_count: 2,
                    rate_limit_count: 1,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                },
                {
                    id: 2,
                    name: 'api-client',
                    description: 'Production API client',
                    api_key_count: 5,
                    rate_limit_count: 3,
                    created_at: '2024-01-02T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                },
                {
                    id: 3,
                    name: 'mobile-app',
                    description: 'Mobile application client',
                    api_key_count: 1,
                    rate_limit_count: 2,
                    created_at: '2024-01-03T00:00:00Z',
                    updated_at: '2024-01-03T00:00:00Z'
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-green"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-white">Client Management</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Manage your API clients and their configurations.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-neon-green hover:bg-neon-green-bright text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-neon-green/25 hover:scale-105"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Client
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <div key={client.id} className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg hover:shadow-neon-green/10 transition-all duration-200">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <UsersIcon className="h-8 w-8 text-neon-green" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-lg font-medium text-white">
                                            {client.name}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {client.description}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="text-neon-green hover:text-neon-green-bright transition-colors">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-red-400 hover:text-red-300 transition-colors">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-semibold text-white">
                                            {client.api_key_count}
                                        </div>
                                        <div className="text-sm text-gray-400">API Keys</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-semibold text-white">
                                            {client.rate_limit_count}
                                        </div>
                                        <div className="text-sm text-gray-400">Rate Limits</div>
                                    </div>
                                </div>

                                <div className="mt-4 text-xs text-gray-500">
                                    Created: {new Date(client.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}