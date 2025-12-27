'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    latency?: number;
    lastCheck: string;
}

export function SystemStatus() {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchSystemStatus = async () => {
        try {
            // Mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 500));
            setServices([
                {
                    name: 'Throttl API',
                    status: 'healthy',
                    latency: 8.5,
                    lastCheck: new Date().toISOString()
                },
                {
                    name: 'Redis',
                    status: 'healthy',
                    latency: 2.1,
                    lastCheck: new Date().toISOString()
                },
                {
                    name: 'PostgreSQL',
                    status: 'healthy',
                    latency: 12.3,
                    lastCheck: new Date().toISOString()
                },
                {
                    name: 'Prometheus',
                    status: 'healthy',
                    latency: 15.7,
                    lastCheck: new Date().toISOString()
                },
                {
                    name: 'Grafana',
                    status: 'warning',
                    latency: 45.2,
                    lastCheck: new Date().toISOString()
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <XCircleIcon className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-900 text-green-300 border border-green-700';
            case 'warning':
                return 'bg-yellow-900 text-yellow-300 border border-yellow-700';
            case 'error':
                return 'bg-red-900 text-red-300 border border-red-700';
            default:
                return 'bg-gray-800 text-gray-300 border border-gray-600';
        }
    };

    const overallStatus = services.some(s => s.status === 'error')
        ? 'error'
        : services.some(s => s.status === 'warning')
            ? 'warning'
            : 'healthy';

    if (loading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg mb-8">
                <div className="p-6">
                    <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-700 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-white">System Status</h2>
                    <div className="flex items-center">
                        {getStatusIcon(overallStatus)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(overallStatus)}`}>
                            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {services.map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                            <div className="flex items-center">
                                {getStatusIcon(service.status)}
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white">
                                        {service.name}
                                    </p>
                                    {service.latency && (
                                        <p className="text-xs text-gray-400">
                                            {service.latency}ms
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}