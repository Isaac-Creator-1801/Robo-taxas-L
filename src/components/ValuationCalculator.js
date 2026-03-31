import React, { useState, useEffect } from 'react';
import '../styles/main.css';

const ValuationCalculator = ({ currentPrice, symbol }) => {
  // Estados para os inputs
  const [lpa, setLpa] = useState('');
  const [vpa, setVpa] = useState('');
  const [dpa, setDpa] = useState('');
  const [growth, setGrowth] = useState('5'); // Crescimento projetado (%)
  const [discountRate, setDiscountRate] = useState('12'); // Custo de Capital / Selic (%)
  const [bazinRate, setBazinRate] = useState('6'); // Retorno mínimo Bazin (%)
  
  // Exibição de explicações
  const [activeInfo, setActiveInfo] = useState(null);

  const toggleInfo = (method) => {
    if (activeInfo === method) setActiveInfo(null);
    else setActiveInfo(method);
  };

  // Funções de Cálculo
  const calcGraham = () => {
    const l = parseFloat(lpa);
    const v = parseFloat(vpa);
    if (l > 0 && v > 0) {
      const fairValue = Math.sqrt(22.5 * l * v);
      const upside = ((fairValue / currentPrice) - 1) * 100;
      return { fairValue, upside, valid: true };
    }
    return { valid: false };
  };

  const calcBazin = () => {
    const d = parseFloat(dpa);
    const r = parseFloat(bazinRate) / 100;
    if (d > 0 && r > 0) {
      const fairValue = d / r;
      const upside = ((fairValue / currentPrice) - 1) * 100;
      return { fairValue, upside, valid: true };
    }
    return { valid: false };
  };

  const calcLynch = () => {
    const l = parseFloat(lpa);
    const d = parseFloat(dpa);
    const g = parseFloat(growth);
    
    if (l > 0 && currentPrice > 0) {
      const pl = currentPrice / l;
      const dy = d > 0 ? (d / currentPrice) * 100 : 0;
      // Ratio de Lynch: (Crescimento + DY) / PL
      const ratio = (g + dy) / pl;
      
      let status = '';
      let statusColor = '';
      if (ratio < 1) { status = 'Caro / Sobrevalorizado'; statusColor = 'var(--color-bearish)'; }
      else if (ratio < 1.5) { status = 'Preço Justo'; statusColor = '#eab308'; }
      else if (ratio < 2.5) { status = 'Barato / Bom Ponto'; statusColor = 'var(--color-bullish)'; }
      else { status = 'Oportunidade Extrema'; statusColor = '#10b981'; }

      return { ratio, pl, dy, status, statusColor, valid: true };
    }
    return { valid: false };
  };

  const calcDCF = () => {
    const l = parseFloat(lpa);
    const d = parseFloat(dpa);
    const g = parseFloat(growth) / 100;
    const k = parseFloat(discountRate) / 100;
    
    // Calculando o Payout histórico baseado no DPA e LPA atuak
    let payout = 0;
    if (l > 0 && d > 0) {
       payout = d / l;
    } else if (l > 0) {
       // Se o usuário não botou dividendo, assumimos 50% de payout genérico
       payout = 0.5;
    }

    if (l > 0 && k > g) {
      // Modelo de Gordon: P0 = (LPA * Payout * (1 + g)) / (k - g)
      const d1 = l * payout * (1 + g);
      const fairValue = d1 / (k - g);
      const upside = ((fairValue / currentPrice) - 1) * 100;
      return { fairValue, upside, payout: (payout*100).toFixed(1), valid: true };
    } else if (k <= g && l > 0) {
      return { valid: false, error: 'A Taxa de Desconto (Risco) deve ser maior que o Crescimento Esperado na perpetuidade.' };
    }
    return { valid: false };
  };

  const formatCurrency = (val) => {
    return val ? `R$ ${val.toFixed(2)}` : '---';
  };

  const getUpsideClass = (upside) => {
    if (upside > 15) return 'upside-high'; // Muito barato
    if (upside > 0) return 'upside-mid'; // Justo a leve desconto
    return 'upside-low'; // Caro
  };

  const getUpsideText = (upside) => {
    if (upside > 15) return `Oportunidade (+${upside.toFixed(1)}%)`;
    if (upside > 0) return `Justo (+${upside.toFixed(1)}%)`;
    return `Caro (${upside.toFixed(1)}%)`;
  };

  const renderCard = (title, author, data, icon, InfoComponent) => {
    return (
      <div className={`valuation-card ${activeInfo === title ? 'expanded' : ''}`}>
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-icon">{icon}</span>
            <div>
              <h4 className="card-method">{title}</h4>
              <span className="card-author">{author}</span>
            </div>
          </div>
          <button className="info-btn" onClick={() => toggleInfo(title)} title="Como funciona?">
            {activeInfo === title ? '✕' : '?'}
          </button>
        </div>

        {activeInfo === title && (
          <div className="card-info-box">
            {InfoComponent}
          </div>
        )}

        <div className="card-body">
          {data.error ? (
            <div className="valuation-error">{data.error}</div>
          ) : data.valid ? (
            title === 'Peter Lynch' ? (
              <div className="lynch-results">
                <div className="lynch-metric"><strong>Ratio:</strong> {data.ratio.toFixed(2)}</div>
                <div className="lynch-metric"><strong>P/L Atual:</strong> {data.pl.toFixed(2)}</div>
                <div className="lynch-status" style={{color: data.statusColor}}>{data.status}</div>
              </div>
            ) : (
              <>
                <div className="fair-value-display">
                  <span className="fv-label">Preço Teto Mágico</span>
                  <span className="fv-value">{formatCurrency(data.fairValue)}</span>
                </div>
                <div className={`upside-badge ${getUpsideClass(data.upside)}`}>
                  {getUpsideText(data.upside)}
                </div>
              </>
            )
          ) : (
            <div className=" Valuation-empty">
              Preencha os campos acima para calcular.
            </div>
          )}
        </div>
      </div>
    );
  };

  const grahamInfo = (
    <p>
      <strong>Benjamin Graham (Mentor de Warren Buffett):</strong> Busca o valor intrínseco ignorando oscilações de mercado. Ideal para empresas maduras e com muito patrimônio. 
      <br/><br/><em>Fórmula: &#8730;(22.5 * VPA * LPA)</em>
    </p>
  );

  const bazinInfo = (
    <p>
      <strong>Décio Bazin:</strong> Ignora o crescimento do lucro e foca 100% num retorno garantido e seguro de dividendos (Cash cow). Exige uma rentabilidade mínima (geralmente 6% ao ano).
      <br/><br/><em>Fórmula: DPA / Retorno Mínimo Desejado</em>
    </p>
  );

  const lynchInfo = (
    <p>
      <strong>Peter Lynch:</strong> Focado em "Ações de Crescimento" (Growth). Relaciona o quanto você paga de múltiplo (P/L) com o potencial de Dividend Yield somado ao Crescimento da empresa. Se a soma for maior que o P/L pago, a ação está barata.
      <br/><br/><em>Fórmula: (Crescimento % + Dividend Yield %) / (P/L)</em>
    </p>
  );

  const dcfInfo = (
    <p>
      <strong>Múltiplos / Gordon Growth (Fluxo de Caixa):</strong> Projeta os dividendos distribuídos pela empresa até a perpetuidade e os traz a valor presente usando uma taxa de juros (o prêmio de risco que você exige correr). Essa é a conta mais avançada feita pelas assets de Wall Street.
      <br/><br/><em>Fórmula: P0 = (LPA * Payout) * (1 + Crescimento) / (Taxa Risco - Crescimento)</em>
    </p>
  );

  return (
    <div className="valuation-container">
      <div className="valuation-header">
        <div className="vh-title-area">
          <h3><span className="section-icon">🧠</span> Calculadora de Valuation Interativa</h3>
          <p className="vh-subtitle">
            Transparência total: Diferente de plataformas cegas, insira você mesmo as suas premissas ("chutes estratégicos") do balanço oficial e descubra o Preço Teto exato que Buffet, Lynch, Bazin e Graham pagariam hoje em {symbol}.
          </p>
        </div>
        <div className="vh-price-tag">
          <span className="vh-current-label">Preço Atual ({symbol})</span>
          <span className="vh-current-val">{formatCurrency(currentPrice)}</span>
        </div>
      </div>

      <div className="valuation-inputs">
        <div className="input-group">
          <label>LPA (Lucro por Ação - R$)</label>
          <input 
            type="number" step="0.01" min="0" 
            placeholder="Ex: 2.50" value={lpa} onChange={e => setLpa(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>VPA (Valor Patrim. por Ação - R$)</label>
          <input 
            type="number" step="0.01" min="0" 
            placeholder="Ex: 15.00" value={vpa} onChange={e => setVpa(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>DPA (Dividendo 12m - R$)</label>
          <input 
            type="number" step="0.01" min="0" 
            placeholder="Ex: 1.20" value={dpa} onChange={e => setDpa(e.target.value)} 
          />
        </div>
        
        <div className="input-separator">Premissas Futuras</div>

        <div className="input-group">
          <label>Crescimento Perpétuo (%)</label>
          <input 
            type="number" step="0.1" 
            title="Sua aposta pro crescimento médio pra vida toda da empresa."
            placeholder="Ex: 5" value={growth} onChange={e => setGrowth(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>Tx. Desconto / Retorno Exigido (%)</label>
          <input 
            type="number" step="0.1" min="0" 
            title="Qual seu ganho mínimo pra correr o risco? (Ex: Selic + Prêmio)"
            placeholder="Ex: 12" value={discountRate} onChange={e => setDiscountRate(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>Tx. Mínima Bazin (%)</label>
          <input 
            type="number" step="0.1" min="0.1" 
            title="Décio Bazin exige 6% de dividendo pra investir. Modifique se quiser ser mais agressivo/conservador."
            placeholder="Ex: 6" value={bazinRate} onChange={e => setBazinRate(e.target.value)} 
          />
        </div>
      </div>

      <div className="valuation-cards-grid">
        {renderCard("Fórmula de Graham", "O Mestre do Value", calcGraham(), "🏛️", grahamInfo)}
        {renderCard("Método Bazin", "Foco em Dividendos Seguros", calcBazin(), "🐄", bazinInfo)}
        {renderCard("Peter Lynch", "Crescimento a Preço Justo", calcLynch(), "📈", lynchInfo)}
        {renderCard("Fluxo de Caixa", "Gordon Growth Model", calcDCF(), "⏳", dcfInfo)}
      </div>

    </div>
  );
};

export default ValuationCalculator;
