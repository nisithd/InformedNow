'use client';
import { useState, useEffect } from 'react';
import UserPreferences from './components/UserPreferences';
import { UserPreferencesData } from '@/types/UserPreferences';

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'preferences' | 'main'>('landing');
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed: UserPreferencesData = JSON.parse(savedPreferences);
        setUserPreferences(parsed);

        // If preferences exist, jump to main view
        if (parsed.categories && parsed.categories.length > 0) {
          setCurrentView('main');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  const handleSignUpClick = () => {
    setCurrentView('preferences');
  };

  const handlePreferencesComplete = (preferences: UserPreferencesData) => {
    setUserPreferences(preferences);
    setCurrentView('main');
  };

  // Landing View
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="text-center max-w-3xl">
          <h1 className="text-6xl font-bold text-white mb-6">InformedNow</h1>
          <p className="text-2xl text-blue-100 mb-4">Clear, Relevant, Unbiased News</p>
          <p className="text-lg text-blue-200 mb-12">
            Aggregated from multiple sources, summarized by AI, and personalized for you.
          </p>
          <button
            onClick={handleSignUpClick}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started
          </button>
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
        <header className="bg-white shadow-sm border-b">
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to InformedNow!</h2>
            <p className="text-gray-600 mb-6">Your personalized news feed based on your interests:</p>

            {userPreferences?.categories && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {userPreferences.categories.map((category) => (
                  <span
                    key={category}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-500 text-sm">
              News feed coming soon! (Backend integration in progress)
            </p>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
