import React, { useState } from 'react';

const SearchBar = ({ onStockSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onStockSelect(searchTerm.trim().toUpperCase());
    }
  };

  return (
    <div className="SearchBar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="stock-search-input"
          placeholder="Digite o código da ação (ex: AAPL, PETR4, VALE3)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" id="stock-search-button">Pesquisar</button>
      </form>
    </div>
  );
};

export default SearchBar;