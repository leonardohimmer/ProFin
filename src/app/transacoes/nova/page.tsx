"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategorySelector from "@/components/CategorySelector";

export default function NovaTransacao() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEBIT"); 
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  const [contact, setContact] = useState("");
  const [paymentType, setPaymentType] = useState("A VISTA");
  const [paymentMethod, setPaymentMethod] = useState("INDEFINIDO");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          amount: parseFloat(amount), 
          type, 
          categoryId: selectedCategory?.id,
          category: selectedCategory?.name, // Passamos o nome como fallback
          contact,
          paymentType,
          paymentMethod
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      router.push("/transacoes");
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Nova Transação</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Registre uma movimentação detalhada no ledger.</p>
      </header>

      <form onSubmit={handleSubmit} className="card dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Descrição</label>
            <input 
              type="text" required placeholder="Ex: Salário Maio"
              value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Recebido de / Pago a (Contato)</label>
            <input 
              type="text" placeholder="Ex: Empresa LTDA"
              value={contact} onChange={(e) => setContact(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Valor (R$)</label>
            <input 
              type="number" step="0.01" required placeholder="0,00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Categoria</label>
            <CategorySelector 
              selectedId={selectedCategory?.id}
              onSelect={(cat) => setSelectedCategory({ id: cat.id, name: cat.name })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Tipo Pagamento</label>
            <select 
              value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="A VISTA">À vista</option>
              <option value="PARCELADO">Parcelado</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Meio de Pagamento</label>
             <select 
              value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="INDEFINIDO">Indefinido</option>
              <option value="PIX">Pix</option>
              <option value="BOLETO">Boleto</option>
              <option value="CARTAO">Cartão</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Tipo de Movimentação</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" onClick={() => setType("DEBIT")}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: type === 'DEBIT' ? 'var(--danger)' : 'white', color: type === 'DEBIT' ? 'white' : 'inherit' }}
              >
                Despesa
              </button>
              <button 
                type="button" onClick={() => setType("CREDIT")}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: type === 'CREDIT' ? 'var(--success)' : 'white', color: type === 'CREDIT' ? 'white' : 'inherit' }}
              >
                Receita
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={() => router.back()} className="filter-btn" style={{ flex: 1 }}>Cancelar</button>
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 2 }}>
            {isLoading ? 'Salvando...' : 'Confirmar Lançamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
