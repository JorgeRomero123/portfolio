import Link from 'next/link';
import CVTailor from '@/components/tools/CVTailor';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'CV Tailor | Jorge Romero Romanis',
  description: 'Tailor your CV to a specific job vacancy using AI. Upload your PDF CV and paste the job description.',
};

export default function CVTailorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
      >
        <svg
          className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Tools
      </Link>

      <PasswordGate password="1234" storageKey="cv-tailor-access">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            CV Tailor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Paste a job vacancy and upload your CV as a PDF. AI will rewrite
            your CV tailored to the role — without fabricating any experience.
          </p>
        </div>

        <CVTailor />
      </PasswordGate>
    </div>
  );
}
