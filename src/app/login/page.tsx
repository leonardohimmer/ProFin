"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "login" | "register" | "verify" | "verified";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("login");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification states
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedBanner, setVerifiedBanner] = useState(false);
  const [verifiedRole, setVerifiedRole] = useState("OPERATOR");

  // Sender Email Setup (only shown if system SMTP is not configured yet)
  const [needsSmtpSetup, setNeedsSmtpSetup] = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState("");

  // Feedback states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer for resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-verify if URL has ?verify=<token>
  useEffect(() => {
    const token = searchParams.get("verify");
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
    if (token) {
      handleVerifyToken(token, emailParam || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleVerifyToken = async (token: string, emailParam: string) => {
    setError("");
    setIsLoading(true);
    setMode("verify");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: emailParam }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível validar o link de confirmação.");
      }
      if (data.email) setEmail(data.email);
      if (data.name) setName(data.name);
      if (data.role) setVerifiedRole(data.role);
      setVerifiedBanner(true);
      setMode("verified");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation helpers
  const hasMinLength = password.length >= 6;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /\d/.test(password);
  const hasUpperOrSpecial = /[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password);
  const isLongPassword = password.length >= 10;

  const passwordScore = [hasMinLength, hasLettersAndNumbers, hasUpperOrSpecial, isLongPassword].filter(Boolean).length;
  const strengthLabels = ["Muito fraca", "Fraca", "Boa", "Forte", "Excelente"];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#8b5cf6"];

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = name.trim().length >= 2;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const switchMode = (newMode: AuthMode) => {
    setError("");
    setSuccessMsg("");
    setNeedsSmtpSetup(false);
    setMode(newMode);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          if (data.name) setName(data.name);
          setOtpDigits(["", "", "", "", "", ""]);
          setMode("verify");
          if (data.emailSent === false) {
            setNeedsSmtpSetup(true);
            setError(data.emailError || "Não foi possível enviar o e-mail de confirmação. Configure o e-mail remetente.");
          } else {
            setNeedsSmtpSetup(false);
            setResendCooldown(30);
            setSuccessMsg("Enviamos um código de confirmação para seu e-mail. Digite-o abaixo para liberar seu login.");
          }
          return;
        }
        throw new Error(data.error || "Erro ao conectar");
      }

      if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!isNameValid) {
      setError("Informe seu nome completo (mínimo 2 caracteres).");
      return;
    }
    if (!isEmailValid) {
      setError("Informe um endereço de e-mail válido.");
      return;
    }
    if (!hasMinLength) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível criar sua conta.");
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setMode("verify");

      if (data.emailSent === false) {
        setNeedsSmtpSetup(true);
        setError(data.emailError || "Configure o e-mail remetente para disparar os códigos de confirmação.");
      } else {
        setNeedsSmtpSetup(false);
        setResendCooldown(30);
        setSuccessMsg("E-mail de confirmação enviado! Verifique sua caixa de entrada e digite o código de 6 dígitos.");
      }

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const next = [...otpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) {
          next[index + idx] = ch;
        }
      });
      setOtpDigits(next);
      const focusIdx = Math.min(index + chars.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  // Verify 6-digit code
  const handleVerifyCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setError("Digite os 6 dígitos do código de confirmação enviado para seu e-mail.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código inválido.");
      }

      if (data.role) setVerifiedRole(data.role);
      setVerifiedBanner(true);
      setMode("verified");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend confirmation email
  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("remetente")) {
          setNeedsSmtpSetup(true);
        }
        throw new Error(data.error || "Erro ao reenviar e-mail.");
      }

      if (data.alreadyVerified) {
        setVerifiedBanner(true);
        setMode("verified");
        return;
      }

      setNeedsSmtpSetup(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(30);
      setSuccessMsg("Novo código de confirmação enviado para seu e-mail!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save SMTP sender email and immediately resend verification code
  const handleSaveSmtpAndResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpFeedback("");
    setIsSavingSmtp(true);

    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao configurar e-mail remetente.");
      }

      setShowSmtpModal(false);
      setNeedsSmtpSetup(false);
      setError("");

      // Dispara o e-mail de confirmação imediatamente após configurar
      const resendRes = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const resendData = await resendRes.json();

      if (resendRes.ok) {
        setResendCooldown(30);
        setSuccessMsg(`E-mail remetente configurado e código enviado para ${email}! Verifique sua caixa de entrada.`);
      } else {
        setError(resendData.error || "Configuração salva, clique em reenviar código.");
      }
    } catch (err: any) {
      setSmtpFeedback(err.message);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 1rem",
        background: "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.14) 0%, var(--background) 65%)",
        transition: "background-color 0.3s ease",
      }}
    >
      <div
        className="panel-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "2.25rem",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card-bg)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
          position: "relative",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)",
              boxShadow: "0 8px 20px var(--primary-glow)",
              marginBottom: "0.75rem",
              color: "#ffffff",
            }}
          >
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
              marginBottom: "0.2rem",
            }}
          >
            ProFin
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            {mode === "login" && "Acesse sua conta para gerenciar suas finanças"}
            {mode === "register" && "Crie sua conta gratuita em poucos segundos"}
            {mode === "verify" && "Confirme seu e-mail para liberar o acesso"}
            {mode === "verified" && "Confirmação concluída com sucesso"}
          </p>
        </div>

        {/* Interactive Mode Tabs (Entrar / Criar Conta) */}
        {(mode === "login" || mode === "register") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: "var(--tabs-bg)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              marginBottom: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => switchMode("login")}
              style={{
                padding: "0.65rem",
                borderRadius: "9px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: mode === "login" ? "var(--primary)" : "transparent",
                color: mode === "login" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: mode === "login" ? "0 4px 12px var(--primary-glow)" : "none",
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              style={{
                padding: "0.65rem",
                borderRadius: "9px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: mode === "register" ? "var(--primary)" : "transparent",
                color: mode === "register" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: mode === "register" ? "0 4px 12px var(--primary-glow)" : "none",
              }}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Step Progress Indicator */}
        {(mode === "register" || mode === "verify" || mode === "verified") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              padding: "0 0.25rem",
            }}
          >
            {[
              { step: 1, label: "Criar Conta", active: mode === "register", done: mode === "verify" || mode === "verified" },
              { step: 2, label: "Confirmar E-mail", active: mode === "verify", done: mode === "verified" },
              { step: 3, label: "Login Liberado", active: mode === "verified", done: mode === "verified" },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: item.done
                        ? "var(--success)"
                        : item.active
                        ? "var(--primary)"
                        : "var(--tabs-bg)",
                      color: item.done || item.active ? "#ffffff" : "var(--text-tertiary)",
                      border: item.done || item.active ? "none" : "1px solid var(--border)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {item.done ? "✓" : item.step}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: item.active || item.done ? 600 : 500,
                      color: item.done
                        ? "var(--success)"
                        : item.active
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      margin: "0 0.5rem",
                      backgroundColor: item.done ? "var(--success)" : "var(--border)",
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Confirmed Email Banner on Login tab */}
        {mode === "login" && verifiedBanner && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid var(--success)",
              color: "#34d399",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>✓</span>
            <span>E-mail confirmado com sucesso! Seu login está liberado.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "rgba(248, 113, 113, 0.12)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
            {needsSmtpSetup && (
              <button
                type="button"
                onClick={() => {
                  setSmtpFeedback("");
                  setShowSmtpModal(true);
                }}
                style={{
                  alignSelf: "flex-start",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--primary)",
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  color: "#ffffff",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⚙️ Cadastrar E-mail Remetente do Sistema (SMTP)
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid var(--success)",
              color: "#34d399",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==================== MODE 1: LOGIN ==================== */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.45rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem 0.95rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--tabs-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.92rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.45rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem 2.75rem 0.8rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.92rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "0.4rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px var(--primary-glow)",
                transition: "all 0.2s ease",
                opacity: isLoading ? 0.75 : 1,
              }}
            >
              {isLoading ? "Autenticando..." : "Entrar no Sistema"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "0.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              Ainda não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.85rem",
                }}
              >
                Criar conta agora
              </button>
            </div>
          </form>
        )}

        {/* ==================== MODE 2: REGISTER (INTERACTIVE) ==================== */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Nome completo
                </label>
                {name.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: isNameValid ? "var(--success)" : "var(--warning)" }}>
                    {isNameValid ? "✓ Nome válido" : "Digite seu nome"}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Ex: Maria Oliveira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.78rem 0.95rem",
                  borderRadius: "10px",
                  border: `1px solid ${name.length > 0 ? (isNameValid ? "var(--success)" : "var(--border)") : "var(--border)"}`,
                  background: "var(--tabs-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.92rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  E-mail (para receber o código)
                </label>
                {email.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: isEmailValid ? "var(--success)" : "var(--warning)" }}>
                    {isEmailValid ? "✓ E-mail válido" : "Formato inválido"}
                  </span>
                )}
              </div>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.78rem 0.95rem",
                  borderRadius: "10px",
                  border: `1px solid ${email.length > 0 ? (isEmailValid ? "var(--success)" : "var(--border)") : "var(--border)"}`,
                  background: "var(--tabs-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.92rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Crie uma senha
                </label>
                {password.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: strengthColors[passwordScore],
                    }}
                  >
                    Força: {strengthLabels[passwordScore]}
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 2.75rem 0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.92rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{ marginTop: "0.55rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", marginBottom: "0.5rem" }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        style={{
                          height: "4px",
                          borderRadius: "4px",
                          backgroundColor:
                            passwordScore >= level ? strengthColors[passwordScore] : "var(--border)",
                          transition: "background-color 0.25s ease",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.85rem", fontSize: "0.73rem" }}>
                    <span style={{ color: hasMinLength ? "var(--success)" : "var(--text-tertiary)" }}>
                      {hasMinLength ? "✓" : "○"} Mín. 6 caracteres
                    </span>
                    <span style={{ color: hasLettersAndNumbers ? "var(--success)" : "var(--text-tertiary)" }}>
                      {hasLettersAndNumbers ? "✓" : "○"} Letras e números
                    </span>
                    <span style={{ color: hasUpperOrSpecial ? "var(--success)" : "var(--text-tertiary)" }}>
                      {hasUpperOrSpecial ? "✓" : "○"} Maiúscula ou símbolo
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Confirmar senha
                </label>
                {confirmPassword.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: passwordsMatch ? "var(--success)" : "var(--danger)" }}>
                    {passwordsMatch ? "✓ Senhas coincidem" : "✕ Senhas diferentes"}
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.78rem 2.75rem 0.78rem 0.95rem",
                    borderRadius: "10px",
                    border: `1px solid ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? "var(--success)"
                          : "var(--danger)"
                        : "var(--border)"
                    }`,
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.92rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "0.4rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px var(--primary-glow)",
                transition: "all 0.2s ease",
                opacity: isLoading ? 0.75 : 1,
              }}
            >
              {isLoading ? "Criando conta e enviando e-mail..." : "Criar Conta e Enviar Confirmação"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "0.4rem",
                paddingTop: "0.9rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.85rem",
                }}
              >
                Fazer login
              </button>
            </div>
          </form>
        )}

        {/* ==================== MODE 3: VERIFY EMAIL (ONLY 6-DIGIT INPUT, NO CODE EXPOSURE) ==================== */}
        {mode === "verify" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
            <div
              style={{
                backgroundColor: "var(--tabs-bg)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "1.15rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.35rem" }}>✉️</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                Verifique sua caixa de entrada
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                Enviamos um e-mail com o código de confirmação de 6 dígitos para{" "}
                <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
                <br />
                <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  Caso não encontre na caixa principal, verifique também a pasta de Spam ou Lixo Eletrônico.
                </span>
              </div>
            </div>

            {/* 6-Digit OTP Input Form */}
            <form onSubmit={handleVerifyCodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Código de 6 dígitos
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.5rem" }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: "100%",
                        height: "52px",
                        textAlign: "center",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        borderRadius: "10px",
                        border: `1.5px solid ${digit ? "var(--primary)" : "var(--border)"}`,
                        backgroundColor: "var(--tabs-bg)",
                        color: "var(--text-primary)",
                        outline: "none",
                        boxShadow: digit ? "0 0 12px var(--primary-glow)" : "none",
                        transition: "all 0.18s ease",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join("").length !== 6}
                style={{
                  padding: "0.85rem",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--success) 0%, #059669 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: isLoading || otpDigits.join("").length !== 6 ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 20px var(--success-glow)",
                  opacity: isLoading || otpDigits.join("").length !== 6 ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {isLoading ? "Verificando código..." : "Confirmar E-mail e Liberar Login"}
              </button>
            </form>

            {/* Resend & Back controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.8rem",
              }}
            >
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                ← Voltar ao login
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendEmail}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "var(--text-tertiary)" : "var(--primary)",
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {resendCooldown > 0
                  ? `Reenviar e-mail (${resendCooldown}s)`
                  : "Reenviar código de confirmação"}
              </button>
            </div>
          </div>
        )}

        {/* ==================== MODE 4: VERIFIED & LOGIN LIBERATED ==================== */}
        {mode === "verified" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.2rem", padding: "0.5rem 0" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.16)",
                border: "2px solid var(--success)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                boxShadow: "0 0 25px var(--success-glow)",
              }}
            >
              <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                E-mail Confirmado!
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                A conta <strong style={{ color: "var(--text-primary)" }}>{email}</strong> foi verificada com sucesso e seu login já está liberado.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <button
                type="button"
                onClick={() => {
                  if (verifiedRole === "ADMIN") {
                    router.push("/admin");
                  } else {
                    router.push("/");
                  }
                  router.refresh();
                }}
                style={{
                  padding: "0.9rem",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--success) 0%, #059669 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px var(--success-glow)",
                }}
              >
                Acessar o Sistema Agora →
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Ir para a tela de Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL PARA CADASTRAR O E-MAIL REMETENTE DO SISTEMA ==================== */}
      {showSmtpModal && (
        <div
          onClick={() => setShowSmtpModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "1.75rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Cadastrar E-mail de Envio (SMTP)
              </h3>
              <button
                type="button"
                onClick={() => setShowSmtpModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: "var(--tabs-bg)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "0.85rem",
                marginBottom: "1rem",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                lineHeight: 1.55,
              }}
            >
              Para que o ProFin envie os códigos de confirmação pelo seu Gmail:
              <br />
              1. Acesse{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}
              >
                myaccount.google.com/apppasswords
              </a>
              <br />
              2. Gere uma <strong>Senha de App</strong> de 16 letras e informe abaixo junto com seu e-mail.
            </div>

            {smtpFeedback && (
              <div
                style={{
                  background: "rgba(248, 113, 113, 0.12)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.8rem",
                }}
              >
                {smtpFeedback}
              </div>
            )}

            <form onSubmit={handleSaveSmtpAndResend} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  E-mail Remetente (ex: seuemail@gmail.com)
                </label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.9rem",
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
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Senha de App do Google (16 letras) ou Senha SMTP
                </label>
                <input
                  type="password"
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--tabs-bg)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSmtp}
                style={{
                  marginTop: "0.3rem",
                  padding: "0.8rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: isSavingSmtp ? "not-allowed" : "pointer",
                }}
              >
                {isSavingSmtp ? "Testando SMTP e enviando código..." : "Salvar E-mail e Enviar Código Agora"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
      <LoginContent />
    </Suspense>
  );
}
