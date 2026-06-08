import { formatCurrency } from "@/lib/math";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export default async function Home() {
  // const headerList = await headers();
  // const userId = headerList.get("x-user-id");
  const userId = "test-user-id"; // ID de teste fixo

  if (!userId) {
    return <div>Não autorizado. Faça login novamente.</div>;
  }

  // Busca o usuário para saudar
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Busca entradas do Ledger para cálculos
  const allEntries = await prisma.ledgerEntry.findMany({
    where: { account: { userId: userId } },
    include: { transaction: true },
    orderBy: { createdAt: 'desc' }
  });

  let totalBalance = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Agrupamento por categoria para o gráfico
  const categoriesMap: Record<string, number> = {};

  allEntries.forEach(entry => {
    const isThisMonth = entry.createdAt >= firstDayOfMonth;
    
    if (entry.type === 'CREDIT') {
      totalBalance += entry.amount;
      if (isThisMonth) monthlyIncome += entry.amount;
    } else {
      totalBalance -= entry.amount;
      if (isThisMonth) {
        monthlyExpenses += entry.amount;
        const cat = entry.transaction.category || "OUTROS";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + entry.amount;
      }
    }
  });

  const recentEntries = allEntries.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '500' }}>Bom dia, {user?.name.split(' ')[0]}.</h2>
      </header>

      <div className="dashboard-grid">
        {/* Previsto / Realizado */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3>Previsto / realizado no mês</h3>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', width: '100%' }}>
            <div className="donut-chart">
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Recebido</p>
                <p style={{ fontWeight: 'bold' }}>100%</p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Recebimentos</p>
                <p style={{ fontWeight: 'bold' }}>{formatCurrency(monthlyIncome)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Despesas</p>
                <p style={{ fontWeight: 'bold' }}>{formatCurrency(monthlyExpenses)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fluxo de Caixa */}
        <div className="dashboard-card">
          <h3>Fluxo de caixa</h3>
          <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '20px' }}>
             {/* Mock de barras de fluxo de caixa */}
             {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
               <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 3 ? 'var(--primary)' : 'var(--primary-light)', borderRadius: '4px' }}></div>
             ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            <span>01/05</span>
            <span>15/05</span>
            <span>30/05</span>
          </div>
        </div>

        {/* Comparativo / Resultado previsto */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <h3>Comparativo / Resultado por Categoria</h3>
          <div className="progress-container">
            {Object.entries(categoriesMap).length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)' }}>Nenhuma despesa este mês.</p>
            ) : (
              Object.entries(categoriesMap).map(([cat, amount]) => (
                <div key={cat} className="progress-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(amount)}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, (amount / monthlyExpenses) * 100)}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Extrato Recente */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Extrato Recente</h3>
            <Link href="/transacoes" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Ver tudo</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentEntries.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>Nenhuma transação.</p>
            ) : (
              recentEntries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{entry.transaction.description}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{entry.transaction.category} • {new Date(entry.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div style={{ color: entry.type === 'CREDIT' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {entry.type === 'CREDIT' ? '+' : '-'} {formatCurrency(entry.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
