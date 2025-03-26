import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/legacy/image';
import { Info, FileX } from 'lucide-react';

interface LazyImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  showLoadingIndicator?: boolean;
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  fallbackSrc?: string;
  blurhash?: string;
}

const defaultFallbackImage = '/images/placeholder-nft.png';

// Simple in-memory cache to track already failed images
const failedImagesCache = new Set<string>();

export default function LazyImage({ 
  src, 
  alt, 
  showLoadingIndicator = false,
  onError,
  onLoad,
  objectFit = "cover",
  fallbackSrc,
  priority = false, // Extract priority prop to handle loading property correctly
  blurhash,
  ...props 
}: LazyImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Check if image has already failed
  useEffect(() => {
    if (src && failedImagesCache.has(src)) {
      handleError();
    } else {
      setImgSrc(src);
      setLoading(true);
      setError(false);
      setFadeIn(false);
    }
  }, [src]);

  // Process common IPFS and data URLs
  useEffect(() => {
    if (!src) return;
    
    try {
      // Process IPFS URLs
      if (src.startsWith('ipfs://')) {
        setImgSrc(`https://ipfs.io/ipfs/${src.slice(7)}`);
      } 
      // Handle base64 data URLs
      else if (src.startsWith('data:')) {
        setImgSrc(src);
      }
      // Handle Arweave URLs
      else if (src.startsWith('ar://')) {
        setImgSrc(`https://arweave.net/${src.slice(5)}`);
      }
      // Handle relative URLs
      else if (src.startsWith('/')) {
        setImgSrc(src);
      } 
      else {
        setImgSrc(src);
      }
    } catch (err) {
      console.error('Error processing image URL:', err);
      handleError();
    }
  }, [src]);

  const handleError = () => {
    // Add to failed cache
    if (src) failedImagesCache.add(src);
    
    // Use fallback or default fallback
    const fallback = fallbackSrc || defaultFallbackImage;
    setImgSrc(fallback);
    setError(true);
    setLoading(false);
    
    // Propagate error event if handler provided
    if (onError) {
      onError({} as React.SyntheticEvent<HTMLImageElement>);
    }
  };

  const handleLoad = (event: any) => {
    setLoading(false);
    setFadeIn(true);
    if (onLoad) onLoad(event);
  };

  // Handle cases where there is no image at all
  if (!imgSrc || imgSrc === 'null' || imgSrc === 'undefined') {
    return (
      <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
        <FileX className="h-10 w-10 text-gray-600 mb-2" />
        <span className="text-xs text-gray-500">No image available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" ref={imgRef}>
      {loading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: 'rgba(255,255,255,0.3) transparent transparent transparent' }} />
        </div>
      )}
      
      <div className={`w-full h-full transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <Image
          src={imgSrc}
          alt={alt || "NFT Image"}
          onError={handleError}
          onLoad={handleLoad}
          objectFit={objectFit}
          layout={props.layout || "fill"}
          quality={props.quality || 75}
          priority={priority}
          loading={priority ? undefined : "lazy"} // Only set loading='lazy' if priority is false
          {...props}
        />
      </div>
      
      {/* Show error placeholder when image fails */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/80 backdrop-blur-sm">
          <Info className="h-8 w-8 text-gray-600 mb-2" />
          <span className="text-xs text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
