'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInput from '@/components/ChatInput';
import StackedRecommendationCards from '@/components/StackedRecommendationCards';
import ProductDetailView from '@/components/ProductDetailView';
import FavoritesPage from '@/components/FavoritesPage';
import { ChatMessage, Product } from '@/types/chat';
import { idssApiService } from '@/services/api';
import { currentDomainConfig } from '@/config/domain-config';
import { convertAPIVehiclesToProducts } from '@/utils/product-converter';

export default function Home() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const config = currentDomainConfig;

  // Check if this is the initial state (only welcome message)
  const isInitialState = chatMessages.length === 1 && chatMessages[0]?.role === 'assistant';

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (product: Product) => {
    const currentlyFavorited = favorites.some(p => p.id === product.id);
    if (currentlyFavorited) {
      setFavorites(prev => prev.filter(p => p.id !== product.id));
    } else {
      setFavorites(prev => [...prev, product]);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(p => p.id === productId);
  };

  // Initialize with welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'initial',
        role: 'assistant',
        content: config.welcomeMessage,
        timestamp: new Date(),
      };
      setChatMessages([initialMessage]);
    }
  }, [chatMessages.length, config.welcomeMessage]);

  // Auto-scroll chat messages to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesContainerRef.current && !isInitialState) {
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTo({
            top: chatMessagesContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, [chatMessages, isLoading, isInitialState]);

  const handleChatMessage = async (message: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await idssApiService.sendMessage(message, sessionId || undefined);

      // Update session ID
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Convert API recommendations to Product format if present
      let productRecommendations: Product[][] | undefined;
      if (response.recommendations) {
        productRecommendations = convertAPIVehiclesToProducts(response.recommendations);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        recommendations: productRecommendations,
        bucket_labels: response.bucket_labels,
        diversification_dimension: response.diversification_dimension,
        quick_replies: response.quick_replies,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I ran into an issue. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#5a0a0f]/75 flex overflow-hidden relative">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden min-h-0 transition-all duration-300 ${showFavorites || selectedProduct ? 'pr-96' : ''}`}>
        {/* Floating Title - IDA */}
        <div className="absolute top-4 left-4 z-10">
          <h1 className="text-xl font-semibold text-white">IDA</h1>
        </div>

        {/* Floating Heart Button - Top Right */}
        {!selectedProduct && (
          <div className={`absolute top-4 right-4 ${showFavorites ? 'z-30' : 'z-10'}`}>
            <button
            onClick={() => {
              setShowFavorites(!showFavorites);
              if (showFavorites) {
                setSelectedProduct(null);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200"
            title={showFavorites ? "Hide Favorites" : "View Favorites"}
          >
            {showFavorites ? (
              <svg 
                className="w-6 h-6 text-white"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg 
                className={`w-6 h-6 transition-all duration-200 ${
                  favorites.length > 0 
                    ? 'text-[#ff1323] fill-[#ff1323]' 
                    : 'text-white'
                }`}
                fill={favorites.length > 0 ? 'currentColor' : 'none'}
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          </div>
        )}

        {/* Chat Messages */}
        <div
          ref={chatMessagesContainerRef}
          className={`flex-1 overflow-y-auto min-h-0 scrollbar-hide ${isInitialState ? 'flex items-center justify-center' : 'px-8 py-8'} pl-20`}
        >
          {isInitialState ? (
            // Initial centered welcome screen
            <div className="max-w-3xl w-full space-y-8">
              {/* Large Welcome Message */}
              <div className="text-center space-y-4">
                <div className="text-3xl font-semibold text-white leading-tight">
                  {config.welcomeMessage}
                </div>
              </div>

              {/* Centered Input Box */}
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <ChatInput onSendMessage={handleChatMessage} isLoading={isLoading} />
                </div>
              </div>
            </div>
          ) : (
            // Regular chat messages
            <div className="max-w-4xl mx-auto flex flex-col space-y-8">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  {message.role === 'user' ? (
                    // User message with bubble
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#8C1515] to-[#750013] text-white shadow-sm">
                        <div className="text-base leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Assistant message - no bubble, full width
                    <div className="space-y-4">
                      <div className="text-base leading-relaxed text-white">
                        {message.content}
                      </div>

                      {/* Show stacked recommendation cards if present */}
                      {message.recommendations && message.recommendations.length > 0 && (
                        <StackedRecommendationCards
                          recommendations={message.recommendations}
                          bucket_labels={message.bucket_labels}
                          diversification_dimension={message.diversification_dimension}
                          onItemSelect={setSelectedProduct}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={isFavorite}
                        />
                      )}

                      {/* Quick reply buttons */}
                      {message.quick_replies && message.quick_replies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.quick_replies.map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleChatMessage(reply)}
                              disabled={isLoading}
                              className="px-4 py-2 bg-[#5a0a0f]/50 hover:bg-[#5a0a0f]/60 border border-[#6d0f14]/50 hover:border-[#6d0f14]/70 text-white hover:text-white text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-white/70">Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input - Only show when not in initial state */}
        {!isInitialState && (
          <div className="px-8 py-4 flex-shrink-0 pl-20">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSendMessage={handleChatMessage} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Favorites or Product Detail */}
      {(showFavorites || selectedProduct) && (
        <div className="absolute top-4 right-4 bottom-4 w-80 rounded-xl shadow-2xl flex flex-col z-20">
          {showFavorites && (
            <FavoritesPage
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onItemSelect={(product) => {
                setSelectedProduct(product);
                setShowFavorites(false);
              }}
              onClose={() => setShowFavorites(false)}
            />
          )}
          {selectedProduct && (
            <ProductDetailView
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}