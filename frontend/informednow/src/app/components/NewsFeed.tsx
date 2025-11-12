import React, { useState, useEffect } from 'react';

interface Article {
  _id: string;
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  country: string[];
  language: string;
  source_id?: string;
  published_at?: string;
  fetchedAt: Date;
}

const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('📰 Fetching articles from API...');
      
      const response = await fetch('/api/articles', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data: Article[] = await response.json();
      console.log('Loaded articles:', data);
      setArticles(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '60px 20px',
        textAlign: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>Loading latest news...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        margin: '20px auto',
        maxWidth: '500px'
      }}>
        <h3 style={{ color: 'white', marginBottom: '8px' }}>⚠️ Error Loading Articles</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={fetchArticles}
          style={{
            padding: '10px 24px',
            backgroundColor: 'white',
            color: '#1a73e8',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.8)'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'white' }}>No articles available yet</h3>
        <p>Articles will appear here once they are fetched from the news API.</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '0 20px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '8px'
        }}>
          Latest Headlines
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
          {articles.length} articles • Updated {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Articles List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {articles.map((article, index) => (
          <article
            key={article._id}
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              height: '140px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            onClick={() => window.open(article.url, '_blank')}
          >
            {/* Number Badge */}
            <div style={{
              width: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#999'
              }}>
                {index + 1}
              </span>
            </div>

            {/* Article Image */}
            {article.image_url && (
              <div style={{
                width: '180px',
                height: '140px',
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                flexShrink: 0
              }}>
                <img
                  src={article.image_url}
                  alt={article.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (target) target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Article Content */}
            <div style={{ 
              padding: '16px 20px', 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 0
            }}>
              {/* Source & Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                {article.source_id && (
                  <span style={{
                    backgroundColor: '#e8f0fe',
                    color: '#1a73e8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    {article.source_id}
                  </span>
                )}
                {article.published_at && (
                  <span>
                    {new Date(article.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {article.title}
              </h3>

              {/* Description */}
              {article.description && (
                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;