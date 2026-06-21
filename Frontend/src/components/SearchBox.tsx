import { useState, useEffect, useRef } from "react";
import "./SearchBox.css";

interface Suggestion {
  id: number;
  query: string;
  count: number;
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [trending, setTrending] = useState<string[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch Trending on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/v2/trending")
      .then(res => res.json())
      .then(result => setTrending(result.data || []))
      .catch(err => console.error("Failed to load trending:", err));
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!query.trim()) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/v2/suggest?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json();
        setSuggestions(result.data || []);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setError("Failed to fetch suggestions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 300); 
    
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery); 
    setIsFocused(false);   
    
    try {
      await fetch("http://localhost:5000/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
    } catch (error) {
      console.error("Failed to save search:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Up and Down arrows for navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selectedIndex < suggestions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSearch(suggestions[selectedIndex].query);
      } else {
        handleSearch(query);
      }
    }
  };

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const showDropdown = isFocused && (suggestions.length > 0 || isLoading || error);

  return (
    <div className="search-container">
      <header className="header-links">
        <nav>
          <a href="#">About</a>
          <a href="#">Store</a>
        </nav>
        <nav>
          <a href="#">Gmail</a>
          <a href="#">Images</a>
        </nav>
      </header>

      <main className="hero">
        <h1 className="hero-title">Search Service</h1>

        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
        >
          <div className="search-wrapper">
            <div className="input-row">
              <svg
                className="search-icon"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>

              <input
                type="text"
                className="search-input"
                placeholder="Search the web"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {showDropdown && (
              <div className="suggestions-panel">
                {error && <div className="error-message">{error}</div>}
                <ul className="suggestions-dropdown">
                  {suggestions.map((item, index) => (
                    <li
                      key={item.id}
                      className={`suggestion-item ${index === selectedIndex ? "selected" : ""}`}
                      onMouseDown={() => handleSearch(item.query)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span>{item.query}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button type="submit" className="search-button">Search Service</button>
            <button type="button" className="search-button secondary">I'm Feeling Lucky</button>
          </div>
        </form>

        {trending.length > 0 && (
          <div className="trending-row">
            <span className="trending-label">Trending:</span>
            <div className="trending-list">
              {trending.map((term, index) => (
                <button
                  key={index}
                  type="button"
                  className="trending-chip"
                  onClick={() => handleSearch(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
