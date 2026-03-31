import React, { useState, useEffect, useRef } from 'react';
import { searchTicker } from '../api/tickerDatabase';

const SearchBar = ({ onStockSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      const filtered = searchTicker(value);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (ticker) => {
    setSearchTerm(ticker);
    setSuggestions([]);
    setShowSuggestions(false);
    onStockSelect(ticker);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex].ticker);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onStockSelect(searchTerm.trim().toUpperCase());
      setShowSuggestions(false);
    }
  };

  return (
    <div className="SearchBar" ref={wrapperRef}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="search-input-wrapper">
          <input
            type="text"
            id="stock-search-input"
            placeholder="Digite Vale, Petrobras, Apple ou ticker..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-suggestions">
              {suggestions.map((item, index) => (
                <li 
                  key={item.ticker}
                  className={index === activeSuggestionIndex ? 'active' : ''}
                  onClick={() => handleSuggestionClick(item.ticker)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  <span className="suggestion-ticker">{item.ticker}</span>
                  <span className="suggestion-name">{item.name}</span>
                  <span className="suggestion-sector">{item.sector}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" id="stock-search-button">Pesquisar</button>
      </form>
    </div>
  );
};

export default SearchBar;