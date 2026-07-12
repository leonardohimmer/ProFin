"use client";

import React, { useState } from "react";
import Link from "next/link";

interface TransactionEntry {
  id: string;
  createdAt: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  transaction: {
    id: string;
    description: string;
    contact: string | null;
    categoryName: string;
    paymentType: string;
    paymentMethod: string;
    isPaid: boolean;
  };
}

interface TransactionsViewProps {
  entries: TransactionEntry[];
  totalBankBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export default function TransactionsView({
  entries,
  totalBankBalance,
  monthlyIncome,
  monthlyExpenses
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  // Filtra as transações excluindo os ajustes de saldo
  const userTransactions = entries.filter(e => {
    return !e.transaction.description.includes("Ajuste");
  });

  // Aplica busca e filtros locais
  const filteredTransactions = userTransactions.filter(e => {
    const matchesSearch = e.transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.transaction.contact && e.transaction.contact.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          e.transaction.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "ALL" ? true : e.type === filterType;

    return matchesSearch && matchesType;
  });

  const formatValue = (valueInCents: number) => {
    const value = valueInCents / 100;
    const formatted = Math.abs(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${value < 0 ? "R$ -" : "R$ "}${formatted}`;
  };

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1>Transações</h1>
            <div className="header-left-subtabs">
              <Link href="/transacoes" className="subtab-link active">Visão Geral</Link>
              <Link href="/relatorios" className="subtab-link">Relatórios</Link>
            </div>
          </div>
        </div>

        <div className="header-right">
          <Link href="/transacoes/nova?type=CREDIT" className="btn-header btn-header-income">
            + Adicionar Receita
          </Link>
          <Link href="/transacoes/nova?type=DEBIT" className="btn-header btn-header-expense">
            - Adicionar Despesa
          </Link>

          <button className="header-icon-btn">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"></path>
            </svg>
          </button>

          <button className="header-icon-btn">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
          </button>

          <div className="profile-container" style={{ borderLeft: "none" }}>
            <div className="profile-avatar">
              <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: 24, height: 24, color: "var(--text-secondary)" }}>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header controls */}
      <section className="controls-row">
        <div className="date-navigator">
          <button className="nav-arrow">&lt;</button>
          <span className="nav-date-text">Junho</span>
          <button className="nav-arrow">&gt;</button>
        </div>

        <div className="search-input-wrapper">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar transação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            className="btn-filter-toggle"
            onClick={() => setFilterType(filterType === "ALL" ? "CREDIT" : filterType === "CREDIT" ? "DEBIT" : "ALL")}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"></path>
            </svg>
            <span>Filtros</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics Cards */}
      <section className="summary-grid" style={{ marginBottom: "2.5rem" }}>
        <div className="summary-card">
          <div className="summary-card-title" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>Saldo Atual</div>
          <div className={`summary-card-value ${totalBankBalance < 0 ? "negative" : "positive"}`}>
            {formatValue(totalBankBalance)}
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>Receitas</div>
          <div className="summary-card-value positive">
            {formatValue(monthlyIncome)}
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>Balanço Mensal</div>
          <div className="summary-card-value">
            {formatValue(monthlyIncome - monthlyExpenses)}
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"></path>
          </svg>
        </div>
      </section>

      {/* Main Body */}
      {filteredTransactions.length === 0 ? (
        <div className="empty-state-transactions-container">
          <svg className="binoculars-illustration" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="30" width="120" height="180" rx="16" stroke="var(--border)" strokeWidth="3" fill="#16161a" />
            <rect x="110" y="35" width="20" height="6" rx="3" fill="var(--border)" />
            <rect x="75" y="150" width="16" height="40" rx="2" fill="var(--text-tertiary)" opacity="0.3" />
            <rect x="97" y="120" width="16" height="70" rx="2" fill="var(--primary)" opacity="0.4" />
            <rect x="119" y="90" width="16" height="100" rx="2" fill="var(--primary)" />
            <rect x="141" y="70" width="16" height="120" rx="2" fill="var(--success)" />
            <path d="M141 50 L160 30 L160 50 M160 30 L100 110" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="120" cy="110" r="10" fill="var(--text-secondary)" />
            <path d="M110 135 C110 125 130 125 130 135 L127 150 L113 150 Z" fill="var(--text-secondary)" />
            <path d="M115 115 H125 M113 113 L111 117 M127 113 L129 117" stroke="var(--text-primary)" strokeWidth="2" />
          </svg>

          <div className="empty-transactions-text">
            Ops! Você não possui transações registradas.
          </div>
          <div className="empty-transactions-subtext">
            Para começar a organizar suas finanças e ver seus relatórios, crie um novo item clicando no botão (+) ou adicione manualmente.
          </div>

          <Link href="/transacoes/nova" className="btn-purple-glow">
            Começar agora
          </Link>
        </div>
      ) : (
        <div className="panel-card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Data</th>
                <th>Descrição</th>
                <th>Recebido de / Pago a</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Pago?</th>
                <th style={{ width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={{ fontWeight: "600" }}>{entry.transaction.description}</td>
                  <td>{entry.transaction.contact || "-"}</td>
                  <td>
                    <span style={{ padding: "0.25rem 0.65rem", backgroundColor: "var(--primary-light)", color: "#c084fc", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                      {entry.transaction.categoryName}
                    </span>
                  </td>
                  <td style={{ fontWeight: "700", color: entry.type === "CREDIT" ? "var(--success)" : "var(--text-primary)" }}>
                    {entry.type === "CREDIT" ? "+" : "-"} {formatValue(entry.amount)}
                  </td>
                  <td>{entry.transaction.paymentType}</td>
                  <td>
                    <label className="switch-control">
                      <input type="checkbox" checked={entry.transaction.isPaid} readOnly />
                      <span className="switch-slider green-switch"></span>
                    </label>
                  </td>
                  <td>
                    <button className="category-action-icon">•••</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fab-container">
        <Link href="/transacoes/nova" className="fab-btn">
          <svg className="fab-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
        </Link>
      </div>
    </>
  );
}
