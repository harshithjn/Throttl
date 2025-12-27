'use client';

import { useState, useEffect } from 'react';
import {
    ClockIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    CogIcon
} from '@heroicons/react/24/outline';

interface ActivityItem {
    id: string;
    type: 'rate_limit' | 'api_key' | 'config' | 'alert';
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error';
}

export function RecentActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentActivity();
        const interval = setInterval(fetchRecentActivity, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchRecentActivity = async () => {
        try {
            // Mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 500));
            setActivities([
                {
                    id: '1',
                    type: 'rate_limit',
                    message: 'Rate limit triggered for client "api-client" on route /api/v1/users',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    severity: 'warning'
                },
                {
                    id: '2',
                    type: 'api_key',
                    message: 'New API key created for client "mobile-app"',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    severity: 'info'
                },
                {
                    id: '3',
                    type: 'config',
                    message: 'Rate limit rule updated for route /api/v1/orders',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    severity: 'info'
                },
                {
                    id: '4',
                    type: 'alert',
                    message: 'High error rate detected on Grafana dashboard',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    severity: 'error'
                },
                {
                    id: '5',
                    type: 'api_key',
                    message: 'API key rotated for client "default"',
                    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    severity: 'info'
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch recent activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'rate_limit':
                return <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />;
            case 'api_key':
                return <KeyIcon className="h-5 w-5 text-blue-500" />;
            case 'config':
                return <CogIcon className="h-5 w-5 text-green-500" />;
            case 'alert':
                return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            case 'info':
            default:
                return 'text-gray-300';
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    if (loading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="text-lg font-medium text-white">Recent Activity</h3>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex space-x-3">
                                <div className="rounded-full bg-gray-700 h-5 w-5"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white">Recent Activity</h3>
            </div>
            <div className="p-6">
                <div className="flow-root">
                    <ul className="-mb-8">
                        {activities.map((activity, activityIdx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== activities.length - 1 ? (
                                        <span
                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center ring-8 ring-gray-900 border border-gray-700">
                                                {getActivityIcon(activity.type)}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className={`text-sm ${getSeverityColor(activity.severity)}`}>
                                                    {activity.message}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-400">
                                                <time dateTime={activity.timestamp}>
                                                    {formatTimeAgo(activity.timestamp)}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {activities.length === 0 && (
                    <div className="text-center py-8">
                        <ClockIcon className="mx-auto h-12 w-12 text-gray-600" />
                        <h3 className="mt-2 text-sm font-medium text-white">No recent activity</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Activity will appear here as your system processes requests.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}