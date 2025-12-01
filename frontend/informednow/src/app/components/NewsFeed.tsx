import React, { useState, useEffect } from "react";
import HistoricalContextSelection from "./HistoricalContextSelection";
import DOMPurify from "dompurify";

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
  const [articleSummaries, setArticleSummaries] = useState<{ [key: string]: string }>({});
  const [summaryLoading, setSummaryLoading] = useState<{ [key: string]: boolean }>({});
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const articlesPerPage = 10;

  useEffect(() => {
    fetchArticles();
  }, []);

  const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
    });
  };

  const isValidURL = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleGetSummary = async (articleId: string, title: string, desc: string) => {
    setSummaryLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      const info = `${title} ${desc}`;
      if (!info || info.trim().length === 0) {
        throw new Error("Nothing to summarize");
      }
      if (info.length > 5000) {
        throw new Error("Article text too long");
      }

      const response = await fetch("/api/summarizeArticle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: info }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const llmResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? data?.candidates?.[0]?.text ?? data?.text ?? "";

      const sanitizedResponse = sanitizeHTML(String(llmResponse || "No summary available"));

      setArticleSummaries((prevSummaries) => ({
        ...prevSummaries,
        [articleId]: sanitizedResponse,
      }));
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setArticleSummaries((prevSummaries) => ({
        ...prevSummaries,
        [articleId]: "Failed to generate summary",
      }));
    } finally {
      setSummaryLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const toggleCardExpansion = (articleId: string) => {
    setExpandedCards((prevState) => ({
      ...prevState,
      [articleId]: !prevState[articleId],
    }));
  };

  const fetchArticles = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/articles", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }

      const data: Article[] = await response.json();

      const initialExpanded: { [key: string]: boolean } = {};
      data.forEach((article) => {
        initialExpanded[article._id] = false;
      });
      setExpandedCards(initialExpanded);

      setArticles(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openArticleURL = (url: string) => {
    if (!isValidURL(url)) {
      console.error("Invalid URL:", url);
      alert("Invalid article URL");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-xl font-semibold text-red-800 mb-2">⚠️ Error Loading Articles</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchArticles} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <h3 className="text-2xl font-semibold mb-4">No articles available yet</h3>
        <p>Articles will appear here once they are fetched from the news API.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Latest Headlines</h2>
        <p className="text-gray-600">
          Showing {indexOfFirstArticle + 1}-{Math.min(indexOfLastArticle, articles.length)} of {articles.length} articles
        </p>
      </div>

      <div className="space-y-6">
        {currentArticles.map((article) => (
          <article key={article._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200">
            <div className="flex flex-col lg:flex-row">
              {article.image_url && isValidURL(article.image_url) && (
                <div className="lg:w-80 h-64 lg:h-auto flex-shrink-0">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget.parentElement;
                      if (target) target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="flex-1 p-6">
                <div className="flex items-center gap-3 mb-3">
                  {article.source_id && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                      {String(article.source_id).substring(0, 50)}
                    </span>
                  )}
                  {article.published_at && (
                    <span className="text-sm text-gray-500">
                      {new Date(article.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <h3 onClick={() => openArticleURL(article.url)} className="text-2xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-blue-600 transition-colors leading-tight">
                  {article.title}
                </h3>

                {article.description && expandedCards[article._id] && (
                  <div className="mb-4 max-h-48 overflow-y-auto">
                    <HistoricalContextSelection desc={article.description} />
                  </div>
                )}

                {expandedCards[article._id] && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-blue-700">🤖 AI Summary</span>

                      {!articleSummaries[article._id] && !summaryLoading[article._id] && (
                        <button
                          onClick={() => handleGetSummary(article._id, article.title, article.description ?? "")}
                          className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                          Generate Summary
                        </button>
                      )}
                    </div>

                    {summaryLoading[article._id] ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Generating summary...</span>
                      </div>
                    ) : articleSummaries[article._id] ? (
                      <div className="text-gray-700 text-sm leading-relaxed max-h-40 overflow-y-auto">{articleSummaries[article._id]}</div>
                    ) : (
                      <div className="text-gray-500 text-sm">Click "Generate Summary" to get an AI-powered summary of this article.</div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <button onClick={() => toggleCardExpansion(article._id)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    {expandedCards[article._id] ? (
                      <>
                        <span>▲</span>
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <span>▼</span>
                        <span>Show More</span>
                      </>
                    )}
                  </button>

                  {!expandedCards[article._id] && !articleSummaries[article._id] && (
                    <button
                      onClick={() => {
                        toggleCardExpansion(article._id);
                        setTimeout(() => {
                          handleGetSummary(article._id, article.title, article.description ?? "");
                        }, 100);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Quick Summary
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-2">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            ← Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-4 py-2 rounded-lg transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                {pageNum}
              </button>
            ))}
          </div>

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
