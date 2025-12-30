import { getVideosData } from '@/lib/content';
import VideoEmbed from '@/components/VideoEmbed';

export const metadata = {
  title: 'Videos | Jorge Romero Romanis',
  description: 'Watch my video content on YouTube',
};

export default async function VideosPage() {
  const data = await getVideosData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Videos
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore my video content and creative projects on YouTube.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {data.videos.map((video) => (
          <div key={video.id} className="space-y-4">
            <VideoEmbed youtubeId={video.youtubeId} title={video.title} />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-gray-600">{video.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
