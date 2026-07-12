"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccountInfo {
  id: string;
  name: string;
  balance: number;
  entriesCount?: number;
  createdAt?: string;
}

interface AccountsViewProps {
  accounts: AccountInfo[];
}

export default function AccountsView({ accounts: initialAccounts }: AccountsViewProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountInfo[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValues, setShowValues] = useState(true);

  // Modais de controle: "CREATE" | "EDIT" | "DELETE" | null
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "DELETE" | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);

  // Campos do formulário de criação
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("Conta Corrente");
  const [newAccountBalance, setNewAccountBalance] = useState("0,00");

  // Campos do formulário de edição
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountBalance, setEditAccountBalance] = useState("0,00");

  // Estado de loading e mensagens
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const formatCurrencyValue = (cents: number) => {
    if (!showValues) return "R$ •••••";
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

  const getAccountColorClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("caixa") || n.includes("nubank") || n.includes("itaú") || n.includes("itau")) return "blue";
    if (n.includes("picpay") || n.includes("inter") || n.includes("sicoob")) return "teal";
    if (n.includes("santander") || n.includes("bradesco")) return "red";
    if (n.includes("sodexo") || n.includes("xp") || n.includes("btg") || n.includes("ticket")) return "orange";
    return "purple";
  };

  const getAccountTypeLabel = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("picpay") || n.includes("mercado") || n.includes("paypal")) return "Carteira Digital";
    if (n.includes("sodexo") || n.includes("ticket") || n.includes("vr") || n.includes("va")) return "Benefício / Vale";
    if (n.includes("xp") || n.includes("btg") || n.includes("rico") || n.includes("clear") || n.includes("invest")) return "Investimentos";
    if (n.includes("carteira") || n.includes("dinheiro") || n.includes("caixinha")) return "Dinheiro Físico";
    return "Conta Corrente";
  };

  const getAccountIconLetter = (name: string) => {
    if (name.toLowerCase().includes("caixa")) return "C";
    if (name.toLowerCase().includes("picpay")) return "P";
    if (name.toLowerCase().includes("santander")) return "S";
    if (name.toLowerCase().includes("nubank")) return "N";
    if (name.toLowerCase().includes("inter")) return "I";
    if (name.toLowerCase().includes("itaú") || name.toLowerCase().includes("itau")) return "I";
    return name.charAt(0).toUpperCase() || "C";
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAccountTypeLabel(acc.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const positiveAccounts = accounts.filter(a => a.balance >= 0);
  const negativeAccounts = accounts.filter(a => a.balance < 0);

  // Ações CRUD
  const handleOpenCreateModal = () => {
    setNewAccountName("");
    setNewAccountBalance("0,00");
    setNewAccountType("Conta Corrente");
    setModalType("CREATE");
  };

  const handleOpenEditModal = (acc: AccountInfo) => {
    setSelectedAccount(acc);
    setEditAccountName(acc.name);
    setEditAccountBalance((acc.balance / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setModalType("EDIT");
  };

  const handleOpenDeleteModal = (acc: AccountInfo) => {
    setSelectedAccount(acc);
    setModalType("DELETE");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || newAccountName.trim() === "") return;

    setIsLoading(true);
    try {
      const balanceCents = parseCurrencyInput(newAccountBalance);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName.trim(),
          initialBalance: balanceCents
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      setAccounts(prev => [...prev, {
        id: data.account.id,
        name: data.account.name,
        balance: balanceCents,
        entriesCount: balanceCents !== 0 ? 1 : 0
      }]);

      showFeedback(`Conta "${data.account.name}" criada com sucesso!`, "success");
      setModalType(null);
      router.refresh();
    } catch (error: any) {
      showFeedback(error.message || "Erro ao criar conta bancária.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !editAccountName.trim()) return;

    setIsLoading(true);
    try {
      const newBalanceCents = parseCurrencyInput(editAccountBalance);
      const res = await fetch("/api/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAccount.id,
          name: editAccountName.trim(),
          newBalance: newBalanceCents
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao atualizar conta");
      }

      setAccounts(prev => prev.map(acc => {
        if (acc.id === selectedAccount.id) {
          return {
            ...acc,
            name: editAccountName.trim(),
            balance: newBalanceCents
          };
        }
        return acc;
      }));

      showFeedback(`Conta "${editAccountName.trim()}" atualizada com sucesso!`, "success");
      setModalType(null);
      setSelectedAccount(null);
      router.refresh();
    } catch (error: any) {
      showFeedback(error.message || "Erro ao atualizar os dados da conta.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounts?id=${selectedAccount.id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir conta");
      }

      setAccounts(prev => prev.filter(acc => acc.id !== selectedAccount.id));
      showFeedback(`Conta "${selectedAccount.name}" excluída com sucesso!`, "success");
      setModalType(null);
      setSelectedAccount(null);
      router.refresh();
    } catch (error: any) {
      showFeedback(error.message || "Erro ao tentar excluir a conta.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const bankSuggestions = [
    "Nubank Principal", "Itaú Unibanco", "Santander", "Bradesco", "Banco Inter",
    "Caixa Econômica", "PicPay", "XP Investimentos", "Sodexo / VR", "Carteira / Dinheiro"
  ];

  return (
    <div className="accounts-page-container">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          backgroundColor: feedbackMsg.type === "success" ? "#065f46" : "#991b1b",
          color: "#ffffff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontWeight: "600",
          fontSize: "0.95rem",
          border: `1px solid ${feedbackMsg.type === "success" ? "#10b981" : "#ef4444"}`,
          animation: "fadeIn 0.3s ease"
        }}>
          {feedbackMsg.type === "success" ? (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1>Gerenciamento de Contas</h1>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Crie, configure e exclua suas contas bancárias, carteiras e contas de investimento com total facilidade.
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="search-input-wrapper" style={{ margin: 0, marginRight: "0.75rem" }}>
            <input
              type="text"
              className="search-input"
              placeholder="Pesquisar conta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn-header btn-header-income"
            style={{ padding: "0.65rem 1.25rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span>Nova Conta</span>
          </button>

          <button onClick={() => setShowValues(!showValues)} className="header-icon-btn" title="Ocultar/Exibir valores">
            {showValues ? (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="summary-grid" style={{ marginBottom: "2rem" }}>
        <div className="summary-card">
          <div className="summary-card-title">Saldo Geral Consolidado</div>
          <div className={`summary-card-value ${totalBalance < 0 ? "negative" : "positive"}`}>
            <span>{formatCurrencyValue(totalBalance)}</span>
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z"></path>
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Contas no Azul (Positivas)</div>
          <div className="summary-card-value positive">
            <span>{positiveAccounts.length} {positiveAccounts.length === 1 ? "conta" : "contas"}</span>
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Contas no Vermelho (Negativas)</div>
          <div className={`summary-card-value ${negativeAccounts.length > 0 ? "negative" : ""}`} style={{ color: negativeAccounts.length > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
            <span>{negativeAccounts.length} {negativeAccounts.length === 1 ? "conta" : "contas"}</span>
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Total de Instituições</div>
          <div className="summary-card-value" style={{ color: "var(--primary)" }}>
            <span>{accounts.length} cadastros</span>
          </div>
          <svg className="summary-card-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        </div>
      </section>

      {/* Grid de Contas */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Minhas Instituições e Carteiras
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Exibindo {filteredAccounts.length} de {accounts.length} contas
          </span>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="panel-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", color: "var(--text-secondary)" }}>
              <svg style={{ width: 32, height: 32 }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 00-.224-.53L12 3.82l-7.276 6.02a.75.75 0 00-.224.53V21H3v1.5h18V21h-1.5z"></path>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>Nenhuma conta encontrada</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 1.5rem auto", fontSize: "0.9rem" }}>
              {searchQuery ? `Não existem contas correspondentes a "${searchQuery}".` : "Você ainda não tem contas cadastradas. Crie sua primeira conta para controlar seus saldos."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="btn-header btn-header-income"
              style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", margin: "0 auto" }}
            >
              + Criar Primeira Conta
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.25rem"
          }}>
            {filteredAccounts.map((acc) => {
              const colorClass = getAccountColorClass(acc.name);
              const isNegative = acc.balance < 0;

              return (
                <div
                  key={acc.id}
                  className="panel-card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    borderLeft: `4px solid ${
                      colorClass === "blue" ? "#2563eb" :
                      colorClass === "teal" ? "#0d9488" :
                      colorClass === "red" ? "#dc2626" :
                      colorClass === "orange" ? "#ea580c" : "#7c3aed"
                    }`,
                    position: "relative"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div className={`account-icon-wrapper ${colorClass}`} style={{ width: "44px", height: "44px", fontSize: "1.2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                          {getAccountIconLetter(acc.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                            {acc.name}
                          </h3>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginTop: "0.15rem" }}>
                            {getAccountTypeLabel(acc.name)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="header-icon-btn"
                          title="Configurar Conta"
                          style={{ width: "34px", height: "34px", padding: 0 }}
                        >
                          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(acc)}
                          className="header-icon-btn"
                          title="Excluir Conta"
                          style={{ width: "34px", height: "34px", padding: 0, color: "var(--danger)" }}
                        >
                          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: "1rem", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "10px", marginBottom: "1.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                        Saldo Atual
                      </span>
                      <div style={{
                        fontSize: "1.6rem",
                        fontWeight: "700",
                        color: isNegative ? "var(--danger)" : "var(--success)",
                        marginTop: "0.25rem",
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between"
                      }}>
                        <span>{formatCurrencyValue(acc.balance)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {acc.entriesCount !== undefined ? `${acc.entriesCount} transações` : "Conta ativa"}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleOpenEditModal(acc)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Configurar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DE CRIAÇÃO (CREATE) */}
      {modalType === "CREATE" && (
        <div className="modal-overlay" onClick={() => !isLoading && setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">Cadastrar Nova Conta</span>
              <button className="modal-close-btn" onClick={() => !isLoading && setModalType(null)}>&times;</button>
            </div>

            <form onSubmit={handleCreateAccount}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    NOME DA INSTITUIÇÃO OU CARTEIRA
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Itaú, Carteira Físico"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#18181f",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.95rem"
                    }}
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />

                  {/* Sugestões rápidas */}
                  <div style={{ marginTop: "0.6rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
                      Sugestões rápidas:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {bankSuggestions.slice(0, 6).map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewAccountName(sug)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "14px",
                            fontSize: "0.75rem",
                            backgroundColor: newAccountName === sug ? "var(--primary)" : "rgba(255,255,255,0.05)",
                            color: newAccountName === sug ? "#fff" : "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    TIPO DE CONTA
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#18181f",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      cursor: "pointer",
                      fontSize: "0.95rem"
                    }}
                  >
                    <option value="Conta Corrente">Conta Corrente</option>
                    <option value="Poupança">Conta Poupança</option>
                    <option value="Carteira Digital">Carteira Digital (PicPay, Inter, Mercado Pago)</option>
                    <option value="Investimentos">Conta de Investimentos (XP, BTG, Rico)</option>
                    <option value="Benefício">Vale Benefício (Sodexo, VR, Ticket)</option>
                    <option value="Dinheiro Físico">Dinheiro Físico / Caixinha</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    SALDO INICIAL ATUAL (R$)
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#18181f",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "1.2rem",
                      fontWeight: "700"
                    }}
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "0.3rem" }}>
                    Um lançamento automático de ajuste será criado para inicializar este saldo.
                  </span>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem" }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setModalType(null)}
                  className="btn-filter-toggle"
                  style={{ borderRadius: "8px", padding: "0.6rem 1.25rem" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-header btn-header-income"
                  style={{ borderRadius: "8px", padding: "0.6rem 1.5rem", color: "#fff" }}
                >
                  {isLoading ? "Criando..." : "Criar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO / CONFIGURAÇÃO (EDIT) */}
      {modalType === "EDIT" && selectedAccount && (
        <div className="modal-overlay" onClick={() => !isLoading && setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">Configurar: {selectedAccount.name}</span>
              <button className="modal-close-btn" onClick={() => !isLoading && setModalType(null)}>&times;</button>
            </div>

            <form onSubmit={handleEditAccount}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    NOME DA CONTA / INSTITUIÇÃO
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#18181f",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.95rem"
                    }}
                    value={editAccountName}
                    onChange={(e) => setEditAccountName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    AJUSTAR SALDO ATUAL (R$)
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#18181f",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "1.2rem",
                      fontWeight: "700"
                    }}
                    value={editAccountBalance}
                    onChange={(e) => setEditAccountBalance(e.target.value)}
                  />
                  <div style={{ padding: "0.75rem", backgroundColor: "rgba(124, 58, 237, 0.1)", borderLeft: "3px solid var(--primary)", borderRadius: "6px", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: "1.4", display: "block" }}>
                      <strong>Conciliação inteligente:</strong> Caso o valor digitado seja diferente do saldo registrado ({formatCurrencyValue(selectedAccount.balance)}), o sistema criará automaticamente uma transação de reconciliação no histórico para compensar a diferença.
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: "1px solid var(--border)", justifyContent: "space-between", padding: "1rem" }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleOpenDeleteModal(selectedAccount)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Excluir Conta
                </button>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setModalType(null)}
                    className="btn-filter-toggle"
                    style={{ borderRadius: "8px", padding: "0.6rem 1.25rem" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-header"
                    style={{ borderRadius: "8px", padding: "0.6rem 1.5rem", backgroundColor: "var(--primary)", color: "#fff" }}
                  >
                    {isLoading ? "Salvar..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO (DELETE) */}
      {modalType === "DELETE" && selectedAccount && (
        <div className="modal-overlay" onClick={() => !isLoading && setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header" style={{ borderBottom: "none", paddingBottom: "0.5rem" }}>
              <span className="modal-title" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Excluir Conta Bancária
              </span>
              <button className="modal-close-btn" onClick={() => !isLoading && setModalType(null)}>&times;</button>
            </div>

            <div style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
              <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: "1.5", margin: "0 0 1rem 0" }}>
                Tem certeza de que deseja excluir a conta <strong>"{selectedAccount.name}"</strong>?
              </p>
              <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.82rem", color: "#fca5a5", lineHeight: "1.4", display: "block" }}>
                  ⚠️ <strong>Atenção:</strong> Todas as entradas financeiras atreladas exclusivamente a esta conta serão removidas do histórico e o seu saldo consolidado sofrerá atualização imediata. Esta ação não pode ser desfeita.
                </span>
              </div>
            </div>

            <div className="modal-header" style={{ borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem" }}>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setModalType(null)}
                className="btn-filter-toggle"
                style={{ borderRadius: "8px", padding: "0.6rem 1.25rem" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDeleteAccount}
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--danger)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s ease"
                }}
              >
                {isLoading ? "Excluindo..." : "Sim, Excluir Conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
