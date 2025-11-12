'use client';
import { useState, useEffect } from 'react';
import UserPreferences from './components/UserPreferences';
import NewsFeed from './components/NewsFeed';
import HistoricalContextSelection from "./components/HistoricalContextSelection";

interface UserPreferencesData {
  userId: string | null;
  categories: string[];
  createdAt: string;
  updatedAt: string;
  llmContext?: {
    preferenceString: string;
    categoryCount: number;
    prompt: string;
  };
}

type ViewType = 'landing' | 'preferences' | 'main';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData | null>(null);

  // Check if user already has preferences saved
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setUserPreferences(parsed);
        // If user has preferences, skip to main view
        if (parsed.categories && parsed.categories.length > 0) {
          setCurrentView('main');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  const handleSignUpClick = (): void => {
    setCurrentView('preferences');
  };

  const handlePreferencesComplete = (preferences: UserPreferencesData): void => {
    setUserPreferences(preferences);
    setCurrentView('main');
  };

  // Landing View
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
        {/* Hero Section */}
        <div className="text-center pt-16 pb-8 px-4">
          <h1 className="text-6xl font-bold text-white mb-6">
            InformedNow
          </h1>
          <p className="text-2xl text-blue-100 mb-4">
            Clear, Relevant, Unbiased News
          </p>
          <p className="text-lg text-blue-200 mb-8">
            Aggregated from multiple sources, summarized by AI, and personalized for you.
          </p>
          <button
            onClick={handleSignUpClick}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started
          </button>
        </div>
        <HistoricalContextSelection/>
        {/* News Feed */}
        <div className="py-8">
          <NewsFeed />
        </div>
      </div>
    );
  }

  // Preferences View
  if (currentView === 'preferences') {
    return <UserPreferences onComplete={handlePreferencesComplete} />;
  }

  // Main News Feed View
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">InformedNow</h1>
            <button
              onClick={() => setCurrentView('preferences')}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Edit Preferences
            </button>
          </div>
        </header>
        {/* News Feed */}
        <main className="py-8">
          <NewsFeed />
        </main>
      </div>
    );
  }

  return null;
}