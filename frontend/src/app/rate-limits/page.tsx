'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface RateLimit {
    id: number;
    client_id: number;
    client_name: string;
    route_pattern: string;
    algorithm: 'token_bucket' | 'sliding_window';
    limit_value: number;
    window_seconds: number;
    burst_capacity?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function RateLimitsPage() {
    const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRateLimits();
    }, []);

    const fetchRateLimits = async () => {
        try {
            // Mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));
            setRateLimits([
                {
                    id: 1,
                    client_id: 1,
                    client_name: 'default',
                    route_pattern: '*',
                    algorithm: 'token_bucket',
                    limit_value: 100,
                    window_seconds: 60,
                    burst_capacity: 10,
                    is_active: true,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                },
                {
                    id: 2,
                    client_id: 2,
                    client_name: 'api-client',
                    route_pattern: '/api/v1/*',
                    algorithm: 'sliding_window',
                    limit_value: 1000,
                    window_seconds: 3600,
                    is_active: true,
                    created_at: '2024-01-02T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch rate limits:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-white">Rate Limit Rules</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Manage rate limiting rules for your clients and routes.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            className="btn-primary"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Rule
                        </button>
                    </div>
                </div>

                <div className="mt-8 card">
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Route Pattern
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Algorithm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Limit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Window
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                                {rateLimits.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {rule.client_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <code className="bg-gray-800 px-2 py-1 rounded text-xs text-blue-400">
                                                {rule.route_pattern}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <span className="badge badge-gray">
                                                {rule.algorithm.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {rule.limit_value}
                                            {rule.burst_capacity && ` (burst: ${rule.burst_capacity})`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {rule.window_seconds}s
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${rule.is_active
                                                ? 'badge-success'
                                                : 'badge-danger'
                                                }`}>
                                                {rule.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-500 hover:text-blue-400 mr-3 transition-colors">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-400 hover:text-red-300 transition-colors">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}