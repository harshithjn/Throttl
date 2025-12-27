'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    PlusIcon,
    KeyIcon,
    TrashIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface APIKey {
    id: string;
    keyHash: string;
    clientId: string;
    name: string;
    keyType: 'client' | 'admin';
    createdAt: string;
    lastUsedAt?: string;
    isActive: boolean;
}

export default function APIKeysPage() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAPIKeys();
    }, []);

    const fetchAPIKeys = async () => {
        try {
            // Mock API keys data - in real implementation, fetch from Throttl API
            const mockKeys: APIKey[] = [
                {
                    id: '1',
                    keyHash: 'admin-1735257600-a1b2c3d4e5f6789012345678',
                    clientId: 'admin',
                    name: 'Master Admin Key',
                    keyType: 'admin',
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    isActive: true,
                },
                {
                    id: '2',
                    keyHash: 'client-1735257602-c3d4e5f6789012345678a1b2',
                    clientId: 'user123',
                    name: 'Production Key',
                    keyType: 'client',
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    lastUsedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                    isActive: true,
                },
                {
                    id: '3',
                    keyHash: 'client-1735257603-d4e5f6789012345678a1b2c3',
                    clientId: 'user456',
                    name: 'Development Key',
                    keyType: 'client',
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    lastUsedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    isActive: true,
                },
            ];

            setKeys(mockKeys);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    const toggleKeyVisibility = (keyId: string) => {
        const newVisible = new Set(visibleKeys);
        if (newVisible.has(keyId)) {
            newVisible.delete(keyId);
        } else {
            newVisible.add(keyId);
        }
        setVisibleKeys(newVisible);
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return key;
        return key.substring(0, 8) + '•'.repeat(key.length - 8);
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        try {
            // Mock delete - in real implementation, call Throttl API
            setKeys(keys.filter(k => k.id !== keyId));
            toast.success('API key deleted successfully');
        } catch (error) {
            console.error('Failed to delete API key:', error);
            toast.error('Failed to delete API key');
        }
    };

    const handleRotateKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to rotate this API key? The old key will be deactivated.')) {
            return;
        }

        try {
            // Mock rotate - in real implementation, call Throttl API
            toast.success('API key rotated successfully. Please update your applications with the new key.');
        } catch (error) {
            console.error('Failed to rotate API key:', error);
            toast.error('Failed to rotate API key');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
                        <div className="bg-gray-900 border border-gray-800 shadow-lg rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-800">
                                <div className="h-6 bg-gray-800 rounded w-1/3"></div>
                            </div>
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-800 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <Link href="/" className="text-neon-green hover:text-neon-green-bright text-sm font-medium transition-colors">
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-white mt-2">API Key Management</h1>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-neon-green hover:bg-neon-green-bright text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-neon-green/25 hover:scale-105"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create API Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h3 className="text-lg font-medium text-white">API Keys ({keys.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Key
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Last Used
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                                {keys.map((key) => (
                                    <tr key={key.id} className="hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <KeyIcon className="h-5 w-5 text-gray-500 mr-3" />
                                                <div>
                                                    <div className="flex items-center">
                                                        <code className="text-sm font-mono text-white mr-2">
                                                            {visibleKeys.has(key.id) ? key.keyHash : maskKey(key.keyHash)}
                                                        </code>
                                                        <button
                                                            onClick={() => toggleKeyVisibility(key.id)}
                                                            className="text-gray-500 hover:text-neon-green transition-colors"
                                                        >
                                                            {visibleKeys.has(key.id) ? (
                                                                <EyeSlashIcon className="h-4 w-4" />
                                                            ) : (
                                                                <EyeIcon className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="text-sm text-gray-400">{key.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {key.clientId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${key.keyType === 'admin'
                                                ? 'bg-yellow-900 text-yellow-300 border-yellow-700'
                                                : 'bg-gray-800 text-gray-300 border-gray-600'
                                                }`}>
                                                {key.keyType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {key.lastUsedAt
                                                ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
                                                : 'Never'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${key.isActive
                                                ? 'bg-green-900 text-green-300 border-green-700'
                                                : 'bg-red-900 text-red-300 border-red-700'
                                                }`}>
                                                {key.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleRotateKey(key.id)}
                                                    className="text-neon-green hover:text-neon-green-bright transition-colors"
                                                    title="Rotate Key"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Delete Key"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Create Modal - Simplified for demo */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-lg rounded-md bg-gray-900">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-white mb-4">Create API Key</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                This is a demo interface. In the full implementation, this would create a new API key.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        toast.success('API key creation feature coming soon!');
                                    }}
                                    className="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green-bright transition-colors font-medium"
                                >
                                    Create Key
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}