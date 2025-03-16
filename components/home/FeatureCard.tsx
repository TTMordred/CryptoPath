import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  imageUrl?: string;
  delay: number;
  language: 'en' | 'vi';
}

// Translation object
const translations = {
  en: {
    explore: 'Explore',
  },
  vi: {
    explore: 'Khám Phá',
  },
};

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  href, 
  imageUrl, 
  delay, 
  language 
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={href}>
        <Card className="h-full bg-gray-900/50 border border-gray-800 overflow-hidden transition-all duration-300 hover:border-orange-500/50 hover:bg-gray-800/50">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl && (
              <div className={`transition-all duration-500 ${isHovered ? 'opacity-20' : 'opacity-10'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
              </div>
            )}
          </div>
          
          <CardContent className="p-6 relative z-10">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
            
            <div className={`mt-4 flex items-center text-orange-500 transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <span className="mr-2">{translations[language].explore}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}