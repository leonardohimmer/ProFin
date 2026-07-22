"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BudgetInfo {
  id: string;
  categoryName: string;
  targetAmount: number;
  spentAmount: number;
}

interface PlanningViewProps {
  budgets: BudgetInfo[];
}

export default function PlanningView({ budgets: initialBudgets }: PlanningViewProps) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetInfo[]>(initialBudgets);
  const [activeMonth, setActiveMonth] = useState("Outubro");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const formatCurrency = (cents: number) => {
    const value = cents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const getPercentUsed = (spent: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((spent / target) * 100);
  };

  // Handlers para atualizar a meta
  const handleTargetChange = (id: string, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, targetAmount: Number(numericValue) * 100 } : b));
  };

  const handleSaveTarget = async (id: string, targetAmount: number) => {
    try {
      await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, targetAmount })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newAmount) return;

    const targetAmount = Math.round(parseFloat(newAmount.replace(/\D/g, "")) * 100);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: newCategory, targetAmount })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCategory("");
        setNewAmount("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calcula totais reais do planejamento baseados no banco
  const totalPlanned = budgets.reduce((sum, b) => sum + b.targetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalAvailable = totalPlanned - totalSpent;
  const globalPercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  const getAlertColorClass = (percent: number) => {
    if (percent >= 100) return "bar-alert-critical"; // Crítico (red)
    if (percent >= 80) return "bar-alert-critical"; // Na imagem de exemplo, 88% está em vermelho
    return "bar-alert-safe"; // Seguro (green)
  };

  const getCategoryIcon = (name: string) => {
    if (name === "Alimentação") {
      return (
        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"></path>
        </svg>
      );
    }
    if (name === "Lazer") {
      return (
        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM1.5 19v-1.5a3 3 0 013-3h15a3 3 0 013 3V19M3 9l9-6 9 6"></path>
        </svg>
      );
    }
    if (name === "Transporte") {
      return (
        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h7.5m3.75-1.5h.008v.008H19.5v-.008zm0-3h.008v.008H19.5v-.008zm-15 0h.008v.008H4.5v-.008zm0-3h.008v.008H4.5V9.75"></path>
        </svg>
      );
    }
    if (name === "Moradia") {
      return (
        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      );
    }
    return (
      <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"></path>
      </svg>
    );
  };

  const getCategorySubtext = (name: string) => {
    switch (name) {
      case "Alimentação": return "Supermercado e Apps";
      case "Lazer": return "Hobbies e Entretenimento";
      case "Transporte": return "Combustível e Uber";
      case "Moradia": return "Aluguel e Contas";
      default: return "Despesas Gerais";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1>Planejamento Mensal</h1>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Gerencie suas metas de gastos para Outubro 2023
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="search-input-wrapper" style={{ margin: 0, marginRight: "1rem" }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar orçamentos ou categorias..."
            />
            <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn-header" style={{ backgroundColor: "var(--primary)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "0.5rem", border: "none", cursor: "pointer", fontWeight: 600 }}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            Novo Planejamento
          </button>
        </div>
      </header>

      {/* Outubro & Export Row */}
      <section style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn-filter-toggle" style={{ borderRadius: "8px", display: "flex", gap: "0.5rem" }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75"></path>
          </svg>
          Outubro
        </button>

        <button className="btn-filter-toggle" style={{ borderRadius: "8px", border: "1px solid var(--primary)", color: "#c084fc", display: "flex", gap: "0.5rem" }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"></path>
          </svg>
          Exportar Relatório
        </button>
      </section>

      {/* Top summary layout */}
      <section className="dashboard-content-layout" style={{ marginBottom: "2rem" }}>
        {/* Column 1 (Total Planejado vs Real) */}
        <div className="panel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="panel-header">
            <span className="panel-title" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
              Total Planejado vs Real
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Disponível</span>
              <strong style={{ color: "var(--success)", fontSize: "1.1rem" }}>{formatCurrency(totalAvailable)}</strong>
            </div>
          </div>

          <div style={{ margin: "1rem 0" }}>
            <div style={{ fontSize: "2.75rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {formatCurrency(totalPlanned)}
            </div>
            
            <div style={{ margin: "1rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                <span>Progresso Global do Orçamento</span>
                <span>{globalPercent}% Utilizado</span>
              </div>
              <div className="progress-bar-bg" style={{ height: "8px" }}>
                <div className="progress-bar-fill" style={{ width: `${globalPercent}%` }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Gasto Real</span>
              <strong style={{ fontSize: "0.95rem" }}>{formatCurrency(totalSpent)}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Meta de Economia</span>
              <strong style={{ fontSize: "0.95rem" }}>{formatCurrency(120000)}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Status</span>
              <strong style={{ fontSize: "0.95rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                </svg>
                No Alvo
              </strong>
            </div>
          </div>
        </div>

        {/* Column 2 (Dias Restantes Progress spinner) */}
        <div className="panel-card" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="circular-progress-wrapper">
            <span className="panel-title" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Dias Restantes
            </span>

            <div className="circular-dial-container">
              <svg width="140" height="140" viewBox="0 0 120 120" style={{ position: "absolute", top: 0, left: 0 }}>
                {/* Background circle */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="6" />
                {/* Progress circle representing 21 out of 30 days (70% fill) */}
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="8"
                  strokeDasharray="314.15" 
                  strokeDashoffset="94" 
                  strokeLinecap="round" 
                  transform="rotate(-90 60 60)" 
                />
              </svg>
              <div className="circular-dial-text">
                <span className="circular-dial-number">09</span>
                <span className="circular-dial-month">Out</span>
              </div>
            </div>

            <p className="circular-progress-subtext">
              Você está no dia 21 de 30 do seu ciclo financeiro mensal.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Category Budgets Card */}
      <section className="panel-card">
        <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
          <span className="panel-title">Planejamento por Categoria</span>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontWeight: "600" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)" }} />
              Seguro
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#fbbf24" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fbbf24" }} />
              Atenção
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#ef4444" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444" }} />
              Crítico
            </span>
          </div>
        </div>

        <div className="budget-category-list-container">
          {budgets.map((b) => {
            const percent = getPercentUsed(b.spentAmount, b.targetAmount);
            const alertColor = getAlertColorClass(percent);

            return (
              <div className="budget-category-row" key={b.id}>
                {/* Category Identity */}
                <div className="budget-category-label-group">
                  <div className="budget-category-icon-wrapper">
                    {getCategoryIcon(b.categoryName)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="budget-category-name">{b.categoryName}</span>
                    <span className="budget-category-sub">{getCategorySubtext(b.categoryName)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="budget-category-progress-col">
                  <span className="budget-category-progress-text">Progresso: {percent}%</span>
                  <div className="progress-bar-bg" style={{ height: "6px" }}>
                    <div 
                      className={`progress-bar-fill ${alertColor}`} 
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {/* Spent de Target values */}
                <div className="budget-category-amount-col">
                  <strong>{formatCurrency(b.spentAmount)}</strong> de {formatCurrency(b.targetAmount)}
                </div>

                {/* Editable target budget adjustments */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: "120px" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.25rem", fontWeight: "600" }}>
                    Ajustar Meta
                  </span>
                  <div className="budget-stepper-control" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.6rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "600" }}>R$</span>
                    <input 
                      type="text" 
                      className="budget-stepper-value"
                      style={{ width: "100%", background: "transparent", color: "var(--text-primary)", border: "none", outline: "none", textAlign: "left", fontSize: "0.9rem", fontWeight: "600" }}
                      value={(b.targetAmount / 100).toString()}
                      onChange={(e) => handleTargetChange(b.id, e.target.value)}
                      onBlur={() => handleSaveTarget(b.id, b.targetAmount)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fab-container">
        <Link href="/transacoes/nova" className="fab-btn">
          <svg className="fab-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
        </Link>
      </div>

      {/* Modal for New Budget */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "var(--bg-primary)", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "400px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Novo Planejamento</h2>
            <form onSubmit={handleCreateBudget}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Categoria</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: Saúde, Educação"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none" }}
                  required
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Meta (R$)</label>
                <input 
                  type="number" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Ex: 500"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "600" }}>Cancelar</button>
                <button type="submit" style={{ padding: "0.5rem 1.5rem", border: "none", background: "var(--primary)", color: "white", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
