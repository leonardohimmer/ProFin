"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CashFlowItem {
  month: string;
  income: number;
  expense: number;
}

interface CategoryExpenseItem {
  name: string;
  value: number;
  percent: number;
}

interface ReportsViewProps {
  cashFlowData: CashFlowItem[];
  categoryData: CategoryExpenseItem[];
  totalExpenses: number;
  totalIncome: number;
  averageExpense: number;
}

export default function ReportsView({
  cashFlowData,
  categoryData,
  totalExpenses,
  totalIncome,
  averageExpense
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"FLUXO" | "CATEGORIAS">("FLUXO");

  const formatCurrency = (amountInCents: number) => {
    const value = amountInCents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "#a855f7", // purple
      "#3b82f6", // blue
      "#22c55e", // green
      "#eab308", // yellow
      "#f97316", // orange
      "#ec4899", // pink
      "#06b6d4"  // cyan
    ];
    return colors[index % colors.length];
  };

  // Cálculo de estatísticas
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Parâmetros do gráfico de colunas SVG (Fluxo de caixa)
  const maxVal = Math.max(...cashFlowData.map(d => Math.max(d.income, d.expense)), 100000); // Mínimo de R$ 1.000,00 para escala
  const chartHeight = 160;
  const chartWidth = 500;
  const barWidth = 18;
  const gapBetweenGroups = 45;
  const totalGroups = cashFlowData.length;

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Relatórios e Gráficos
          </h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Análise detalhada do seu fluxo de caixa e estrutura de custos
          </span>
        </div>

        <div className="header-right">
          <Link href="/transacoes" className="btn-filter-toggle" style={{ borderRadius: "8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Ver Extrato
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <section style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => setActiveTab("FLUXO")}
          className={`tab-btn ${activeTab === "FLUXO" ? "active" : ""}`}
          style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", borderRadius: "8px" }}
        >
          Fluxo de Caixa
        </button>
        <button 
          onClick={() => setActiveTab("CATEGORIAS")}
          className={`tab-btn ${activeTab === "CATEGORIAS" ? "active" : ""}`}
          style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", borderRadius: "8px" }}
        >
          Despesas por Categoria
        </button>
      </section>

      {/* Overview Cards */}
      <section className="summary-grid" style={{ marginBottom: "2rem" }}>
        <div className="summary-card">
          <div className="summary-card-title">Saldo Líquido (Mês)</div>
          <div className={`summary-card-value ${netSavings >= 0 ? "positive" : "negative"}`}>
            {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings)}
          </div>
          <div className="summary-card-subtext">Resultado das receitas vs despesas de Outubro</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Taxa de Poupança</div>
          <div className={`summary-card-value ${savingsRate >= 0 ? "purple" : "negative"}`}>
            {savingsRate.toFixed(1)}%
          </div>
          <div className="summary-card-subtext">Percentual da sua receita que foi economizado</div>
          <div className="progress-bar-container" style={{ height: 4, marginTop: "0.5rem", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)" }}>
            <div className="progress-bar-fill" style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%`, height: "100%", borderRadius: "2px", backgroundColor: "var(--primary)" }} />
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Média Mensal de Gastos</div>
          <div className="summary-card-value" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(averageExpense)}
          </div>
          <div className="summary-card-subtext">Histórico médio de despesas mensais</div>
        </div>
      </section>

      {/* Main Charts Cards */}
      <section className="dashboard-content-layout">
        {activeTab === "FLUXO" ? (
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-header" style={{ marginBottom: "2rem" }}>
              <span className="panel-title">Entradas vs Saídas Mensais</span>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "var(--success)" }} /> Receitas
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "var(--danger)" }} /> Despesas
                </span>
              </div>
            </div>

            {/* Custom SVG Column Chart */}
            <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", padding: "1rem 0" }}>
              {cashFlowData.length > 0 ? (
                <svg viewBox={`0 0 ${chartWidth} 220`} style={{ width: "100%", maxWidth: chartWidth, height: "auto" }}>
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="170" x2={chartWidth} y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {cashFlowData.map((d, index) => {
                    // Posicionamento x
                    const xBase = index * (barWidth * 2 + gapBetweenGroups) + 40;
                    
                    // Alturas das colunas
                    const incHeight = (d.income / maxVal) * chartHeight;
                    const expHeight = (d.expense / maxVal) * chartHeight;

                    // Posicionamento Y
                    const incY = 170 - incHeight;
                    const expY = 170 - expHeight;

                    return (
                      <g key={d.month}>
                        {/* Receitas Bar (Green) */}
                        <rect 
                          x={xBase} 
                          y={incY} 
                          width={barWidth} 
                          height={incHeight} 
                          fill="var(--success)" 
                          rx="3"
                        >
                          <title>{`Receitas: ${formatCurrency(d.income)}`}</title>
                        </rect>
                        {/* Despesas Bar (Red) */}
                        <rect 
                          x={xBase + barWidth + 4} 
                          y={expY} 
                          width={barWidth} 
                          height={expHeight} 
                          fill="var(--danger)" 
                          rx="3"
                        >
                          <title>{`Despesas: ${formatCurrency(d.expense)}`}</title>
                        </rect>
                        {/* Month text label */}
                        <text 
                          x={xBase + barWidth} 
                          y="190" 
                          fill="var(--text-secondary)" 
                          fontSize="10" 
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div style={{ padding: "3rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  Sem histórico de transações disponível para plotagem.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
              <span className="panel-title">Distribuição de Gastos do Mês</span>
              <span className="badge-critical" style={{ backgroundColor: "rgba(255,255,255,0.03)", color: "var(--text-secondary)" }}>
                Total: {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {categoryData.map((cat, index) => (
                <div key={cat.name} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: getCategoryColor(index) }} />
                      <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{cat.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", color: "var(--text-secondary)" }}>
                      <strong>{formatCurrency(cat.value)}</strong>
                      <span>{cat.percent.toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* Category mini bar */}
                  <div className="progress-bar-container" style={{ height: "6px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <div className="progress-bar-fill" style={{ width: `${cat.percent}%`, height: "100%", borderRadius: "3px", backgroundColor: getCategoryColor(index) }} />
                  </div>
                </div>
              ))}

              {categoryData.length === 0 && (
                <div style={{ padding: "3rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  Nenhuma despesa cadastrada no mês atual para compor o gráfico.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
