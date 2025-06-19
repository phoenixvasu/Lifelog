'use client';

import { Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDailyQuote, getRandomQuote } from '@/services/quotes';

interface QuoteType {
  text: string;
  author: string;
}

export const DailyQuote = () => {
  const [quote, setQuote] = useState<QuoteType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the daily quote when component mounts
    const dailyQuote = getDailyQuote();
    setQuote(dailyQuote);
    setIsLoading(false);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // Get a random quote when refresh is clicked
    const randomQuote = getRandomQuote();
    setQuote(randomQuote);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="relative bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-6 border border-purple-100 dark:border-purple-800">
      <div className="absolute top-4 left-4 text-purple-200 dark:text-purple-700">
        <Quote className="h-6 w-6" />
      </div>
      <div className="pl-8">
        <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-2">
          "{quote.text}"
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          — {quote.author}
        </p>
      </div>
      <button
        onClick={handleRefresh}
        className="absolute top-4 right-4 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
        title="Get a new quote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}; 