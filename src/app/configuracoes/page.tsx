"use client";

import React, { useState, useEffect } from "react";

export default function ConfiguracoesPage() {
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [configured, setConfigured] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/settings/email")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setConfigured(Boolean(data.configured));
          setSmtpUser(data.smtpUser || "");
          setSmtpHost(data.smtpHost || "smtp.gmail.com");
          setSmtpPort(String(data.smtpPort || 465));
          setSmtpFrom(data.smtpFrom || "");
          setHasPassword(Boolean(data.hasPassword));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser,
          smtpPass,
          smtpHost,
          smtpPort,
          smtpFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar configuração de e-mail.");
      }

      setConfigured(true);
      setHasPassword(true);
      setSmtpPass("");
      setSuccess(data.message || "E-mail remetente salvo e verificado com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "760px" }}>
      <div className="page-header">
        <div className="header-left">
          <h1>Configurações do Sistema</h1>
        </div>
      </div>

      <div className="panel-card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
              E-mail para Envio de Códigos de Confirmação (SMTP)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Configure a conta de e-mail responsável por disparar os códigos de 6 dígitos na criação de novas contas.
            </p>
          </div>

          <span
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: configured ? "rgba(16, 185, 129, 0.15)" : "rgba(251, 191, 36, 0.15)",
              color: configured ? "var(--success)" : "var(--warning)",
              border: `1px solid ${configured ? "var(--success)" : "var(--warning)"}`,
            }}
          >
            {configured ? "✓ E-mail Remetente Ativo" : "Pendente de Configuração"}
          </span>
        </div>

        {/* Guia rápido para Gmail */}
        <div
          style={{
            backgroundColor: "var(--tabs-bg)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
            marginBottom: "1.5rem",
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.3rem" }}>
            💡 Como usar seu Gmail para enviar os códigos:
          </strong>
          1. Acesse sua Conta Google em{" "}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}
          >
            myaccount.google.com/apppasswords
          </a>{" "}
          (Senhas de App).
          <br />
          2. Crie uma senha de app com o nome <strong>ProFin</strong> e copie o código gerado de 16 letras.
          <br />
          3. Informe seu endereço <strong>@gmail.com</strong> e cole a Senha de App de 16 letras abaixo.
        </div>

        {error && (
          <div
            style={{
              background: "rgba(248, 113, 113, 0.12)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid var(--success)",
              color: "var(--success)",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
            }}
          >
            {success}
          </div>
        )}

        {isLoading ? (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Carregando configurações...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  E-mail Remetente (SMTP User) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: seuemail@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  Senha de App (16 letras) ou Senha SMTP {hasPassword ? "(Já salva)" : "*"}
                </label>
                <input
                  type="password"
                  required={!hasPassword}
                  placeholder={hasPassword ? "•••••••••••••••• (digite para alterar)" : "xxxx xxxx xxxx xxxx"}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  Servidor SMTP (Host)
                </label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  Porta SMTP
                </label>
                <input
                  type="number"
                  placeholder="465"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                alignSelf: "flex-start",
                padding: "0.85rem 1.75rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.92rem",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px var(--primary-glow)",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? "Testando conexão SMTP e salvando..." : "Salvar e Testar E-mail de Envio"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
