'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ChartBarIcon,
    KeyIcon,
    CogIcon,
    ShieldCheckIcon,
    ClockIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { MetricsCard } from '@/components/MetricsCard';
import { RecentActivity } from '@/components/RecentActivity';
import { SystemStatus } from '@/components/SystemStatus';

interface DashboardStats {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    activeClients: number;
    activeKeys: number;
    avgLatency: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call - in real implementation, fetch from Throttl API
        const fetchStats = async () => {
            try {
                // Mock data for demonstration
                await new Promise(resolve => setTimeout(resolve, 1000));
                setStats({
                    totalRequests: 125430,
                    allowedRequests: 118920,
                    blockedRequests: 6510,
                    activeClients: 24,
                    activeKeys: 47,
                    avgLatency: 8.5,
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const successRate = stats ? ((stats.allowedRequests / stats.totalRequests) * 100).toFixed(1) : '0';

    return (
        <div className="min-h-screen bg-black text-gray-100">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Throttl</h1>
                                <span className="text-xs text-gray-400">Rate Limiting Platform</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link href="/landing" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">
                                Landing
                            </Link>
                            <Link href="/monitoring" className="text-gray-400 hover:text-blue-500 transition-colors">
                                <ChartBarIcon className="h-5 w-5" />
                            </Link>
                            <div className="h-4 w-px bg-gray-700"></div>
                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Production</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* System Status */}
                <SystemStatus />

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <MetricsCard
                        title="Total Requests"
                        value={stats?.totalRequests.toLocaleString() || '0'}
                        icon={ChartBarIcon}
                        trend="+12.5%"
                        trendUp={true}
                    />
                    <MetricsCard
                        title="Success Rate"
                        value={`${successRate}%`}
                        icon={ShieldCheckIcon}
                        trend="+2.1%"
                        trendUp={true}
                    />
                    <MetricsCard
                        title="Avg Latency"
                        value={`${stats?.avgLatency || 0}ms`}
                        icon={ClockIcon}
                        trend="-1.2ms"
                        trendUp={true}
                    />
                    <MetricsCard
                        title="Active Clients"
                        value={stats?.activeClients.toString() || '0'}
                        icon={UsersIcon}
                        trend="+3"
                        trendUp={true}
                    />
                    <MetricsCard
                        title="API Keys"
                        value={stats?.activeKeys.toString() || '0'}
                        icon={KeyIcon}
                        trend="+5"
                        trendUp={true}
                    />
                    <MetricsCard
                        title="Blocked Requests"
                        value={stats?.blockedRequests.toLocaleString() || '0'}
                        icon={ShieldCheckIcon}
                        trend="+8.3%"
                        trendUp={false}
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-white">Quick Actions</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/api-keys" className="btn-primary text-center hover-lift">
                                    <KeyIcon className="h-4 w-4 mr-2" />
                                    API Keys
                                </Link>
                                <Link href="/rate-limits" className="btn-secondary text-center hover-lift">
                                    <CogIcon className="h-4 w-4 mr-2" />
                                    Rate Limits
                                </Link>
                                <Link href="/monitoring" className="btn-primary text-center hover-lift">
                                    <ChartBarIcon className="h-4 w-4 mr-2" />
                                    Monitoring
                                </Link>
                                <Link href="/clients" className="btn-secondary text-center hover-lift">
                                    <UsersIcon className="h-4 w-4 mr-2" />
                                    Clients
                                </Link>
                            </div>
                        </div>
                    </div>

                    <RecentActivity />
                </div>

                {/* External Links */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-white">Monitoring & Analytics</h3>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href={process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3002'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 hover-lift"
                            >
                                <ChartBarIcon className="h-8 w-8 text-orange-400 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-100">Grafana</h4>
                                    <p className="text-sm text-gray-400">Real-time dashboards</p>
                                </div>
                            </a>
                            <a
                                href={process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://localhost:9090'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 hover-lift"
                            >
                                <ChartBarIcon className="h-8 w-8 text-red-400 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-100">Prometheus</h4>
                                    <p className="text-sm text-gray-400">Metrics & alerts</p>
                                </div>
                            </a>
                            <Link
                                href="/api-docs"
                                className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 hover-lift"
                            >
                                <CogIcon className="h-8 w-8 text-blue-400 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-100">API Docs</h4>
                                    <p className="text-sm text-gray-400">Integration guide</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}