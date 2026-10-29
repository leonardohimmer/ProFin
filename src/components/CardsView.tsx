"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuickAddMenu from "./QuickAddMenu";

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

export default function CardsView({ cards: initialCards, transactions }: CardsViewProps) {
  const router = useRouter();
  const [cards, setCards] = useState<CardInfo[]>(initialCards);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal controls: "CREATE" | "EDIT" | "DELETE" | null
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "DELETE" | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumberDigits, setCardNumberDigits] = useState("");
  const [holderName, setHolderName] = useState("ALEX SILVA");
  const [expirationDate, setExpirationDate] = useState("12/28");
  const [dueDate, setDueDate] = useState("10 Out");
  const [limitStr, setLimitStr] = useState("5.000,00");
  const [invoiceStr, setInvoiceStr] = useState("0,00");

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatCurrencyValue = (cents: number) => {
    const value = cents / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const parseCurrencyInput = (valStr: string): number => {
    const cleaned = valStr.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  };

  const getPercentUsed = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getAvailable = (limit: number, current: number) => {
    return Math.max(0, limit - current);
  };

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

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCardName("");
    setCardNumberDigits("4829");
    setHolderName("ALEX SILVA");
    setExpirationDate("12/28");
    setDueDate("10 Out");
    setLimitStr("5.000,00");
    setInvoiceStr("0,00");
    setModalType("CREATE");
  };

  // Open Edit Modal
  const handleOpenEditModal = (card: CardInfo) => {
    setSelectedCard(card);
    setCardName(card.name);
    setCardNumberDigits(card.cardNumber.replace(/\D/g, "").slice(-4));
    setHolderName(card.holderName);
    setExpirationDate(card.expirationDate);
    setDueDate(card.dueDate);
    setLimitStr((card.limit / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setInvoiceStr((card.currentInvoice / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setModalType("EDIT");
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (card: CardInfo) => {
    setSelectedCard(card);
    setModalType("DELETE");
  };

  // Create Card Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      showToast("Nome do cartão é obrigatório.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const limitCents = parseCurrencyInput(limitStr);
      const invoiceCents = parseCurrencyInput(invoiceStr);

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cardName.trim(),
          cardNumber: cardNumberDigits,
          holderName: holderName.trim(),
          expirationDate,
          dueDate,
          limit: limitCents,
          currentInvoice: invoiceCents
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao cadastrar cartão");
      }

      setCards(prev => [...prev, data.card]);
      showToast(`Cartão "${data.card.name}" adicionado com sucesso!`);
      setModalType(null);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Erro ao cadastrar cartão.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Card Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !cardName.trim()) return;

    setIsLoading(true);
    try {
      const limitCents = parseCurrencyInput(limitStr);
      const invoiceCents = parseCurrencyInput(invoiceStr);

      const res = await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCard.id,
          name: cardName.trim(),
          cardNumber: cardNumberDigits,
          holderName: holderName.trim(),
          expirationDate,
          dueDate,
          limit: limitCents,
          currentInvoice: invoiceCents
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao atualizar cartão");
      }

      setCards(prev => prev.map(c => c.id === selectedCard.id ? data.card : c));
      showToast(`Cartão "${cardName.trim()}" atualizado com sucesso!`);
      setModalType(null);
      setSelectedCard(null);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar cartão.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Card Submit
  const handleDeleteSubmit = async () => {
    if (!selectedCard) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/cards?id=${selectedCard.id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir cartão");
      }

      setCards(prev => prev.filter(c => c.id !== selectedCard.id));
      showToast(`Cartão "${selectedCard.name}" excluído com sucesso!`);
      setModalType(null);
      setSelectedCard(null);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir cartão.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cards by search query
  const filteredCards = cards.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cardNumber.includes(searchQuery)
  );

  const totalInvoiceSum = cards.reduce((sum, c) => sum + c.currentInvoice, 0);

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          padding: "0.85rem 1.25rem",
          borderRadius: "12px",
          backgroundColor: toast.type === "success" ? "#065f46" : "#991b1b",
          color: "#ffffff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontWeight: "600",
          fontSize: "0.9rem",
          border: `1px solid ${toast.type === "success" ? "#10b981" : "#ef4444"}`
        }}>
          {toast.type === "success" ? "✓ " : "⚠️ "} {toast.message}
        </div>
      )}

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

          <QuickAddMenu />

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
        <button 
          onClick={handleOpenCreateModal}
          className="btn-purple-glow" 
          style={{ borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", cursor: "pointer" }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
          Adicionar Novo Cartão
        </button>
      </section>

      <section className="credit-cards-grid">
        {filteredCards.map((c) => {
          const isVisa = c.name.toLowerCase().includes("visa") || c.name.toLowerCase().includes("premium");
          const percentUsed = getPercentUsed(c.currentInvoice, c.limit);
          const available = getAvailable(c.limit, c.currentInvoice);

          return (
            <div className="credit-card-panel" key={c.id}>
              {/* Visual Card Canvas */}
              <div className={`credit-card-canvas ${isVisa ? "purple-card" : "grey-card"}`}>
                {/* Actions Overlay */}
                <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "0.4rem", zIndex: 10 }}>
                  <button 
                    onClick={() => handleOpenEditModal(c)}
                    title="Configurar Cartão"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: "6px",
                      padding: "0.3rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => handleOpenDeleteModal(c)}
                    title="Excluir Cartão"
                    style={{
                      background: "rgba(225,29,72,0.4)",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: "6px",
                      padding: "0.3rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>

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

        {/* Dashed Virtual Card Trigger */}
        <div className="credit-card-panel" style={{ justifyContent: "center", cursor: "pointer" }} onClick={handleOpenCreateModal}>
          <div className="credit-card-canvas dashed-virtual-card" style={{ height: "100%", width: "100%", margin: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: "1px solid var(--border)", alignSelf: "center" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "300" }}>+</span>
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
              Novo Cartão Virtual / Crédito
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: "200px", lineHeight: "1.5" }}>
              Clique aqui para cadastrar novos cartões e personalizar limites e vencimentos.
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
                return (
                  <div className="activity-item" key={tx.id}>
                    <div className="activity-left">
                      <div className="activity-icon">
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                      </div>
                      <div className="activity-name-group">
                        <span className="activity-title">{tx.description}</span>
                        <span className="activity-meta">
                          {tx.paymentMethod} • {formatTxDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="activity-right">
                      <span className="activity-amount" style={{ color: "#ef4444" }}>
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
              Acompanhe seus limites de crédito para manter seu controle financeiro em dia.
            </div>
            <div className="insight-status-green">
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
              </svg>
              <span>Faturas e limites dentro do planejado</span>
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
          </div>
        </div>
      </section>

      {/* CREATE & EDIT CARD MODAL */}
      {(modalType === "CREATE" || modalType === "EDIT") && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <span className="modal-title">
                {modalType === "CREATE" ? "Adicionar Novo Cartão" : `Configurar ${selectedCard?.name}`}
              </span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>&times;</button>
            </div>

            <form onSubmit={modalType === "CREATE" ? handleCreateSubmit : handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                  Nome do Cartão
                </label>
                <input 
                  type="text"
                  className="search-input"
                  style={{ width: "100%", borderRadius: "8px" }}
                  placeholder="Ex: Nubank Roxinho, Premium Visa"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Últimos 4 Dígitos
                  </label>
                  <input 
                    type="text"
                    maxLength={4}
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="4829"
                    value={cardNumberDigits}
                    onChange={(e) => setCardNumberDigits(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Validade (MM/AA)
                  </label>
                  <input 
                    type="text"
                    maxLength={5}
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="08/28"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Portador do Cartão
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="ALEX SILVA"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Vencimento / Fechamento
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="Ex: 10 Out ou Dia 15"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Limite Total (R$)
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="5.000,00"
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: "600" }}>
                    Fatura Atual (R$)
                  </label>
                  <input 
                    type="text"
                    className="search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                    placeholder="0,00"
                    value={invoiceStr}
                    onChange={(e) => setInvoiceStr(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setModalType(null)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem"
                  }}
                >
                  Cancelar
                </button>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-purple-glow"
                  style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", fontSize: "0.85rem" }}
                >
                  {isLoading ? "Salvando..." : modalType === "CREATE" ? "Cadastrar Cartão" : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modalType === "DELETE" && selectedCard && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "#ef4444" }}>Excluir Cartão</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>&times;</button>
            </div>

            <div style={{ marginTop: "1rem", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Tem certeza que deseja excluir o cartão <strong>"{selectedCard.name}"</strong>? Esta ação não pode ser desfeita.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                type="button" 
                onClick={() => setModalType(null)}
                style={{
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem"
                }}
              >
                Cancelar
              </button>

              <button 
                type="button"
                disabled={isLoading}
                onClick={handleDeleteSubmit}
                style={{
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)"
                }}
              >
                {isLoading ? "Excluindo..." : "Excluir Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
