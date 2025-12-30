interface TourEmbedProps {
  src: string;
  title: string;
}

export default function TourEmbed({ src, title }: TourEmbedProps) {
  return (
    <div className="relative w-full min-h-[70vh] sm:min-h-[500px] lg:min-h-0 lg:pb-[56.25%] lg:h-0 overflow-hidden rounded-lg shadow-lg">
      <iframe
        src={src}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
