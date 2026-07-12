"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Investment {
  id: string;
  name: string;
  type: string; // RENDA_FIXA, ACOES, FII, CRIPTOMOEDAS
  purchaseValue: number;
  currentValue: number;
  quantity: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface InvestmentsViewProps {
  investments: Investment[];
  accounts: Account[];
}

export default function InvestmentsView({ investments, accounts }: InvestmentsViewProps) {
  const router = useRouter();
  const [modalType, setModalType] = useState<"CREATE" | "LIQUIDATE" | null>(null);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);

  // Add Investment Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("RENDA_FIXA");
  const [purchaseValue, setPurchaseValue] = useState("1.000,00");
  const [currentValue, setCurrentValue] = useState("1.000,00");
  const [quantity, setQuantity] = useState("1");
  const [fundingAccountId, setFundingAccountId] = useState("");

  // Liquidate Form Fields
  const [liquidateAccountId, setLiquidateAccountId] = useState(accounts[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amountInCents: number) => {
    const value = amountInCents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const getTypeName = (t: string) => {
    switch (t) {
      case "RENDA_FIXA": return "Renda Fixa";
      case "ACOES": return "Ações";
      case "FII": return "Fundos Imobiliários";
      case "CRIPTOMOEDAS": return "Criptoativos";
      default: return t;
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case "RENDA_FIXA": return "#3b82f6"; // Blue
      case "ACOES": return "#22c55e";     // Green
      case "FII": return "#eab308";       // Yellow
      case "CRIPTOMOEDAS": return "#a855f7"; // Purple
      default: return "var(--text-secondary)";
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const pVal = parseFloat(purchaseValue.replace(/\./g, "").replace(",", "."));
      const cVal = parseFloat(currentValue.replace(/\./g, "").replace(",", "."));
      const qty = parseFloat(quantity.replace(",", "."));

      if (isNaN(pVal) || pVal <= 0 || isNaN(qty) || qty <= 0) {
        throw new Error("Valores inválidos para cadastro.");
      }

      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          purchaseValue: pVal * 100,
          currentValue: cVal * 100,
          quantity: qty,
          accountId: fundingAccountId || null
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar investimento");

      // Reset
      setName("");
      setType("RENDA_FIXA");
      setPurchaseValue("1.000,00");
      setCurrentValue("1.000,00");
      setQuantity("1");
      setFundingAccountId("");
      setModalType(null);

      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiquidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    setIsLoading(true);

    try {
      const url = `/api/investments?id=${selectedInv.id}${liquidateAccountId ? `&accountId=${liquidateAccountId}` : ""}`;
      const res = await fetch(url, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Erro ao liquidar investimento");

      setModalType(null);
      setSelectedInv(null);
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Consolidação de dados
  const totalPurchase = investments.reduce((acc, curr) => acc + curr.purchaseValue, 0);
  const totalCurrent = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalGain = totalCurrent - totalPurchase;
  const totalGainPercent = totalPurchase > 0 ? (totalGain / totalPurchase) * 100 : 0;

  // Divisão por categorias de ativos
  const assetTypes = ["RENDA_FIXA", "ACOES", "FII", "CRIPTOMOEDAS"];
  const typeAllocation = assetTypes.map((t) => {
    const totalForType = investments
      .filter((inv) => inv.type === t)
      .reduce((acc, curr) => acc + curr.currentValue, 0);
    return {
      type: t,
      value: totalForType,
      percent: totalCurrent > 0 ? (totalForType / totalCurrent) * 100 : 0
    };
  }).filter((x) => x.value > 0);

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Carteira de Investimentos
          </h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Monitore a alocação de ativos e a rentabilidade do seu patrimônio
          </span>
        </div>

        <div className="header-right">
          <button 
            onClick={() => setModalType("CREATE")} 
            className="btn-header btn-header-income"
            style={{ borderRadius: "8px" }}
          >
            + Novo Ativo
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="summary-grid" style={{ marginBottom: "2rem" }}>
        <div className="summary-card">
          <div className="summary-card-title">Patrimônio Atual</div>
          <div className="summary-card-value positive">{formatCurrency(totalCurrent)}</div>
          <div className="summary-card-subtext">Valor de mercado dos seus investimentos</div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Custo de Aquisição</div>
          <div className="summary-card-value" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalPurchase)}</div>
          <div className="summary-card-subtext">Capital total aportado</div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--text-secondary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-10.5-6h18a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 21.75v-9a2.25 2.25 0 012.25-2.25z"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Retorno Total</div>
          <div className={`summary-card-value ${totalGain >= 0 ? "positive" : "negative"}`}>
            {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
          </div>
          <div className="summary-card-subtext">
            <span className={totalGain >= 0 ? "up" : "down"}>
              {totalGain >= 0 ? "▲" : "▼"} {totalGainPercent.toFixed(2)}%
            </span> vs preço de compra
          </div>
        </div>
      </section>

      {/* Allocation & Assets Row */}
      <section className="dashboard-content-layout" style={{ marginBottom: "2rem" }}>
        {/* Left: Table of Holdings */}
        <div className="dashboard-left-column" style={{ flex: 2 }}>
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Meus Ativos</span>
            </div>

            <div className="transaction-table-wrapper" style={{ marginTop: "1rem" }}>
              <table className="transaction-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem" }}>Ativo</th>
                    <th style={{ padding: "0.75rem" }}>Classe</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Qtd</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Custo</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Atual</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Rentabilidade</th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => {
                    const gain = inv.currentValue - inv.purchaseValue;
                    const gainPercent = inv.purchaseValue > 0 ? (gain / inv.purchaseValue) * 100 : 0;
                    return (
                      <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.9rem" }}>
                        <td style={{ padding: "0.75rem", fontWeight: "600", color: "var(--text-primary)" }}>{inv.name}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ color: getTypeColor(inv.type), fontWeight: "600", fontSize: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                            {getTypeName(inv.type)}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>{inv.quantity}</td>
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>{formatCurrency(inv.purchaseValue)}</td>
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>{formatCurrency(inv.currentValue)}</td>
                        <td style={{ padding: "0.75rem", textAlign: "right", color: gain >= 0 ? "var(--success)" : "var(--danger)", fontWeight: "600" }}>
                          {gain >= 0 ? "+" : ""}{gainPercent.toFixed(1)}%
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <button 
                            onClick={() => {
                              setSelectedInv(inv);
                              setModalType("LIQUIDATE");
                            }}
                            className="btn-filter-toggle"
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}
                          >
                            Resgatar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {investments.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        Nenhum investimento cadastrado. Clique em "+ Novo Ativo" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Allocation breakdown */}
        <div style={{ flex: 1 }}>
          <div className="panel-card" style={{ height: "100%" }}>
            <div className="panel-header">
              <span className="panel-title">Distribuição de Ativos</span>
            </div>

            <div style={{ padding: "1rem 0" }}>
              {/* Custom SVG Stacked Bar */}
              <div style={{ height: "24px", display: "flex", borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)" }}>
                {typeAllocation.map((alloc) => (
                  <div 
                    key={alloc.type} 
                    style={{ 
                      width: `${alloc.percent}%`, 
                      backgroundColor: getTypeColor(alloc.type), 
                      height: "100%" 
                    }} 
                    title={`${getTypeName(alloc.type)}: ${alloc.percent.toFixed(1)}%`}
                  />
                ))}
              </div>

              {/* Allocation Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {typeAllocation.map((alloc) => (
                  <div key={alloc.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: getTypeColor(alloc.type) }} />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{getTypeName(alloc.type)}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)", display: "block" }}>
                        {formatCurrency(alloc.value)}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {alloc.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {typeAllocation.length === 0 && (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", display: "block" }}>
                    Nenhum dado de alocação disponível.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Holding Modal */}
      {modalType === "CREATE" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Novo Ativo na Carteira</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>&times;</button>
            </div>

            <form onSubmit={handleAddInvestment}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Nome */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>NOME DO ATIVO</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Tesouro Selic 2029, PETR4, Bitcoin"
                    required
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Classe */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>CLASSE DE ATIVO</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", outline: "none" }}
                  >
                    <option value="RENDA_FIXA">Renda Fixa (CDB, Tesouro, LCI)</option>
                    <option value="ACOES">Ações (Bolsa de Valores)</option>
                    <option value="FII">Fundos Imobiliários (FIIs)</option>
                    <option value="CRIPTOMOEDAS">Criptomoedas / Crypto</option>
                  </select>
                </div>

                {/* Qtd */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>QUANTIDADE COMPRADA</label>
                  <input 
                    type="text" 
                    required
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                {/* Custo total */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>VALOR TOTAL PAGO (APORTE) (R$)</label>
                  <input 
                    type="text" 
                    required
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={purchaseValue}
                    onChange={(e) => setPurchaseValue(e.target.value)}
                  />
                </div>

                {/* Valor Atual */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>VALOR ATUAL DE MERCADO (OPCIONAL) (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Se diferente do valor pago"
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                  />
                </div>

                {/* Debitar de Conta */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>DEBITAR VALOR DE COMPRA DE CONTA</label>
                  <select 
                    value={fundingAccountId}
                    onChange={(e) => setFundingAccountId(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", outline: "none" }}
                  >
                    <option value="">(Não registrar no extrato financeiro)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setModalType(null)}
                  className="btn-filter-toggle"
                  style={{ borderRadius: "6px" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-header btn-header-income"
                  style={{ borderRadius: "6px", color: "#fff" }}
                >
                  {isLoading ? "Salvando..." : "Salvar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liquidate Holding Modal */}
      {modalType === "LIQUIDATE" && selectedInv && (
        <div className="modal-overlay" onClick={() => { setModalType(null); setSelectedInv(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Resgatar / Vender: {selectedInv.name}</span>
              <button className="modal-close-btn" onClick={() => { setModalType(null); setSelectedInv(null); }}>&times;</button>
            </div>

            <form onSubmit={handleLiquidate}>
              <div style={{ padding: "1.5rem" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                  Você está liquidando este ativo. O valor atual de mercado de <strong>{formatCurrency(selectedInv.currentValue)}</strong> será retirado da sua carteira de investimentos.
                </p>

                {/* Conta para Creditar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>CREDITAR VALOR DE RESGATE NA CONTA</label>
                  <select 
                    value={liquidateAccountId}
                    onChange={(e) => setLiquidateAccountId(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", outline: "none" }}
                  >
                    <option value="">(Não registrar movimentação no extrato)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => { setModalType(null); setSelectedInv(null); }}
                  className="btn-filter-toggle"
                  style={{ borderRadius: "6px" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-header"
                  style={{ borderRadius: "6px", backgroundColor: "var(--danger)", color: "#fff" }}
                >
                  {isLoading ? "Processando..." : "Confirmar Venda / Resgate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
