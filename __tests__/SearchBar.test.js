import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../src/components/SearchBar';

describe('SearchBar Component', () => {
  test('renders input and button elements', () => {
    render(<SearchBar />);
    
    expect(screen.getByPlaceholderText('Digite o código da ação (ex: AAPL, PETR4, VALE3)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pesquisar' })).toBeInTheDocument();
  });

  test('calls onStockSelect with uppercase symbol when form is submitted', () => {
    const onStockSelectMock = jest.fn();
    render(<SearchBar onStockSelect={onStockSelectMock} />);
    
    const input = screen.getByPlaceholderText('Digite o código da ação (ex: AAPL, PETR4, VALE3)');
    const button = screen.getByRole('button', { name: 'Pesquisar' });
    
    fireEvent.change(input, { target: { value: 'vale3' } });
    fireEvent.click(button);
    
    expect(onStockSelectMock).toHaveBeenCalledWith('VALE3');
  });

  test('does not call onStockSelect when input is empty', () => {
    const onStockSelectMock = jest.fn();
    render(<SearchBar onStockSelect={onStockSelectMock} />);
    
    const button = screen.getByRole('button', { name: 'Pesquisar' });
    fireEvent.click(button);
    
    expect(onStockSelectMock).not.toHaveBeenCalled();
  });

  test('updates input value when user types', () => {
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Digite o código da ação (ex: AAPL, PETR4, VALE3)');
    fireEvent.change(input, { target: { value: 'petr4' } });
    
    expect(input.value).toBe('petr4');
  });
});