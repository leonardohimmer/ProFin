"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface GoalsViewProps {
  goals: Goal[];
  accounts: Account[];
}

export default function GoalsView({ goals, accounts }: GoalsViewProps) {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [modalType, setModalType] = useState<"DEPOSIT" | "WITHDRAW" | "CREATE" | null>(null);
  
  // Form fields
  const [amountValue, setAmountValue] = useState("100,00");
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("1.000,00");
  const [newGoalCurrent, setNewGoalCurrent] = useState("0,00");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amountInCents: number) => {
    const value = amountInCents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const handleGoalAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal && modalType !== "CREATE") return;
    setIsLoading(true);

    try {
      if (modalType === "CREATE") {
        const target = parseFloat(newGoalTarget.replace(/\./g, "").replace(",", "."));
        const current = parseFloat(newGoalCurrent.replace(/\./g, "").replace(",", "."));

        if (isNaN(target) || target <= 0) {
          throw new Error("O valor alvo deve ser maior que zero.");
        }

        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newGoalName,
            targetAmount: target * 100,
            currentAmount: (current || 0) * 100,
            deadline: newGoalDeadline || null
          })
        });

        if (!res.ok) throw new Error("Erro ao criar meta");
      } else {
        const amount = parseFloat(amountValue.replace(/\./g, "").replace(",", "."));
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Por favor insira um valor válido maior que zero.");
        }

        const res = await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId: selectedGoal?.id,
            amount: amount * 100,
            type: modalType,
            accountId: selectedAccountId || null
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao processar movimentação");
        }
      }

      // Limpa formulários e fecha modais
      setNewGoalName("");
      setNewGoalTarget("1.000,00");
      setNewGoalCurrent("0,00");
      setNewGoalDeadline("");
      setAmountValue("100,00");
      setModalType(null);
      setSelectedGoal(null);
      
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Estatísticas globais
  const totalSaved = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const overallPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Metas e Objetivos
          </h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Economize e realize seus planos passo a passo
          </span>
        </div>

        <div className="header-right">
          <button 
            onClick={() => setModalType("CREATE")} 
            className="btn-header btn-header-income"
            style={{ borderRadius: "8px" }}
          >
            + Nova Meta
          </button>
        </div>
      </header>

      {/* Consolidation Row */}
      <section className="summary-grid" style={{ marginBottom: "2rem" }}>
        <div className="summary-card">
          <div className="summary-card-title">Total Economizado</div>
          <div className="summary-card-value positive">{formatCurrency(totalSaved)}</div>
          <div className="summary-card-subtext">Reservado das suas contas correntes</div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879a3 3 0 004.243 0L15 13.182a3 3 0 00-4.243 0L9 15.182zm3-9.545l.879-.879a3 3 0 014.243 0L18 7.818a3 3 0 01-4.243 0L12 9.818z"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Progresso Geral</div>
          <div className="summary-card-value purple">{overallPercent.toFixed(1)}%</div>
          <div className="summary-card-subtext">Do alvo total de {formatCurrency(totalTarget)}</div>
          <div className="progress-bar-container" style={{ height: 6, marginTop: "0.5rem", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.05)" }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min(overallPercent, 100)}%`, height: "100%", borderRadius: "3px", backgroundColor: "var(--primary)" }} />
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Metas Ativas</div>
          <div className="summary-card-value" style={{ color: "var(--text-primary)" }}>{goals.length}</div>
          <div className="summary-card-subtext">Planos cadastrados no sistema</div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--text-secondary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a4.89 4.89 0 003.714-4.74V4.5a.75.75 0 00-1.056-.683l-3.114.732a9 9 0 01-6.086-.71l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"></path>
          </svg>
        </div>
      </section>

      {/* Goals Grid */}
      <section className="dashboard-content-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {goals.map((g) => {
          const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const remaining = Math.max(g.targetAmount - g.currentAmount, 0);

          return (
            <div className="panel-card" key={g.id} style={{ display: "flex", flexDirection: "column", height: "auto" }}>
              <div className="panel-header" style={{ marginBottom: "1rem" }}>
                <span className="panel-title" style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{g.name}</span>
                <span className="badge-critical green-switch" style={{ backgroundColor: percent >= 100 ? "rgba(34,197,94,0.1)" : "rgba(192,132,252,0.1)", color: percent >= 100 ? "var(--success)" : "#c084fc", fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "12px", border: "1px solid " + (percent >= 100 ? "rgba(34,197,94,0.2)" : "rgba(192,132,252,0.2)") }}>
                  {percent >= 100 ? "Concluído" : `${percent.toFixed(0)}%`}
                </span>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  <span>Economizado: <strong>{formatCurrency(g.currentAmount)}</strong></span>
                  <span>Alvo: <strong>{formatCurrency(g.targetAmount)}</strong></span>
                </div>
                {/* Progress bar */}
                <div className="progress-bar-container" style={{ height: "8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, height: "100%", borderRadius: "4px", backgroundColor: percent >= 100 ? "var(--success)" : "var(--primary)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
                  <span>Falta: {formatCurrency(remaining)}</span>
                  {g.deadline && (
                    <span>Prazo: {new Date(g.deadline).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <button 
                  onClick={() => {
                    setSelectedGoal(g);
                    setModalType("DEPOSIT");
                  }} 
                  className="btn-filter-toggle"
                  style={{ flex: 1, borderRadius: "6px", backgroundColor: "rgba(34,197,94,0.08)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.15)" }}
                >
                  Depositar
                </button>
                <button 
                  onClick={() => {
                    setSelectedGoal(g);
                    setModalType("WITHDRAW");
                  }} 
                  className="btn-filter-toggle"
                  style={{ flex: 1, borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  Resgatar
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="panel-card" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: "var(--text-tertiary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a4.89 4.89 0 003.714-4.74V4.5a.75.75 0 00-1.056-.683l-3.114.732a9 9 0 01-6.086-.71l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <strong style={{ fontSize: "1.2rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
              Nenhuma meta definida
            </strong>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "300px", lineHeight: "1.5" }}>
              Defina objetivos claros de economia como uma reserva de emergência ou viagem dos sonhos.
            </span>
            <button 
              onClick={() => setModalType("CREATE")}
              className="btn-header btn-header-income" 
              style={{ marginTop: "1.5rem", borderRadius: "20px" }}
            >
              Criar minha primeira meta
            </button>
          </div>
        )}
      </section>

      {/* Movement Modal (Deposit / Withdraw) */}
      {(modalType === "DEPOSIT" || modalType === "WITHDRAW") && selectedGoal && (
        <div className="modal-overlay" onClick={() => { setModalType(null); setSelectedGoal(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">
                {modalType === "DEPOSIT" ? `Depositar em: ${selectedGoal.name}` : `Resgatar de: ${selectedGoal.name}`}
              </span>
              <button className="modal-close-btn" onClick={() => { setModalType(null); setSelectedGoal(null); }}>&times;</button>
            </div>

            <form onSubmit={handleGoalAction}>
              <div style={{ padding: "1.5rem" }}>
                {/* Valor */}
                <div className="form-row" style={{ flexDirection: "column", alignItems: "stretch", borderBottom: "none", padding: "0 0 1rem 0" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "600" }}>VALOR (R$)</label>
                  <input 
                    type="text" 
                    className="value-display-input"
                    style={{ fontSize: "2rem", width: "100%", borderBottom: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-primary)", padding: "0.25rem 0", fontWeight: "700" }}
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                  />
                </div>

                {/* Conta de Origem/Destino */}
                <div className="form-row" style={{ flexDirection: "column", alignItems: "stretch", borderBottom: "none", padding: "0" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "600" }}>
                    {modalType === "DEPOSIT" ? "DEBITAR DA CONTA" : "CREDITAR NA CONTA"}
                  </label>
                  <select 
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", outline: "none" }}
                  >
                    <option value="">(Não registrar movimentação em conta)</option>
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
                  onClick={() => { setModalType(null); setSelectedGoal(null); }}
                  className="btn-filter-toggle"
                  style={{ borderRadius: "6px" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-header"
                  style={{ borderRadius: "6px", backgroundColor: modalType === "DEPOSIT" ? "var(--success)" : "var(--danger)", color: "#fff" }}
                >
                  {isLoading ? "Processando..." : modalType === "DEPOSIT" ? "Confirmar Depósito" : "Confirmar Resgate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {modalType === "CREATE" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Nova Meta Financeira</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>&times;</button>
            </div>

            <form onSubmit={handleGoalAction}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Nome */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>NOME DO OBJETIVO</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Reserva de Emergência, Carro Novo"
                    required
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                  />
                </div>

                {/* Valor Alvo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>VALOR ALVO (R$)</label>
                  <input 
                    type="text" 
                    required
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                  />
                </div>

                {/* Valor Inicial */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>SALDO INICIAL JÁ ECONOMIZADO (R$)</label>
                  <input 
                    type="text" 
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(e.target.value)}
                  />
                </div>

                {/* Prazo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>PRAZO LIMITE (OPCIONAL)</label>
                  <input 
                    type="date" 
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                  />
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
                  {isLoading ? "Criando..." : "Criar Meta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
