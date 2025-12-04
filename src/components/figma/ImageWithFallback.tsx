import React, { ImgHTMLAttributes, useState, useEffect, useCallback } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  lqip?: string | null; // base64 or small placeholder URL
}

/**
 * ImageWithFallback
 * - lazy loads by default
 * - supports srcSet & sizes via props
 * - shows fallback on error
 * - optional lqip used as background until the image loads
 */
export function ImageWithFallback({
  src,
  fallbackSrc,
  lqip,
  alt,
  loading = 'lazy',
  onError,
  onLoad,
  ...rest
}: Props) {
  // local src so we can swap to fallback on error
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src as string | undefined);
  // track loaded state so we can remove LQIP background after successful load
  const [loaded, setLoaded] = useState(false);

  // if parent changes src, update the internal src
  useEffect(() => {
    setCurrentSrc(src as string | undefined);
    setLoaded(false);
  }, [src]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
      // forward any onError prop
      if (typeof onError === 'function') onError(e);
    },
    [fallbackSrc, currentSrc, onError]
  );

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setLoaded(true);
      if (typeof onLoad === 'function') onLoad(e);
    },
    [onLoad]
  );

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      style={{
        // show lqip background only while not loaded
        backgroundImage: !loaded && lqip ? `url(${lqip})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      {...(rest as any)}
    />
  );
}
