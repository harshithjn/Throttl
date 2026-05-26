'use client';

import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'authentication', name: 'Auth' },
    { id: 'endpoints', name: 'Endpoints' },
    { id: 'examples', name: 'Examples' },
    { id: 'sdks', name: 'SDKs' },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
        >
            {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
        </button>
    );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
    return (
        <div className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={code} />
            </div>
            <pre className="bg-[#0d0d0d] border border-gray-800/60 rounded-lg p-4 text-[13px] font-mono text-gray-300 overflow-x-auto leading-relaxed">
                {code}
            </pre>
        </div>
    );
}

export default function ApiDocsPage() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white">API Documentation</h1>
                <p className="text-sm text-gray-500 mt-1">Integration guide for the Throttl rate limiting API</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/[0.02] border border-gray-800/60 rounded-lg p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                            activeTab === tab.id
                                ? 'bg-white/[0.08] text-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-6 space-y-4">
                            <h2 className="text-base font-medium text-white">Getting Started</h2>
                            <p className="text-[13px] text-gray-400 leading-relaxed">
                                Throttl is a distributed rate limiting platform that helps you control API traffic
                                and prevent abuse. Integrate it into your application in four simple steps.
                            </p>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Base URL</h3>
                                <div className="flex items-center gap-2">
                                    <code className="text-[13px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/10">
                                        https://your-throttl-instance.com/api
                                    </code>
                                    <CopyButton text="https://your-throttl-instance.com/api" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Quick Integration</h3>
                                <ol className="space-y-2 text-[13px] text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-600 font-mono text-[12px] mt-0.5">1.</span>
                                        Create an API key in the dashboard
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-600 font-mono text-[12px] mt-0.5">2.</span>
                                        Configure rate limit rules for your routes
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-600 font-mono text-[12px] mt-0.5">3.</span>
                                        Call the /check endpoint before processing requests
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-600 font-mono text-[12px] mt-0.5">4.</span>
                                        Handle rate limit responses appropriately
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'authentication' && (
                    <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-6 space-y-4">
                            <h2 className="text-base font-medium text-white">Authentication</h2>
                            <p className="text-[13px] text-gray-400">
                                All API requests must include an API key in the Authorization header.
                            </p>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Header Format</h3>
                                <div className="flex items-center gap-2">
                                    <code className="text-[13px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/10">
                                        Authorization: Bearer your-api-key-here
                                    </code>
                                    <CopyButton text="Authorization: Bearer your-api-key-here" />
                                </div>
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4">
                                <p className="text-[13px] text-amber-300/80">
                                    <span className="font-medium">Security Note:</span> Keep API keys secure. Never expose them in client-side code. Rotate keys regularly and revoke unused ones.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'endpoints' && (
                    <div className="space-y-4">
                        {/* Rate Limit Check */}
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">POST</span>
                                <code className="text-[13px] font-mono text-gray-300">/check</code>
                            </div>
                            <p className="text-[13px] text-gray-400">Check if a request should be allowed or rate limited.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Request</h4>
                                    <CodeBlock code={`{
  "client_id": "your-client-id",
  "route": "/api/v1/users",
  "identifier": "user-123"
}`} />
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Response</h4>
                                    <CodeBlock code={`{
  "allowed": true,
  "remaining": 95,
  "reset_time": "2024-01-01T12:01:00Z",
  "limit": 100
}`} />
                                </div>
                            </div>
                        </div>

                        {/* Health Check */}
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">GET</span>
                                <code className="text-[13px] font-mono text-gray-300">/health</code>
                            </div>
                            <p className="text-[13px] text-gray-400">Check the health status of the Throttl service.</p>
                            <CodeBlock code={`{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}`} />
                        </div>
                    </div>
                )}

                {activeTab === 'examples' && (
                    <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-6 space-y-6">
                            <h2 className="text-base font-medium text-white">Integration Examples</h2>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Node.js / Express</h3>
                                <CodeBlock code={`const axios = require('axios');

async function checkRateLimit(req, res, next) {
  try {
    const response = await axios.post('http://throttl:8080/check', {
      client_id: 'your-client-id',
      route: req.path,
      identifier: req.ip
    }, {
      headers: { 'Authorization': 'Bearer your-api-key' }
    });

    if (response.data.allowed) {
      next();
    } else {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retry_after: response.data.retry_after
      });
    }
  } catch (error) {
    next(); // Fail open
  }
}

app.use(checkRateLimit);`} />
                            </div>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Python / Flask</h3>
                                <CodeBlock code={`import requests
from flask import request, jsonify

def check_rate_limit():
    try:
        response = requests.post('http://throttl:8080/check',
            json={
                'client_id': 'your-client-id',
                'route': request.path,
                'identifier': request.remote_addr
            },
            headers={'Authorization': 'Bearer your-api-key'}
        )

        data = response.json()
        if not data['allowed']:
            return jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': data['retry_after']
            }), 429

    except Exception as e:
        pass  # Fail open`} />
                            </div>

                            <div>
                                <h3 className="text-[13px] font-medium text-gray-300 mb-2">Go</h3>
                                <CodeBlock code={`func rateLimitMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        reqBody := RateLimitRequest{
            ClientID:   "your-client-id",
            Route:      r.URL.Path,
            Identifier: r.RemoteAddr,
        }

        jsonBody, _ := json.Marshal(reqBody)
        req, _ := http.NewRequest("POST", "http://throttl:8080/check",
            bytes.NewBuffer(jsonBody))
        req.Header.Set("Authorization", "Bearer your-api-key")

        resp, err := http.DefaultClient.Do(req)
        if err != nil {
            next.ServeHTTP(w, r) // Fail open
            return
        }
        defer resp.Body.Close()

        var result RateLimitResponse
        json.NewDecoder(resp.Body).Decode(&result)

        if !result.Allowed {
            w.WriteHeader(http.StatusTooManyRequests)
            return
        }

        next.ServeHTTP(w, r)
    })
}`} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sdks' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Node.js SDK', desc: 'TypeScript support included', install: 'npm install @throttl/node-sdk', color: 'text-emerald-400' },
                                { name: 'Python SDK', desc: 'Async support included', install: 'pip install throttl-python', color: 'text-blue-400' },
                                { name: 'Go SDK', desc: 'Context support included', install: 'go get github.com/throttl/go-sdk', color: 'text-cyan-400' },
                                { name: 'Java SDK', desc: 'Spring Boot compatible', install: 'Coming Soon', color: 'text-gray-500' },
                            ].map((sdk) => (
                                <div key={sdk.name} className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-5 hover:bg-white/[0.04] transition-colors">
                                    <h3 className="text-[14px] font-medium text-white mb-1">{sdk.name}</h3>
                                    <p className="text-[12px] text-gray-500 mb-3">{sdk.desc}</p>
                                    <div className="flex items-center gap-2">
                                        <code className={`text-[12px] font-mono ${sdk.color} bg-white/[0.03] px-2.5 py-1 rounded-md`}>
                                            {sdk.install}
                                        </code>
                                        {sdk.install !== 'Coming Soon' && <CopyButton text={sdk.install} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4">
                            <p className="text-[13px] text-blue-300/80">
                                Don't see your language? Community-contributed SDKs are available on GitHub.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
