import Link from 'next/link';
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/AnimateIn';
import { TOOL_CATEGORIES } from '@/lib/tools';

export const metadata = {
  title: 'Interactive Tools | Jorge Romero Romanis',
  description: 'Fun interactive tools and experiments',
};

// The games are single static HTML files in public/games: a plain link loads them as full pages.
function ToolLink({ href, children }: { href: string; children: React.ReactNode }) {
  return href.endsWith('.html') ? <a href={href}>{children}</a> : <Link href={href}>{children}</Link>;
}

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimateIn className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Interactive Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {`${TOOL_CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0)} browser-based tools I've built with Next.js and TypeScript.`}
        </p>
      </AnimateIn>

      <div className="space-y-12">
        {TOOL_CATEGORIES.map((category) => (
          <AnimateIn key={category.label}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {category.label}
            </h2>
            <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" staggerDelay={0.04}>
              {category.tools.map((tool) => (
                <StaggerItem key={tool.href}>
                  <ToolLink href={tool.href}>
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
                  </ToolLink>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}
