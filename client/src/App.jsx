import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LayoutDashboard, Home, Users, TrendingUp, Wrench, ShieldCheck } from 'lucide-react';

const ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'sales', label: 'Sales' },
  { id: 'technician', label: 'Technician' },
];

const StatCard = ({ title, value, Icon, subtitle }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {Icon && (
      <div className="p-3 rounded-full bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
    )}
  </div>
);

const SectionCard = ({ title, description, children }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const API_BASE = 'http://localhost:5000';

function App() {
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchWithRole = async (path) => {
          const res = await fetch(`${API_BASE}${path}`, {
            headers: {
              'x-role': role,
            },
          });
          if (!res.ok) {
            const message = (await res.json().catch(() => ({}))).message || res.statusText;
            throw new Error(message);
          }
          return res.json();
        };

        const [overviewRes] = await Promise.all([
          fetchWithRole('/api/dashboard/overview'),
        ]);
        setOverview(overviewRes);

        if (role === 'admin' || role === 'sales') {
          const [contractsRes, propertiesRes] = await Promise.all([
            fetchWithRole('/api/sales/contracts'),
            fetchWithRole('/api/properties'),
          ]);
          setContracts(contractsRes);
          setProperties(propertiesRes);
        } else {
          setContracts([]);
          setProperties([]);
        }

        if (role === 'admin' || role === 'technician') {
          const tasksRes = await fetchWithRole('/api/maintenance/tasks');
          setTasks(tasksRes);
        } else {
          setTasks([]);
        }
      } catch (e) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      value || 0,
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Property PMS
              </h1>
              <p className="text-xs text-slate-500">
                Centralized Management Portal for Inventory, Sales & Maintenance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Current Role
              </p>
              <p className="text-xs text-slate-600">
                Role-based Access Control (RBAC) demo
              </p>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Portfolio Value"
            value={overview ? formatCurrency(overview.totalValue) : '—'}
            subtitle="All active residential units"
            Icon={TrendingUp}
          />
          <StatCard
            title="Total Units"
            value={overview ? overview.unitCount : '—'}
            subtitle="Aggregated from live inventory feed"
            Icon={Home}
          />
          <StatCard
            title="Average Price / Unit"
            value={overview ? formatCurrency(overview.avgPrice) : '—'}
            subtitle="Helps sales & strategy teams benchmark"
            Icon={Users}
          />
        </div>

        {/* Layout: sales / maintenance / security */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Area chart + security note */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Average Price by Sub-Locality"
              description="Helps you identify premium micro-locations and optimize pricing."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.byArea || []} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(15,23,42,0.1)',
                      }}
                    />
                    <Bar dataKey="avgPrice" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

          </div>

          {/* Right: Role-specific panels */}
          <div className="space-y-6">
            {(role === 'admin' || role === 'sales') && (
              <SectionCard
                title="Sales Console"
                description="Live view of contracts and top units for the sales team."
              >
                <div className="text-xs text-slate-500 mb-2">
                  Showing sample contracts generated from inventory. In a real deployment this would
                  connect to your booking & payment engines.
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {contracts.slice(0, 5).map((c) => (
                    <div
                      key={c.contractId}
                      className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {c.contractId} • {c.buyerName}
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          Unit {c.unitId} · DP {formatCurrency(c.downPayment)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Total
                        </p>
                        <p className="font-semibold text-slate-800">
                          {formatCurrency(c.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {contracts.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Switch to <span className="font-semibold">Admin</span> or{' '}
                      <span className="font-semibold">Sales</span> role to see sales data.
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {(role === 'admin' || role === 'technician') && (
              <SectionCard
                title="Maintenance Queue"
                description="Centralized task list for field technicians."
              >
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                  {tasks.slice(0, 6).map((t) => (
                    <div
                      key={t.taskId}
                      className="flex items-start justify-between border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {t.taskId} • {t.type}
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          {t.projectName} · {t.subLocality}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            t.priority === 'High'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">{t.status}</p>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Switch to <span className="font-semibold">Admin</span> or{' '}
                      <span className="font-semibold">Technician</span> role to see tasks.
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Inventory Snapshot"
              description="Filtered view of units, honoring RBAC at the API level."
            >
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                {properties.slice(0, 6).map((p) => (
                  <div
                    key={p.unitId}
                    className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {p.unitId} • {p.projectName}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {p.subLocality || 'Unknown area'} · {p.sqft} sqft
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(p.price)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.status}</p>
                    </div>
                  </div>
                ))}
                {properties.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Inventory data is restricted to <span className="font-semibold">Sales</span> and{' '}
                    <span className="font-semibold">Admin</span> roles in this demo.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs shadow-lg flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Syncing PMS data for role: {role}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;