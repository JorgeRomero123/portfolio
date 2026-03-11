import React, { useState, useRef, useEffect } from 'react';

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

export interface KeyFinding {
  finding: string;
  description: string;
}

export interface StrategicTakeaway {
  theme: string;
  recommendation: string;
}

export interface DemandDriver {
  driver: string;
  description: string;
  treatments_impacted: string[];
  growth_indicator: string;
  source: Source;
}

export interface PatientBehaviorChange {
  trend: string;
  description: string;
}

export interface StrategicOpportunity {
  opportunity: string;
  description: string;
  market_driver: string;
  potential_benefits: string[];
}

export interface StrategicImplication {
  implication: string;
  context: string;
  relevance_for_fusion: string;
  supporting_trend: string;
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
  key_findings?: KeyFinding[];
  strategic_takeaways?: StrategicTakeaway[];
  demand_drivers?: DemandDriver[];
  patient_behavior_changes?: PatientBehaviorChange[];
  opportunities?: StrategicOpportunity[];
  strategic_implications?: StrategicImplication[];
  key_takeaways?: string[];
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
  esthetic_market_growth: 'Crecimiento del Mercado Estético',
  tourism_opportunity: 'Oportunidad de Turismo Dental',
  technology_expectation: 'Expectativa Tecnológica',
  premium_market: 'Mercado Premium',
  digital_scalability: 'Escalabilidad Digital',
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
  laboratories: 'laboratorios',
  clinics: 'clínicas',
  economic_units: 'unidades económicas',
  monthly: '/mes',
};

export function formatMetricValue(metric: Metric): string {
  if (metric.unit === 'percent') return `${metric.value}%`;
  if (metric.currency) {
    const base = formatNumber(metric.value, metric.currency);
    const unitSuffix = metric.unit ? UNIT_LABELS[metric.unit] : undefined;
    return unitSuffix ? `${base} ${unitSuffix}` : base;
  }
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
  heroMetrics,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  heroMetrics?: { value: string; label: string }[];
}) {
  return (
    <header className="relative mb-24 pt-12 pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl -mx-4 sm:-mx-6" />
      <div className="relative z-10 text-center px-4 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300/90 mb-5">
          Estudio de Mercado {lastUpdated}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]">
          {title}
        </h1>
        <p className="text-base sm:text-lg text-blue-200/70 max-w-2xl mx-auto mb-14 leading-relaxed">
          {subtitle}
        </p>
        {heroMetrics && heroMetrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {heroMetrics.map((m, i) => (
              <div key={i} className="bg-white/[0.07] backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">{m.value}</p>
                <p className="text-sm text-blue-200/60 leading-snug">{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-extrabold text-[#111111] mb-6 tracking-tight">{children}</h3>
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

export function SectionHeader({ number, label, title, description, intro }: { number: number; label?: string; title: string; description: string; intro?: string }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold shadow-sm">
          {number}
        </span>
        {label && (
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
            {label}
          </span>
        )}
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] mb-3 tracking-tight leading-tight">{title}</h2>
      <p className="text-base sm:text-lg text-[#6b7280] leading-relaxed max-w-3xl">{description}</p>
      {intro && (
        <p className="text-base text-[#374151] leading-[1.8] max-w-4xl mt-5">{intro}</p>
      )}
      <div className="mt-8 border-b border-gray-200" />
    </div>
  );
}

export function SectionDivider() {
  return <div className="py-10"><hr className="border-gray-200" /></div>;
}

export function MetricCard({ metricKey, metric }: { metricKey: string; metric: Metric }) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] mb-2 tracking-tight">
        {formatMetricValue(metric)}
      </p>
      <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">
        {formatMetricLabel(metricKey)}
      </p>
      <p className="text-sm text-[#6b7280] leading-relaxed">
        {metric.description}
      </p>
      {metric.source && (
        <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] mt-4 pt-4 border-t border-gray-100">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{metric.source.organization} ({metric.year || metric.source.year})</span>
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ metrics, title }: { metrics: [string, Metric][]; title?: string }) {
  if (!metrics.length) return null;
  const cols = metrics.length <= 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section className="mb-12">
      {title && <h3 className="text-xl font-extrabold text-[#111111] mb-6 tracking-tight">{title}</h3>}
      <div className={`grid ${cols} gap-5`}>
        {metrics.map(([key, metric]) => (
          <MetricCard key={key} metricKey={key} metric={metric} />
        ))}
      </div>
    </section>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-7 sm:p-8 border border-blue-100/80 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Insight</span>
      </div>
      <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-4">
        {formatInsightType(insight.type)}
      </span>
      <p className="text-[#111111] leading-[1.7] mb-6 text-[15px]">
        {insight.description}
      </p>
      <div className="bg-white/90 backdrop-blur-sm border-l-4 border-blue-600 rounded-r-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
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
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-2 tracking-tight">Hallazgos Clave del Mercado</h2>
        <p className="text-base text-[#6b7280]">Principales conclusiones del análisis con implicaciones directas para laboratorios dentales</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-2 tracking-tight">Fuentes</h2>
        <p className="text-base text-[#6b7280]">{sources.length} fuentes utilizadas en este estudio</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <p className="font-semibold text-[#111111] text-sm mb-1 group-hover:text-blue-600 transition-colors">
              {source.title}
            </p>
            <p className="text-xs text-[#6b7280] mb-3">
              {source.organization} &middot; {source.year}
            </p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Ver fuente
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
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
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
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
              <div className="bg-white rounded-2xl p-5 border border-gray-100 flex-1 hover:shadow-lg transition-all duration-300">
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
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
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
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
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
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
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
      <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
          <div key={key} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-xl font-extrabold text-[#111111] tracking-tight">Oportunidad de Mercado</h3>
        </div>
        <p className="text-sm text-[#6b7280]">Resultado de la estimación del mercado de laboratorios dentales</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {entries.map(([key, c]) => (
          <div key={key} className="relative bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-7 sm:p-8 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight relative z-10">
              {c.currency ? formatNumber(c.value, c.currency) : formatNumber(c.value)}
            </p>
            <p className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 relative z-10">
              {formatMetricLabel(key)}
            </p>
            {c.description && (
              <p className="text-sm text-blue-200/60 mb-2 leading-relaxed relative z-10">{c.description}</p>
            )}
            <p className="text-xs font-mono text-blue-300/40 relative z-10">{c.calculation}</p>
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
          <div key={seg.segment} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
      <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
          <div key={c.name} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
          <div key={d.dimension} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
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
          <div key={seg.segment} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
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

// ── Section 01: Executive Summary ──

export function KeyFindingsSection({ findings }: { findings: KeyFinding[] }) {
  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {findings.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base font-bold shrink-0">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-[#111111] text-base mb-1">{f.finding}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{f.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StrategicTakeawaysSection({ takeaways }: { takeaways: StrategicTakeaway[] }) {
  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {takeaways.map((t, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-3 capitalize">
              {t.theme}
            </span>
            <p className="text-sm text-[#111111] leading-relaxed font-medium">{t.recommendation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 09: Patient Demand Trends ──

export function DemandDriversSection({ drivers }: { drivers: DemandDriver[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Impulsores de Demanda</SectionTitle>
      <div className="space-y-5">
        {drivers.map((d, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <h3 className="font-semibold text-[#111111] text-lg mb-2">{d.driver}</h3>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-3">{d.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {d.treatments_impacted.map((t) => (
                <span key={t} className="text-xs bg-blue-50 text-[#2563eb] px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
            <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1">Indicador de Crecimiento</p>
              <p className="text-sm text-[#111111] leading-relaxed">{d.growth_indicator}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{d.source.organization} ({d.source.year})</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PatientBehaviorSection({ changes }: { changes: PatientBehaviorChange[] }) {
  return (
    <section className="mb-16">
      <SectionTitle>Cambios en el Comportamiento del Paciente</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {changes.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <h3 className="font-semibold text-[#111111] capitalize mb-2">{c.trend}</h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 10: Strategic Opportunities ──

export function OpportunitiesSection({ opportunities }: { opportunities: StrategicOpportunity[] }) {
  return (
    <section className="mb-12">
      <div className="space-y-6">
        {opportunities.map((o, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex">
            <div className="w-1.5 bg-blue-600 shrink-0" />
            <div className="p-7 sm:p-9 flex-1">
              <div className="flex items-start gap-4 mb-6">
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white text-lg font-bold shrink-0 shadow-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111111] mb-2 tracking-tight">{o.opportunity}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{o.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-blue-50/70 rounded-xl p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Motor del Mercado</p>
                  <p className="text-sm text-[#111111] leading-relaxed">{o.market_driver}</p>
                </div>
                <div className="bg-emerald-50/70 rounded-xl p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Beneficios Potenciales</p>
                  <ul className="space-y-2">
                    {o.potential_benefits.map((b) => (
                      <li key={b} className="text-sm text-[#111111] flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 11: Fusion Strategic Implications ──

export function StrategicImplicationsSection({ implications }: { implications: StrategicImplication[] }) {
  return (
    <section className="mb-12">
      <div className="space-y-6">
        {implications.map((imp, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex">
            <div className="w-1.5 bg-blue-600 shrink-0" />
            <div className="p-7 sm:p-9 flex-1">
              <div className="flex items-start gap-4 mb-5">
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white text-lg font-bold shrink-0 shadow-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111111] mb-2 tracking-tight">{imp.implication}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{imp.context}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-blue-50/70 rounded-xl p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Relevancia para Fusion</p>
                  <p className="text-sm text-[#111111] leading-relaxed">{imp.relevance_for_fusion}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">Tendencia de Soporte</p>
                  <p className="text-sm text-[#111111] leading-relaxed font-medium">{imp.supporting_trend}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionKeyTakeaways({ takeaways }: { takeaways: string[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-extrabold text-[#111111] tracking-tight">Conclusiones Clave</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {takeaways.map((t, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-6 border border-blue-100/80 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-[15px] text-[#111111] leading-[1.7] font-medium">{t}</p>
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
    // demand_drivers
    if (section.demand_drivers) {
      section.demand_drivers.forEach((d: DemandDriver) => { if (d.source) add(d.source); });
    }
    // explicit sources array
    if (section.sources) {
      section.sources.forEach(add);
    }
  }

  return Array.from(sourcesMap.values());
}

// ── Chat Widget ──

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget({ sections }: { sections: SectionData[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const context = JSON.stringify(sections, null, 0);
      const res = await fetch('/api/dental-market-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, history: messages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer || data.error || 'Error desconocido' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#2563eb] text-white shadow-lg hover:bg-[#1d4ed8] transition-all flex items-center justify-center"
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
      >
        {open ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#2563eb] text-white flex items-center gap-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Asistente del Estudio</p>
              <p className="text-xs opacity-80">Pregunta sobre el mercado dental</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 mt-8">
                <p className="mb-2">Haz cualquier pregunta sobre el estudio de mercado dental.</p>
                <p className="text-xs">Ejemplo: &quot;¿Cuál es el tamaño del mercado?&quot;</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#2563eb] text-white rounded-br-sm'
                      : 'bg-gray-100 text-[#111111] rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-xl bg-[#2563eb] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#1d4ed8] transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
