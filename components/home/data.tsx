import type { ReactNode } from 'react';

/** The single accent. Change it here and the whole page follows. */
export const ACCENT = '#0070f3';

export const MONO = 'var(--font-jetbrains-mono), monospace';
export const SANS = 'var(--font-space-grotesk), sans-serif';

/** `hideXs` drops the link below 430px, where five of them stop fitting. */
export const NAV_LINKS: { href: string; label: string; hideXs?: boolean }[] = [
  { href: '#work', label: 'work' },
  { href: '#clients', label: 'clients' },
  { href: '#tools', label: 'the pile' },
  { href: '#explore', label: 'explore', hideXs: true },
  { href: '#contact', label: 'contact' },
];

export const TECH = [
  'NEXT.JS', 'REACT', 'TYPESCRIPT', 'C#', 'THREE.JS',
  'WEBGL', 'GLSL', 'STRIPE', 'NODE', 'POSTGRES', '360° IMAGING',
];

/** Counters animate from 0 — `value` is the number, `suffix` the decoration. */
export const STATS = [
  { value: 200, suffix: 'k+', label: 'monthly users on a portal I co-led at PayPal' },
  { value: 400, suffix: '%',  label: 'DAU growth I helped ship at Microsoft Bing' },
  { value: 25,  suffix: '',   label: 'tools on this site, built for an audience of mostly me' },
  { value: 2,   suffix: '',   label: 'SaaS products running solo — billing, auth, the boring parts too' },
];

/** The stuff a résumé leaves out. */
export const TRUTHS: { k: string; v: ReactNode }[] = [
  { k: 'based in', v: <>México. Half my side projects are in Spanish because that&rsquo;s who I build them for.</> },
  { k: 'allegiance', v: <>Tottenham Hotspur, for my sins. There is an entire route on this site about it.</> },
  { k: 'currently learning', v: <>Guitar and singing — so naturally I built two apps that listen to me and grade me.</> },
  { k: 'also does', v: <>Photography, drone video, and 360° tours for real clients.</> },
];

export type Project = {
  href: string;
  tag: string;
  tagColor: string;
  tagBorder: string;
  title: string;
  body: ReactNode;
  tech: string[];
  cardBg?: string;
  cardBorder?: string;
};

const hi = (s: string) => <b style={{ color: '#0b1b3a', fontWeight: 600 }}>{s}</b>;

export const PROJECTS: Project[] = [
  {
    href: 'https://fastlane.paypal.com/',
    tag: 'PayPal · lead',
    tagColor: '#5b7fc7',
    tagBorder: '#c9d8f0',
    title: 'Fastlane',
    body: (
      <>
        Technical co-lead for the profile-management portal — empty repo to production.
        Kept the Next.js app healthy for {hi('200k+ monthly users')} and led its expansion
        across continents.
      </>
    ),
    tech: ['Next.js', 'React', 'i18n'],
  },
  {
    href: 'https://www.bing.com/images?FORM=Z9LH',
    tag: 'Microsoft',
    tagColor: '#5b7fc7',
    tagBorder: '#c9d8f0',
    title: 'Bing Image\nInspiration Feed',
    body: (
      <>
        Drove UX dev on a 0-to-1 recommendation feed for Bing Multimedia — C#, TypeScript,
        React. Daily active users rose {hi('400% over 9 months')}. I own a slice of that
        number, not all of it, and that slice was the front end.
      </>
    ),
    tech: ['C#', 'TypeScript', 'React'],
  },
  {
    href: 'https://myalbumlink.com',
    tag: 'solo · SaaS',
    tagColor: '#0070f3',
    tagBorder: '#bcd8fb',
    title: 'MyAlbumLink',
    body: (
      <>
        Multi-tenant SaaS for sharing media albums from a single link. Auto-compressed
        photo/video uploads, 360° content, watermarking, passcodes, per-album analytics and
        tiered Stripe subscriptions. {hi('Built and run entirely solo')}.
      </>
    ),
    tech: ['Multi-tenant', 'Stripe', '360°'],
  },
  {
    href: 'https://www.labwiselink.com',
    tag: 'solo · B2B',
    tagColor: '#0070f3',
    tagBorder: '#bcd8fb',
    title: 'LabWiseLink',
    body: (
      <>
        A dental-lab order platform wiring one lab to many clinics. {hi('5-role RBAC')}, an
        order state machine with audit logging, real-time SSE alerts, file storage and
        multi-clinic doctor support. B2B software is deeply unsexy and I loved every part
        of building it.
      </>
    ),
    tech: ['RBAC', 'SSE', 'State machine'],
  },
  {
    href: 'https://artoverlay.com',
    tag: 'solo · free',
    tagColor: '#0070f3',
    tagBorder: '#bcd8fb',
    title: 'Art Overlay',
    body: (
      <>
        A tracing app that pins your reference image onto the live camera feed, so muralists,
        tattoo artists and cake decorators can trace it by hand. Perspective correction for
        tilted walls, curvature for mugs, background removal built in — and it all
        {' '}{hi('runs on the phone, nothing uploads')}. Free forever, no account. It started as
        one of the toys in the pile below and refused to stay there.
      </>
    ),
    tech: ['Camera API', 'Canvas', 'On-device'],
  },
];

export type ClientSite = {
  href: string;
  name: string;
  sector: string;
  place: string;
  body: string;
};

/** Real businesses, real invoices. Ordered by how long the site has been live. */
export const CLIENT_SITES: ClientSite[] = [
  {
    href: 'https://emarts.com.mx',
    name: 'e.marts',
    sector: 'talleres de gouache',
    place: 'Cuernavaca · Metepec',
    body: 'Elizabeth teaches gouache to people who swear they cannot paint. Public workshops, private events and corporate team building — the site sells all three and hands the booking to WhatsApp.',
  },
  {
    href: 'https://papeleria-raquel.com',
    name: 'Papelería Raquel',
    sector: 'papelería · mercería',
    place: 'Antonio Barona, Cuernavaca',
    body: 'Copies, CURP printing, binding, and thread by the metre. A neighbourhood shop that needed to be findable at 9pm when someone remembers the school supply list.',
  },
  {
    href: 'https://www.depel.com.mx',
    name: 'DEPEL',
    sector: 'ingeniería eléctrica industrial',
    place: 'Jiutepec, Morelos',
    body: 'Turnkey industrial electrical work up to 34.5 kV, running since 1999. Pharma plants read the project portfolio, then pick up the phone.',
  },
];

/** Mirrors /tools — kept in the same order so the two pages never disagree. */
export const TOOL_GROUPS: { label: string; accent: string; tools: { name: string; icon: string }[] }[] = [
  {
    label: 'business & utility',
    accent: '#0070f3',
    tools: [
      { name: 'CV Tailor', icon: '📄' },
      { name: 'CFDI XML Grouper', icon: '🗂️' },
      { name: 'CFDI Excel Processor', icon: '📊' },
      { name: 'Ficha Técnica', icon: '🏠' },
      { name: 'YouTube Transcript', icon: '📝' },
      { name: 'Client Intake', icon: '📋' },
      { name: 'Travel Time Calculator', icon: '🗺️' },
      { name: 'Estudio Dental México', icon: '🦷' },
    ],
  },
  {
    label: 'image & media',
    accent: '#0891b2',
    tools: [
      { name: 'Background Remover', icon: '✂️' },
      { name: 'Photo Editor', icon: '🎨' },
      { name: 'HEIC to PNG', icon: '📱' },
      { name: 'WebP Converter', icon: '🖼️' },
      { name: 'Image Splitter', icon: '🔲' },
      { name: 'Image Opacity', icon: '👻' },
      { name: 'Video to WebM', icon: '🎬' },
      { name: 'Pinterest Downloader', icon: '📌' },
      { name: 'Camera Tracer', icon: '📷' },
    ],
  },
  {
    label: 'interactive & fun',
    accent: '#059669',
    tools: [
      { name: '3D Model Viewer', icon: '🧊' },
      { name: 'Paint by Numbers', icon: '🖌️' },
      { name: 'Wheel of Fortune', icon: '🎡' },
      { name: 'The Puzzle', icon: '🧩' },
      { name: 'Aprende Guitarra', icon: '🎸' },
      { name: 'Aprende a Cantar', icon: '🎤' },
      { name: 'Mi Rutina', icon: '💪' },
      { name: 'Quehaceres del Depa', icon: '🧹' },
    ],
  },
];

export const TOOL_COUNT = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);
