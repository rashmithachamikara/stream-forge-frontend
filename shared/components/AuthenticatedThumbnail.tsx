'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

type AuthenticatedThumbnailProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

const isProtectedThumbnailUrl = (src: string) => {
  return /\/api\/v1\/videos\/[^/]+\/thumbnail(?:$|\?)/i.test(src);
};

export function AuthenticatedThumbnail({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  ...props
}: AuthenticatedThumbnailProps) {
  const { token } = useAuth();
  const [resolvedSrc, setResolvedSrc] = useState<string>(src || fallbackSrc);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const revokeObjectUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    if (!src) {
      revokeObjectUrl();
      setResolvedSrc(fallbackSrc);
      return;
    }

    if (!isProtectedThumbnailUrl(src) || !token) {
      revokeObjectUrl();
      setResolvedSrc(src);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadThumbnail = async () => {
      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load thumbnail');
        }

        const blob = await response.blob();
        const nextObjectUrl = URL.createObjectURL(blob);

        if (!isActive) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }

        revokeObjectUrl();
        objectUrlRef.current = nextObjectUrl;
        setResolvedSrc(nextObjectUrl);
      } catch (error) {
        if (!controller.signal.aborted && isActive) {
          revokeObjectUrl();
          setResolvedSrc(fallbackSrc);
        }
      }
    };

    void loadThumbnail();

    return () => {
      isActive = false;
      controller.abort();
      revokeObjectUrl();
    };
  }, [fallbackSrc, src, token]);

  return <img src={resolvedSrc} alt={alt} {...props} />;
}
