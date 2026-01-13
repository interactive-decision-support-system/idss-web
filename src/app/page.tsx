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
    if (chatMessagesContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTo({
            top: chatMessagesContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, [chatMessages, isLoading]);

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
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#8b959e]/30 px-8 py-4 shadow-sm flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className="w-10 h-10 bg-white border border-[#8b959e]/40 rounded-lg flex items-center justify-center hover:border-[#ff1323] hover:shadow-md transition-all duration-200 shadow-sm relative group"
          title={showFavorites ? "Hide Favorites" : "View Favorites"}
        >
          {/* Heart icon - shown when favorites are closed */}
          {!showFavorites && (
            <svg 
              className={`w-6 h-6 transition-all duration-200 ${
                favorites.length > 0 
                  ? 'text-[#ff1323] fill-[#ff1323]' 
                  : 'text-[#8b959e]'
              }`}
              fill={favorites.length > 0 ? 'currentColor' : 'none'}
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
          {/* X icon - shown when favorites are open, highlighted on hover */}
          {showFavorites && (
            <svg 
              className="w-6 h-6 text-[#8b959e] group-hover:text-[#ff1323] transition-colors duration-200"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        <h1 className="text-2xl font-bold text-[#8C1515] flex-1 text-center">Interactive Decision Support System</h1>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Favorites Panel - Top Half */}
        {showFavorites && (
          <div className="h-1/2 border-b border-[#8b959e]/30 overflow-hidden flex-shrink-0">
            <FavoritesPage
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onItemSelect={setSelectedProduct}
            />
          </div>
        )}

        {/* Chat Section - Bottom Half or Full */}
        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${showFavorites ? '' : ''}`}>
          {/* Chat Messages */}
          <div
            ref={chatMessagesContainerRef}
            className="flex-1 overflow-y-auto p-8 min-h-0"
          >
        <div className="max-w-4xl mx-auto flex flex-col space-y-6">
          {chatMessages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#8C1515] to-[#750013] text-white shadow-sm'
                      : 'bg-white text-black border border-[#8b959e]/30 shadow-sm'
                  }`}
                >
                  <div className="text-base leading-relaxed chat-message">
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
                </div>
              </div>

              {/* Quick reply buttons */}
              {message.role === 'assistant' && message.quick_replies && message.quick_replies.length > 0 && (
                <div className="flex justify-start mt-2">
                  <div className="max-w-[80%] flex flex-wrap gap-2">
                    {message.quick_replies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChatMessage(reply)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white hover:bg-[#8b959e]/5 border border-[#8b959e]/40 hover:border-[#8C1515] text-[#8C1515] hover:text-[#8C1515] text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl border border-[#8b959e]/30 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#8b959e] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#8C1515] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#8b959e] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-[#8b959e]">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-[#8b959e]/30 bg-[#8C1515]/5 px-8 py-3 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSendMessage={handleChatMessage} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail View */}
      {selectedProduct && (
        <ProductDetailView 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
}
