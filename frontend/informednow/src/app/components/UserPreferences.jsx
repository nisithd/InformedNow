import React, { useState, useEffect } from 'react';

// Mock categories - ready for backend integration
const NEWS_CATEGORIES = [
  { id: 'world', label: 'World News', icon: '🌍' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'food', label: 'Food & Cooking', icon: '🍳' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '✨' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'environment', label: 'Environment', icon: '🌱' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'crime', label: 'Crime', icon: '🚔' },
  { id: 'weather', label: 'Weather', icon: '🌤️' }
];

const UserPreferences = ({ onComplete }) => {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setSelectedPreferences(parsed.categories || []);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  const togglePreference = (categoryId) => {
    setSelectedPreferences(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSavePreferences = () => {
    setIsSubmitting(true);
    
    // Structure ready for MongoDB schema
    const userPreferencesData = {
      userId: null, // Will be set when auth is implemented
      categories: selectedPreferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ready for future LLM input
      llmContext: {
        preferenceString: selectedPreferences.join(', '),
        categoryCount: selectedPreferences.length,
        prompt: `User interests: ${selectedPreferences.map(id => 
          NEWS_CATEGORIES.find(cat => cat.id === id)?.label
        ).join(', ')}`
      }
    };

    // Save to localStorage (temporary until MongoDB is set up)
    localStorage.setItem('userPreferences', JSON.stringify(userPreferencesData));
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      console.log('Preferences saved:', userPreferencesData);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(userPreferencesData);
      }
    }, 300);
  };

  const handleSkip = () => {
    const emptyPreferences = {
      userId: null,
      categories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skipped: true
    };
    localStorage.setItem('userPreferences', JSON.stringify(emptyPreferences));
    
    if (onComplete) {
      onComplete(emptyPreferences);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '980px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '60px 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Choose Your Interests
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            Select topics you'd like to see in your news feed. You can always change these later in settings.
          </p>
          <div style={{
            fontSize: '16px',
            color: '#1a73e8',
            fontWeight: '500'
          }}>
            {selectedPreferences.length} selected
          </div>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {NEWS_CATEGORIES.map((category) => {
            const isSelected = selectedPreferences.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => togglePreference(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '18px 24px',
                  fontSize: '17px',
                  fontWeight: '500',
                  color: isSelected ? '#1a73e8' : '#1a1a1a',
                  backgroundColor: isSelected ? '#e8f0fe' : '#f5f5f5',
                  border: isSelected ? '2px solid #1a73e8' : '2px solid transparent',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#ebebeb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
              >
                <span style={{ fontSize: '24px' }}>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '40px'
        }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#666',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            Skip for now
          </button>
          <button
            onClick={handleSavePreferences}
            disabled={selectedPreferences.length === 0 || isSubmitting}
            style={{
              padding: '14px 48px',
              fontSize: '16px',
              fontWeight: '600',
              color: selectedPreferences.length === 0 ? '#999' : 'white',
              backgroundColor: selectedPreferences.length === 0 ? '#e0e0e0' : '#1a73e8',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedPreferences.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: isSubmitting ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (selectedPreferences.length > 0 && !isSubmitting) {
                e.currentTarget.style.backgroundColor = '#1557b0';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPreferences.length > 0) {
                e.currentTarget.style.backgroundColor = '#1a73e8';
              }
            }}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;