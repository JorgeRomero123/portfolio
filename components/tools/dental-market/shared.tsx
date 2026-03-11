import React from 'react';

// ── Types ──

export interface Source {
  title: string;
  organization: string;
  year: number;
  url: string;
}

export interface Metric {
  value: number;
  unit?: string;
  currency?: string;
  year?: number;
  period?: string;
  description: string;
  source: Source;
}

export interface Insight {
  type: string;
  description: string;
  implication_for_labs: string;
}

export interface MarketStructureEntry {
  value: number;
  unit: string;
  description: string;
  source: Source;
}

export interface StateData {
  state: string;
  economic_units: number;
  year: number;
}

export interface Service {
  service: string;
  description: string;
  demand_level: string;
}

export interface WorkflowStep {
  step: number;
  actor: string;
  process_name?: string;
  description: string;
  tools_used?: string[];
}

export interface Trend {
  trend: string;
  description: string;
  impact_on_labs: string;
}

export interface CommunicationMethod {
  method: string;
  usage_level: string;
  description: string;
}

export interface PainPoint {
  problem: string;
  description: string;
  impact: string;
}

export interface MarketModel {
  methodology: string;
  description: string;
  formula: string;
}

export interface Assumption {
  value: number;
  unit?: string;
  currency?: string;
  description: string;
  source: Source;
}

export interface CalculationEntry {
  value: number;
  unit?: string;
  currency?: string;
  description?: string;
  calculation: string;
  exchange_rate_assumption?: number;
}

export interface MarketSegment {
  segment: string;
  examples: string[];
  share_estimate_percent: number;
}

export interface RegionalOpportunity {
  region: string;
  estimated_share_percent: number;
}

export interface TechnologyTrend {
  technology: string;
  description: string;
  adoption_level: string;
  impact_on_labs: string;
  source: Source;
}

export interface IndustryShift {
  trend: string;
  description: string;
  implication_for_labs: string;
}

export interface Competitor {
  name: string;
  type: string;
  headquarters: string;
  presence_in_mexico?: string;
  positioning: string;
  key_services: string[];
  strengths: string[];
  weaknesses: string[];
  source: Source;
}

export interface CompetitiveDimension {
  dimension: string;
  description: string;
}

export interface ClientSegment {
  segment: string;
  description: string;
  estimated_share_percent: number;
  needs: string[];
  typical_case_volume_per_month: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SectionData extends Record<string, any> {
  section_id: string;
  section_label?: string;
  title: string;
  description: string;
  last_updated: string;
  key_metrics?: Record<string, Metric>;
  industry_metrics?: Record<string, Metric>;
  geographic_distribution?: {
    top_states_by_dental_activity: StateData[];
    note: string;
  };
  market_structure?: Record<string, MarketStructureEntry>;
  services_provided_by_labs?: Service[];
  workflow?: WorkflowStep[];
  workflow_between_dentists_and_labs?: { steps: WorkflowStep[] };
  industry_trends?: Trend[];
  communication_methods?: CommunicationMethod[];
  pain_points?: PainPoint[];
  market_model?: MarketModel;
  assumptions?: Record<string, Assumption>;
  market_calculation?: Record<string, CalculationEntry>;
  market_segments?: MarketSegment[];
  regional_opportunity?: RegionalOpportunity[];
  technology_trends?: TechnologyTrend[];
  industry_shift?: IndustryShift;
  competitors?: Competitor[];
  competitive_dimensions?: CompetitiveDimension[];
  segments?: ClientSegment[];
  insights?: Insight[];
  sources?: Source[];
}

// ── Formatting ──

function humanizeNumber(value: number): { num: number; suffix: string } {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return { num: value / 1_000_000_000, suffix: ' mil millones' };
  if (abs >= 100_000_000) return { num: value / 1_000_000, suffix: ' millones' };
  if (abs >= 1_000_000) return { num: value / 1_000_000, suffix: ' millones' };
  if (abs >= 100_000) return { num: value / 1_000, suffix: ' mil' };
  return { num: value, suffix: '' };
}

function formatHumanized(num: number, suffix: string, currency?: string): string {
  const isWholeAfterRound = Number.isInteger(Math.round(num * 10) / 10);
  const decimals = isWholeAfterRound ? 0 : 1;

  if (currency) {
    const symbol = currency === 'MXN' ? '$' : currency === 'USD' ? 'US$' : `${currency} `;
    return `${symbol}${new Intl.NumberFormat('es-MX', { maximumFractionDigits: decimals }).format(num)}${suffix}${currency === 'MXN' ? ' MXN' : currency === 'USD' ? ' USD' : ''}`;
  }
  return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: decimals }).format(num)}${suffix}`;
}

export function formatNumber(value: number, currency?: string): string {
  const { num, suffix } = humanizeNumber(value);
  if (suffix) return formatHumanized(num, suffix, currency);

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
  estimated_dental_labs: 'Laboratorios Dentales Estimados',
  global_dental_laboratory_market_size: 'Tamaño del Mercado Global',
  global_dental_laboratory_market_forecast: 'Pronóstico del Mercado Global (2030)',
  global_market_cagr: 'Crecimiento Anual Compuesto (CAGR)',
  average_lab_size_mexico: 'Tamaño Promedio de Laboratorio',
  average_turnaround_time_days: 'Tiempo Promedio de Entrega',
  digital_impression_adoption: 'Adopción de Escaneo Digital',
  dentists_in_mexico: 'Dentistas en México',
  percentage_using_external_labs: 'Usan Laboratorio Externo',
  average_lab_cases_per_month: 'Casos Mensuales por Dentista',
  average_lab_fee_per_case: 'Tarifa Promedio por Caso',
  active_dentists_using_labs: 'Dentistas Activos con Laboratorio',
  cases_per_year: 'Casos Anuales',
  total_market_value_mxn: 'Valor Total del Mercado (MXN)',
  total_market_value_usd: 'Valor Total del Mercado (USD)',
};

const INSIGHT_LABELS: Record<string, string> = {
  market_fragmentation: 'Fragmentación del Mercado',
  urban_concentration: 'Concentración Urbana',
  large_workforce: 'Gran Fuerza Laboral',
  fragmented_market: 'Mercado Fragmentado',
  technology_shift: 'Cambio Tecnológico',
  aesthetic_demand: 'Demanda Estética',
  software_opportunity: 'Oportunidad de Software',
  digital_transformation: 'Transformación Digital',
  logistics_dependency: 'Dependencia Logística',
  large_market: 'Gran Mercado',
  esthetic_growth: 'Crecimiento Estético',
  automation_opportunity: 'Oportunidad de Automatización',
  competitive_advantage: 'Ventaja Competitiva',
  technology_gap: 'Brecha Tecnológica',
  premium_opportunity: 'Oportunidad Premium',
  premium_segment_growth: 'Crecimiento del Segmento Premium',
  relationship_driven_market: 'Mercado Basado en Relaciones',
};

export function formatMetricLabel(key: string): string {
  return METRIC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatInsightType(type: string): string {
  return INSIGHT_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const UNIT_LABELS: Record<string, string> = {
  days: 'días',
  employees: 'empleados',
  people: 'personas',
  cases: 'casos',
  dentists: 'dentistas',
};

export function formatMetricValue(metric: Metric): string {
  if (metric.unit === 'percent') return `${metric.value}%`;
  if (metric.currency) return formatNumber(metric.value, metric.currency);
  const suffix = UNIT_LABELS[metric.unit || ''];
  if (suffix) return `${formatNumber(metric.value)} ${suffix}`;
  return formatNumber(metric.value);
}

// ── Shared Components ──

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-6xl mx-auto"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {children}
    </div>
  );
}

export function DashboardHeader({
  title,
  subtitle,
  lastUpdated,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
}) {
  return (
    <header className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-[#111111] mb-3 tracking-tight">
        {title}
      </h1>
      <p className="text-lg text-[#6b7280] max-w-2xl mx-auto mb-2">
        {subtitle}
      </p>
      <p className="text-sm text-[#6b7280]">
        Última actualización: {lastUpdated}
      </p>
    </header>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold text-[#111111] mb-6">{children}</h2>
  );
}

export function SectionBadge({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb] bg-blue-50 inline-block px-3 py-1 rounded-full">
        {label}
      </p>
    </div>
  );
}

export function SectionDivider() {
  return <hr className="border-gray-200 mb-12" />;
}

export function MetricCard({ metricKey, metric }: { metricKey: string; metric: Metric }) {
  return (
    <div className="bg-[#f9fafb] rounded-xl p-6 hover:shadow-md transition-shadow border border-gray-100">
      <p className="text-3xl md:text-4xl font-bold text-[#111111] mb-1">
        {formatMetricValue(metric)}
      </p>
      <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
        {formatMetricLabel(metricKey)}
      </p>
      <p className="text-sm text-[#6b7280] mb-3 leading-relaxed">
        {metric.description}
      </p>
      {metric.source && (
        <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{metric.source.organization} ({metric.year})</span>
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ metrics, title }: { metrics: [string, Metric][]; title?: string }) {
  if (!metrics.length) return null;
  return (
    <section className="mb-16">
      <SectionTitle>{title || 'Métricas Clave'}</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.map(([key, metric]) => (
          <MetricCard key={key} metricKey={key} metric={metric} />
        ))}
      </div>
    </section>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
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
  );
}

export function InsightsSection({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null;
  return (
    <section className="mb-16">
      <SectionTitle>Hallazgos Clave del Mercado</SectionTitle>
      <div className="space-y-5">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </section>
  );
}

export function SourcesSection({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section className="mb-8">
      <SectionTitle>Fuentes</SectionTitle>
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
  );
}

// ── Section-specific renderers ──

const DEMAND_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  growing: 'En crecimiento',
  low: 'Baja',
};

const DEMAND_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  growing: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

export function ServicesGrid({ services }: { services: Service[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Servicios de Laboratorios Dentales</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc) => (
          <div
            key={svc.service}
            className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#111111]">{svc.service}</h3>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 ${DEMAND_COLORS[svc.demand_level] || 'bg-gray-100 text-gray-600'}`}
              >
                {DEMAND_LABELS[svc.demand_level] || svc.demand_level}
              </span>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              {svc.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const ACTOR_LABELS: Record<string, string> = {
  Patient: 'Paciente',
  Dentist: 'Dentista',
  'Dental Laboratory': 'Laboratorio Dental',
};

const ACTOR_COLORS: Record<string, { circle: string; badge: string }> = {
  Patient: { circle: 'bg-emerald-600 text-white', badge: 'bg-emerald-50 text-emerald-700' },
  Dentist: { circle: 'bg-[#2563eb] text-white', badge: 'bg-blue-50 text-[#2563eb]' },
  'Dental Laboratory': { circle: 'bg-[#111111] text-white', badge: 'bg-gray-100 text-[#111111]' },
};

export function WorkflowTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Flujo de Trabajo</SectionTitle>
      <div className="relative">
        {steps.map((step, i) => {
          const colors = ACTOR_COLORS[step.actor] || ACTOR_COLORS['Dentist'];
          return (
            <div key={step.step} className="flex gap-4 mb-6 last:mb-0">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors.circle}`}>
                  {step.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="bg-[#f9fafb] rounded-xl p-5 border border-gray-100 flex-1 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {ACTOR_LABELS[step.actor] || step.actor}
                  </span>
                  {step.process_name && (
                    <span className="text-sm font-semibold text-[#111111]">
                      {step.process_name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#111111] leading-relaxed">
                  {step.description}
                </p>
                {step.tools_used && step.tools_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {step.tools_used.map((tool) => (
                      <span
                        key={tool}
                        className="text-xs bg-gray-100 text-[#6b7280] px-2 py-0.5 rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TrendsSection({ trends }: { trends: Trend[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Tendencias de la Industria</SectionTitle>
      <div className="space-y-5">
        {trends.map((trend, i) => (
          <div
            key={i}
            className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-[#111111] mb-2">
              {trend.trend}
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
              {trend.description}
            </p>
            <div className="bg-blue-50 border-l-4 border-[#2563eb] rounded-r-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb] mb-1">
                Impacto en Laboratorios
              </p>
              <p className="text-sm text-[#111111] leading-relaxed">
                {trend.impact_on_labs}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const USAGE_LABELS: Record<string, string> = {
  very_high: 'Muy Alto',
  high: 'Alto',
  medium: 'Medio',
  low_to_medium: 'Bajo-Medio',
  low: 'Bajo',
};

const USAGE_COLORS: Record<string, string> = {
  very_high: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low_to_medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

export function CommunicationMethodsSection({ methods }: { methods: CommunicationMethod[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Métodos de Comunicación</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {methods.map((m) => (
          <div
            key={m.method}
            className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#111111]">{m.method}</h3>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 ${USAGE_COLORS[m.usage_level] || 'bg-gray-100 text-gray-600'}`}
              >
                {USAGE_LABELS[m.usage_level] || m.usage_level}
              </span>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              {m.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PainPointsSection({ painPoints }: { painPoints: PainPoint[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Puntos de Dolor</SectionTitle>
      <div className="space-y-5">
        {painPoints.map((pp, i) => (
          <div
            key={i}
            className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-[#111111] mb-2">{pp.problem}</h3>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
              {pp.description}
            </p>
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">
                Impacto
              </p>
              <p className="text-sm text-[#111111] leading-relaxed">
                {pp.impact}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 04: Market Size Estimation ──

export function MarketModelSection({ model }: { model: MarketModel }) {
  return (
    <section className="mb-16">
      <SectionTitle>Metodología de Estimación</SectionTitle>
      <div className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100">
        <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
          {model.description}
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-sm text-[#2563eb] text-center">
          {model.formula}
        </div>
      </div>
    </section>
  );
}

export function AssumptionsSection({ assumptions }: { assumptions: Record<string, Assumption> }) {
  const entries = Object.entries(assumptions);
  return (
    <section className="mb-16">
      <SectionTitle>Supuestos del Modelo</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {entries.map(([key, a]) => (
          <div key={key} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-3xl md:text-4xl font-bold text-[#111111] mb-1">
              {a.unit === 'percent' ? `${a.value}%` : a.currency ? formatNumber(a.value, a.currency) : formatNumber(a.value)}
            </p>
            <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
              {formatMetricLabel(key)}
            </p>
            <p className="text-sm text-[#6b7280] mb-3 leading-relaxed">{a.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{a.source.organization} ({a.source.year})</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketCalculationSection({ calculation }: { calculation: Record<string, CalculationEntry> }) {
  const entries = Object.entries(calculation);
  return (
    <section className="mb-16">
      <SectionTitle>Resultado de la Estimación</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {entries.map(([key, c]) => (
          <div key={key} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-3xl md:text-4xl font-bold text-[#111111] mb-1">
              {c.currency ? formatNumber(c.value, c.currency) : formatNumber(c.value)}
            </p>
            <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
              {formatMetricLabel(key)}
            </p>
            {c.description && (
              <p className="text-sm text-[#6b7280] mb-2 leading-relaxed">{c.description}</p>
            )}
            <p className="text-xs font-mono text-[#9ca3af]">{c.calculation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketSegmentsSection({ segments }: { segments: MarketSegment[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Segmentos del Mercado</SectionTitle>
      <div className="space-y-4">
        {segments.map((seg) => (
          <div key={seg.segment} className="bg-[#f9fafb] rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#111111]">{seg.segment}</h3>
              <span className="text-lg font-bold text-[#2563eb]">{seg.share_estimate_percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#2563eb] rounded-full transition-all"
                style={{ width: `${seg.share_estimate_percent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seg.examples.map((ex) => (
                <span key={ex} className="text-xs bg-gray-100 text-[#6b7280] px-2 py-0.5 rounded">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RegionalOpportunitySection({ regions }: { regions: RegionalOpportunity[] }) {
  const maxShare = Math.max(...regions.map((r) => r.estimated_share_percent));
  return (
    <section className="mb-16">
      <SectionTitle>Oportunidad Regional</SectionTitle>
      <div className="space-y-3">
        {regions.map((r, i) => (
          <div key={r.region} className="flex items-center gap-4">
            <span className="text-2xl font-bold text-[#2563eb] w-8 text-right">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-[#111111]">{r.region}</span>
                <span className="text-sm font-semibold text-[#111111]">{r.estimated_share_percent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full transition-all"
                  style={{ width: `${(r.estimated_share_percent / maxShare) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 05: Technology Trends ──

const ADOPTION_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  growing: 'En crecimiento',
  rapid_growth: 'Crecimiento rápido',
  emerging: 'Emergente',
  low: 'Baja',
};

const ADOPTION_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  growing: 'bg-blue-100 text-blue-700',
  rapid_growth: 'bg-purple-100 text-purple-700',
  emerging: 'bg-indigo-100 text-indigo-700',
  low: 'bg-gray-100 text-gray-600',
};

export function TechnologyTrendsSection({ trends }: { trends: TechnologyTrend[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Tecnologías Clave</SectionTitle>
      <div className="space-y-5">
        {trends.map((t, i) => (
          <div key={i} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-semibold text-[#111111]">{t.technology}</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ADOPTION_COLORS[t.adoption_level] || 'bg-gray-100 text-gray-600'}`}>
                {ADOPTION_LABELS[t.adoption_level] || t.adoption_level}
              </span>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
              {t.description}
            </p>
            <div className="bg-blue-50 border-l-4 border-[#2563eb] rounded-r-lg p-4 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb] mb-1">
                Impacto en Laboratorios
              </p>
              <p className="text-sm text-[#111111] leading-relaxed">
                {t.impact_on_labs}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.source.organization} ({t.source.year})</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IndustryShiftSection({ shift }: { shift: IndustryShift }) {
  return (
    <section className="mb-16">
      <SectionTitle>Cambio en la Industria</SectionTitle>
      <div className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100">
        <p className="text-[#111111] leading-relaxed mb-4">{shift.description}</p>
        <div className="bg-blue-50 border-l-4 border-[#2563eb] rounded-r-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb] mb-1">
            Implicación para Laboratorios
          </p>
          <p className="text-sm text-[#111111] leading-relaxed">
            {shift.implication_for_labs}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section 06: Competitors ──

const COMPETITOR_TYPE_LABELS: Record<string, string> = {
  international_lab: 'Internacional',
  mexican_lab: 'Nacional',
  regional_lab: 'Regional',
};

const COMPETITOR_TYPE_COLORS: Record<string, string> = {
  international_lab: 'bg-purple-100 text-purple-700',
  mexican_lab: 'bg-green-100 text-green-700',
  regional_lab: 'bg-yellow-100 text-yellow-700',
};

export function CompetitorsSection({ competitors }: { competitors: Competitor[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Competidores</SectionTitle>
      <div className="space-y-5">
        {competitors.map((c) => (
          <div key={c.name} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-[#111111] text-lg">{c.name}</h3>
                <p className="text-xs text-[#6b7280]">{c.headquarters}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${COMPETITOR_TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                {COMPETITOR_TYPE_LABELS[c.type] || c.type}
              </span>
            </div>

            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">{c.positioning}</p>

            {c.presence_in_mexico && (
              <p className="text-xs text-[#6b7280] mb-4">
                <span className="font-semibold text-[#111111]">Presencia en México:</span> {c.presence_in_mexico}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {c.key_services.map((s) => (
                <span key={s} className="text-xs bg-blue-50 text-[#2563eb] px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1.5">Fortalezas</p>
                <ul className="space-y-1">
                  {c.strengths.map((s) => (
                    <li key={s} className="text-xs text-[#111111] flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1.5">Debilidades</p>
                <ul className="space-y-1">
                  {c.weaknesses.map((w) => (
                    <li key={w} className="text-xs text-[#111111] flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">−</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CompetitiveDimensionsSection({ dimensions }: { dimensions: CompetitiveDimension[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Dimensiones Competitivas</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {dimensions.map((d) => (
          <div key={d.dimension} className="bg-[#f9fafb] rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-[#111111] capitalize mb-1">{d.dimension}</h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 07: Client Segments ──

export function ClientSegmentsSection({ segments }: { segments: ClientSegment[] }) {
  const maxVolume = Math.max(...segments.map((s) => s.typical_case_volume_per_month));

  return (
    <section className="mb-16">
      <SectionTitle>Segmentos de Clientes</SectionTitle>
      <div className="space-y-5">
        {segments.map((seg) => (
          <div key={seg.segment} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="font-semibold text-[#111111]">{seg.segment}</h3>
              <span className="text-lg font-bold text-[#2563eb]">{seg.estimated_share_percent}%</span>
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#2563eb] rounded-full transition-all"
                style={{ width: `${seg.estimated_share_percent}%` }}
              />
            </div>

            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">{seg.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Necesidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {seg.needs.map((n) => (
                    <span key={n} className="text-xs bg-blue-50 text-[#2563eb] px-2 py-0.5 rounded">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Volumen Mensual</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#111111]">{seg.typical_case_volume_per_month}</span>
                  <span className="text-xs text-[#6b7280]">casos/mes</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#111111] rounded-full transition-all"
                    style={{ width: `${(seg.typical_case_volume_per_month / maxVolume) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-20 text-red-600">
      <p className="text-lg">Error al cargar datos: {message}</p>
    </div>
  );
}

export function collectAllSources(sections: SectionData[]): Source[] {
  const sourcesMap = new Map<string, Source>();
  const add = (s: Source) => {
    const key = `${s.title}-${s.organization}`;
    if (!sourcesMap.has(key)) sourcesMap.set(key, s);
  };

  for (const section of sections) {
    // key_metrics
    if (section.key_metrics) {
      Object.values(section.key_metrics).forEach((m) => add(m.source));
    }
    // industry_metrics
    if (section.industry_metrics) {
      Object.values(section.industry_metrics).forEach((m) => add(m.source));
    }
    // market_structure
    if (section.market_structure) {
      Object.values(section.market_structure).forEach((e) => add(e.source));
    }
    // assumptions
    if (section.assumptions) {
      Object.values(section.assumptions).forEach((a: Assumption) => add(a.source));
    }
    // technology_trends
    if (section.technology_trends) {
      section.technology_trends.forEach((t: TechnologyTrend) => add(t.source));
    }
    // competitors
    if (section.competitors) {
      section.competitors.forEach((c: Competitor) => add(c.source));
    }
    // explicit sources array
    if (section.sources) {
      section.sources.forEach(add);
    }
  }

  return Array.from(sourcesMap.values());
}
