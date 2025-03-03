// File: app/FAQ.tsx
import React, { useState, useRef, useEffect } from 'react';

type Language = 'en' | 'vi';

interface FAQProps {
  language: Language;
}

const translations = {
  en: {
    faqTitle: 'Frequently Asked Questions',
    faqData: [
      {
        question: 'What is CryptoPath?',
        answer: 'CryptoPath is a powerful tool that allows you to track transactions and explore the blockchain in a user-friendly way.',
      },
      {
        question: 'How do I search for a transaction?',
        answer: 'Simply enter a wallet address or transaction hash in the search bar. CryptoPath will fetch all related information from the blockchain.',
      },
      {
        question: 'Can I track multiple addresses?',
        answer: 'Yes, you can track multiple wallet addresses at once to monitor your entire portfolio in real-time.',
      },
      {
        question: 'What blockchains does CryptoPath support?',
        answer: 'CryptoPath currently supports major blockchains such as Ethereum, BNB Smart Chain, and more. Stay tuned for upcoming updates!',
      },
    ],
  },
  vi: {
    faqTitle: 'Các câu hỏi thường gặp',
    faqData: [
      {
        question: 'CryptoPath là gì?',
        answer: 'CryptoPath là một công cụ mạnh mẽ cho phép bạn theo dõi các giao dịch và khám phá blockchain một cách thân thiện với người dùng.',
      },
      {
        question: 'Làm thế nào để tìm kiếm một giao dịch?',
        answer: 'Chỉ cần nhập địa chỉ ví hoặc mã giao dịch vào thanh tìm kiếm. CryptoPath sẽ lấy tất cả thông tin liên quan từ blockchain.',
      },
      {
        question: 'Tôi có thể theo dõi nhiều địa chỉ không?',
        answer: 'Có, bạn có thể theo dõi nhiều địa chỉ ví cùng một lúc theo thời gian thực.',
      },
      {
        question: 'CryptoPath hỗ trợ những blockchain nào?',
        answer: 'CryptoPath hiện hỗ trợ các blockchain chính như Ethereum, BNB Smart Chain và nhiều hơn nữa. Hãy đón chờ các cập nhật sắp tới!',
      },
    ],
  },
};

const FAQ: React.FC<FAQProps> = ({ language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [contentHeights, setContentHeights] = useState<number[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setContentHeights(contentRefs.current.map((ref) => ref?.scrollHeight || 0));
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const t = translations[language];

  return (
    <div className="w-full px-4 py-12 bg-transparent">
      <h2 className="text-3xl font-bold text-center mb-8">{t.faqTitle}</h2>
      <div className="max-w-3xl mx-auto">
        {t.faqData.map((faq, index) => (
          <div key={index} className="border-b border-gray-300 py-4">
            <button
              onClick={() => toggleFAQ(index)}
              className="flex justify-between items-center w-full text-left focus:outline-none"
            >
              <span className="font-medium text-lg">{faq.question}</span>
              <span className="ml-2 text-2xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            <div
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              style={{ maxHeight: openIndex === index ? contentHeights[index] : 0 }}
              className="transition-all duration-300 ease-in-out overflow-hidden mt-2"
            >
              <p className="text-gray-200 py-2">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;