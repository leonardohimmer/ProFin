"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CategoryInfo {
  id: string;
  name: string;
  transactionsCount: number;
}

interface CategoriesViewProps {
  categories: CategoryInfo[];
}

export default function CategoriesView({ categories }: CategoriesViewProps) {
  const [activeTab, setActiveTab] = useState<"DESPESAS" | "RECEITAS">("DESPESAS");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtra as categorias com base na aba ativa (exemplo simplificado: a maioria é despesa, exceto 'Receitas')
  const filteredCategories = categories.filter(cat => {
    const isIncome = cat.name.toLowerCase() === "receitas" || cat.name.toLowerCase() === "rendimentos";
    const matchesTab = activeTab === "RECEITAS" ? isIncome : !isIncome;
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCategoryDetails = (name: string) => {
    switch (name) {
      case "Mercado":
        return {
          colorClass: "blue",
          bgColor: "#1e3a8a",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          )
        };
      case "Moradia":
        return {
          colorClass: "purple",
          bgColor: "#581c87",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          )
        };
      case "Pagamentos":
        return {
          colorClass: "orange",
          bgColor: "#7c2d12",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-18v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
            </svg>
          )
        };
      case "Pet":
        return {
          colorClass: "pink",
          bgColor: "#831843",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="14" r="4" />
              <circle cx="8" cy="8" r="2" />
              <circle cx="12" cy="6" r="2" />
              <circle cx="16" cy="8" r="2" />
            </svg>
          )
        };
      case "PIX":
        return {
          colorClass: "grey",
          bgColor: "#374151",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          )
        };
      case "Presentes":
        return {
          colorClass: "light-green",
          bgColor: "#064e3b",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a3 3 0 003 3h10a3 3 0 003-3V8H12z"></path>
            </svg>
          )
        };
      case "Roupa":
        return {
          colorClass: "green",
          bgColor: "#14532d",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 00-3 3v2.382l-5.447 2.724A1 1 0 003 12v3a1 1 0 001 1h16a1 1 0 001-1v-3a1 1 0 00-.553-.894L15 8.382V6a3 3 0 00-3-3z"></path>
            </svg>
          )
        };
      case "Saúde":
        return {
          colorClass: "light-blue",
          bgColor: "#1e3a8a",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          )
        };
      case "Vestuário":
        return {
          colorClass: "yellow",
          bgColor: "#78350f",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.5 5.5l13 13m0-13l-13 13"></path>
            </svg>
          )
        };
      case "Água":
        return {
          colorClass: "light-blue",
          bgColor: "#172554",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          )
        };
      case "Carro":
        return {
          colorClass: "purple",
          bgColor: "#3b0764",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0-1.5-1.5-3-3-3h-9c-1.5 0-3 1.5-3 3v4.5h15v-4.5z"></path>
            </svg>
          )
        };
      default:
        return {
          colorClass: "grey",
          bgColor: "#374151",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          )
        };
    }
  };

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1>Gerenciar Categorias</h1>
            <div className="header-left-subtabs">
              <Link href="/categorias" className="subtab-link active">Visão Geral</Link>
              <Link href="/relatorios" className="subtab-link">Relatórios</Link>
            </div>
          </div>
        </div>

        <div className="header-right">
          <Link href="/transacoes/nova?type=CREDIT" className="btn-header btn-header-income">
            Adicionar Receita
          </Link>
          <Link href="/transacoes/nova?type=DEBIT" className="btn-header btn-header-expense">
            Adicionar Despesa
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

      {/* Filter and search row */}
      <section className="categories-filter-row">
        <div className="categories-type-tabs">
          <button 
            onClick={() => setActiveTab("DESPESAS")}
            className={`category-tab ${activeTab === "DESPESAS" ? "active-expense" : ""}`}
          >
            DESPESAS
          </button>
          <button 
            onClick={() => setActiveTab("RECEITAS")}
            className={`category-tab ${activeTab === "RECEITAS" ? "active-income" : ""}`}
          >
            RECEITAS
          </button>
        </div>

        <div className="search-input-wrapper" style={{ margin: 0 }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="categories-grid">
        {filteredCategories.map((cat) => {
          const details = getCategoryDetails(cat.name);
          return (
            <div className="category-card" key={cat.id}>
              <div className="category-card-left">
                <div className="category-icon-bg" style={{ backgroundColor: details.bgColor }}>
                  {details.icon}
                </div>
                <div className="category-card-info">
                  <span className="category-card-name">{cat.name}</span>
                  <span className="category-card-stats">
                    {cat.transactionsCount === 0 
                      ? "0 transações este mês" 
                      : `${cat.transactionsCount} transações este mês`}
                  </span>
                </div>
              </div>

              <div className="category-card-right">
                <button className="category-action-icon">+</button>
                <button className="category-action-icon">•••</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Floating Action Button (Green FAB) */}
      <div className="fab-container">
        <button className="fab-btn green-fab">
          <svg className="fab-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
        </button>
      </div>
    </>
  );
}
