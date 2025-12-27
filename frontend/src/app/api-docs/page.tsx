'use client';

import { useState } from 'react';
import { ClipboardDocumentIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export default function ApiDocsPage() {
    const [activeTab, setActiveTab] = useState('overview');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-white">API Documentation</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Complete guide to integrating with the Throttl Rate Limiting Platform.
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-800 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', name: 'Overview' },
                            { id: 'authentication', name: 'Authentication' },
                            { id: 'endpoints', name: 'Endpoints' },
                            { id: 'examples', name: 'Examples' },
                            { id: 'sdks', name: 'SDKs' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-neon-green text-neon-green'
                                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-800">
                                <h2 className="text-lg font-medium text-white">Getting Started</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-300">
                                    Throttl is a distributed rate limiting platform that helps you control API traffic
                                    and prevent abuse. This documentation will guide you through integrating Throttl
                                    into your application.
                                </p>

                                <h3 className="text-md font-medium text-white">Base URL</h3>
                                <div className="bg-gray-800 p-3 rounded-md font-mono text-sm text-neon-green border border-gray-700">
                                    https://your-throttl-instance.com/api
                                </div>

                                <h3 className="text-md font-medium text-white">Quick Integration</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                                    <li>Create an API key in the dashboard</li>
                                    <li>Configure rate limit rules for your routes</li>
                                    <li>Make requests to the /check endpoint before processing</li>
                                    <li>Handle rate limit responses appropriately</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {activeTab === 'authentication' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-800">
                                <h2 className="text-lg font-medium text-white">Authentication</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-300">
                                    All API requests must include an API key in the Authorization header.
                                </p>

                                <h3 className="text-md font-medium text-white">Header Format</h3>
                                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                                    <code className="text-sm text-neon-green">Authorization: Bearer your-api-key-here</code>
                                    <button
                                        onClick={() => copyToClipboard('Authorization: Bearer your-api-key-here')}
                                        className="ml-2 text-neon-green hover:text-neon-green-bright transition-colors"
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4 inline" />
                                    </button>
                                </div>

                                <div className="bg-yellow-900 border border-yellow-700 rounded-md p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-300">
                                                Security Note
                                            </h3>
                                            <div className="mt-2 text-sm text-yellow-200">
                                                <p>
                                                    Keep your API keys secure and never expose them in client-side code.
                                                    Rotate keys regularly and revoke unused keys.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'endpoints' && (
                        <div className="space-y-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-800">
                                    <h2 className="text-lg font-medium text-white">Rate Limit Check</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-sm font-medium border border-green-700">
                                            POST
                                        </span>
                                        <code className="bg-gray-800 px-2 py-1 rounded text-sm text-neon-green border border-gray-700">/check</code>
                                    </div>

                                    <p className="text-gray-300">Check if a request should be allowed or rate limited.</p>

                                    <h4 className="font-medium text-white">Request Body</h4>
                                    <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                        {`{
  "client_id": "your-client-id",
  "route": "/api/v1/users",
  "identifier": "user-123"
}`}
                                    </pre>

                                    <h4 className="font-medium text-white">Response (Allowed)</h4>
                                    <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                        {`{
  "allowed": true,
  "remaining": 95,
  "reset_time": "2024-01-01T12:01:00Z",
  "limit": 100
}`}
                                    </pre>

                                    <h4 className="font-medium text-white">Response (Rate Limited)</h4>
                                    <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                        {`{
  "allowed": false,
  "remaining": 0,
  "reset_time": "2024-01-01T12:01:00Z",
  "limit": 100,
  "retry_after": 45
}`}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-800">
                                    <h2 className="text-lg font-medium text-white">Health Check</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-sm font-medium border border-blue-700">
                                            GET
                                        </span>
                                        <code className="bg-gray-800 px-2 py-1 rounded text-sm text-neon-green border border-gray-700">/health</code>
                                    </div>

                                    <p className="text-gray-300">Check the health status of the Throttl service.</p>

                                    <h4 className="font-medium text-white">Response</h4>
                                    <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                        {`{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'examples' && (
                        <div className="space-y-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-800">
                                    <h2 className="text-lg font-medium text-white">Integration Examples</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-2 text-white">Node.js / Express</h3>
                                        <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                            {`const axios = require('axios');

async function checkRateLimit(req, res, next) {
  try {
    const response = await axios.post('http://throttl:8080/check', {
      client_id: 'your-client-id',
      route: req.path,
      identifier: req.ip
    }, {
      headers: {
        'Authorization': 'Bearer your-api-key'
      }
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
    console.error('Rate limit check failed:', error);
    next(); // Fail open
  }
}

app.use(checkRateLimit);`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-2 text-white">Python / Flask</h3>
                                        <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                            {`import requests
from flask import request, jsonify

def check_rate_limit():
    try:
        response = requests.post('http://throttl:8080/check', 
            json={
                'client_id': 'your-client-id',
                'route': request.path,
                'identifier': request.remote_addr
            },
            headers={
                'Authorization': 'Bearer your-api-key'
            }
        )
        
        data = response.json()
        if not data['allowed']:
            return jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': data['retry_after']
            }), 429
            
    except Exception as e:
        print(f"Rate limit check failed: {e}")
        # Fail open
        pass`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-2 text-white">Go</h3>
                                        <pre className="bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                            {`package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type RateLimitRequest struct {
    ClientID   string \`json:"client_id"\`
    Route      string \`json:"route"\`
    Identifier string \`json:"identifier"\`
}

type RateLimitResponse struct {
    Allowed    bool \`json:"allowed"\`
    Remaining  int  \`json:"remaining"\`
    RetryAfter int  \`json:"retry_after,omitempty"\`
}

func rateLimitMiddleware(next http.Handler) http.Handler {
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
        req.Header.Set("Content-Type", "application/json")
        
        client := &http.Client{}
        resp, err := client.Do(req)
        if err != nil {
            // Fail open
            next.ServeHTTP(w, r)
            return
        }
        defer resp.Body.Close()
        
        var rateLimitResp RateLimitResponse
        json.NewDecoder(resp.Body).Decode(&rateLimitResp)
        
        if !rateLimitResp.Allowed {
            w.Header().Set("Retry-After", 
                fmt.Sprintf("%d", rateLimitResp.RetryAfter))
            w.WriteHeader(http.StatusTooManyRequests)
            json.NewEncoder(w).Encode(map[string]interface{}{
                "error": "Rate limit exceeded",
                "retry_after": rateLimitResp.RetryAfter,
            })
            return
        }
        
        next.ServeHTTP(w, r)
    })
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sdks' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-800">
                                <h2 className="text-lg font-medium text-white">Official SDKs</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-300">
                                    Official SDKs make it easy to integrate Throttl into your applications.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                                        <div className="flex items-center mb-2">
                                            <CodeBracketIcon className="h-5 w-5 text-blue-500 mr-2" />
                                            <h3 className="font-medium text-white">Node.js SDK</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-3">
                                            Official Node.js SDK with TypeScript support
                                        </p>
                                        <code className="bg-gray-700 px-2 py-1 rounded text-sm text-neon-green">
                                            npm install @throttl/node-sdk
                                        </code>
                                    </div>

                                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                                        <div className="flex items-center mb-2">
                                            <CodeBracketIcon className="h-5 w-5 text-green-500 mr-2" />
                                            <h3 className="font-medium text-white">Python SDK</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-3">
                                            Official Python SDK with async support
                                        </p>
                                        <code className="bg-gray-700 px-2 py-1 rounded text-sm text-neon-green">
                                            pip install throttl-python
                                        </code>
                                    </div>

                                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                                        <div className="flex items-center mb-2">
                                            <CodeBracketIcon className="h-5 w-5 text-blue-600 mr-2" />
                                            <h3 className="font-medium text-white">Go SDK</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-3">
                                            Official Go SDK with context support
                                        </p>
                                        <code className="bg-gray-700 px-2 py-1 rounded text-sm text-neon-green">
                                            go get github.com/throttl/go-sdk
                                        </code>
                                    </div>

                                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                                        <div className="flex items-center mb-2">
                                            <CodeBracketIcon className="h-5 w-5 text-red-500 mr-2" />
                                            <h3 className="font-medium text-white">Java SDK</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-3">
                                            Official Java SDK for Spring Boot
                                        </p>
                                        <code className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-400">
                                            Coming Soon
                                        </code>
                                    </div>
                                </div>

                                <div className="bg-blue-900 border border-blue-700 rounded-md p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-300">
                                                Community SDKs
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-200">
                                                <p>
                                                    Don't see your language? Check out community-contributed SDKs
                                                    or contribute your own on GitHub.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}