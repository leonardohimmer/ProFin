"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface SelectionItem {
  id: string;
  name: string;
}

interface ParsedTransaction {
  tempId: string;
  description: string;
  amount: number; // float value (e.g. 22.50)
  type: "CREDIT" | "DEBIT";
  date: string;
  categoryId: string;
  selected: boolean;
}

interface ImporterViewProps {
  categories: SelectionItem[];
  accounts: SelectionItem[];
}

export default function ImporterView({ categories, accounts }: ImporterViewProps) {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = () => {
    // Sugere categorias padrão baseando-se nas categorias do banco de dados
    const getCatIdByName = (name: string) => {
      const cat = categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
      return cat?.id || categories[0]?.id || "";
    };

    const mockData: ParsedTransaction[] = [
      {
        tempId: "1",
        description: "Supermercado Pão de Açúcar",
        amount: 345.60,
        type: "DEBIT",
        date: new Date().toISOString().split("T")[0],
        categoryId: getCatIdByName("Alimentação") || getCatIdByName("Mercado"),
        selected: true
      },
      {
        tempId: "2",
        description: "Uber Trip",
        amount: 22.50,
        type: "DEBIT",
        date: new Date().toISOString().split("T")[0],
        categoryId: getCatIdByName("Transporte") || getCatIdByName("Carro"),
        selected: true
      },
      {
        tempId: "3",
        description: "Salário Mensal ProFin",
        amount: 5500.00,
        type: "CREDIT",
        date: new Date().toISOString().split("T")[0],
        categoryId: getCatIdByName("PIX") || getCatIdByName("Receita"),
        selected: true
      },
      {
        tempId: "4",
        description: "Lojas Americanas S.A.",
        amount: 89.90,
        type: "DEBIT",
        date: new Date().toISOString().split("T")[0],
        categoryId: getCatIdByName("Lazer") || getCatIdByName("Outros"),
        selected: true
      }
    ];

    setParsedTransactions(mockData);
  };

  const handleToggleSelect = (tempId: string) => {
    setParsedTransactions(prev =>
      prev.map(t => (t.tempId === tempId ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleCategoryChange = (tempId: string, categoryId: string) => {
    setParsedTransactions(prev =>
      prev.map(t => (t.tempId === tempId ? { ...t, categoryId } : t))
    );
  };

  const handleImport = async () => {
    const toImport = parsedTransactions.filter(t => t.selected);
    if (toImport.length === 0) {
      alert("Nenhuma transação selecionada para importação.");
      return;
    }
    if (!selectedAccountId) {
      alert("Selecione uma conta de destino para a importação.");
      return;
    }

    setIsLoading(true);
    let successCount = 0;

    try {
      // Loop sequencial ou paralelo chamando a API de transações para importar cada lançamento
      await Promise.all(
        toImport.map(async (t) => {
          const categoryName = categories.find(c => c.id === t.categoryId)?.name || "OUTROS";
          
          const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: t.description,
              amount: t.amount,
              type: t.type,
              accountId: selectedAccountId,
              categoryId: t.categoryId || null,
              category: categoryName,
              paymentType: "A VISTA",
              paymentMethod: t.type === "DEBIT" ? "CARTAO" : "PIX",
              isPaid: true
            })
          });

          if (res.ok) {
            successCount++;
          }
        })
      );

      alert(`${successCount} transações importadas com sucesso!`);
      setParsedTransactions([]);
      router.push("/transacoes");
      router.refresh();
    } catch (error) {
      console.error("Erro na importação:", error);
      alert("Erro ao importar transações.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = parsedTransactions.filter(t => t.selected).length;

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Importar Extrato Bancário
          </h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Importe arquivos OFX/CSV ou simule importações automáticas
          </span>
        </div>
      </header>

      {/* Upload Zone Panel */}
      <section className="dashboard-content-layout" style={{ marginBottom: "2rem" }}>
        <div className="panel-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", border: "2px dashed var(--border)", textAlign: "center", backgroundColor: "rgba(255,255,255,0.01)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: "var(--text-tertiary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0 0l-3-3m3 3l3-3m-9-6a9 9 0 1118 0c0 1.229-.247 2.397-.694 3.465" />
            </svg>
          </div>
          <strong style={{ fontSize: "1.2rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
            Arraste seu arquivo OFX, CSV ou TXT
          </strong>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "300px", lineHeight: "1.5", marginBottom: "1.5rem" }}>
            Suporta extratos bancários de Nubank, Itaú, Bradesco, Santander e outros.
          </span>
          
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              type="button"
              className="btn-filter-toggle"
              style={{ borderRadius: "20px" }}
              onClick={() => alert("Por favor use o botão 'Simular Importação' para testar esta funcionalidade no ambiente de sandbox.")}
            >
              Escolher Arquivo
            </button>
            <button 
              onClick={handleSimulate}
              className="btn-header btn-header-income" 
              style={{ borderRadius: "20px" }}
            >
              + Simular Importação
            </button>
          </div>
        </div>
      </section>

      {/* Parsed List Results */}
      {parsedTransactions.length > 0 && (
        <section className="dashboard-content-layout">
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-header" style={{ marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <span className="panel-title">Transações Identificadas no Extrato</span>
              
              {/* Account selection */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Importar na Conta:</span>
                <select 
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="transaction-table-wrapper">
              <table className="transaction-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem", width: "40px" }}></th>
                    <th style={{ padding: "0.75rem" }}>Descrição</th>
                    <th style={{ padding: "0.75rem" }}>Data</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Valor</th>
                    <th style={{ padding: "0.75rem" }}>Categoria Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.map((t) => (
                    <tr key={t.tempId} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.9rem", opacity: t.selected ? 1 : 0.4 }}>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <input 
                          type="checkbox" 
                          checked={t.selected} 
                          onChange={() => handleToggleSelect(t.tempId)}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "0.75rem", fontWeight: "600", color: "var(--text-primary)" }}>{t.description}</td>
                      <td style={{ padding: "0.75rem" }}>{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", color: t.type === "DEBIT" ? "var(--danger)" : "var(--success)", fontWeight: "600" }}>
                        {t.type === "DEBIT" ? "-" : "+"}{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <select 
                          value={t.categoryId}
                          onChange={(e) => handleCategoryChange(t.tempId, e.target.value)}
                          style={{ padding: "0.4rem", backgroundColor: "#18181f", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirm buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <button 
                onClick={() => setParsedTransactions([])}
                className="btn-filter-toggle"
                style={{ borderRadius: "6px" }}
              >
                Descartar
              </button>
              <button 
                onClick={handleImport}
                disabled={isLoading}
                className="btn-header btn-header-income"
                style={{ borderRadius: "6px", color: "#fff" }}
              >
                {isLoading ? "Processando..." : `Importar Selecionados (${selectedCount})`}
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
