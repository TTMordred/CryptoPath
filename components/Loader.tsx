"use client";
export const Loader = () => {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/20"></div>
          </div>
        </div>
      </div>
    );
  };
export default Loader;