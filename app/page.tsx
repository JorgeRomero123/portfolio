import Link from 'next/link';
import ParallaxHero from '@/components/ParallaxHero';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Parallax Effect */}
      <ParallaxHero />

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

      {/* Drone Footage Showcase */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Aerial Videography
            </h2>
            <p className="text-lg text-gray-600">
              Stunning drone footage capturing unique perspectives
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
                src="https://www.youtube.com/embed/mLDi3wrbtpc?si=NFQJJMPjjCzVupzO"
                title="Weekend House Drone Footage"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="text-center text-gray-500 mt-4">
              Weekend house aerial tour
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Showcase */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pinta tu Mascota
            </h2>
            <p className="text-lg text-gray-600">
              Enero 2026
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative w-full overflow-hidden rounded-lg shadow-xl" style={{ paddingBottom: '75%' }}>
              <iframe
                src="https://myalbumlink.com/albums/pinta-tu-mascota-enero-2026?embed=true"
                title="Pinta tu Mascota Enero 2026"
                className="absolute top-0 left-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects I've Built */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Projects I've Built
            </h2>
            <p className="text-lg text-gray-600">
              Web applications I designed and developed
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">MyAlbumLink</h3>
              <p className="text-gray-600">
                A platform for creating and sharing multimedia albums — photos, videos, 360° content,
                documents, and more — all in one beautiful, shareable link.
              </p>
              <a
                href="https://myalbumlink.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-600 font-semibold hover:text-blue-700"
              >
                myalbumlink.com →
              </a>
              <a
                href="https://myalbumlink.com/albums/jorge-fotografia-aerea"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sm text-blue-500 hover:text-blue-700"
              >
                See an example album →
              </a>
            </div>
            <a
              href="https://labwiselink.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">LabWiseLink</h3>
              <p className="text-gray-600">
                A dental lab management platform that streamlines order tracking and communication
                between dental professionals and laboratories.
              </p>
              <span className="inline-block mt-4 text-blue-600 font-semibold">
                labwiselink.com →
              </span>
            </a>
          </div>
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

      {/* Contact Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Contact Me
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Have a question or want to work together? Feel free to reach out!
          </p>
          <a
            href="mailto:jorgeromanis@yahoo.com.mx"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            jorgeromanis@yahoo.com.mx
          </a>
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
