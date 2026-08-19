import Link from 'next/link';
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/AnimateIn';

export const metadata = {
  title: 'Interactive Tools | Jorge Romero Romanis',
  description: 'Fun interactive tools and experiments',
};

interface Tool {
  name: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

const categories: { label: string; tools: Tool[] }[] = [
  {
    label: 'Business & Utility',
    tools: [
      { name: 'CV Tailor', description: 'AI-powered CV tailoring for job vacancies', href: '/tools/cv-tailor', icon: '📄', color: 'from-blue-600 to-indigo-600' },
      { name: 'CFDI XML Grouper', description: 'Group invoices by RFC and download as ZIP', href: '/tools/cfdi-xml-grouper', icon: '📄', color: 'from-blue-600 to-indigo-600' },
      { name: 'CFDI Excel Processor', description: 'Clean CFDI files, filter columns, calculate totals', href: '/tools/cfdi-excel-processor', icon: '📊', color: 'from-blue-600 to-indigo-600' },
      { name: 'Ficha Técnica', description: 'Generate real estate property listing PDFs', href: '/tools/ficha-tecnica', icon: '🏠', color: 'from-blue-600 to-indigo-600' },
      { name: 'YouTube Transcript', description: 'Extract transcripts from any YouTube video', href: '/tools/youtube-transcript', icon: '📝', color: 'from-blue-600 to-indigo-600' },
      { name: 'Client Intake', description: 'AI-assisted intake form for web projects', href: '/tools/client-intake', icon: '📋', color: 'from-blue-600 to-indigo-600' },
      { name: 'Travel Time Calculator', description: 'Calculate driving times from multiple origins', href: '/tools/travel-time-calculator', icon: '🗺️', color: 'from-blue-600 to-indigo-600' },
      { name: 'Estudio Dental México', description: 'Estudio de mercado dental en México', href: '/tools/dental-market', icon: '🦷', color: 'from-blue-600 to-indigo-600' },
    ],
  },
  {
    label: 'Image & Media',
    tools: [
      { name: 'Background Remover', description: 'AI-powered background removal with manual refinement', href: '/tools/background-remover', icon: '✂️', color: 'from-amber-500 to-orange-600' },
      { name: 'Photo Editor', description: 'Grid alignment, auto-levels, white balance, and color correction', href: '/tools/photo-editor', icon: '🎨', color: 'from-amber-500 to-orange-600' },
      { name: 'HEIC to PNG', description: 'Convert iPhone photos to PNG', href: '/tools/heic-converter', icon: '📱', color: 'from-amber-500 to-orange-600' },
      { name: 'WebP Converter', description: 'Optimize images with WebP compression', href: '/tools/webp-converter', icon: '🖼️', color: 'from-amber-500 to-orange-600' },
      { name: 'Image Splitter', description: 'Split images into grid layouts', href: '/tools/image-splitter', icon: '🔲', color: 'from-amber-500 to-orange-600' },
      { name: 'Image Opacity', description: 'Adjust opacity and export as transparent PNG', href: '/tools/image-opacity', icon: '👻', color: 'from-amber-500 to-orange-600' },
      { name: 'Video to WebM', description: 'Trim and convert video to WebM', href: '/tools/video-to-webm', icon: '🎬', color: 'from-amber-500 to-orange-600' },
      { name: 'Pinterest Downloader', description: 'Download board images as a ZIP', href: '/tools/pinterest-downloader', icon: '📌', color: 'from-amber-500 to-orange-600' },
      { name: 'Camera Tracer', description: 'Overlay an image on your live camera to trace by hand', href: '/tools/camera-tracer', icon: '📷', color: 'from-amber-500 to-orange-600' },
    ],
  },
  {
    label: 'Interactive & Fun',
    tools: [
      { name: '3D Model Viewer', description: 'View and interact with 3D models', href: '/tools/3d-models', icon: '🧊', color: 'from-emerald-500 to-teal-600' },
      { name: 'Paint by Numbers', description: 'Generate templates with acrylic paint recipes', href: '/tools/paint-by-numbers', icon: '🖌️', color: 'from-emerald-500 to-teal-600' },
      { name: 'Wheel of Fortune', description: 'Spin the wheel for random decisions', href: '/tools/wheel-of-fortune', icon: '🎡', color: 'from-emerald-500 to-teal-600' },
      { name: 'The Puzzle', description: 'A mystery challenge for curious minds', href: '/tools/puzzle', icon: '🧩', color: 'from-emerald-500 to-teal-600' },
      { name: 'Aprende Guitarra', description: 'Level-based course with mic-verified chord practice', href: '/tools/guitarra', icon: '🎸', color: 'from-emerald-500 to-teal-600' },
      { name: 'Aprende a Cantar', description: 'Pitch training that transposes every level to your vocal range', href: '/tools/canto', icon: '🎤', color: 'from-emerald-500 to-teal-600' },
      { name: 'Mi Rutina', description: 'Rutina diaria con racha, niveles y modo depa o parque', href: '/tools/exercise-routine', icon: '💪', color: 'from-emerald-500 to-teal-600' },
      { name: 'Quehaceres del Depa', description: 'Chore tracker with email reminders', href: '/tools/quehaceres', icon: '🧹', color: 'from-emerald-500 to-teal-600' },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimateIn className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Interactive Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {`${categories.reduce((sum, c) => sum + c.tools.length, 0)} browser-based tools I've built with Next.js and TypeScript.`}
        </p>
      </AnimateIn>

      <div className="space-y-12">
        {categories.map((category) => (
          <AnimateIn key={category.label}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {category.label}
            </h2>
            <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" staggerDelay={0.04}>
              {category.tools.map((tool) => (
                <StaggerItem key={tool.href}>
                  <Link href={tool.href}>
                    <div className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                      <span className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-xl`}>
                        {tool.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}
