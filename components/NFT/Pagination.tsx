// components/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages,
  onPageChange 
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === 1 
            ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
            : 'bg-gray-800 hover:bg-gray-700'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-300">
          Page <span className="text-orange-400">{currentPage}</span> of{" "}
          <span className="text-purple-400">{totalPages}</span>
        </span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === totalPages
            ? 'bg-gray-800 opacity-50 cursor-not-allowed'
            : 'bg-gray-800 hover:bg-gray-700'
        }`}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}