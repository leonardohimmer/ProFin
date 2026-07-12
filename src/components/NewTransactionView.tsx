"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface SelectionItem {
  id: string;
  name: string;
}

interface NewTransactionViewProps {
  categories: SelectionItem[];
  accounts: SelectionItem[];
  defaultType: "CREDIT" | "DEBIT";
}

export default function NewTransactionView({
  categories,
  accounts,
  defaultType
}: NewTransactionViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Define o tipo inicial com base no query param (?type=CREDIT ou DEBIT)
  const queryType = searchParams.get("type") as "CREDIT" | "DEBIT" | "TRANSFER" | null;
  const [type, setType] = useState<"CREDIT" | "DEBIT" | "TRANSFER">(queryType || defaultType);

  const defaultDestAccount = accounts.find(a => a.name !== "Caixa" && a.name !== "SX") || accounts[1] || null;
  const [selectedDestinationAccount, setSelectedDestinationAccount] = useState<SelectionItem | null>(defaultDestAccount);
  const [showDestAccountModal, setShowDestAccountModal] = useState(false);

  const [amount, setAmount] = useState("10,00");
  const [isPaid, setIsPaid] = useState(true);
  const [dateOption, setDateOption] = useState<"HOJE" | "ONTEM" | "OUTROS">("HOJE");
  const [description, setDescription] = useState("");
  
  // Tenta selecionar "Carro" como padrão, se existir, senão a primeira
  const defaultCategory = categories.find(c => c.name === "Carro") || categories[0] || null;
  const [selectedCategory, setSelectedCategory] = useState<SelectionItem | null>(defaultCategory);
  
  // Tenta selecionar "Caixa" como padrão, se existir, senão a primeira
  const defaultAccount = accounts.find(a => a.name === "Caixa") || accounts[0] || null;
  const [selectedAccount, setSelectedAccount] = useState<SelectionItem | null>(defaultAccount);

  const [observation, setObservation] = useState("");

  // Opções avançadas
  const [isInstallment, setIsInstallment] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [ignoreExpense, setIgnoreExpense] = useState(false);

  // Modais de Seleção
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      // Converte o valor "10,00" para float
      const parsedAmount = parseFloat(amount.replace(",", "."));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Por favor, digite um valor válido maior que zero.");
      }

      if (!selectedAccount) {
        throw new Error("Por favor, selecione uma conta.");
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || (type === "DEBIT" ? "Despesa" : type === "CREDIT" ? "Receita" : "Transferência"),
          amount: parsedAmount,
          type: type,
          accountId: selectedAccount.id,
          destinationAccountId: type === "TRANSFER" ? selectedDestinationAccount?.id : null,
          categoryId: type === "TRANSFER" ? null : (selectedCategory?.id || null),
          category: type === "TRANSFER" ? "Transferência" : (selectedCategory?.name || "OUTROS"),
          paymentType: isInstallment ? "PARCELADO" : "A VISTA",
          paymentMethod: type === "TRANSFER" ? "TRANSFERENCIA" : (type === "DEBIT" ? "BOLETO" : "PIX"),
          isPaid: type === "TRANSFER" ? true : isPaid
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar transação");
      }

      router.push(type === "DEBIT" ? "/" : "/transacoes");
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Top Header Row */}
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => router.back()} className="btn-back">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
            </svg>
          </button>
          <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
            <button 
              type="button"
              onClick={() => setType("DEBIT")} 
              style={{
                background: type === "DEBIT" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                color: type === "DEBIT" ? "var(--danger)" : "var(--text-secondary)",
                border: "1px solid " + (type === "DEBIT" ? "var(--danger)" : "var(--border)"),
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8rem"
              }}
            >
              Despesa
            </button>
            <button 
              type="button"
              onClick={() => setType("CREDIT")} 
              style={{
                background: type === "CREDIT" ? "rgba(34, 197, 94, 0.15)" : "transparent",
                color: type === "CREDIT" ? "var(--success)" : "var(--text-secondary)",
                border: "1px solid " + (type === "CREDIT" ? "var(--success)" : "var(--border)"),
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8rem"
              }}
            >
              Receita
            </button>
            <button 
              type="button"
              onClick={() => setType("TRANSFER")} 
              style={{
                background: type === "TRANSFER" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: type === "TRANSFER" ? "#60a5fa" : "var(--text-secondary)",
                border: "1px solid " + (type === "TRANSFER" ? "#60a5fa" : "var(--border)"),
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8rem"
              }}
            >
              Transferência
            </button>
          </div>
        </div>

        <div className="header-right">
          <Link href="/transacoes" className="subtab-link active">Visão Geral</Link>
          <Link href="/relatorios" className="subtab-link">Relatórios</Link>

          <button className="header-icon-btn" style={{ marginLeft: "1rem" }}>
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

      {/* Value Input Section */}
      <section className="value-display-section">
        <span className="value-display-label">
          {type === "DEBIT" ? "VALOR DA DESPESA" : type === "CREDIT" ? "VALOR DA RECEITA" : "VALOR DA TRANSFERÊNCIA"}
        </span>
        <div className="value-display-amount-row">
          <span className="value-display-currency">R$</span>
          <input 
            type="text" 
            className="value-display-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <select className="value-display-currency-select">
          <option value="BRL">BRL v</option>
          <option value="USD">USD v</option>
        </select>
      </section>

      {/* Two Columns Layout */}
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <section className="form-columns-layout">
          {/* Left Column */}
          <div>
            <div className="form-main-card">
              {/* Pago Switch */}
              <div className="form-row">
                <div className="form-row-left">
                  <svg className="form-row-icon" style={{ color: "var(--success)" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="form-row-label-group">
                    <span className="form-row-label">Pago</span>
                    <span className="form-row-sublabel">Marcar se esta conta já foi liquidada</span>
                  </div>
                </div>
                <label className="switch-control">
                  <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                  <span className="switch-slider green-switch"></span>
                </label>
              </div>

              {/* Data da despesa */}
              <div className="form-row">
                <div className="form-row-left">
                  <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"></path>
                  </svg>
                  <span className="form-row-label">Data da despesa</span>
                </div>
                <div className="date-pills-container">
                  <button 
                    type="button" 
                    onClick={() => setDateOption("HOJE")} 
                    className={`date-pill ${dateOption === "HOJE" ? "active" : ""}`}
                  >
                    Hoje
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setDateOption("ONTEM")} 
                    className={`date-pill ${dateOption === "ONTEM" ? "active" : ""}`}
                  >
                    Ontem
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setDateOption("OUTROS")} 
                    className={`date-pill ${dateOption === "OUTROS" ? "active" : ""}`}
                  >
                    Outros...
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="form-row">
                <div className="form-row-left">
                  <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"></path>
                  </svg>
                  <input 
                    type="text" 
                    className="form-inline-input" 
                    style={{ textAlign: "left" }} 
                    placeholder="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <button type="button" className="header-icon-btn" style={{ padding: "0.2rem" }}>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: "var(--text-secondary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                  </svg>
                </button>
              </div>

              {/* Categoria Selection */}
              {type !== "TRANSFER" && (
                <div className="form-row">
                  <div className="form-row-left">
                    <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.182 0l4.318-4.318a2.25 2.25 0 000-3.182L11.16 3.659A2.25 2.25 0 009.568 3z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"></path>
                    </svg>
                    <span className="form-row-label">Categoria</span>
                  </div>
                  <div 
                    className="selection-card-trigger"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    <div className="selection-card-icon-bg" style={{ backgroundColor: "#581c87" }}>
                      {selectedCategory?.name[0] || "C"}
                    </div>
                    <span className="selection-card-text">{selectedCategory?.name || "Selecionar Categoria"}</span>
                    <span className="selection-card-arrow">&gt;</span>
                  </div>
                </div>
              )}

              {/* Conta Selection */}
              <div className="form-row">
                <div className="form-row-left">
                  <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3h18V6z"></path>
                  </svg>
                  <span className="form-row-label">{type === "TRANSFER" ? "Conta de Origem" : "Conta / Carteira"}</span>
                </div>
                <div 
                  className="selection-card-trigger"
                  onClick={() => setShowAccountModal(true)}
                >
                  <div className="selection-card-icon-bg" style={{ backgroundColor: "#14532d" }}>
                    {selectedAccount?.name[0] || "C"}
                  </div>
                  <span className="selection-card-text">{selectedAccount?.name || "Selecionar Conta"}</span>
                  <span className="selection-card-arrow">&gt;</span>
                </div>
              </div>

              {/* Conta de Destino Selection */}
              {type === "TRANSFER" && (
                <div className="form-row">
                  <div className="form-row-left">
                    <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3h18V6z"></path>
                    </svg>
                    <span className="form-row-label">Conta de Destino</span>
                  </div>
                  <div 
                    className="selection-card-trigger"
                    onClick={() => setShowDestAccountModal(true)}
                  >
                    <div className="selection-card-icon-bg" style={{ backgroundColor: "#1d4ed8" }}>
                      {selectedDestinationAccount?.name[0] || "D"}
                    </div>
                    <span className="selection-card-text">{selectedDestinationAccount?.name || "Selecionar Conta de Destino"}</span>
                    <span className="selection-card-arrow">&gt;</span>
                  </div>
                </div>
              )}

              {/* Anexar */}
              <div className="form-row">
                <div className="form-row-left">
                  <svg className="form-row-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.75m-5.364-5.625h5.364m-5.364 3H18.36m-15 0h.008v.008H3.36v-.008zm0-3h.008v.008H3.36v-.008zm0-3h.008v.008H3.36V9.75zm0-3h.008v.008H3.36V6.75zM12 9h.008v.008H12V9zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12V15z"></path>
                  </svg>
                  <span className="form-row-label">Anexar</span>
                </div>
                <button type="button" className="cloud-upload-btn">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Observações Card */}
            <div className="observation-card">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20, color: "var(--text-tertiary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"></path>
              </svg>
              <textarea 
                className="observation-textarea" 
                placeholder="Observação ou anotação extra..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="form-right-column">
            {/* Opções Avançadas */}
            <div className="options-card">
              <span className="panel-title" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
                Opções avançadas
              </span>

              {/* Parcelado */}
              <div className="option-row">
                <div className="option-left">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="option-label">Parcelado</span>
                </div>
                <label className="switch-control">
                  <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Despesa Fixa */}
              <div className="option-row">
                <div className="option-left">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.75m-5.364-5.625h5.364m-5.364 3H18.36m-15 0h.008v.008H3.36v-.008z"></path>
                  </svg>
                  <span className="option-label">Despesa fixa</span>
                </div>
                <label className="switch-control">
                  <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Tags */}
              <div className="option-row">
                <div className="option-left">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.182 0l4.318-4.318a2.25 2.25 0 000-3.182L11.16 3.659A2.25 2.25 0 009.568 3z"></path>
                  </svg>
                  <span className="option-label">Tags</span>
                </div>
                <div className="option-trigger-text">
                  <span>&gt;</span>
                </div>
              </div>

              {/* Ignorar Despesa */}
              <div className="option-row">
                <div className="option-left">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path>
                  </svg>
                  <span className="option-label">Ignorar despesa</span>
                </div>
                <label className="switch-control">
                  <input type="checkbox" checked={ignoreExpense} onChange={(e) => setIgnoreExpense(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>

            {/* Premium Mockup Card */}
            <div className="premium-graphic-card">
              <div className="premium-card-glow" />
              <div className="premium-card-illustration">
                <div className="premium-card-chip" />
                <div className="premium-card-neon-stripe" />
              </div>
              <span className="premium-card-text">Gerencie com precisão.</span>
            </div>
          </div>
        </section>

        {/* Bottom Actions Row */}
        <section className="form-actions-row">
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-submit-main"
          >
            {isLoading ? "SALVANDO..." : "SALVAR E CONTINUAR"}
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSubmit()} 
            disabled={isLoading}
            className="btn-floating-check"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
            </svg>
          </button>
        </section>
      </form>

      {/* Category Modal Dialog */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Selecionar Categoria</span>
              <button className="modal-close-btn" onClick={() => setShowCategoryModal(false)}>&times;</button>
            </div>
            <div className="modal-list">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <div 
                    key={cat.id} 
                    className={`modal-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryModal(false);
                    }}
                  >
                    <div className="modal-list-item-icon" style={{ backgroundColor: "#581c87" }}>
                      {cat.name[0]}
                    </div>
                    <span className="account-name">{cat.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Account Modal Dialog */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{type === "TRANSFER" ? "Selecionar Conta de Origem" : "Selecionar Conta"}</span>
              <button className="modal-close-btn" onClick={() => setShowAccountModal(false)}>&times;</button>
            </div>
            <div className="modal-list">
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                return (
                  <div 
                    key={acc.id} 
                    className={`modal-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedAccount(acc);
                      setShowAccountModal(false);
                    }}
                  >
                    <div className="modal-list-item-icon" style={{ backgroundColor: "#14532d" }}>
                      {acc.name[0]}
                    </div>
                    <span className="account-name">{acc.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Destination Account Modal Dialog */}
      {showDestAccountModal && (
        <div className="modal-overlay" onClick={() => setShowDestAccountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Selecionar Conta de Destino</span>
              <button className="modal-close-btn" onClick={() => setShowDestAccountModal(false)}>&times;</button>
            </div>
            <div className="modal-list">
              {accounts.map((acc) => {
                const isSelected = selectedDestinationAccount?.id === acc.id;
                return (
                  <div 
                    key={acc.id} 
                    className={`modal-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedDestinationAccount(acc);
                      setShowDestAccountModal(false);
                    }}
                  >
                    <div className="modal-list-item-icon" style={{ backgroundColor: "#1e3a8a" }}>
                      {acc.name[0]}
                    </div>
                    <span className="account-name">{acc.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
