import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Info } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  fill = false,
  objectFit = 'cover',
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const placeholderColors = useRef<string[]>([
    'rgb(30, 30, 30)', 'rgb(40, 40, 40)', 'rgb(50, 50, 50)', 'rgb(35, 35, 35)'
  ]);
  
  // Function to transform IPFS URLs
  const transformUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${url.slice(7)}`;
    }
    return url;
  };
  
  // Set up intersection observer to detect when image is in viewport
  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsInView(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '200px', // Load images 200px before they appear in viewport
        threshold: 0.01,
      }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);
  
  // Set image source when in view
  useEffect(() => {
    if (isInView && src) {
      setImgSrc(transformUrl(src));
    }
  }, [isInView, src]);
  
  // Handle image load
  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  // Handle image error
  const handleImageError = () => {
    setError(true);
    setIsLoaded(true);
    if (onError) onError();
  };
  
  // Generate random placeholder background
  const placeholderBackground = `linear-gradient(45deg, ${placeholderColors.current[0]}, ${placeholderColors.current[1]}, ${placeholderColors.current[2]}, ${placeholderColors.current[3]})`;

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={{
        width: fill ? '100%' : width ? `${width}px` : '100%',
        height: fill ? '100%' : height ? `${height}px` : 'auto',
        backgroundColor: 'rgb(30, 30, 30)',
        overflow: 'hidden',
      }}
    >
      {/* Placeholder with shimmer effect */}
      {!isLoaded && (
        <motion.div
          className="absolute inset-0 z-0"
          style={{ background: placeholderBackground }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
        />
      )}
      
      {/* Main image */}
      {imgSrc && isInView && (
        <Image
          src={imgSrc}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          className={`object-${objectFit} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes={sizes}
          quality={quality}
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <Info className="h-8 w-8 text-gray-500" />
        </div>
      )}
    </div>
  );
}
