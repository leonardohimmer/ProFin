"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CardInfo {
  id: string;
  name: string;
  cardNumber: string;
  expirationDate: string;
  holderName: string;
  limit: number;
  currentInvoice: number;
  dueDate: string;
}

interface CardTransaction {
  id: string;
  description: string;
  categoryName: string;
  paymentMethod: string;
  amount: number;
  createdAt: string;
}

interface CardsViewProps {
  cards: CardInfo[];
  transactions: CardTransaction[];
}

export default function CardsView({ cards, transactions }: CardsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const formatCurrencyValue = (cents: number) => {
    const value = cents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const getPercentUsed = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((current / limit) * 100);
  };

  const getAvailable = (limit: number, current: number) => {
    return limit - current;
  };

  // Helper para formatar a data da transação do cartão
  const formatTxDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
  };

  // Calcula total das faturas a pagar
  const totalInvoiceSum = cards.reduce((sum, c) => sum + c.currentInvoice, 0);

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1>Meus Cartões</h1>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Gerencie seus limites, acompanhe faturas e controle seus gastos recorrentes.
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="search-input-wrapper" style={{ margin: 0, marginRight: "1rem" }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Pesquisar faturas ou cartões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <Link href="/transacoes/nova?type=CREDIT" className="btn-header btn-header-income" style={{ padding: "0.6rem 1rem", borderRadius: "10px" }}>
            + Receita
          </Link>
          <Link href="/transacoes/nova?type=DEBIT" className="btn-header btn-header-expense" style={{ padding: "0.6rem 1rem", borderRadius: "10px" }}>
            - Despesa
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
        </div>
      </header>

      {/* Meus Cartões Grid & Button */}
      <section style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button className="btn-purple-glow" style={{ borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem" }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
          Adicionar Novo Cartão
        </button>
      </section>

      <section className="credit-cards-grid">
        {cards.map((c) => {
          const isVisa = c.name.toLowerCase().includes("visa") || c.name.toLowerCase().includes("premium");
          const percentUsed = getPercentUsed(c.currentInvoice, c.limit);
          const available = getAvailable(c.limit, c.currentInvoice);

          return (
            <div className="credit-card-panel" key={c.id}>
              {/* Visual Card Canvas */}
              <div className={`credit-card-canvas ${isVisa ? "purple-card" : "grey-card"}`}>
                <div className="credit-card-chip-container">
                  <div className="premium-card-chip" style={{ position: "relative", top: 0, left: 0 }} />
                  <div className="credit-card-brand-logo">
                    {isVisa ? "VISA" : "MC"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>
                    {c.name}
                  </span>
                  <div className="credit-card-number">{c.cardNumber}</div>
                </div>

                <div className="credit-card-holder-info">
                  <div>
                    <span style={{ display: "block", fontSize: "0.5rem", opacity: 0.6 }}>Validade</span>
                    <strong>{c.expirationDate}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "0.5rem", opacity: 0.6 }}>Portador</span>
                    <strong>{c.holderName}</strong>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="card-billing-details">
                <div className="card-billing-row-top">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="card-billing-label">Fatura Atual</span>
                    <span className={`card-billing-value ${percentUsed > 80 ? "danger-value" : ""}`}>
                      {formatCurrencyValue(c.currentInvoice)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className="card-billing-label">Vence em</span>
                    <span className="card-billing-value">{c.dueDate}</span>
                  </div>
                </div>

                <div className="card-limit-progress-group">
                  <div className="card-limit-progress-text-row">
                    <span>Limite Utilizado</span>
                    <span>{percentUsed}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: "6px" }}>
                    <div 
                      className={`progress-bar-fill ${percentUsed > 80 ? "bar-alert-critical" : "bar-alert-safe"}`} 
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>

                <div className="card-limit-available-row">
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Disponível</span>
                    <span className="card-limit-available-text green">{formatCurrencyValue(available)}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Limite Total</span>
                    <span className="card-limit-available-text" style={{ color: "var(--text-secondary)" }}>{formatCurrencyValue(c.limit)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dashed Virtual Card */}
        <div className="credit-card-panel" style={{ justifyContent: "center" }}>
          <div className="credit-card-canvas dashed-virtual-card" style={{ height: "100%", width: "100%", margin: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: "1px solid var(--border)", alignSelf: "center" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "300" }}>+</span>
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
              Novo Cartão Virtual
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: "200px", lineHeight: "1.5" }}>
              Crie cartões temporários para assinaturas e compras seguras online.
            </span>
          </div>
        </div>
      </section>

      {/* Bottom Layout Activity and Insights */}
      <section className="dashboard-content-layout">
        {/* Left Activity Panel */}
        <div className="dashboard-left-column">
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Atividades Recentes</span>
              <span style={{ fontSize: "0.8rem", color: "var(--primary)", cursor: "pointer" }}>Ver todas</span>
            </div>

            <div className="activity-list">
              {transactions.map((tx) => {
                const isAmazon = tx.description.toLowerCase().includes("amazon");
                const isStarbucks = tx.description.toLowerCase().includes("starbucks");
                
                return (
                  <div className="activity-item" key={tx.id}>
                    <div className="activity-left">
                      <div className="activity-icon">
                        {isAmazon ? (
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        ) : isStarbucks ? (
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                          </svg>
                        )}
                      </div>
                      <div className="activity-name-group">
                        <span className="activity-title">{tx.description}</span>
                        <span className="activity-meta">
                          {tx.paymentMethod} • {formatTxDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="activity-right">
                      <span className="activity-amount">
                        -{formatCurrencyValue(tx.amount)}
                      </span>
                      <span className="activity-category-tag">
                        {tx.categoryName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Insight Card */}
          <div className="panel-card">
            <span className="panel-title" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
              Insight do Mês
            </span>
            <div className="insight-body">
              Seus gastos com <strong>Restaurantes</strong> no cartão Visa subiram 12% em comparação a Agosto.
            </div>
            <div className="insight-status-green">
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
              </svg>
              <span>Meta de lazer ainda no limite</span>
            </div>
          </div>

          {/* Faturas Próximas */}
          <div className="panel-card">
            <span className="panel-title" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
              Faturas Próximas
            </span>

            <div className="faturas-proximas-list">
              {cards.map((c) => (
                <div className="fatura-proxima-row" key={c.id}>
                  <div>
                    <span className={`fatura-proxima-bullet ${c.name.includes("Premium") ? "purple" : "orange"}`} />
                    <span className="fatura-proxima-name">{c.name}</span>
                  </div>
                  <span className="fatura-proxima-value">{formatCurrencyValue(c.currentInvoice)}</span>
                </div>
              ))}
            </div>

            <div className="fatura-total-to-pay">
              <span>Total a pagar</span>
              <span className="fatura-total-value">{formatCurrencyValue(totalInvoiceSum)}</span>
            </div>

            <button className="btn-dark-grey">Gerar Boleto Único</button>
          </div>
        </div>
      </section>
    </>
  );
}
