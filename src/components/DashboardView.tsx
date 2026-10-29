"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QuickAddMenu from "./QuickAddMenu";

interface AccountInfo {
  id: string;
  name: string;
  balance: number;
}

interface BudgetInfo {
  id: string;
  categoryName: string;
  targetAmount: number;
  spentAmount: number;
}

interface CardInfo {
  id: string;
  name: string;
  cardNumber: string;
  limit: number;
  currentInvoice: number;
  dueDate: string;
}

interface GoalInfo {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface InvestmentInfo {
  id: string;
  name: string;
  currentValue: number;
}

interface DashboardViewProps {
  userName: string;
  accounts: AccountInfo[];
  monthlyIncome: number;
  monthlyExpenses: number;
  expensesByCategory: { name: string; amount: number }[];
  budgets: BudgetInfo[];
  cards: CardInfo[];
  goals: GoalInfo[];
  investments: InvestmentInfo[];
  selectedMonth?: number;
  selectedYear?: number;
}

export default function DashboardView({
  userName,
  accounts,
  monthlyIncome,
  monthlyExpenses,
  expensesByCategory,
  budgets,
  cards,
  goals,
  investments,
  selectedMonth,
  selectedYear
}: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showValues, setShowValues] = useState(true);
  const [activeCardTab, setActiveCardTab] = useState<"abertas" | "fechadas">("abertas");

  const currentMonth = selectedMonth !== undefined ? selectedMonth : new Date().getMonth();
  const currentYear = selectedYear !== undefined ? selectedYear : new Date().getFullYear();

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const YEARS = Array.from({ length: 7 }, (_, i) => 2023 + i);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    params.set("year", currentYear.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", currentMonth.toString());
    params.set("year", newYear);
    router.push(`/?${params.toString()}`);
  };

  // Filtra as contas normais (Removemos a lógica manual do cartão SX já que agora usamos o modelo de Cartão)
  const bankAccounts = accounts.filter(acc => !acc.name.includes("Cartão"));

  // Calcula totais
  const totalBankBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalCreditCardBalance = (cards || []).reduce((acc, curr) => acc + curr.currentInvoice, 0);

  const formatValue = (valueInCents: number) => {
    if (!showValues) return "R$ ••••";
    const value = valueInCents / 100;
    const formatted = Math.abs(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${value < 0 ? "R$ -" : "R$ "}${formatted}`;
  };

  const getAccountType = (name: string) => {
    switch (name) {
      case "Caixa": return "Conta Corrente";
      case "PicPay": return "Carteira Digital";
      case "Santander": return "Conta Salário";
      case "Sodexo": return "Vale Alimentação";
      default: return "Conta Corrente";
    }
  };

  const getAccountColorClass = (name: string) => {
    switch (name) {
      case "Caixa": return "blue";
      case "PicPay": return "teal";
      case "Santander": return "red";
      case "Sodexo": return "orange";
      default: return "purple";
    }
  };

  const getAccountIconLetter = (name: string) => {
    if (name === "Caixa") return "X";
    if (name === "PicPay") return "P";
    if (name === "Santander") return "S";
    if (name === "Sodexo") return "S";
    return name[0] || "C";
  };

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Dashboard
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem" }}>
              <div className="select-wrapper">
                <select 
                  className="select-dropdown"
                  value={currentMonth}
                  onChange={handleMonthChange}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="select-wrapper">
                <select 
                  className="select-dropdown"
                  value={currentYear}
                  onChange={handleYearChange}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <QuickAddMenu />

          <button className="header-icon-btn">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"></path>
            </svg>
          </button>

          <div className="profile-container">
            <div className="profile-info">
              <span className="profile-name">{userName}</span>
              <span className="profile-role">Premium User</span>
            </div>
            <div className="profile-avatar">
              <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: 24, height: 24, color: "var(--text-secondary)" }}>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="summary-grid">
        {/* Card Saldo */}
        <div className="summary-card">
          <div className="summary-card-title">Saldo em contas</div>
          <div className={`summary-card-value ${totalBankBalance < 0 ? "negative" : "positive"}`}>
            <span>{formatValue(totalBankBalance)}</span>
            <button 
              onClick={() => setShowValues(!showValues)} 
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {showValues ? (
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z"></path>
          </svg>
        </div>

        {/* Card Receitas */}
        <div className="summary-card">
          <div className="summary-card-title">Receitas</div>
          <div className="summary-card-value positive">
            {formatValue(monthlyIncome)}
          </div>
          <div className="summary-card-subtext">
            <span className="up">+12%</span> vs last month
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
          </svg>
        </div>

        {/* Card Despesas */}
        <div className="summary-card">
          <div className="summary-card-title">Despesas</div>
          <div className="summary-card-value negative">
            {formatValue(monthlyExpenses)}
          </div>
          <div className="summary-card-subtext">
            <span className="down">-5%</span> vs last month
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--danger)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94 2.28l-2.28 5.941"></path>
          </svg>
        </div>
      </section>

      {/* Main Dashboard 3-Column Layout */}
      <section className="dashboard-main-grid">
        {/* Column 1: Contas & Cartões de Crédito */}
        <div className="dashboard-column">
          {/* Card Contas */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Contas</span>
              <div className="panel-actions">
                <button className="panel-action-btn" style={{ marginRight: "0.5rem" }} title="Filtrar">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"></path>
                  </svg>
                </button>
                <Link href="/contas" className="panel-action-btn" title="Gerenciar contas">
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="account-list">
              {bankAccounts.map((acc) => (
                <div className="account-row" key={acc.id}>
                  <div className="account-info-group">
                    <div className={`account-icon-wrapper ${getAccountColorClass(acc.name)}`}>
                      {getAccountIconLetter(acc.name)}
                    </div>
                    <div className="account-name-group">
                      <span className="account-name">{acc.name}</span>
                      <span className="account-type">{getAccountType(acc.name)}</span>
                    </div>
                  </div>
                  <div className="account-value-group">
                    <span className={`account-value ${acc.balance < 0 ? "negative" : "positive"}`}>
                      {formatValue(acc.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-total-row">
              <span>Total</span>
              <span className={`panel-total-value ${totalBankBalance < 0 ? "negative" : "positive"}`}>
                {formatValue(totalBankBalance)}
              </span>
            </div>
          </div>

          {/* Card Cartões de crédito */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Cartões de crédito</span>
              <div className="tabs-container">
                <button 
                  onClick={() => setActiveCardTab("abertas")}
                  className={`tab-btn ${activeCardTab === "abertas" ? "active" : ""}`}
                >
                  Abertas
                </button>
                <button 
                  onClick={() => setActiveCardTab("fechadas")}
                  className={`tab-btn ${activeCardTab === "fechadas" ? "active" : ""}`}
                >
                  Fechadas
                </button>
              </div>
            </div>

            <div className="account-list">
              {cards && cards.length > 0 ? cards.map((card) => (
                <div className="account-row" key={card.id}>
                  <div className="account-info-group">
                    <div className="card-logo" style={{ fontSize: "0.65rem", padding: "2px 5px" }}>VISA</div>
                    <div className="account-name-group">
                      <span className="account-name">{card.name}</span>
                      <span className="account-type">fecha {card.dueDate} • **{card.cardNumber.slice(-4)}</span>
                    </div>
                  </div>
                  <div className="account-value-group">
                    <span className="account-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                      {formatValue(card.currentInvoice)}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        limite: {formatValue(card.limit)}
                      </span>
                    </span>
                  </div>
                </div>
              )) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", display: "block", padding: "0.5rem 0" }}>Nenhum cartão cadastrado.</span>
              )}
            </div>

            <div className="panel-total-row">
              <span>Total faturas</span>
              <span>{formatValue(totalCreditCardBalance)}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Despesas por Categoria & Investimentos */}
        <div className="dashboard-column">
          {/* Card Despesas por categoria */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Despesas por categoria</span>
            </div>

            {expensesByCategory && expensesByCategory.length > 0 ? (
              <div style={{ marginTop: "0.5rem" }}>
                {expensesByCategory.slice(0, 5).map((cat) => {
                  const maxExpense = Math.max(...expensesByCategory.map(e => e.amount), 1);
                  return (
                    <div key={cat.name} style={{ marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{cat.name}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{formatValue(cat.amount)}</span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: "5px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                        <div className="progress-bar-fill" style={{ width: `${(cat.amount / maxExpense) * 100}%`, backgroundColor: "var(--primary)", height: "100%", borderRadius: "4px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-categories" style={{ padding: "1rem 0.5rem" }}>
                <div className="empty-state-title" style={{ fontSize: "0.85rem" }}>
                  Sem despesas neste mês.
                </div>
              </div>
            )}
          </div>

          {/* Card Investimentos */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Investimentos</span>
              <Link href="/investimentos" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Ver tudo</Link>
            </div>
            
            <div className="account-list" style={{ marginTop: "0.25rem" }}>
              {investments && investments.length > 0 ? investments.slice(0, 4).map((inv) => (
                <div className="account-row" key={inv.id}>
                  <div className="account-info-group">
                    <div className="account-icon-wrapper teal" style={{ width: 26, height: 26 }}>
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
                      </svg>
                    </div>
                    <div className="account-name-group">
                      <span className="account-name" style={{ fontSize: "0.82rem" }}>{inv.name}</span>
                    </div>
                  </div>
                  <div className="account-value-group">
                    <span className="account-value positive" style={{ fontSize: "0.82rem" }}>
                      {formatValue(inv.currentValue)}
                    </span>
                  </div>
                </div>
              )) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", display: "block", padding: "0.5rem 0" }}>Nenhum investimento cadastrado.</span>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Planejamento & Metas */}
        <div className="dashboard-column">
          {/* Card Planejamento */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Planejamento</span>
              <Link href="/planejamento" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Ver tudo</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
              {budgets && budgets.length > 0 ? [...budgets].sort((a, b) => {
                const percentA = a.targetAmount > 0 ? (a.spentAmount / a.targetAmount) : 0;
                const percentB = b.targetAmount > 0 ? (b.spentAmount / b.targetAmount) : 0;
                return percentB - percentA;
              }).slice(0, 4).map(b => {
                const rawPercent = b.targetAmount > 0 ? Math.round((b.spentAmount / b.targetAmount) * 100) : 0;
                const percent = Math.min(100, rawPercent);
                
                let colorClass = "progress-bar-safe";
                if (rawPercent >= 100) {
                  colorClass = "progress-bar-critical-blink";
                } else if (rawPercent >= 85) {
                  colorClass = "progress-bar-warning";
                } else if (rawPercent >= 60) {
                  colorClass = "progress-bar-attention";
                }

                return (
                  <div key={b.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>{b.categoryName}</span>
                      <span style={{ fontSize: "0.78rem" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{formatValue(b.spentAmount)}</strong> / {formatValue(b.targetAmount)}
                      </span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: "5px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                      <div className={`progress-bar-fill ${colorClass}`} style={{ width: `${percent}%`, height: "100%", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              }) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", display: "block", padding: "0.5rem 0" }}>Nenhum planejamento cadastrado.</span>
              )}
            </div>
          </div>

          {/* Card Metas */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Metas</span>
              <Link href="/metas" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Ver tudo</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
              {goals && goals.length > 0 ? goals.slice(0, 3).map(g => {
                const percent = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                return (
                  <div key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>{g.name}</span>
                      <span style={{ fontSize: "0.78rem" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{formatValue(g.currentAmount)}</strong> / {formatValue(g.targetAmount)}
                      </span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: "5px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                      <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: "var(--success)", height: "100%", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              }) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", display: "block", padding: "0.5rem 0" }}>Nenhuma meta cadastrada.</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
