'use client';

import Link from 'next/link';
import { ChartBarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function MonitoringPage() {
    const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000';
    const prometheusUrl = process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://localhost:9090';

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
                            <h1 className="text-3xl font-bold text-white mt-2">Monitoring & Analytics</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Grafana Dashboard */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white">Grafana Dashboards</h3>
                                <a
                                    href={grafanaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neon-green hover:text-neon-green-bright transition-colors"
                                >
                                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <a
                                    href={`${grafanaUrl}/d/throttl-overview`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 hover:border-neon-green/50 transition-all duration-200"
                                >
                                    <div className="flex items-center">
                                        <ChartBarIcon className="h-8 w-8 text-orange-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-white">Throttl Overview</h4>
                                            <p className="text-sm text-gray-400">Rate limiting metrics and performance</p>
                                        </div>
                                    </div>
                                </a>
                                <a
                                    href={`${grafanaUrl}/d/throttl-system`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 hover:border-neon-green/50 transition-all duration-200"
                                >
                                    <div className="flex items-center">
                                        <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-white">System Health</h4>
                                            <p className="text-sm text-gray-400">Infrastructure and resource monitoring</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Prometheus Metrics */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white">Prometheus Metrics</h3>
                                <a
                                    href={prometheusUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neon-green hover:text-neon-green-bright transition-colors"
                                >
                                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <a
                                    href={`${prometheusUrl}/graph`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 hover:border-neon-green/50 transition-all duration-200"
                                >
                                    <div className="flex items-center">
                                        <ChartBarIcon className="h-8 w-8 text-red-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-white">Query Interface</h4>
                                            <p className="text-sm text-gray-400">Custom metric queries and exploration</p>
                                        </div>
                                    </div>
                                </a>
                                <a
                                    href={`${prometheusUrl}/alerts`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 hover:border-neon-green/50 transition-all duration-200"
                                >
                                    <div className="flex items-center">
                                        <ChartBarIcon className="h-8 w-8 text-yellow-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-white">Alerts</h4>
                                            <p className="text-sm text-gray-400">Active alerts and thresholds</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Embedded Grafana Dashboard */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg mt-6">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h3 className="text-lg font-medium text-white">Live Dashboard</h3>
                    </div>
                    <div className="p-0">
                        <iframe
                            src={`${grafanaUrl}/d-solo/throttl-overview/throttl-overview?orgId=1&refresh=30s&panelId=1&theme=dark`}
                            width="100%"
                            height="400"
                            frameBorder="0"
                            className="rounded-b-lg"
                        ></iframe>
                    </div>
                </div>
            </main>
        </div>
    );
}