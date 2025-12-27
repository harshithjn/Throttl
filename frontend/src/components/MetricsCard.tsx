import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricsCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    trendUp?: boolean;
}

export function MetricsCard({ title, value, icon: Icon, trend, trendUp }: MetricsCardProps) {
    return (
        <div className="card-glow">
            <div className="card-body">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-neon-400 animate-pulse-glow" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-100">{value}</div>
                                {trend && (
                                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${trendUp ? 'text-neon-400' : 'text-danger-400'
                                        }`}>
                                        {trendUp ? (
                                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                                        ) : (
                                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                                        )}
                                        <span className="sr-only">{trendUp ? 'Increased' : 'Decreased'} by</span>
                                        {trend}
                                    </div>
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}