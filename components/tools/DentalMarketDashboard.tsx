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
  formatMetricValue,
  formatInsightType,
  DashboardWrapper,
  DashboardHeader,
  SectionTitle,
  SectionHeader,
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
  CompetitorsSection,
  CompetitiveDimensionsSection,
  ClientSegmentsSection,
  KeyFindingsSection,
  StrategicTakeawaysSection,
  DemandDriversSection,
  PatientBehaviorSection,
  OpportunitiesSection,
  StrategicImplicationsSection,
  SectionKeyTakeaways,
  DentalTourismSection,
  SpendingSegmentsSection,
  GeographicRegionsSection,
  MarketEvolutionTimeline,
  RegulatorySection,
  LoadingSpinner,
  ErrorMessage,
  collectAllSources,
  ChatWidget,
} from './dental-market/shared';

const ACCENT = '#2563eb';
const MUTED = '#6b7280';
const PIE_COLORS = ['#2563eb', '#e5e7eb'];

const SECTION_INTROS: Record<string, string> = {
  executive_summary: 'Este reporte analiza la estructura, el tamaño y las tendencias del mercado de laboratorios dentales en México. A partir de datos de la industria, procesos operativos y dinámicas de demanda, se identifican los factores clave que están moldeando el sector y las oportunidades estratégicas para laboratorios como Fusion Dental Lab.',
  mexico_dental_market_overview: 'La industria dental en México es amplia y altamente fragmentada, con decenas de miles de consultorios dentales operando en todo el país. Comprender el tamaño, la distribución geográfica y la estructura de este mercado permite contextualizar la demanda por servicios de laboratorio dental.',
  dental_laboratories_market_mexico: 'Los laboratorios dentales son un componente esencial del ecosistema odontológico, ya que fabrican restauraciones, prótesis y soluciones estéticas prescritas por los dentistas. Analizar este segmento permite entender cómo se genera valor dentro de la cadena de servicios dentales.',
  market_size_estimation: 'Estimar el tamaño del mercado de laboratorios dentales permite dimensionar la oportunidad económica disponible para los laboratorios que atienden a dentistas en México. A partir del número de dentistas activos, el volumen promedio de casos y los precios por restauración, es posible aproximar el valor anual del mercado.',
  dental_industry_processes_and_pain_points: 'Los laboratorios dentales trabajan como socios técnicos de los dentistas, transformando especificaciones clínicas en restauraciones físicas para los pacientes. Analizar este flujo de trabajo permite identificar ineficiencias operativas y áreas donde la digitalización puede mejorar la coordinación entre clínicas y laboratorios.',
  dental_technology_trends: 'La innovación tecnológica está transformando rápidamente la forma en que se diseñan y fabrican las restauraciones dentales. Tecnologías como los escáneres intraorales, los sistemas CAD/CAM y la impresión 3D están permitiendo procesos más rápidos, precisos y escalables dentro de los laboratorios dentales.',
  dental_laboratory_competitors: 'El mercado de laboratorios dentales está compuesto por una amplia variedad de actores que van desde pequeños talleres técnicos hasta laboratorios altamente digitalizados. Analizar a los competidores permite entender cómo se posicionan diferentes laboratorios en términos de tecnología, especialización y servicios.',
  dental_client_segments: 'Los laboratorios dentales atienden a diferentes tipos de clientes dentro del sector odontológico, desde consultorios independientes hasta clínicas especializadas en estética o implantología. Identificar estos segmentos permite comprender cómo varía la demanda de servicios de laboratorio según el tipo de práctica dental.',
  patient_demand_trends: 'La demanda de tratamientos dentales está influenciada por factores demográficos, económicos y culturales. Tendencias como el crecimiento de la estética dental, el envejecimiento poblacional y el turismo dental están impulsando un mayor volumen de tratamientos que requieren servicios de laboratorio.',
  strategic_opportunities: 'A partir del análisis del mercado, la estructura de la industria y las tendencias tecnológicas, se pueden identificar varias oportunidades estratégicas para los laboratorios dentales. Estas oportunidades reflejan áreas donde los laboratorios pueden diferenciarse, expandir su alcance y capturar mayor valor dentro del mercado.',
  fusion_strategic_implications: 'A partir del análisis del mercado dental mexicano, las tendencias tecnológicas y la estructura del sector, se identifican implicaciones estratégicas relevantes para laboratorios dentales con posicionamiento premium y capacidades digitales avanzadas como Fusion Dental Lab.',
  dental_tourism_mexico: 'México se ha posicionado como uno de los principales destinos de turismo dental a nivel global. La proximidad con Estados Unidos, los costos significativamente menores y la alta calidad de los tratamientos han generado un flujo constante de pacientes internacionales que representan una oportunidad para laboratorios dentales.',
  patient_spending_analysis: 'El análisis del gasto en tratamientos dentales revela segmentos diferenciados con comportamientos de compra distintos. Comprender estos patrones permite a los laboratorios dentales diseñar estrategias de precio y servicio alineadas con cada tipo de paciente.',
  geographic_market_distribution: 'La distribución geográfica del mercado dental en México presenta dinámicas regionales distintas, desde el turismo dental en el norte hasta la alta densidad de clínicas en el centro del país. Estas diferencias regionales definen oportunidades específicas para los laboratorios.',
  market_evolution_timeline: 'La industria dental ha atravesado una transformación significativa en la última década, migrando de procesos completamente manuales hacia flujos digitales integrados. Esta evolución marca el rumbo de la inversión tecnológica para laboratorios que buscan mantenerse competitivos.',
  regulatory_and_official_data: 'El sector dental en México opera bajo un marco regulatorio definido por instituciones como COFEPRIS e INEGI. Los datos oficiales permiten dimensionar la industria y entender los requisitos normativos que los laboratorios deben cumplir.',
};

function buildHeroMetrics(sections: SectionData[]): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];

  // Find key metrics across sections
  for (const section of sections) {
    if (section.key_metrics) {
      const km = section.key_metrics;
      if (km.dentists_total_estimated) {
        metrics.push({ value: formatMetricValue(km.dentists_total_estimated), label: 'Dentistas en México' });
      }
      if (km.industry_revenue) {
        metrics.push({ value: formatMetricValue(km.industry_revenue), label: 'Ingresos de la Industria' });
      }
    }
    if (section.market_calculation) {
      const mc = section.market_calculation;
      if (mc.total_market_value_mxn) {
        metrics.push({
          value: mc.total_market_value_mxn.currency
            ? formatNumber(mc.total_market_value_mxn.value, mc.total_market_value_mxn.currency)
            : formatNumber(mc.total_market_value_mxn.value),
          label: 'Mercado de Laboratorios',
        });
      }
    }
    if (section.industry_metrics) {
      const im = section.industry_metrics;
      if (im.estimated_dental_labs) {
        metrics.push({ value: formatMetricValue(im.estimated_dental_labs), label: 'Laboratorios Dentales' });
      }
    }
  }

  return metrics.slice(0, 4);
}

function GeographicSection({ data }: { data: SectionData }) {
  const geo = data.geographic_distribution!;
  const states = geo.top_states_by_dental_activity;
  const maxUnits = Math.max(...states.map((s) => s.economic_units));

  return (
    <section className="mb-14">
      <h3 className="text-xl font-extrabold text-[#111111] mb-2 tracking-tight">
        Principales Estados por Actividad Dental
      </h3>
      <p className="text-sm text-[#6b7280] mb-8">{geo.note}</p>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-10">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="economic_units" fill={ACCENT} radius={[0, 8, 8, 0]} />
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
    <section className="mb-14">
      <SectionTitle>Estructura del Mercado</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm flex items-center justify-center">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {entries.map(([key, entry]) => (
            <div key={key} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-4xl font-extrabold text-[#111111] mb-1">{entry.value}%</p>
              <p className="text-sm font-bold text-[#2563eb] uppercase tracking-wider mb-2">
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

function SectionRenderer({ section, index }: { section: SectionData; index: number }) {
  const metrics = section.key_metrics ? Object.entries(section.key_metrics) : [];
  const industryMetrics = section.industry_metrics ? Object.entries(section.industry_metrics) : [];
  const workflowSteps = section.workflow || section.workflow_between_dentists_and_labs?.steps;

  return (
    <>
      <SectionHeader
        number={index + 1}
        label={section.section_label}
        title={section.title}
        description={section.description}
        intro={SECTION_INTROS[section.section_id]}
      />

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

      {section.competitors && <CompetitorsSection competitors={section.competitors} />}
      {section.competitive_dimensions && <CompetitiveDimensionsSection dimensions={section.competitive_dimensions} />}
      {section.segments && <ClientSegmentsSection segments={section.segments} />}

      {section.key_findings && <KeyFindingsSection findings={section.key_findings} />}
      {section.strategic_takeaways && <StrategicTakeawaysSection takeaways={section.strategic_takeaways} />}
      {section.demand_drivers && <DemandDriversSection drivers={section.demand_drivers} />}
      {section.patient_behavior_changes && <PatientBehaviorSection changes={section.patient_behavior_changes} />}
      {section.opportunities && <OpportunitiesSection opportunities={section.opportunities} />}
      {section.strategic_implications && <StrategicImplicationsSection implications={section.strategic_implications} />}
      {section.key_takeaways && <SectionKeyTakeaways takeaways={section.key_takeaways} />}

      {section.key_destinations && section.drivers && <DentalTourismSection destinations={section.key_destinations} drivers={section.drivers} />}
      {section.spending_segments && <SpendingSegmentsSection segments={section.spending_segments} />}
      {section.regions && <GeographicRegionsSection regions={section.regions} />}
      {section.timeline && <MarketEvolutionTimeline timeline={section.timeline} />}
      {section.institutions && section.official_metrics && <RegulatorySection institutions={section.institutions} keyMetrics={section.official_metrics} />}

      {/* Per-section insights */}
      {section.insights && section.insights.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-bold text-[#111111]">Hallazgos de esta sección</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {section.insights.map((insight, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-7 border border-blue-100/80">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Insight</span>
                </div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-4">
                  {formatInsightType(insight.type)}
                </span>
                <p className="text-[15px] text-[#111111] leading-[1.7] mb-4">{insight.description}</p>
                {insight.implication_for_labs && (
                  <div className="bg-white/90 border-l-4 border-blue-600 rounded-r-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Implicación para Laboratorios</p>
                    <p className="text-sm text-[#111111] leading-relaxed">{insight.implication_for_labs}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
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
    <nav className="xl:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12 print:hidden">
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
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeId === item.id
                ? 'bg-[#2563eb] text-white shadow-sm shadow-blue-200'
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
    <nav className="hidden xl:block fixed right-6 top-1/2 -translate-y-1/2 z-30 print:!hidden">
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
              <span
                className={`absolute right-full mr-3 text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 text-[#2563eb]'
                    : 'opacity-0 group-hover:opacity-100 text-[#6b7280]'
                }`}
              >
                {item.label}
              </span>
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
  const [showBackToTop, setShowBackToTop] = useState(false);

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
    setShowBackToTop(window.scrollY > 400);
  }, [sections]);

  const handleDownloadPDF = useCallback(() => {
    document.body.classList.add('printing-report');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-report');
    }, 100);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
  const heroMetrics = buildHeroMetrics(sections);

  return (
    <DashboardWrapper>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body.printing-report nav,
          body.printing-report .print\\:hidden,
          body.printing-report button[aria-label],
          body.printing-report #back-to-top-btn { display: none !important; }
          body.printing-report { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      ` }} />

      <DashboardHeader
        title="Estudio de Mercado Dental en México"
        subtitle="Panorama del mercado dental y de laboratorios dentales — métricas, estructura, servicios y tendencias"
        lastUpdated={sections[0]?.last_updated || '2026'}
        heroMetrics={heroMetrics}
        onDownloadPDF={handleDownloadPDF}
      />

      <TopNav items={getNavItems(sections)} activeId={activeId} />
      <SideNav items={getNavItems(sections)} activeId={activeId} />

      {sections.map((section, i) => (
        <div key={section.section_id} id={section.section_id} className="scroll-mt-24">
          {i > 0 && <SectionDivider />}
          <SectionRenderer section={section} index={i} />
        </div>
      ))}

      <SectionDivider />
      <div id="insights" className="scroll-mt-24">
        <InsightsSection insights={allInsights} />
      </div>

      {/* Key Takeaways — final summary from first 4 insights */}
      {allInsights.length > 0 && (
        <>
          <SectionDivider />
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] mb-3 tracking-tight">Conclusiones del Estudio</h2>
              <p className="text-base sm:text-lg text-[#6b7280]">Resumen ejecutivo de los hallazgos más relevantes para la toma de decisiones</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {allInsights.slice(0, 4).map((insight, i) => (
                <div key={i} className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden flex hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-1.5 bg-blue-600 shrink-0" />
                  <div className="p-6">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">
                      Conclusión {i + 1}
                    </span>
                    <p className="text-[15px] text-[#111111] leading-[1.7] font-medium">{insight.description}</p>
                    {insight.implication_for_labs && (
                      <p className="text-sm text-[#6b7280] mt-3 leading-relaxed">{insight.implication_for_labs}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <SectionDivider />
      <div id="sources" className="scroll-mt-24">
        <SourcesSection sources={allSources} />
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          id="back-to-top-btn"
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full bg-white text-gray-600 shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl hover:text-[#2563eb] transition-all duration-200 flex items-center justify-center print:hidden"
          aria-label="Volver arriba"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      <ChatWidget sections={sections} />
    </DashboardWrapper>
  );
}
