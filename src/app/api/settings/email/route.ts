import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEmailSenderConfig } from "@/lib/email";

async function ensureConfigTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function upsertConfig(key: string, value: string) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SystemConfig" ("key", "value", "updatedAt")
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP;`,
    key,
    value
  );
}

export async function GET() {
  try {
    const cfg = await getEmailSenderConfig();
    const configured = Boolean((cfg.smtpUser && cfg.smtpPass) || cfg.resendApiKey);

    return NextResponse.json({
      success: true,
      configured,
      smtpUser: cfg.smtpUser,
      smtpHost: cfg.smtpHost,
      smtpPort: cfg.smtpPort,
      smtpFrom: cfg.smtpFrom,
      hasPassword: Boolean(cfg.smtpPass),
      hasResendKey: Boolean(cfg.resendApiKey),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro ao carregar configuração de e-mail: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureConfigTable();

    const body = await request.json();
    const smtpUser = (body.smtpUser || "").trim();
    const smtpPassRaw = (body.smtpPass || "").trim();
    const smtpHostInput = (body.smtpHost || "").trim();
    const smtpPortInput = body.smtpPort ? String(body.smtpPort).trim() : "";
    const smtpFromInput = (body.smtpFrom || "").trim();

    if (!smtpUser) {
      return NextResponse.json(
        { error: "Informe o e-mail remetente (ex: seuemail@gmail.com)." },
        { status: 400 }
      );
    }

    const currentCfg = await getEmailSenderConfig();
    const finalPass = smtpPassRaw || currentCfg.smtpPass;

    if (!finalPass) {
      return NextResponse.json(
        { error: "Informe a Senha de App (16 caracteres para Gmail) ou senha SMTP." },
        { status: 400 }
      );
    }

    // Remove espaços caso seja Senha de App do Gmail (ex: "xxxx xxxx xxxx xxxx")
    const normalizedPass = smtpUser.toLowerCase().endsWith("@gmail.com")
      ? finalPass.replace(/\s+/g, "")
      : finalPass;

    let defaultHost = "smtp.gmail.com";
    let defaultPort = "465";
    const domain = smtpUser.split("@")[1]?.toLowerCase() || "";
    if (domain.includes("hotmail.") || domain.includes("outlook.") || domain.includes("live.")) {
      defaultHost = "smtp-mail.outlook.com";
      defaultPort = "587";
    } else if (domain.includes("yahoo.")) {
      defaultHost = "smtp.mail.yahoo.com";
      defaultPort = "465";
    }

    const finalHost = smtpHostInput || defaultHost;
    const finalPort = smtpPortInput || defaultPort;
    const finalFrom = smtpFromInput || `ProFin Segurança <${smtpUser}>`;

    // Valida a conexão SMTP antes de salvar para garantir que os códigos serão enviados
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: finalHost,
        port: Number(finalPort),
        secure: Number(finalPort) === 465,
        auth: {
          user: smtpUser,
          pass: normalizedPass,
        },
      });

      await transporter.verify();
    } catch (verifyErr: any) {
      return NextResponse.json(
        {
          error: `Não foi possível autenticar no servidor SMTP (${finalHost}:${finalPort}). Para Gmail, utilize uma "Senha de App" de 16 dígitos gerada na sua Conta Google. Detalhe: ${verifyErr.message || String(verifyErr)}`,
        },
        { status: 400 }
      );
    }

    await upsertConfig("smtp_user", smtpUser);
    await upsertConfig("smtp_pass", normalizedPass);
    await upsertConfig("smtp_host", finalHost);
    await upsertConfig("smtp_port", finalPort);
    await upsertConfig("smtp_from", finalFrom);

    return NextResponse.json({
      success: true,
      message: "E-mail remetente configurado e verificado com sucesso! Os códigos de confirmação agora serão enviados para os e-mails cadastrados.",
    });
  } catch (error: any) {
    console.error("Erro ao salvar configuração SMTP:", error);
    return NextResponse.json(
      { error: `Erro ao salvar configuração: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
