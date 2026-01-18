import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Background Image */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://cdn.jorgeromeroromanis.com/gallery/4fd284a0-6e88-422c-a565-9068f5a7e546.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              Jorge Romero Romanis
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto drop-shadow-lg">
              Software Engineer | Creative Explorer | 360° Storyteller
            </p>
            <p className="text-lg text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-lg">
              Welcome to my creative portfolio! Explore my photography, immersive 360° tours,
              videos, and interactive projects. This is where engineering meets creativity.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/gallery"
                className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                View Gallery
              </Link>
              <Link
                href="/tours"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-colors shadow-lg"
              >
                Explore 360° Tours
              </Link>
            </div>
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

      {/* 3D Capture Showcase */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              3D Capture
            </h2>
            <p className="text-lg text-gray-600">
              Explore immersive 3D scans and captures
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Gaussian Splatting
              </h3>
              <iframe
                src="https://poly.cam/capture/9a5891db-0c2d-4a91-a2a1-16de6360379a/embed"
                title="Gaussian Splatting capture"
                style={{
                  height: '100%',
                  width: '100%',
                  maxHeight: '720px',
                  maxWidth: '1280px',
                  minHeight: '400px',
                  minWidth: '280px'
                }}
                className="rounded-lg shadow-xl"
                frameBorder="0"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Photogrammetry
              </h3>
              <iframe
                src="https://poly.cam/capture/a1dbaa12-b9ab-43d2-a8d5-e410222de8a2/embed"
                title="Photogrammetry capture"
                style={{
                  height: '100%',
                  width: '100%',
                  maxHeight: '720px',
                  maxWidth: '1280px',
                  minHeight: '400px',
                  minWidth: '280px'
                }}
                className="rounded-lg shadow-xl"
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="bg-gray-50 py-16">
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
      <section className="bg-white py-16">
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
