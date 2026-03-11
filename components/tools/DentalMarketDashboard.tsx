'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  type SectionData,
  formatNumber,
  formatMetricLabel,
  DashboardWrapper,
  DashboardHeader,
  SectionTitle,
  SectionBadge,
  SectionDivider,
  MetricsGrid,
  InsightsSection,
  SourcesSection,
  ServicesGrid,
  WorkflowTimeline,
  TrendsSection,
  CommunicationMethodsSection,
  PainPointsSection,
  MarketModelSection,
  AssumptionsSection,
  MarketCalculationSection,
  MarketSegmentsSection,
  RegionalOpportunitySection,
  TechnologyTrendsSection,
  IndustryShiftSection,
  LoadingSpinner,
  ErrorMessage,
  collectAllSources,
} from './dental-market/shared';

const ACCENT = '#2563eb';
const MUTED = '#6b7280';
const PIE_COLORS = ['#2563eb', '#e5e7eb'];

function GeographicSection({ data }: { data: SectionData }) {
  const geo = data.geographic_distribution!;
  const states = geo.top_states_by_dental_activity;
  const maxUnits = Math.max(...states.map((s) => s.economic_units));

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-[#111111] mb-2">
        Principales Estados por Actividad Dental
      </h2>
      <p className="text-sm text-[#6b7280] mb-6">{geo.note}</p>

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
              <YAxis type="category" dataKey="state" width={130} tick={{ fill: '#111', fontSize: 13 }} />
              <Tooltip
                formatter={(value) => [formatNumber(value as number), 'Unidades Económicas']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              />
              <Bar dataKey="economic_units" fill={ACCENT} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {states.map((s, i) => (
          <div key={s.state} className="flex items-center gap-4">
            <span className="text-2xl font-bold text-[#2563eb] w-8 text-right">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-[#111111]">{s.state}</span>
                <span className="text-sm font-semibold text-[#111111]">{formatNumber(s.economic_units)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full transition-all"
                  style={{ width: `${(s.economic_units / maxUnits) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketStructureSection({ data }: { data: SectionData }) {
  const entries = Object.entries(data.market_structure!);
  const pieData = entries.map(([key, entry]) => ({
    name: key.includes('single') ? 'Propietario Único' : 'Corporativo',
    value: entry.value,
  }));

  return (
    <section className="mb-16">
      <SectionTitle>Estructura del Mercado</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {entries.map(([key, entry]) => (
            <div key={key} className="bg-[#f9fafb] rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-4xl font-bold text-[#111111] mb-1">{entry.value}%</p>
              <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wide mb-2">
                {formatMetricLabel(key)}
              </p>
              <p className="text-sm text-[#6b7280] leading-relaxed">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionRenderer({ section }: { section: SectionData }) {
  const metrics = section.key_metrics ? Object.entries(section.key_metrics) : [];
  const industryMetrics = section.industry_metrics ? Object.entries(section.industry_metrics) : [];
  const workflowSteps = section.workflow || section.workflow_between_dentists_and_labs?.steps;

  return (
    <>
      {section.section_label && <SectionBadge label={section.section_label} />}

      {metrics.length > 0 && <MetricsGrid metrics={metrics} />}
      {industryMetrics.length > 0 && <MetricsGrid metrics={industryMetrics} title="Indicadores de la Industria" />}

      {section.geographic_distribution && <GeographicSection data={section} />}
      {section.market_structure && <MarketStructureSection data={section} />}
      {section.services_provided_by_labs && <ServicesGrid services={section.services_provided_by_labs} />}
      {workflowSteps && <WorkflowTimeline steps={workflowSteps} />}
      {section.communication_methods && <CommunicationMethodsSection methods={section.communication_methods} />}
      {section.pain_points && <PainPointsSection painPoints={section.pain_points} />}
      {section.industry_trends && <TrendsSection trends={section.industry_trends} />}

      {section.market_model && <MarketModelSection model={section.market_model} />}
      {section.assumptions && <AssumptionsSection assumptions={section.assumptions} />}
      {section.market_calculation && <MarketCalculationSection calculation={section.market_calculation} />}
      {section.market_segments && <MarketSegmentsSection segments={section.market_segments} />}
      {section.regional_opportunity && <RegionalOpportunitySection regions={section.regional_opportunity} />}

      {section.technology_trends && <TechnologyTrendsSection trends={section.technology_trends} />}
      {section.industry_shift && <IndustryShiftSection shift={section.industry_shift} />}
    </>
  );
}

interface NavItem {
  id: string;
  label: string;
}

function getNavItems(sections: SectionData[]): NavItem[] {
  return [
    ...sections.map((s) => ({ id: s.section_id, label: s.section_label || s.title })),
    { id: 'insights', label: 'Hallazgos' },
    { id: 'sources', label: 'Fuentes' },
  ];
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function TopNav({ items, activeId }: { items: NavItem[]; activeId: string }) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    const active = navRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement;
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <nav className="xl:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12">
      <div
        ref={navRef}
        className="flex gap-1 overflow-x-auto py-3 scrollbar-hide max-w-6xl mx-auto"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-id={item.id}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(item.id);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeId === item.id
                ? 'bg-[#2563eb] text-white'
                : 'text-[#6b7280] hover:bg-gray-100 hover:text-[#111111]'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function SideNav({ items, activeId }: { items: NavItem[]; activeId: string }) {
  return (
    <nav className="hidden xl:block fixed right-6 top-1/2 -translate-y-1/2 z-30">
      <div className="flex flex-col items-end gap-3 py-4">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
              className="group relative flex items-center"
            >
              {/* Label — always visible when active, tooltip on hover when inactive */}
              <span
                className={`absolute right-full mr-3 text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 text-[#2563eb]'
                    : 'opacity-0 group-hover:opacity-100 text-[#6b7280]'
                }`}
              >
                {item.label}
              </span>
              {/* Dot */}
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-3 h-3 bg-[#2563eb] shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                    : 'w-2 h-2 bg-gray-300 group-hover:bg-gray-500 group-hover:scale-125'
                }`}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default function DentalMarketDashboard() {
  const [sections, setSections] = useState<SectionData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    fetch('/dental-market/manifest.json')
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el manifiesto');
        return r.json();
      })
      .then((files: string[]) =>
        Promise.all(
          files.map((f) =>
            fetch(`/dental-market/${f}`).then((r) => {
              if (!r.ok) throw new Error(`No se pudo cargar ${f}`);
              return r.json();
            })
          )
        )
      )
      .then(setSections)
      .catch((err) => setError(err.message));
  }, []);

  const handleScroll = useCallback(() => {
    if (!sections) return;
    const ids = [...sections.map((s) => s.section_id), 'insights', 'sources'];
    const offset = 100;
    let current = ids[0];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= offset) {
        current = id;
      }
    }
    setActiveId(current);
  }, [sections]);

  useEffect(() => {
    if (!sections) return;
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, handleScroll]);

  if (error) return <ErrorMessage message={error} />;
  if (!sections) return <LoadingSpinner />;

  const allInsights = sections.flatMap((s) => s.insights || []);
  const allSources = collectAllSources(sections);

  return (
    <DashboardWrapper>
      <DashboardHeader
        title="Estudio de Mercado Dental en México"
        subtitle="Panorama del mercado dental y de laboratorios dentales — métricas, estructura, servicios y tendencias"
        lastUpdated={sections[0]?.last_updated || '2026'}
      />

      <TopNav items={getNavItems(sections)} activeId={activeId} />
      <SideNav items={getNavItems(sections)} activeId={activeId} />

      {sections.map((section, i) => (
        <div key={section.section_id} id={section.section_id} className="scroll-mt-20">
          {i > 0 && <SectionDivider />}
          <SectionRenderer section={section} />
        </div>
      ))}

      <SectionDivider />
      <div id="insights" className="scroll-mt-20">
        <InsightsSection insights={allInsights} />
      </div>
      <div id="sources" className="scroll-mt-20">
        <SourcesSection sources={allSources} />
      </div>
    </DashboardWrapper>
  );
}
