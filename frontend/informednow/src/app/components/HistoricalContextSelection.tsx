'use client';
import React, { useState } from 'react';

interface HistoricalContextSelectionProps {
  desc: string;
}

export default function HistoricalContextSelection({ desc }: HistoricalContextSelectionProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [contextData, setContextData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState<boolean>(false);

  const getSelectedText = (): string => {
    const selection = window.getSelection();
    return selection && selection.toString() ? selection.toString().trim() : '';
  };

  const handleMouseUp = () => {
    const text = getSelectedText();
    if (text && text.length > 2) {
      setSelectedText(text);
      setShowContext(false); // Reset context when new text is selected
    }
  };

  const handleGetContext = async () => {
    if (!selectedText) {
      setError('Please select some text first');
      return;
    }

    setLoading(true);
    setError(null);
    setShowContext(true);

    try {
      const response = await fetch('/api/addHistoricalContext/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "data": selectedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch historical context');
      }

      const data = await response.json();
      const llmResponse = data.candidates[0]?.content?.parts[0]?.text;
      setContextData(llmResponse || 'No context available');
    } catch (err) {
      console.error('Error fetching context:', err);
      setError('Failed to fetch historical context. Please try again.');
      setContextData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Article Description - Selectable Text */}
      <div
        onMouseUp={handleMouseUp}
        className="text-gray-700 text-sm leading-relaxed select-text"
      >
        {desc}
      </div>

      {/* Context Button - Shows when text is selected */}
      {selectedText && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleGetContext}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Getting Context...</span>
              </>
            ) : (
              <>
                <span>📚</span>
                <span>Get Historical Context</span>
              </>
            )}
          </button>
          
          {!loading && !showContext && (
            <span className="text-xs text-gray-500 italic">
              Selected: "{selectedText.slice(0, 30)}{selectedText.length > 30 ? '...' : ''}"
            </span>
          )}
        </div>
      )}

      {/* Historical Context Display */}
      {showContext && (
        <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-600 rounded-lg shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <span>📚</span>
              <span>Historical Context</span>
            </h4>
            <button
              onClick={() => setShowContext(false)}
              className="text-purple-600 hover:text-purple-800 text-xl leading-none"
              title="Close context"
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-purple-700">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading context...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {contextData && !loading && (
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              <p className="mb-2 text-xs text-purple-700 font-medium">
                For: "{selectedText}"
              </p>
              {contextData}
            </div>
          )}
        </div>
      )}
    </div>
  );
}