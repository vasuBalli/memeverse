

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

type ImageWithFallbackProps = Omit<ImageProps, 'src' | 'width' | 'height'> & {
  src: string
  fallbackSrc?: string
}

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback({
  src,
  fallbackSrc = ERROR_IMG_SRC,
  alt,
  className,
  unoptimized,
  sizes = '(max-width: 768px) 100vw, 480px',
  ...props
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const imageSrc =
    typeof src === 'string' && src.startsWith('http')
      ? src
      : fallbackSrc

  return (
    <Image
      src={didError ? fallbackSrc : imageSrc}
      alt={alt || 'Image'}
      fill                         // ✅ REQUIRED FIX
      className={className}
      unoptimized={unoptimized}
      sizes={sizes}
      onError={() => setDidError(true)}
      {...props}
    />
  )
}

