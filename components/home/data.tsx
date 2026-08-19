import type { ReactNode } from 'react';

export const MONO = 'var(--font-jetbrains-mono), monospace';
export const SANS = 'var(--font-space-grotesk), sans-serif';

export const NAV_LINKS = [
  { href: '#work', label: 'work' },
  { href: '#tools', label: 'the pile' },
  { href: '#explore', label: 'explore' },
  { href: '#demo', label: 'live demo' },
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

const hi = (s: string) => <b style={{ color: '#e8e2da', fontWeight: 600 }}>{s}</b>;

export const PROJECTS: Project[] = [
  {
    href: 'https://fastlane.paypal.com/',
    tag: 'PayPal · lead',
    tagColor: '#8da0ff',
    tagBorder: '#2c3358',
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
    tagColor: '#8da0ff',
    tagBorder: '#2c3358',
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
    tagColor: '#ff6a3d',
    tagBorder: '#4a2c20',
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
    tagColor: '#ff6a3d',
    tagBorder: '#4a2c20',
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
];

/** Mirrors /tools — kept in the same order so the two pages never disagree. */
export const TOOL_GROUPS: { label: string; accent: string; tools: { name: string; icon: string }[] }[] = [
  {
    label: 'business & utility',
    accent: '#8da0ff',
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
    accent: '#ffd089',
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
    accent: '#7ed47a',
    tools: [
      { name: '3D Model Viewer', icon: '🧊' },
      { name: 'Paint by Numbers', icon: '🖌️' },
      { name: 'Wheel of Fortune', icon: '🎡' },
      { name: 'The Puzzle', icon: '🧩' },
      { name: 'Aprende Guitarra', icon: '🎸' },
      { name: 'Aprende a Cantar', icon: '🎤' },
      { name: 'Exercise Routine', icon: '💪' },
      { name: 'Quehaceres del Depa', icon: '🧹' },
    ],
  },
];

export const TOOL_COUNT = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);
