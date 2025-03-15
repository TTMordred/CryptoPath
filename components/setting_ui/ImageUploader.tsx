'use client';
import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageChange: (imageDataUrl: string | null) => void;
  className?: string;
  type: 'profile' | 'background';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage, 
  onImageChange, 
  className,
  type
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onImageChange(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
  };

  return (
    <div 
      className={cn(
        'relative group cursor-pointer overflow-hidden transition-all duration-300',
        type === 'profile' 
          ? 'w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-black'
          : 'w-full h-full rounded-xl',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {currentImage ? (
        <>
          <img 
            src={currentImage} 
            alt={type === 'profile' ? "Profile" : "Background"} 
            className={cn(
              'object-cover transition-transform duration-500 h-full w-full group-hover:scale-110',
              type === 'profile' ? 'rounded-full' : 'rounded-xl'
            )} 
          />
          <div 
            className={cn(
              'absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              type === 'profile' ? 'rounded-full' : 'rounded-xl'
            )}
          >
            <Camera className="w-8 h-8 text-white drop-shadow-md" />
            {isHovering && (
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-500/80 transition-colors duration-200 border border-white/20"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className={cn(
          'w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-black/60 to-black/80 group-hover:from-black/70 group-hover:to-black/90 transition-colors duration-300',
          type === 'profile' ? 'rounded-full' : 'rounded-xl'
        )}>
          {type === 'profile' ? (
            <div className="animate-pulse-gentle">
              <Camera className="w-10 h-10 text-amber opacity-80" />
            </div>
          ) : (
            <div className="animate-pulse-gentle">
              <ImageIcon className="w-10 h-10 text-amber opacity-80" />
            </div>
          )}
          <span className="text-sm mt-3 text-white/90 font-medium px-4 text-center">
            {type === 'profile' ? 'Upload profile picture' : 'Upload background image'}
          </span>
        </div>
      )}
      
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;