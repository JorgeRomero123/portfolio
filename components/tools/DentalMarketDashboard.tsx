'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Source {
  title: string;
  organization: string;
  year: number;
  url: string;
}

interface Metric {
  value: number;
  unit?: string;
  currency?: string;
  year: number;
  description: string;
  source: Source;
}

interface StateData {
  state: string;
  economic_units: number;
  year: number;
}

interface MarketStructureEntry {
  value: number;
  unit: string;
  description: string;
  source: Source;
}

interface Insight {
  type: string;
  description: string;
  implication_for_labs: string;
}

interface MarketData {
  section_id: string;
  title: string;
  description: string;
  last_updated: string;
  key_metrics: Record<string, Metric>;
  geographic_distribution: {
    top_states_by_dental_activity: StateData[];
    note: string;
  };
  market_structure: Record<string, MarketStructureEntry>;
  insights: Insight[];
}

function formatNumber(value: number, currency?: string): string {
  if (currency) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('es-MX').format(value);
}

const METRIC_LABELS: Record<string, string> = {
  dentists_total_estimated: 'Total de Dentistas',
  dental_clinics_total: 'Total de Clínicas Dentales',
  dental_offices_economic_units: 'Unidades Económicas',
  industry_revenue: 'Ingresos de la Industria',
  workforce: 'Fuerza Laboral',
  average_salary: 'Salario Promedio',
  single_owner_clinics_percentage: 'Clínicas de Propietario Único',
  corporate_clinics_percentage: 'Clínicas Corporativas',
};

const INSIGHT_LABELS: Record<string, string> = {
  market_fragmentation: 'Fragmentación del Mercado',
  urban_concentration: 'Concentración Urbana',
  large_workforce: 'Gran Fuerza Laboral',
};

function formatMetricLabel(key: string): string {
  return METRIC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatInsightType(type: string): string {
  return INSIGHT_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const ACCENT = '#2563eb';
const MUTED = '#6b7280';
const PIE_COLORS = ['#2563eb', '#e5e7eb'];

export default function DentalMarketDashboard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/dental-market-data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <p className="text-lg">Error al cargar datos: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const metrics = Object.entries(data.key_metrics);
  const states = data.geographic_distribution.top_states_by_dental_activity;
  const maxUnits = Math.max(...states.map((s) => s.economic_units));

  const structureEntries = Object.entries(data.market_structure);
  const pieData = structureEntries.map(([key, entry]) => ({
    name: key.includes('single') ? 'Propietario Único' : 'Corporativo',
    value: entry.value,
  }));

  // Collect unique sources
  const sourcesMap = new Map<string, Source>();
  metrics.forEach(([, m]) => {
    const key = `${m.source.title}-${m.source.organization}`;
    if (!sourcesMap.has(key)) sourcesMap.set(key, m.source);
  });
  structureEntries.forEach(([, entry]) => {
    const key = `${entry.source.title}-${entry.source.organization}`;
    if (!sourcesMap.has(key)) sourcesMap.set(key, entry.source);
  });
  const sources = Array.from(sourcesMap.values());

  return (
    <div
      className="max-w-6xl mx-auto"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-[#111111] mb-3 tracking-tight">
          Panorama del Mercado Dental en México
        </h1>
        <p className="text-lg text-[#6b7280] max-w-2xl mx-auto mb-2">
          Estructura del mercado e indicadores relevantes para laboratorios dentales
        </p>
        <p className="text-sm text-[#6b7280]">
          Última actualización: {data.last_updated}
        </p>
      </header>

      {/* Key Metrics */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[#111111] mb-6">
          Métricas Clave
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map(([key, metric]) => (
            <div
              key={key}
              className="bg-[#f9fafb] rounded-xl p-6 hover:shadow-md transition-shadow border border-gray-100"
            >
              <p className="text-3xl md:text-4xl font-bold text-[#111111] mb-1">
                {formatNumber(metric.value, metric.currency)}
              </p>
              <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
                {formatMetricLabel(key)}
              </p>
              <p className="text-sm text-[#6b7280] mb-3 leading-relaxed">
                {metric.description}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{metric.source.organization} ({metric.year})</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Geographic Distribution */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[#111111] mb-2">
          Principales Estados por Actividad Dental
        </h2>
        <p className="text-sm text-[#6b7280] mb-6">
          {data.geographic_distribution.note}
        </p>

        {/* Chart */}
        <div className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 mb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={states}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="state"
                  width={130}
                  tick={{ fill: '#111', fontSize: 13 }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatNumber(value as number),
                    'Unidades Económicas',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="economic_units" fill={ACCENT} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranked list */}
        <div className="space-y-3">
          {states.map((s, i) => (
            <div key={s.state} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-[#2563eb] w-8 text-right">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#111111]">{s.state}</span>
                  <span className="text-sm font-semibold text-[#111111]">
                    {formatNumber(s.economic_units)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563eb] rounded-full transition-all"
                    style={{
                      width: `${(s.economic_units / maxUnits) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Market Structure */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[#111111] mb-6">
          Estructura del Mercado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 flex items-center justify-center">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="space-y-4">
            {structureEntries.map(([key, entry]) => (
              <div
                key={key}
                className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <p className="text-4xl font-bold text-[#111111] mb-1">
                  {entry.value}%
                </p>
                <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
                  {formatMetricLabel(key)}
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  {entry.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[#111111] mb-6">
          Hallazgos Clave del Mercado
        </h2>
        <div className="space-y-5">
          {data.insights.map((insight, i) => (
            <div
              key={i}
              className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full mb-3">
                {formatInsightType(insight.type)}
              </span>
              <p className="text-[#111111] leading-relaxed mb-4">
                {insight.description}
              </p>
              <div className="bg-blue-50 border-l-4 border-[#2563eb] rounded-r-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb] mb-1">
                  Implicación para Laboratorios
                </p>
                <p className="text-sm text-[#111111] leading-relaxed">
                  {insight.implication_for_labs}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111111] mb-6">
          Fuentes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((source, i) => (
            <div
              key={i}
              className="bg-[#f9fafb] rounded-xl p-5 border border-gray-100"
            >
              <p className="font-medium text-[#111111] text-sm mb-1">
                {source.title}
              </p>
              <p className="text-xs text-[#6b7280] mb-2">
                {source.organization} &middot; {source.year}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2563eb] hover:underline break-all"
              >
                {source.url}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
