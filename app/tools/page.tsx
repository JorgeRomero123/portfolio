import Link from 'next/link';

export const metadata = {
  title: 'Interactive Tools | Jorge Romero Romanis',
  description: 'Fun interactive tools and experiments',
};

const tools = [
  {
    name: 'Wheel of Fortune',
    description: 'Spin the wheel to make random decisions',
    href: '/tools/wheel-of-fortune',
    icon: '🎡',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'The Puzzle',
    description: 'A mystery challenge for curious minds',
    href: '/tools/puzzle',
    icon: '🧩',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'HEIC to PNG Converter',
    description: 'Convert iPhone photos to PNG format',
    href: '/tools/heic-converter',
    icon: '📱',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Image to WebP Converter',
    description: 'Optimize images with WebP compression',
    href: '/tools/webp-converter',
    icon: '🖼️',
    color: 'from-green-500 to-emerald-500',
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Interactive Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Fun web apps and experiments I've built for entertainment and learning.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className={`bg-gradient-to-br ${tool.color} p-12 flex items-center justify-center`}>
                <span className="text-8xl">{tool.icon}</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {tool.name}
                </h3>
                <p className="text-gray-600">{tool.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
