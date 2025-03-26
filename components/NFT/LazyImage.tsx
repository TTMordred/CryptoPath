import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/legacy/image';
import { Info } from 'lucide-react';

interface LazyImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  showLoadingIndicator?: boolean;
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
}

export default function LazyImage({ 
  src, 
  alt, 
  showLoadingIndicator = false,
  onError,
  onLoad,
  objectFit = "cover",
  ...props 
}: LazyImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleError = () => {
    setImgSrc('/images/placeholder-nft.png'); // Fallback image
    setError(true);
    setLoading(false);
    // Fix: Don't pass Error object directly to onError
    if (onError) onError({} as React.SyntheticEvent<HTMLImageElement>);
  };

  const handleLoad = (event: any) => {
    setLoading(false);
    if (onLoad) onLoad(event);
  };

  // Handle IPFS and data URLs properly
  // Fix: Changed from let to const
  const finalSrc = imgSrc;

  if (!imgSrc || error) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <Info className="h-10 w-10 text-gray-600" />
      </div>
    );
  }

  return (
    <>
      {loading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <Image
        src={finalSrc}
        alt={alt || "NFT Image"}
        onError={handleError}
        onLoad={handleLoad}
        objectFit={objectFit}
        {...props}
      />
    </>
  );
}
