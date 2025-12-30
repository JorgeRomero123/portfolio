import { getAboutContent } from '@/lib/content';
import ReactMarkdown from 'react-markdown';

export const metadata = {
  title: 'About | Jorge Romero Romanis',
  description: 'Learn more about Jorge Romero Romanis',
};

export default async function AboutPage() {
  const content = await getAboutContent();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-4xl font-bold text-gray-900 mb-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-3xl font-semibold text-gray-900 mt-8 mb-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-600 mb-4 leading-relaxed">{children}</p>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-blue-600 hover:text-blue-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">{children}</ol>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
