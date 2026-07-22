"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface QuickAddMenuProps {
  buttonStyle?: React.CSSProperties;
  className?: string;
}

export default function QuickAddMenu({ buttonStyle, className }: QuickAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const options = [
    {
      label: "Transferências",
      href: "/transacoes/nova?type=TRANSFER",
      color: "var(--primary, #6366f1)",
      bg: "rgba(99, 102, 241, 0.15)",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      )
    },
    {
      label: "Despesas",
      href: "/transacoes/nova?type=DEBIT",
      color: "var(--danger, #ef4444)",
      bg: "rgba(239, 68, 68, 0.15)",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      )
    },
    {
      label: "Despesas cartão",
      href: "/transacoes/nova?type=CREDIT_CARD",
      color: "#0d9488",
      bg: "rgba(13, 148, 136, 0.15)",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      )
    },
    {
      label: "Receitas",
      href: "/transacoes/nova?type=CREDIT",
      color: "var(--success, #10b981)",
      bg: "rgba(16, 185, 129, 0.15)",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      )
    }
  ];

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block", zIndex: 9999 }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`quick-add-btn ${isOpen ? "open" : ""}`}
        title="Nova transação"
        aria-expanded={isOpen}
        style={buttonStyle}
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          className="quick-add-btn-icon"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {isOpen && (
        <div className="quick-add-dropdown">
          <div className="quick-add-dropdown-header">
            <span>NOVA TRANSAÇÃO</span>
          </div>
          <div className="quick-add-dropdown-items">
            {options.map((opt) => (
              <Link
                key={opt.label}
                href={opt.href}
                className="quick-add-dropdown-item"
                onClick={() => setIsOpen(false)}
              >
                <div className="quick-add-item-icon" style={{ color: opt.color, backgroundColor: opt.bg }}>
                  {opt.icon}
                </div>
                <span className="quick-add-item-label">{opt.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
