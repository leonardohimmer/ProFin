export interface SendConfirmationEmailParams {
  to: string;
  name: string;
  verificationCode: string;
  verificationToken: string;
  origin: string;
}

export interface SendConfirmationEmailResult {
  sent: boolean;
  provider: "smtp" | "resend" | "ethereal" | "virtual";
  previewUrl?: string;
  verificationUrl: string;
  subject: string;
  from: string;
  to: string;
  htmlContent: string;
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
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ProFin</div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Premium Finance</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#f3f3f6;">Olá, ${firstName}! 👋</h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#9ea2b0;">
                Sua conta no <strong style="color:#f3f3f6;">ProFin</strong> foi criada com sucesso! Para liberar seu login e começar a gerenciar suas finanças com segurança, confirme seu endereço de e-mail utilizando o código abaixo:
              </p>

              <!-- 6-digit code box -->
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

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 6px 20px rgba(139,92,246,0.4);">
                  Confirmar E-mail e Liberar Login
                </a>
              </div>

              <p style="margin:0;font-size:13px;line-height:1.5;color:#626575;text-align:center;">
                Se você não solicitou a criação desta conta, pode ignorar este e-mail com segurança.
              </p>
            </td>
          </tr>
          <!-- Footer -->
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
  const from = process.env.SMTP_FROM || "ProFin Segurança <no-reply@profin.app>";
  const htmlContent = buildConfirmationEmailHtml({
    name,
    verificationCode,
    verificationUrl,
  });

  // 1. Se houver RESEND_API_KEY configurada, envia via Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
          verificationUrl,
          subject,
          from,
          to,
          htmlContent,
        };
      }
    } catch (err) {
      console.warn("Aviso ao enviar via Resend API:", err);
    }
  }

  // 2. Se houver SMTP_HOST e SMTP_USER configurados no .env, envia via SMTP real
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });

      return {
        sent: true,
        provider: "smtp",
        verificationUrl,
        subject,
        from,
        to,
        htmlContent,
      };
    } catch (err) {
      console.warn("Aviso ao enviar via SMTP configurado:", err);
    }
  }

  // 3. Tenta enviar via conta de teste Ethereal do Nodemailer (com timeout rápido de 4s)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer");
    const etherealPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      return previewUrl ? String(previewUrl) : undefined;
    })();

    const timeoutPromise = new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), 4000)
    );

    const previewUrl = await Promise.race([etherealPromise, timeoutPromise]);

    if (previewUrl) {
      console.log(`✉️ E-mail de confirmação enviado! Preview URL: ${previewUrl}`);
      return {
        sent: true,
        provider: "ethereal",
        previewUrl,
        verificationUrl,
        subject,
        from,
        to,
        htmlContent,
      };
    }
  } catch (err) {
    // Fallback silencioso para caixa de entrada virtual interativa
  }

  console.log(`✉️ E-mail de confirmação gerado para ${to} | Código: ${verificationCode} | Link: ${verificationUrl}`);

  return {
    sent: true,
    provider: "virtual",
    verificationUrl,
    subject,
    from,
    to,
    htmlContent,
  };
}
