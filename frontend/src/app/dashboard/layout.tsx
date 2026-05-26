'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Squares2X2Icon,
    KeyIcon,
    AdjustmentsHorizontalIcon,
    UsersIcon,
    BookOpenIcon,
    ArrowLeftIcon,
    LockClosedIcon,
    ArrowRightIcon,
    ClipboardDocumentIcon,
    IdentificationIcon,
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { getAdminKey, setAdminKey, fetchApi, removeAdminKey } from '@/lib/api';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Squares2X2Icon },
    { href: '/dashboard/api-keys', label: 'API Keys', icon: KeyIcon },
    { href: '/dashboard/rate-limits', label: 'Rate Limits', icon: AdjustmentsHorizontalIcon },
    { href: '/dashboard/clients', label: 'Clients', icon: UsersIcon },
    { href: '/dashboard/api-docs', label: 'API Docs', icon: BookOpenIcon },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    
    // Auth View States
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'registered'>('login');
    const [loginKey, setLoginKey] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Registration States
    const [regName, setRegName] = useState('');
    const [regDesc, setRegDesc] = useState('');
    const [registeredKey, setRegisteredKey] = useState('');

    useEffect(() => {
        const checkAuth = () => {
            const key = getAdminKey();
            setIsAuthenticated(!!key);
        };

        checkAuth();
        window.addEventListener('throttl_auth_change', checkAuth);
        return () => window.removeEventListener('throttl_auth_change', checkAuth);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginKey.trim()) {
            toast.error('API key is required');
            return;
        }

        setIsVerifying(true);
        try {
            // Verify key by attempting to fetch keys list
            const tempHeaders = new Headers();
            tempHeaders.set('Authorization', `Bearer ${loginKey.trim()}`);
            
            const response = await fetch('/api/admin/keys/list', {
                headers: tempHeaders
            });

            if (response.ok) {
                setAdminKey(loginKey.trim());
                toast.success('Successfully authenticated');
            } else {
                toast.error('Invalid Throttl API Key');
            }
        } catch (error) {
            console.error('Auth verification error:', error);
            toast.error('Could not connect to Throttl service');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const clientNameNormalized = regName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

        if (!clientNameNormalized) {
            toast.error('Client workspace slug is required');
            return;
        }

        setIsVerifying(true);
        try {
            const res = await fetchApi<{ status: string; api_key: string; client_name: string }>('/public/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: clientNameNormalized,
                    description: regDesc.trim(),
                }),
            });

            if (res.status === 'success') {
                setRegisteredKey(res.api_key);
                setAuthMode('registered');
                toast.success('Account registered successfully!');
                setRegName('');
                setRegDesc('');
            } else {
                toast.error('Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Client name already exists. Choose a different name.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLogout = () => {
        removeAdminKey();
        toast.success('Logged out');
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4 relative overflow-hidden font-sans">
                {/* Decorative background glows */}
                <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>

                <div className="w-full max-w-md bg-white/[0.01] border border-gray-900/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white tracking-tight">Throttl Console</h2>
                        <p className="text-[12px] text-gray-500 mt-1">
                            {authMode === 'login' && 'Authenticate to access your rate limiting workspace'}
                            {authMode === 'register' && 'Register your self-service developer profile'}
                            {authMode === 'registered' && 'Account initialized successfully'}
                        </p>
                    </div>

                    {authMode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Workspace API Key</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-600">
                                        <LockClosedIcon className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="password"
                                        value={loginKey}
                                        onChange={e => setLoginKey(e.target.value)}
                                        placeholder="admin-master-... or client-..."
                                        className="w-full bg-[#111] border border-gray-800/80 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isVerifying}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-[13px] font-semibold py-3 rounded-xl transition-all duration-200 mt-6 shadow-lg shadow-blue-500/10"
                            >
                                {isVerifying ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <span className="text-[12px] text-gray-600">
                                    New to Throttl?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('register')}
                                        className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                                    >
                                        Create Account
                                    </button>
                                </span>
                            </div>
                        </form>
                    )}

                    {authMode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Workspace Slug (ID)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-600">
                                        <IdentificationIcon className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="text"
                                        value={regName}
                                        onChange={e => setRegName(e.target.value)}
                                        placeholder="e.g. acme-backend"
                                        className="w-full bg-[#111] border border-gray-800/80 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1 pl-1">Lowercase letters, numbers, and dashes only.</p>
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Description</label>
                                <textarea
                                    value={regDesc}
                                    onChange={e => setRegDesc(e.target.value)}
                                    placeholder="Rate limiting rules for my primary backend service..."
                                    rows={3}
                                    className="w-full bg-[#111] border border-gray-800/80 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isVerifying}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-[13px] font-semibold py-3 rounded-xl transition-all duration-200 mt-4 shadow-lg shadow-blue-500/10"
                            >
                                {isVerifying ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Register Account
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <span className="text-[12px] text-gray-600">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('login')}
                                        className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                                    >
                                        Sign In
                                    </button>
                                </span>
                            </div>
                        </form>
                    )}

                    {authMode === 'registered' && (
                        <div className="space-y-5 animate-fade-in font-sans">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5 space-y-4">
                                <div className="text-center">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">✓</div>
                                    <p className="text-[13px] text-emerald-400 font-medium">Workspace Created Successfully!</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Copy your initial API key below. You cannot see it again.</p>
                                </div>

                                <div className="flex items-center gap-2 bg-[#050505] p-3 rounded border border-gray-800 font-mono text-[12px] text-white">
                                    <span className="truncate flex-1 select-all">{registeredKey}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(registeredKey);
                                            toast.success('Key copied to clipboard');
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-white transition-colors hover:bg-white/[0.05] rounded"
                                        title="Copy API Key"
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setAdminKey(registeredKey);
                                    toast.success('Logged in with new account');
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10"
                            >
                                Enter Console Workspace
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-gray-900/60 text-center">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                            <ArrowLeftIcon className="h-3 w-3" />
                            Back to landing page
                        </Link>
                    </div>
                </div>
                <Toaster position="bottom-right" toastOptions={{
                    style: { background: '#121212', color: '#fff', border: '1px solid #222', fontSize: '12px' }
                }} />
            </div>
        );
    }

    const key = getAdminKey();
    const isAdmin = key ? key.startsWith('admin-') : false;

    const visibleNavItems = navItems.filter(item => {
        if (item.href === '/dashboard/clients' && !isAdmin) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Sidebar */}
            <aside className="w-56 border-r border-gray-800/60 flex flex-col fixed h-full bg-[#0a0a0a]">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-800/60">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-xs">T</span>
                        </div>
                        <span className="text-sm font-semibold text-white tracking-tight">Throttl</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {visibleNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-white/[0.07] text-white'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                }`}
                            >
                                <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : ''}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-4 border-t border-gray-800/60 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5 text-left"
                    >
                        <ArrowLeftIcon className="h-3.5 w-3.5" />
                        Log out console
                    </button>
                    <div className="px-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[11px] text-gray-500">Service connected</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-56">
                <div className="max-w-6xl mx-auto px-8 py-8">
                    {children}
                </div>
            </main>
            <Toaster position="bottom-right" toastOptions={{
                style: { background: '#121212', color: '#fff', border: '1px solid #222', fontSize: '12px' }
            }} />
        </div>
    );
}
