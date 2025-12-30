import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Jorge Romero Romanis
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Software Engineer | Creative Explorer | 360° Storyteller
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Welcome to my creative portfolio! Explore my photography, immersive 360° tours,
            videos, and interactive projects. This is where engineering meets creativity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/gallery"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Gallery
            </Link>
            <Link
              href="/tours"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Explore 360° Tours
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            title="Photo Gallery"
            description="A collection of my favorite shots"
            href="/gallery"
            icon="📸"
          />
          <FeatureCard
            title="Videos"
            description="Creative content on YouTube"
            href="/videos"
            icon="🎥"
          />
          <FeatureCard
            title="360° Tours"
            description="Immersive virtual experiences"
            href="/tours"
            icon="🌐"
          />
          <FeatureCard
            title="Interactive Tools"
            description="Fun projects and experiments"
            href="/tools"
            icon="🛠️"
          />
        </div>
      </section>

      {/* About Preview */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            About Me
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            I'm a software engineer who loves building things - from code to creative content.
            This portfolio is a fun playground where I showcase my photography, 360° tours,
            and various interactive projects.
          </p>
          <Link
            href="/about"
            className="text-blue-600 font-semibold hover:text-blue-700"
          >
            Learn more about me →
          </Link>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

function FeatureCard({ title, description, href, icon }: FeatureCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
