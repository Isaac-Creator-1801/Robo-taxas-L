# Análise de Ações - Expert Financeiro

Uma aplicação web responsiva para análise de ações do mercado financeiro com expertise simulada de analista com 50+ anos de experiência.

## Funcionalidades

- ✅ Barra de pesquisa para busca de ações por símbolo (ex: AAPL, GOOGL, PETR4)
- ✅ Análise técnica avançada (RSI, MACD, Médias Móveis, Tendência)
- ✅ Análise fundamentalista (P/L, P/VP, Dividend Yield, ROE, Margens)
- ✅ Análise de contexto de mercado (Setor, Performance setorial)
- ✅ Avaliação de relações internacionais que afetam a ação
- ✅ Previsões de preço para curto, médio e longo prazo
- ✅ Avaliação de risco de investimento
- ✅ Notícias recentes e eventos futuros importantes
- ✅ Recomendação de investimento com score de confiança
- ✅ Interface responsiva e moderna
- ✅ Dados atualizados em tempo real (simulado)

## Tecnologias Utilizadas

- **Frontend:** React.js
- **Build:** Webpack 5 com Babel
- **Estilização:** CSS3 moderno com responsividade
- **Requisições HTTP:** Axios
- **API de Dados:** Integração simulada com Alpha Vantage (para ser substituída por chave real)

## Como Executar

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Obtenha uma chave gratuita da [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
4. Substitua `'YOUR_ALPHA_VANTAGE_API_KEY'` no arquivo `src/api/stockService.js` pela sua chave real
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```
6. Acesse http://localhost:3000 no seu navegador

## Estrutura do Projeto

```
analise-acoes-app/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── stockService.js          # Integração com API de dados financeiros
│   │   └── marketAnalysisService.js # Lógica de análise avançada
│   ├── components/
│   │   ├── SearchBar.js             # Barra de pesquisa
│   │   └── StockAnalysis.js         # Componente principal de análise
│   ├── styles/
│   │   └── main.css                 # Estilos globais
│   ├── App.js                       # Componente raiz
│   └── index.js                     # Ponto de entrada
├── webpack.config.js                # Configuração do Webpack
├── .babelrc                         # Configuração do Babel
├── package.json                     # Dependências e scripts
└── README.md                        # Este arquivo
```

## Próximos Passos / Melhorias Futuras

- [ ] Integração real com API Alpha Vantage ou outra fonte de dados premium
- [ ] Adicionar autenticação e personalização de watchlist
- [ ] Implementar gráficos interativos com bibliotecas como Chart.js ou D3.js
- [ ] Adicionar modo escuro
- [ ] Implementar sistema de alertas para mudanças significativas
- [ ] Adicionar suporte para ações brasileiras (B3) com sufixo .SA
- [ ] Melhorar a precisão das previsões com modelos de machine learning
- [ ] Adicionar backtesting de estratégias
- [ ] Implementar exportação de relatórios em PDF

## Aviso Legal

Esta aplicação é para fins educacionais e informativos. As análises e previsões são simuladas e não constituem aconselhamento financeiro. Sempre consulte um profissional qualificado antes de tomar decisões de investimento. O desempenho passado não garante resultados futuros.

Desenvolvido com ❤️ para ajudar investidores a tomar decisões mais informadas.