export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 'bold' }}>Painel Administrativo</h2>
        <div className="card glass-panel" style={{ padding: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>Bem-vindo ao painel de controle do sistema.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Usuários Ativos</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Logs de Sistema</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Estável</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="card glass-panel">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Configurações Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ flex: 1 }}>Gerenciar Usuários</button>
          <button className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)' }}>Auditoria de Transações</button>
        </div>
      </section>
    </div>
  );
}
