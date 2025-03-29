'use client';

import { useState, useRef, useEffect } from 'react';
import { getChatResponse, ChatMessage, suggestedQuestions } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a welcome message when the chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          role: 'model', 
          content: "👋 Hello! I'm the CryptoPath Assistant. How can I help you?"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    const newMessages = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);
    setInputMessage('');

    try {
      const response = await getChatResponse(newMessages);
      setMessages([...newMessages, { role: 'model' as const, content: response }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages([
        ...newMessages, 
        { 
          role: 'model', 
          content: "I'm sorry, I encountered an error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <div className="fixed bottom-40 right-4 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="bg-[#f89725] hover:bg-[#e88615] text-white rounded-full p-3 shadow-lg"
            aria-label="Open chat assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
          </motion.button>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-72 h-96 flex flex-col border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex justify-between items-center py-2 px-3 border-b bg-[#f89725] rounded-t-lg">
              <h3 className="text-sm font-semibold text-white">CryptoPath Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-100 p-1 rounded-full hover:bg-[#e88615]"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-zinc-800 text-sm">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 3) }}
                  className={`mb-2 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block py-2 px-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[#f89725] text-white'
                        : 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    } max-w-[90%] text-xs`}
                  >
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => (
                          <span className="font-bold text-black dark:text-white" {...props} />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              
              {/* Show suggested questions after the welcome message */}
              {showSuggestions && messages.length === 1 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quick questions:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-left text-xs text-[#f89725] hover:text-[#e88615] p-1 rounded hover:bg-[#fff8f0] dark:hover:bg-zinc-700 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 mb-1"
                      >
                        {question.length > 25 ? `${question.substring(0, 22)}...` : question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="text-left mb-2">
                  <div className="inline-block py-2 px-3 rounded-lg bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f89725] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f89725] animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f89725] animate-bounce" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSend(inputMessage);
                    }
                  }}
                  placeholder="Ask something..."
                  className="flex-1 py-1 px-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#f89725] text-gray-800 dark:text-gray-200 bg-white dark:bg-zinc-700 border-gray-300 dark:border-gray-600"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend(inputMessage)}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-[#f89725] text-white px-2 py-1 rounded-lg hover:bg-[#e88615] disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}