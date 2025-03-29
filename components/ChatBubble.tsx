'use client';

import { useState, useRef, useEffect } from 'react';
import { getChatResponse, ChatMessage as GeminiChatMessage, suggestedQuestions } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';

// Extend the ChatMessage type to include timestamp
interface ChatMessage extends GeminiChatMessage {
  timestamp?: string;
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
          content: "👋 Hello! I'm the CryptoPath Assistant. How can I help you today with blockchain exploration or portfolio tracking?"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    const newMessages = [...messages, { role: 'user' as const, content, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setInputMessage('');

    try {
      const response = await getChatResponse(newMessages);
      setMessages([...newMessages, { 
        role: 'model' as const, 
        content: response,
        timestamp: new Date().toISOString()
      }]);
      
      // Play subtle notification sound when message is received
      const audio = new Audio('/sounds/message-received.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play prevented:', e));
      
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages([
        ...newMessages, 
        { 
          role: 'model', 
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const resetConversation = () => {
    setMessages([]);
    setShowSuggestions(true);
    // Re-initialize with welcome message
    setMessages([
      { 
        role: 'model', 
        content: "👋 Chat reset! How else can I help you with CryptoPath?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Format timestamp to display as HH:MM
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-28 md:bottom-8 right-4 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-[#f89725] to-[#e88615] text-white rounded-full p-4 shadow-lg flex items-center gap-2"
            aria-label="Open chat assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
            <span className="hidden md:block font-medium">Chat Assistant</span>
          </motion.button>
        ) : (
          <motion.div 
            ref={chatContainerRef}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-80 sm:w-96 h-[450px] sm:h-[500px] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="relative flex justify-between items-center py-3 px-4 border-b bg-gradient-to-r from-[#f89725] to-[#e88615] rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">CryptoPath Assistant</h3>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
                    <span className="text-xs text-white/80">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetConversation}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Reset conversation"
                  title="Reset conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 opacity-50"></div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-800 text-sm space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 3) }}
                  className={`${
                    message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'
                  }`}
                >
                  <div
                    className={`relative group py-2.5 px-3.5 rounded-2xl max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#f89725] to-[#e88615] text-white rounded-tr-none shadow-sm'
                        : 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => (
                          <span className={`font-bold ${message.role === 'user' ? 'text-white' : 'text-black dark:text-white'}`} {...props} />
                        ),
                        a: ({node, ...props}) => (
                          <a className="text-blue-500 hover:underline" {...props} />
                        ),
                        ul: ({node, ...props}) => (
                          <ul className="list-disc pl-4 mt-1 mb-1" {...props} />
                        ),
                        ol: ({node, ...props}) => (
                          <ol className="list-decimal pl-4 mt-1 mb-1" {...props} />
                        ),
                        li: ({node, ...props}) => (
                          <li className="mb-0.5" {...props} />
                        ),
                        code: ({node, ...props}) => (
                          <code className="bg-gray-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    
                    {/* Message timestamp */}
                    <div className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      message.role === 'user' ? 'text-white/70 text-right' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Show suggested questions after the welcome message */}
              {showSuggestions && messages.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-3"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Suggested questions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * index }}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-left text-xs text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-[#fff8f0] dark:hover:bg-zinc-700 bg-white dark:bg-zinc-800/60 border border-gray-200 dark:border-gray-700 transition-all hover:scale-[1.02] hover:shadow-sm flex items-center group"
                      >
                        <span className="mr-2 opacity-70">💡</span>
                        <span>{question}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#f89725]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start"
                >
                  <div className="inline-block py-3.5 px-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#f89725] animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#f89725] animate-pulse" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#f89725] animate-pulse" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900">
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-zinc-800 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-[#f89725]/50">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSend(inputMessage);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border-none text-sm focus:outline-none text-gray-800 dark:text-gray-200"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend(inputMessage)}
                  disabled={isLoading || !inputMessage.trim()}
                  className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                    isLoading || !inputMessage.trim() 
                      ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-gray-400' 
                      : 'bg-[#f89725] text-white hover:bg-[#e88615]'
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Character count indicator for long messages */}
              {inputMessage.length > 0 && (
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${
                    inputMessage.length > 200 ? 'text-amber-500' : 'text-gray-400'
                  }`}>
                    {inputMessage.length}/500
                  </span>
                </div>
              )}
            </div>
            
            {/* Sound toggle and accessibility controls */}
            <div className="px-3 py-1 flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    /* Toggle sound implementation */
                    const soundEnabled = localStorage.getItem('chat-sound') !== 'disabled';
                    localStorage.setItem('chat-sound', soundEnabled ? 'disabled' : 'enabled');
                  }}
                  className="hover:text-[#f89725] transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                  title="Toggle sound"
                  aria-label="Toggle notification sounds"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    /* Increase font size */
                    const chatContainer = document.querySelector('.chat-messages-container');
                    if (chatContainer) {
                      chatContainer.classList.toggle('text-lg');
                    }
                  }}
                  className="hover:text-[#f89725] transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                  title="Adjust text size"
                  aria-label="Adjust text size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </button>
              </div>
              
              <span className="text-[10px] opacity-60">
                Powered by Google Gemini
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard shortcut tooltip */}
      {isOpen && (
        <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-3 rounded-full opacity-60 pointer-events-none">
          Press Esc to close, Enter to send
        </div>
      )}
    </div>
  );
}