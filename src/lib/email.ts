import prisma from "@/lib/prisma";

export interface SendConfirmationEmailParams {
  to: string;
  name: string;
  verificationCode: string;
  verificationToken: string;
  origin: string;
}

export interface SendConfirmationEmailResult {
  sent: boolean;
  provider?: "smtp" | "resend";
  error?: string;
}

export interface EmailSenderConfig {
  smtpUser: string;
  smtpPass: string;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  resendApiKey: string;
}

export async function getEmailSenderConfig(): Promise<EmailSenderConfig> {
  const configMap: Record<string, string> = {};

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemConfig" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const rows = await prisma.$queryRawUnsafe<Array<{ key: string; value: string }>>(
      `SELECT "key", "value" FROM "SystemConfig";`
    );

    for (const row of rows) {
      configMap[row.key] = row.value;
    }
  } catch (err) {
    // Fallback para variáveis de ambiente caso a tabela ainda não exista
  }

  const smtpUser = (configMap["smtp_user"] || process.env.SMTP_USER || "").trim();
  // Remove espaços de senhas de app do Google (ex: "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const rawPass = (configMap["smtp_pass"] || process.env.SMTP_PASS || "").trim();
  const smtpPass = smtpUser.toLowerCase().endsWith("@gmail.com")
    ? rawPass.replace(/\s+/g, "")
    : rawPass;

  let defaultHost = "smtp.gmail.com";
  let defaultPort = 465;

  const domain = smtpUser.split("@")[1]?.toLowerCase() || "";
  if (domain.includes("hotmail.") || domain.includes("outlook.") || domain.includes("live.")) {
    defaultHost = "smtp-mail.outlook.com";
    defaultPort = 587;
  } else if (domain.includes("yahoo.")) {
    defaultHost = "smtp.mail.yahoo.com";
    defaultPort = 465;
  }

  const smtpHost = (configMap["smtp_host"] || process.env.SMTP_HOST || defaultHost).trim();
  const smtpPort = Number(configMap["smtp_port"] || process.env.SMTP_PORT || defaultPort);
  const smtpFrom = (
    configMap["smtp_from"] ||
    process.env.SMTP_FROM ||
    (smtpUser ? `ProFin Segurança <${smtpUser}>` : "ProFin Segurança <no-reply@profin.app>")
  ).trim();
  const resendApiKey = (configMap["resend_api_key"] || process.env.RESEND_API_KEY || "").trim();

  return {
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    smtpFrom,
    resendApiKey,
  };
}

export function buildConfirmationEmailHtml({
  name,
  verificationCode,
  verificationUrl,
}: {
  name: string;
  verificationCode: string;
  verificationUrl: string;
}): string {
  const firstName = name.trim().split(" ")[0] || "Usuário";
  const digits = verificationCode.split("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirme seu e-mail - ProFin</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f12;font-family:'Outfit','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f3f3f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f12;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#18181f;border:1px solid #262633;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ProFin</div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Premium Finance</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#f3f3f6;">Olá, ${firstName}! 👋</h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#9ea2b0;">
                Sua conta no <strong style="color:#f3f3f6;">ProFin</strong> foi criada! Para liberar seu login e começar a gerenciar suas finanças, informe o código de 6 dígitos abaixo na tela de confirmação:
              </p>

              <div style="background-color:#121218;border:1px solid #2e2e3d;border-radius:14px;padding:22px 16px;text-align:center;margin-bottom:24px;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#9ea2b0;margin-bottom:12px;">
                  Código de Confirmação
                </div>
                <div style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:800;color:#a78bfa;font-family:monospace;">
                  ${digits.join(" ")}
                </div>
                <div style="font-size:12px;color:#626575;margin-top:10px;">
                  Válido por 24 horas
                </div>
              </div>

              <div style="text-align:center;margin-bottom:24px;">
                <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 6px 20px rgba(139,92,246,0.4);">
                  Confirmar E-mail Automaticamente
                </a>
              </div>

              <p style="margin:0;font-size:13px;line-height:1.5;color:#626575;text-align:center;">
                Se você não solicitou a criação desta conta, ignore este e-mail com segurança.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #22222a;padding:18px 32px;text-align:center;background-color:#131317;">
              <p style="margin:0;font-size:12px;color:#626575;">
                © ${new Date().getFullYear()} ProFin Premium Finance • Segurança e Controle Financeiro
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendConfirmationEmail({
  to,
  name,
  verificationCode,
  verificationToken,
  origin,
}: SendConfirmationEmailParams): Promise<SendConfirmationEmailResult> {
  const verificationUrl = `${origin}/login?verify=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(to)}`;
  const subject = `Código ${verificationCode} - Confirme sua conta no ProFin`;
  const htmlContent = buildConfirmationEmailHtml({
    name,
    verificationCode,
    verificationUrl,
  });

  const cfg = await getEmailSenderConfig();

  // 1. Envio via SMTP (Gmail, Outlook, Yahoo ou servidor próprio)
  if (cfg.smtpUser && cfg.smtpPass) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        auth: {
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
        },
      });

      await transporter.sendMail({
        from: cfg.smtpFrom,
        to,
        subject,
        html: htmlContent,
      });

      return {
        sent: true,
        provider: "smtp",
      };
    } catch (err: any) {
      console.error("Erro ao enviar e-mail via SMTP:", err);
      return {
        sent: false,
        error: `Falha ao enviar e-mail via SMTP (${cfg.smtpHost}): ${err.message || String(err)}`,
      };
    }
  }

  // 2. Envio via Resend API (caso configurado)
  if (cfg.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "ProFin <onboarding@resend.dev>",
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        return {
          sent: true,
          provider: "resend",
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          sent: false,
          error: `Erro na API Resend: ${errData.message || res.statusText}`,
        };
      }
    } catch (err: any) {
      return {
        sent: false,
        error: `Erro ao conectar com Resend: ${err.message || String(err)}`,
      };
    }
  }

  return {
    sent: false,
    error:
      "O e-mail remetente do sistema ainda não foi configurado. Cadastre o e-mail e Senha de App em Configurações > Envio de E-mail (ou nas variáveis SMTP_USER e SMTP_PASS).",
  };
}
