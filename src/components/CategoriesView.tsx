"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuickAddMenu from "./QuickAddMenu";

interface CategoryInfo {
  id: string;
  name: string;
  type?: string;
  transactionsCount: number;
}

interface CategoriesViewProps {
  categories: CategoryInfo[];
}

export default function CategoriesView({ categories }: CategoriesViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"DESPESAS" | "RECEITAS">("DESPESAS");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryInfo | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Filtra as categorias com base na aba ativa e na busca
  const filteredCategories = categories.filter(cat => {
    const isIncome = cat.type === "CREDIT" || 
      ["salário", "salario", "investimentos", "freelance", "prêmios", "premios", "cashback", "rendimentos", "outras receitas", "receitas"].includes(cat.name.toLowerCase());
    const matchesTab = activeTab === "RECEITAS" ? isIncome : !isIncome;
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenCreate = () => {
    setFormName("");
    setFormType(activeTab === "RECEITAS" ? "CREDIT" : "DEBIT");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: CategoryInfo) => {
    setSelectedCat(cat);
    setFormName(cat.name);
    const isIncome = cat.type === "CREDIT" || 
      ["salário", "salario", "investimentos", "freelance", "prêmios", "premios", "cashback", "rendimentos", "outras receitas", "receitas"].includes(cat.name.toLowerCase());
    setFormType(cat.type === "CREDIT" || isIncome ? "CREDIT" : "DEBIT");
    setIsEditOpen(true);
  };

  const handleOpenDelete = (cat: CategoryInfo) => {
    setSelectedCat(cat);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), type: formType })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar categoria");
      }

      showToast("Categoria criada com sucesso!");
      setIsCreateOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !formName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCat.id, name: formName.trim(), type: formType })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar categoria");
      }

      showToast("Categoria atualizada com sucesso!");
      setIsEditOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCat) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/categories?id=${selectedCat.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir categoria");
      }

      showToast("Categoria excluída com sucesso!");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDetails = (name: string) => {
    switch (name.trim()) {
      // DESPESAS (19 Categorias exatas conforme as imagens)
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
      case "Celular":
        return {
          colorClass: "green",
          bgColor: "#14532d",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"></path>
            </svg>
          )
        };
      case "Combustível":
        return {
          colorClass: "blue",
          bgColor: "#0369a1",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"></path>
            </svg>
          )
        };
      case "Educação":
        return {
          colorClass: "teal",
          bgColor: "#0f766e",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
            </svg>
          )
        };
      case "Eletrônicos":
        return {
          colorClass: "yellow",
          bgColor: "#92400e",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"></path>
            </svg>
          )
        };
      case "Energia":
        return {
          colorClass: "red",
          bgColor: "#991b1b",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path>
            </svg>
          )
        };
      case "Farmácia":
        return {
          colorClass: "grey",
          bgColor: "#1f2937",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
          )
        };
      case "IPTU":
        return {
          colorClass: "purple",
          bgColor: "#6b21a8",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"></path>
            </svg>
          )
        };
      case "Lazer":
        return {
          colorClass: "red",
          bgColor: "#9f1239",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"></path>
            </svg>
          )
        };
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

      // RECEITAS (7 Categorias Padrão Premium)
      case "Salário":
        return {
          colorClass: "green",
          bgColor: "#15803d",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"></path>
            </svg>
          )
        };
      case "Investimentos":
      case "Rendimentos":
        return {
          colorClass: "teal",
          bgColor: "#0f766e",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
            </svg>
          )
        };
      case "Freelance":
        return {
          colorClass: "blue",
          bgColor: "#1d4ed8",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"></path>
            </svg>
          )
        };
      case "Prêmios":
      case "Cashback":
        return {
          colorClass: "yellow",
          bgColor: "#b45309",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516m-13.5 0c2.14-.316 4.318-.483 6.518-.495m6.982.495v1.516c0 2.108-.966 3.99-2.48 5.228m2.48-5.228c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.396 4.972"></path>
            </svg>
          )
        };
      case "Outras Receitas":
      default:
        return {
          colorClass: "grey",
          bgColor: "#374151",
          icon: (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )
        };
    }
  };

  return (
    <>
      {/* Toast Notificação */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          backgroundColor: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 12,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 500,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          animation: "fadeIn 0.3s ease-out"
        }}>
          {toast.type === "success" ? (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

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
          <QuickAddMenu />

          <button className="header-icon-btn" onClick={handleOpenCreate} title="Criar Nova Categoria">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
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
            DESPESAS ({categories.filter(c => c.type !== "CREDIT").length})
          </button>
          <button 
            onClick={() => setActiveTab("RECEITAS")}
            className={`category-tab ${activeTab === "RECEITAS" ? "active-income" : ""}`}
          >
            RECEITAS ({categories.filter(c => c.type === "CREDIT").length})
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
        {filteredCategories.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: 12 }}>Nenhuma categoria encontrada para <strong>{activeTab}</strong>.</p>
            <button 
              onClick={handleOpenCreate}
              className="btn-header btn-header-expense"
              style={{ display: "inline-block" }}
            >
              + Criar Nova Categoria de {activeTab === "DESPESAS" ? "Despesa" : "Receita"}
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => {
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

                <div className="category-card-right" style={{ display: "flex", gap: 6 }}>
                  <Link 
                    href={`/transacoes/nova?type=${cat.type || 'DEBIT'}&category=${encodeURIComponent(cat.name)}`}
                    className="category-action-icon" 
                    title="Nova Transação nesta categoria"
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    +
                  </Link>
                  <button 
                    onClick={() => handleOpenEdit(cat)} 
                    className="category-action-icon"
                    title="Editar Categoria"
                    style={{ fontSize: "14px" }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleOpenDelete(cat)} 
                    className="category-action-icon"
                    title="Excluir Categoria"
                    style={{ fontSize: "14px" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Floating Action Button (Red/Primary FAB) */}
      <div className="fab-container">
        <button className="fab-btn" onClick={handleOpenCreate} style={{ backgroundColor: activeTab === "RECEITAS" ? "#10b981" : "#ef4444" }} title="Adicionar Categoria">
          <svg className="fab-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
        </button>
      </div>

      {/* MODAL: Criar Nova Categoria */}
      {isCreateOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 20,
            padding: 32,
            width: "100%",
            maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>
              Nova Categoria ({activeTab === "RECEITAS" ? "Receita" : "Despesa"})
            </h2>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Nome da Categoria
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Assinaturas, Cursos, Academia..." 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Tipo de Fluxo
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setFormType("DEBIT")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: formType === "DEBIT" ? "2px solid #ef4444" : "1px solid var(--border-color)",
                      backgroundColor: formType === "DEBIT" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-tertiary)",
                      color: formType === "DEBIT" ? "#ef4444" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("CREDIT")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: formType === "CREDIT" ? "2px solid #10b981" : "1px solid var(--border-color)",
                      backgroundColor: formType === "CREDIT" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-tertiary)",
                      color: formType === "CREDIT" ? "#10b981" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formName.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    backgroundColor: "var(--primary-color)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Criando..." : "Criar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Categoria */}
      {isEditOpen && selectedCat && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 20,
            padding: 32,
            width: "100%",
            maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>
              Editar Categoria
            </h2>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Nome da Categoria
                </label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Tipo de Fluxo
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setFormType("DEBIT")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: formType === "DEBIT" ? "2px solid #ef4444" : "1px solid var(--border-color)",
                      backgroundColor: formType === "DEBIT" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-tertiary)",
                      color: formType === "DEBIT" ? "#ef4444" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("CREDIT")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: formType === "CREDIT" ? "2px solid #10b981" : "1px solid var(--border-color)",
                      backgroundColor: formType === "CREDIT" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-tertiary)",
                      color: formType === "CREDIT" ? "#10b981" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formName.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    backgroundColor: "var(--primary-color)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Excluir Categoria */}
      {isDeleteOpen && selectedCat && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 20,
            padding: 32,
            width: "100%",
            maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ef4444", marginBottom: 12 }}>
              Excluir Categoria?
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a categoria <strong>"{selectedCat.name}"</strong>? Transações vinculadas a esta categoria não serão apagadas, mas ficarão marcadas como "Sem Categoria".
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  backgroundColor: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Excluindo..." : "Excluir Permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
