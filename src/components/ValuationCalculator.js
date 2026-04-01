import React, { useState, useEffect } from 'react';
import '../styles/main.css';

const ValuationCalculator = ({ currentPrice, symbol, fundamentalData }) => {
  // Estados para os inputs
  const [lpa, setLpa] = useState('');
  const [vpa, setVpa] = useState('');
  const [dpa, setDpa] = useState('');
  const [growth, setGrowth] = useState('5'); // Crescimento projetado (%)
  const [discountRate, setDiscountRate] = useState('12'); // Custo de Capital / Selic (%)
  const [bazinRate, setBazinRate] = useState('6'); // Retorno mínimo Bazin (%)

  // Auto-preencher com dados reais sempre que trocar de símbolo ou os dados chegarem
  useEffect(() => {
    if (fundamentalData && Object.keys(fundamentalData).length > 0) {
      console.log('[Valuation] Injetando dados automáticos:', fundamentalData);
      
      // Sempre preenche se os dados da API existirem (isso garante que o "---" suma)
      if (fundamentalData.earningsPerShare) {
        setLpa(parseFloat(fundamentalData.earningsPerShare).toFixed(2));
      }
      
      if (fundamentalData.bookValuePerShare) {
        setVpa(parseFloat(fundamentalData.bookValuePerShare).toFixed(2));
      }
      
      // Dividendo (DPA) - Se tiver DY, calcula. Se não, tenta o último dividendo.
      if (fundamentalData.dividendYield && currentPrice) {
        const estimatedDpa = (fundamentalData.dividendYield / 100) * currentPrice;
        setDpa(estimatedDpa.toFixed(2));
      } else if (fundamentalData.lastDividend) {
        setDpa(parseFloat(fundamentalData.lastDividend).toFixed(2));
      }
    }
  }, [fundamentalData, currentPrice, symbol]); // Adicionado symbol para resetar ao trocar de ação
  
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

  const renderPremiumRow = (title, author, data, icon, description) => {
    return (
      <div className="valuation-premium-row">
        <div className="valuation-header-slate">
          <div className="vh-title-group">
            <span className="vh-icon">{icon}</span>
            <span className="vh-title-text">{title.toUpperCase()}</span>
          </div>
          <button className="vh-info-btn" onClick={() => toggleInfo(title)} title="Como funciona?">
            {activeInfo === title ? '✕' : '?'}
          </button>
        </div>

        {activeInfo === title && (
          <div className="valuation-description-banner">
            <strong>{author}:</strong> {description}
          </div>
        )}

        <div className="metric-display-grid-premium">
          {/* Coluna 1: Preço Atual */}
          <div className="metric-column-premium">
            <span className="metric-label-premium">Preço atual</span>
            <span className="metric-value-featured">{formatCurrency(currentPrice)}</span>
          </div>

          {/* Coluna 2: Preço Justo / Métrica Central */}
          <div className="metric-column-premium">
            {title === 'Peter Lynch' ? (
              <>
                <span className="metric-label-premium">Lynch Ratio</span>
                <span className="metric-value-fair">{data.valid ? data.ratio.toFixed(2) : '---'}</span>
              </>
            ) : (
              <>
                <span className="metric-label-premium">Preço Justo</span>
                <span className="metric-value-fair">{data.valid ? formatCurrency(data.fairValue) : '---'}</span>
              </>
            )}
          </div>

          {/* Coluna 3: Upside / Status */}
          <div className="metric-column-premium">
            <span className="metric-label-premium">{title === 'Peter Lynch' ? 'Status' : 'Upside'}</span>
            {data.valid ? (
              title === 'Peter Lynch' ? (
                <div className="upside-premium-badge">
                  <span className="upside-pct-val" style={{color: data.statusColor}}>{data.status}</span>
                </div>
              ) : (
                <div className="upside-premium-badge">
                  <span className={`upside-pct-val ${data.upside >= 0 ? 'positive' : 'negative'}`}>
                    {Math.abs(data.upside).toFixed(2)}%
                  </span>
                  <span className={`upside-trend-icon ${data.upside >= 0 ? 'positive' : 'negative'}`} style={{color: data.upside >= 0 ? '#10b981' : '#f43f5e'}}>
                    {data.upside >= 0 ? '▲ OPORTUNIDADE' : '▼ CARO'}
                  </span>
                </div>
              )
            ) : (
              <span className="metric-label-premium">Aguardando dados...</span>
            )}
          </div>
        </div>

        {data.valid && title !== 'Peter Lynch' && (
          <div className="valuation-footer-details">
             {title === 'Fórmula de Graham' && (
               <>
                 <span>LPA: <span className="metric-pill-dark">{lpa}</span></span>
                 <span>VPA: <span className="metric-pill-dark">{vpa}</span></span>
               </>
             )}
             {title === 'Método Bazin' && (
               <span>DPA Projetado: <span className="metric-pill-dark">R$ {dpa}</span></span>
             )}
             {title === 'Fluxo de Caixa' && (
               <>
                 <span>G (Crescimento): <span className="metric-pill-dark">{growth}%</span></span>
                 <span>K (Desconto): <span className="metric-pill-dark">{discountRate}%</span></span>
               </>
             )}
          </div>
        )}
      </div>
    );
  };

  const grahamDesc = "Busca o valor intrínseco ignorando oscilações de mercado. Ideal para empresas maduras e com muito patrimônio. Fórmula: √(22.5 * VPA * LPA)";
  const bazinDesc = "Foca 100% num retorno garantido e seguro de dividendos. Exige uma rentabilidade mínima (geralmente 6% ao ano). Fórmula: DPA / Retorno Mínimo";
  const lynchDesc = "Relaciona o P/L com o potencial de crescimento e dividendos. Se a soma for maior que o P/L, a ação está barata. Fórmula: (G% + DY%) / P/L";
  const dcfDesc = "Projeta dividendos à perpetuidade e traz a valor presente usando uma taxa de risco. CONTA DE WALL STREET. Fórmula: Gordon Growth Model";

  return (
    <div className="valuation-container">
      <div className="valuation-header">
        <div className="vh-title-area">
          <h3><span className="section-icon">🧠</span> Calculadora de Valuation Interativa</h3>
          <p className="vh-subtitle">
            Transparência total: Diferente de plataformas cegas, insira você mesmo as suas premissas ("chutes estratégicos") do balanço oficial e descubra o Preço Teto exato que Buffet, Lynch, Bazin e Graham pagariam hoje em {symbol}.
          </p>
        </div>
      </div>

      <div className="valuation-inputs">
        <div className="auto-fill-status-badge">
          <span className="status-dot pulsed"></span>
          Dados oficiais de {symbol} injetados automaticamente
        </div>

        <div className="input-group">
          <label>LPA (Lucro por Ação - R$) <span className="info-tooltip" title="Lucro Líquido / Total de Ações">ⓘ</span></label>
          <input 
            type="number" step="any" min="0" 
            placeholder="Ex: 2.50" value={lpa} onChange={e => setLpa(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>VPA (Valor Patrim. por Ação - R$) <span className="info-tooltip" title="Patrimônio Líquido / Total de Ações">ⓘ</span></label>
          <input 
            type="number" step="any" min="0" 
            placeholder="Ex: 15.00" value={vpa} onChange={e => setVpa(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>DPA (Dividendo 12m - R$) <span className="info-tooltip" title="Total de proventos pagos por ação no ano">ⓘ</span></label>
          <input 
            type="number" step="any" min="0" 
            placeholder="Ex: 1.20" value={dpa} onChange={e => setDpa(e.target.value)} 
          />
        </div>
        
        <div className="input-separator">Premissas Futuras</div>

        <div className="input-group">
          <label>Crescimento Perpétuo (%)</label>
          <input 
            type="number" step="any" 
            title="Sua aposta pro crescimento médio pra vida toda da empresa."
            placeholder="Ex: 5" value={growth} onChange={e => setGrowth(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>Tx. Desconto / Retorno Exigido (%)</label>
          <input 
            type="number" step="any" min="0" 
            title="Qual seu ganho mínimo pra correr o risco? (Ex: Selic + Prêmio)"
            placeholder="Ex: 12" value={discountRate} onChange={e => setDiscountRate(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>Tx. Mínima Bazin (%)</label>
          <input 
            type="number" step="any" min="0.1" 
            title="Décio Bazin exige 6% de dividendo pra investir. Modifique se quiser ser mais agressivo/conservador."
            placeholder="Ex: 6" value={bazinRate} onChange={e => setBazinRate(e.target.value)} 
          />
        </div>
      </div>

      <div className="valuation-premium-section">
        {renderPremiumRow("Fórmula de Graham", "Benjamin Graham", calcGraham(), "🏛️", grahamDesc)}
        {renderPremiumRow("Método Bazin", "Décio Bazin", calcBazin(), "🐄", bazinDesc)}
        {renderPremiumRow("Peter Lynch", "Peter Lynch", calcLynch(), "📈", lynchDesc)}
        {renderPremiumRow("Fluxo de Caixa", "Gordon Growth", calcDCF(), "⏳", dcfDesc)}
      </div>

    </div>
  );
};

export default ValuationCalculator;
