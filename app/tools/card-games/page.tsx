import Link from 'next/link';
import CardGames from '@/components/tools/card-games';

export const metadata = {
  title: 'Card Games | Jorge Romero Romanis',
  description: 'Play Texas Hold\'em Poker with friends in real-time. No accounts needed — just create a room and share the link.',
};

export default async function CardGamesPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Card Games
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Play Texas Hold&apos;em Poker with friends in real-time. Create a room and share the link — no accounts needed.
        </p>
      </div>

      <CardGames initialRoomCode={params.room} />
    </div>
  );
}
