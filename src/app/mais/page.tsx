"use client";

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function MaisPage() {
  const menuItems = [
    {
      title: "GERENCIAR",
      items: [
        { name: "Contas", href: "/contas", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z" /> },
        { name: "Cartão de crédito", href: "/cartoes", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
        { name: "Categorias", href: "/categorias", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
        { name: "Objetivos", href: "/metas", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a4.89 4.89 0 003.714-4.74V4.5a.75.75 0 00-1.056-.683l-3.114.732a9 9 0 01-6.086-.71l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /> },
      ]
    },
    {
      title: "FERRAMENTAS",
      items: [
        { name: "Importar dados", href: "/importar", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0 0l-3-3m3 3l3-3m-9-6a9 9 0 1118 0c0 1.229-.247 2.397-.694 3.465" /> },
        { name: "Relatórios", href: "/relatorios", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
        { name: "Investimentos", href: "/investimentos", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /> },
      ]
    },
    {
      title: "SISTEMA",
      items: [
        { name: "Configurações", href: "/configuracoes", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></> },
        { name: "Suporte", href: "/suporte", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /> },
      ]
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "2rem" }}>
      <header className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Mais opções</h1>
          <p className="page-subtitle">Acesse todas as configurações do seu sistema</p>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {menuItems.map((group, index) => (
          <div key={index}>
            <h3 style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem", paddingLeft: "1rem" }}>
              {group.title}
            </h3>
            <div className="panel-card" style={{ padding: "0.5rem 0", borderRadius: "16px" }}>
              {group.items.map((item, itemIndex) => (
                <Link 
                  key={itemIndex} 
                  href={item.href}
                  style={{
                    display: "flex", 
                    alignItems: "center", 
                    padding: "1rem 1.25rem",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    borderBottom: itemIndex < group.items.length - 1 ? "1px solid var(--border)" : "none"
                  }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 22, height: 22, color: "var(--text-secondary)", marginRight: "1rem" }}>
                    {item.icon}
                  </svg>
                  <span style={{ fontSize: "0.95rem", fontWeight: "500", flex: 1 }}>{item.name}</span>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "var(--text-tertiary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
