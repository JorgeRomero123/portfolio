export interface Photo {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: string;
}

export interface PhotoSection {
  category: string;
  photos: Photo[];
}

export interface GalleryData {
  photos: Photo[];
  sections?: PhotoSection[];
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
}

export interface VideosData {
  videos: Video[];
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  description?: string;
  iframeUrl: string;
  thumbnailUrl?: string;
}

export interface ToursData {
  tours: Tour[];
}
