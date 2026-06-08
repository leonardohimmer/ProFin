import { formatCurrency } from "@/lib/math";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export default async function TransacoesPage(props: {
  searchParams: Promise<{ type?: string }>
}) {
  const searchParams = await props.searchParams;
  const filterType = searchParams.type; // CREDIT ou DEBIT

  const headerList = await headers();
  const userId = headerList.get("x-user-id");

  if (!userId) {
    return <div>Não autorizado. Faça login novamente.</div>;
  }

  // Filtro dinâmico para o Prisma
  const whereClause: any = { account: { userId: userId } };
  if (filterType) {
    whereClause.type = filterType;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: whereClause,
    include: { 
      transaction: true,
      account: true
    },
    orderBy: { createdAt: 'desc' }
  });


  // Cálculos de resumo
  let totalReceived = 0;
  let totalToReceive = 0;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  entries.forEach(e => {
    if (e.createdAt >= firstDayOfMonth) {
      if (e.type === 'CREDIT') totalReceived += e.amount;
      else totalToReceive += e.amount; // Simplificação para o exemplo
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '500' }}>Transações</h2>
        <div style={{ display: 'flex', gap: '3rem', marginTop: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resultado previsto no mês</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(totalReceived - totalToReceive)}</p>
          </div>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Recebimentos</span>
              <span style={{ fontWeight: 'bold' }}>100%</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: '100%', background: 'var(--success)' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: '500' }}>{formatCurrency(totalReceived)}</p>
          </div>
        </div>
      </header>

      <div className="dashboard-card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/transacoes" className="filter-btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)', textDecoration: 'none' }}>MAI/2026</Link>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/transacoes?type=CREDIT" className="filter-btn" style={{ textDecoration: 'none', background: filterType === 'CREDIT' ? 'var(--success)' : 'var(--surface-bg)', color: filterType === 'CREDIT' ? 'white' : 'inherit' }}>Recebimentos</Link>
            <Link href="/transacoes?type=DEBIT" className="filter-btn" style={{ textDecoration: 'none', background: filterType === 'DEBIT' ? 'var(--danger)' : 'var(--surface-bg)', color: filterType === 'DEBIT' ? 'white' : 'inherit' }}>Despesas</Link>
            <Link href="/transacoes" className="filter-btn" style={{ textDecoration: 'none', background: 'var(--surface-bg)' }}>Limpar Filtros</Link>
          </div>
        </div>


        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Data</th>
              <th>Descrição</th>
              <th>Recebido de / Pago a</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Pago?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'var(--surface-hover)' }}>
              <td colSpan={8} style={{ textAlign: 'center', padding: '0.75rem' }}>
                <Link href="/transacoes/nova" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>
                  + Nova transação
                </Link>
              </td>
            </tr>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Nenhuma transação encontrada.</td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: '500' }}>{entry.transaction.description}</td>
                  <td>{entry.transaction.contact || '-'}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--surface-highlight)', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {entry.transaction.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: entry.type === 'CREDIT' ? 'var(--success)' : 'inherit' }}>
                    {entry.type === 'CREDIT' ? '' : '-'} {formatCurrency(entry.amount)}
                  </td>
                  <td>{entry.transaction.paymentType}</td>
                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={entry.transaction.isPaid} readOnly />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td><span style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }}>•••</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', minWidth: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{formatCurrency(totalReceived)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Recebido</span>
              <span style={{ color: 'var(--success)' }}>{formatCurrency(totalReceived)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>A Receber</span>
              <span>{formatCurrency(totalToReceive)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
