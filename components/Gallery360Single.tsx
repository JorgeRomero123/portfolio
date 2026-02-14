'use client';

import { useMemo } from 'react';
import Pannellum360Viewer from './Pannellum360Viewer';
import type { Photo360 } from '@/lib/types';

interface Props {
  photo: Photo360;
}

export default function Gallery360Single({ photo }: Props) {
  const proxiedPhoto = useMemo(() => {
    if (photo.url.includes('r2.dev') || photo.url.includes('cdn.jorgeromeroromanis.com')) {
      return {
        ...photo,
        url: `/api/proxy-360?url=${encodeURIComponent(photo.url)}`,
      };
    }
    return photo;
  }, [photo]);

  return <Pannellum360Viewer photo={proxiedPhoto} className="w-full h-full" />;
}
