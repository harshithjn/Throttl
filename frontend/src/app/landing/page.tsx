'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  BoltIcon,
  ChartBarIcon,
  CloudIcon,
  Cog6ToothIcon,
  KeyIcon,
  LockClosedIcon,
  ServerIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            
            
          </div>
          <nav className="hidden md:flex gap-6 text-sm  text-gray-400">
            <a href="#problem" className="hover:text-white">Problem</a>
            <a href="#architecture" className="hover:text-white">Architecture</a>
            <a href="#adoption" className="hover:text-white">Adoption</a>
            <Link href="/" className="hover:text-white">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-4xl">
          Distributed Rate Limiting Platform <br />
          <span className="text-blue-500">Built for Production Systems</span>
        </h1>

        <p className="mt-6 text-gray-400 text-lg max-w-3xl">
          Throttl is a self-hosted, cloud-native rate limiting platform that
          solves the core challenges of enforcing fair usage and protecting
          services in distributed systems — with sub-10ms decisions,
          multi-tenancy, and full observability.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
          >
            View Dashboard
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <a
            href="#architecture"
            className="border border-gray-700 px-6 py-3 rounded-lg text-gray-300 hover:border-gray-500"
          >
            Architecture
          </a>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold mb-6">
            Why Rate Limiting Is Hard
          </h2>

          <p className="text-gray-400 max-w-3xl mb-10">
            In distributed systems, rate limiting must balance speed,
            consistency, and correctness. Traditional approaches either fail
            under scale or introduce unacceptable latency.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <Problem title="State Synchronization">
              Multiple instances need shared counters without race conditions.
            </Problem>
            <Problem title="Latency Constraints">
              Decisions must happen in under 10ms to avoid slowing APIs.
            </Problem>
            <Problem title="Dynamic Configuration">
              Limits must change without redeploying services.
            </Problem>
            <Problem title="Multi-Tenancy">
              Each client needs isolated limits and secure access.
            </Problem>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold mb-6">
            System Architecture
          </h2>

          <p className="text-gray-400 max-w-3xl mb-12">
            Throttl is designed as an independent enforcement service that sits
            in front of APIs or internal services, making fast, atomic rate
            limiting decisions.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <ArchCard
              icon={ServerIcon}
              title="Rate Limiting Engine"
              desc="Go-based service exposing a /check endpoint with sub-10ms latency."
            />
            <ArchCard
              icon={CloudIcon}
              title="Redis (State)"
              desc="Atomic counters implemented using Redis Lua scripts."
            />
            <ArchCard
              icon={Cog6ToothIcon}
              title="PostgreSQL (Config)"
              desc="ACID-backed storage for rules, API keys, and audit logs."
            />
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6 text-sm">
            <ArchCard
              icon={BoltIcon}
              title="Token Bucket Algorithm"
              desc="Allows controlled bursts while maintaining average rate limits."
            />
            <ArchCard
              icon={ChartBarIcon}
              title="Sliding Window Algorithm"
              desc="Precise time-based limiting using Redis sorted sets."
            />
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold mb-12">
            Platform Capabilities
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <Feature icon={KeyIcon} title="API Key Security">
              SHA-256 hashed keys with rotation, revocation, and audit trails.
            </Feature>
            <Feature icon={UsersIcon} title="Multi-Tenant Isolation">
              Strict separation of clients, rules, and usage metrics.
            </Feature>
            <Feature icon={ShieldCheckIcon} title="Production Observability">
              20+ Prometheus metrics with Grafana dashboards.
            </Feature>
            <Feature icon={LockClosedIcon} title="RBAC & Admin APIs">
              Secure CRUD operations for keys, rules, and clients.
            </Feature>
            <Feature icon={CloudIcon} title="Cloud-Native Deployment">
              Docker Compose for local, Kubernetes for production.
            </Feature>
            <Feature icon={BoltIcon} title="High Throughput">
              50k+ requests/sec per instance with predictable latency.
            </Feature>
          </div>
        </div>
      </section>

      {/* Adoption */}
      <section id="adoption" className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold mb-6">
            How Companies Use Throttl
          </h2>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <UseCase
              title="Public API Protection"
              desc="Enforce quotas for free, paid, and enterprise customers."
            />
            <UseCase
              title="Microservices Safety"
              desc="Prevent cascading failures by throttling internal calls."
            />
            <UseCase
              title="Resource Control"
              desc="Limit expensive operations like uploads or emails."
            />
          </div>

          <div className="mt-10 text-gray-400 max-w-3xl">
            Throttl runs as a standalone service. Teams integrate it via HTTP or
            middleware without modifying existing business logic — making it
            truly plug-and-play.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-500 flex justify-between">
          <span>© 2025 Throttl</span>
          <span>Engineered for distributed systems</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Components ---------- */

function Problem({ title, children }: any) {
  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-gray-400">{children}</p>
    </div>
  );
}

function ArchCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <Icon className="h-6 w-6 text-blue-500 mb-4" />
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, children }: any) {
  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <Icon className="h-6 w-6 text-blue-500 mb-4" />
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-gray-400">{children}</p>
    </div>
  );
}

function UseCase({ title, desc }: any) {
  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}
