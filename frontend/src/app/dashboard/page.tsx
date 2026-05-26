'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowUpIcon,
    ArrowDownIcon,
} from '@heroicons/react/24/solid';
import {
    KeyIcon,
    AdjustmentsHorizontalIcon,
    UsersIcon,
    BookOpenIcon,
    ShieldCheckIcon,
    ClockIcon,
    BoltIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { fetchApi, getAdminKey } from '@/lib/api';

interface APIKey {
    is_active: boolean;
}

interface Client {
    name: string;
}

interface RateLimit {
    client_id: string;
}

interface GlobalStats {
    total_requests: number;
    allowed_requests: number;
    blocked_requests: number;
    avg_latency_ms: number;
}

interface DashboardStats {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    activeClients: number;
    activeKeys: number;
    avgLatency: number;
}

interface ActivityItem {
    id: string;
    type: 'rate_limit' | 'api_key' | 'config' | 'alert';
    message: string;
    time: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Counts
    const [clientCount, setClientCount] = useState(0);
    const [keyCount, setKeyCount] = useState(0);
    const [ruleCount, setRuleCount] = useState(0);

    const loadStats = async () => {
        try {
            // Determine user role
            const key = getAdminKey();
            const isAdmin = key ? key.startsWith('admin-') : false;

            // In multi-tenant client mode, calling /clients/list might fail if endpoint is restricted, 
            // but the Go API listClientsHandler requires admin auth.
            // Let's safe-guard so that if it returns 403/Forbidden, we fall back gracefully!
            let clientsData: { clients: Client[] } = { clients: [] };
            if (isAdmin) {
                try {
                    clientsData = await fetchApi<{ clients: Client[] }>('/admin/clients/list');
                } catch (e) {
                    console.error('Failed to load clients list', e);
                }
            }

            const [keysData, configsData, globalStatsData] = await Promise.all([
                fetchApi<{ keys: APIKey[] }>('/admin/keys/list'),
                fetchApi<{ configs: RateLimit[] }>('/admin/config/list'),
                fetchApi<GlobalStats>('/admin/stats/global')
            ]);
            
            const activeClients = (clientsData.clients || []).length;
            const activeKeys = (keysData.keys || []).filter(k => k.is_active).length;
            const activeRules = (configsData.configs || []).length;
            
            setClientCount(activeClients);
            setKeyCount((keysData.keys || []).length);
            setRuleCount(activeRules);

            setStats({
                totalRequests: globalStatsData.total_requests || 0,
                allowedRequests: globalStatsData.allowed_requests || 0,
                blockedRequests: globalStatsData.blocked_requests || 0,
                activeClients: activeClients,
                activeKeys: activeKeys,
                avgLatency: globalStatsData.avg_latency_ms || 0,
            });
        } catch (error) {
            console.error('Failed to load dashboard metrics:', error);
            toast.error('Failed to load dashboard metrics');
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await loadStats();
            setLoading(false);
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-800/50 rounded-lg w-48"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-800/30 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const successRate = stats && stats.totalRequests > 0 
        ? ((stats.allowedRequests / stats.totalRequests) * 100).toFixed(1) 
        : '100.0';

    const key = getAdminKey();
    const isAdmin = key ? key.startsWith('admin-') : false;

    const metrics = [
        {
            label: 'Total Requests',
            value: stats?.totalRequests.toLocaleString() || '0',
            trend: stats && stats.totalRequests > 0 ? 'Live' : 'No traffic',
            up: true,
            icon: BoltIcon,
        },
        {
            label: 'Success Rate',
            value: `${successRate}%`,
            trend: stats && stats.totalRequests > 0 ? 'Optimal' : 'Stable',
            up: true,
            icon: ShieldCheckIcon,
        },
        {
            label: 'Avg Latency',
            value: `${stats ? stats.avgLatency.toFixed(2) : '0.00'}ms`,
            trend: stats && stats.totalRequests > 0 ? 'Fast' : 'Stable',
            up: true,
            icon: ClockIcon,
        },
        // Role Aware Metrics Card: Admin sees Active Clients, Client sees Allowed Requests
        isAdmin ? {
            label: 'Active Clients',
            value: clientCount.toString(),
            trend: 'Live',
            up: true,
            icon: UsersIcon,
        } : {
            label: 'Allowed Requests',
            value: stats?.allowedRequests.toLocaleString() || '0',
            trend: 'Allowed',
            up: true,
            icon: ShieldCheckIcon,
        },
        {
            label: 'API Keys',
            value: keyCount.toString(),
            trend: 'Live',
            up: true,
            icon: KeyIcon,
        },
        {
            label: 'Blocked Requests',
            value: stats?.blockedRequests.toLocaleString() || '0',
            trend: stats && stats.blockedRequests > 0 ? 'Alert' : 'None',
            up: false,
            icon: ExclamationTriangleIcon,
        },
    ];

    const activities: ActivityItem[] = [];

    if (stats) {
        if (stats.totalRequests > 0) {
            activities.push({
                id: 'traffic',
                type: 'rate_limit',
                message: `Rate limiting engine active: processed ${stats.totalRequests.toLocaleString()} requests`,
                time: 'Live',
            });
        }
        if (stats.blockedRequests > 0) {
            activities.push({
                id: 'blocked',
                type: 'alert',
                message: `Exceeded request capacity: blocked ${stats.blockedRequests.toLocaleString()} requests`,
                time: 'Live',
            });
        }
    }

    if (keyCount > 0) {
        activities.push({
            id: 'keys',
            type: 'api_key',
            message: `Secure SHA-256 API key layer active with ${keyCount} keys`,
            time: 'Active',
        });
    }

    if (ruleCount > 0) {
        activities.push({
            id: 'rules',
            type: 'config',
            message: `Rate limiting rules loaded: ${ruleCount} active paths configured`,
            time: 'Loaded',
        });
    }

    const quickLinks = [
        { href: '/dashboard/api-keys', label: 'API Keys', icon: KeyIcon, desc: `Manage ${keyCount} keys` },
        { href: '/dashboard/rate-limits', label: 'Rate Limits', icon: AdjustmentsHorizontalIcon, desc: `Configure ${ruleCount} rules` },
        // Conditional description depending on role
        isAdmin ? { href: '/dashboard/clients', label: 'Clients', icon: UsersIcon, desc: `Manage ${clientCount} clients` } : null,
        { href: '/dashboard/api-docs', label: 'API Docs', icon: BookOpenIcon, desc: 'Integration guide' },
    ].filter(Boolean) as { href: string; label: string; icon: any; desc: string }[];

    return (
        <div className="space-y-8 font-sans">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Console Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isAdmin ? 'System health and global tenant metrics' : 'Workspace health and active keys'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        loadStats();
                        toast.success('Metrics refreshed');
                    }}
                    className="text-[12px] bg-white/[0.03] border border-gray-800/80 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    Refresh Stats
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((m) => (
                    <div
                        key={m.label}
                        className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-5 hover:bg-white/[0.04] transition-colors duration-200"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-gray-500">{m.label}</span>
                            <m.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-semibold text-white tracking-tight">{m.value}</span>
                            <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                {m.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Quick Links */}
                <div className="lg:col-span-2">
                    <h2 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h2>
                    <div className="space-y-2">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 p-3.5 bg-white/[0.02] border border-gray-800/60 rounded-xl hover:bg-white/[0.05] hover:border-gray-700 transition-all duration-200 group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                    <link.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div>
                                    <span className="text-[13px] font-medium text-white">{link.label}</span>
                                    <p className="text-[11px] text-gray-500">{link.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-3">
                    <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h2>
                    <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl overflow-hidden">
                        {activities.length === 0 ? (
                            <div className="p-8 text-center text-[12px] text-gray-500">
                                No recent activity logged. Start making rate limit check requests to see live events.
                            </div>
                        ) : (
                            activities.map((activity, i) => (
                                <div
                                    key={activity.id}
                                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors ${
                                        i !== activities.length - 1 ? 'border-b border-gray-800/40' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                            activity.type === 'alert' ? 'bg-red-400' :
                                            activity.type === 'rate_limit' ? 'bg-amber-400' :
                                            'bg-blue-400'
                                        }`} />
                                        <span className="text-[13px] text-gray-300 truncate">{activity.message}</span>
                                    </div>
                                    <span className="text-[11px] text-gray-600 flex-shrink-0 ml-4">{activity.time}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
