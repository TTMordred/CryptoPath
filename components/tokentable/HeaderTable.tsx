'use client'; // Đánh dấu đây là client component vì sử dụng hook
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const HeaderTable = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div>
      {/* Thêm JSX của bạn ở đây, ví dụ: */}
      <header className={isScrolled ? 'scrolled' : ''}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>
      </header>
    </div>
  );
};

export default HeaderTable;