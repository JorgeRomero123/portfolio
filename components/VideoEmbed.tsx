interface VideoEmbedProps {
  youtubeId: string;
  title: string;
}

export default function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  return (
    <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
