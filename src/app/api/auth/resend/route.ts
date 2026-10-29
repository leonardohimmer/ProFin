import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { ensureDatabaseInitialized } from "@/lib/db-init";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Informe o endereço de e-mail." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nenhuma conta encontrada para este e-mail." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Este e-mail já foi confirmado! Seu login já está liberado.",
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationToken,
        verificationExpires,
      },
    });

    const origin = new URL(request.url).origin;
    const emailResult = await sendConfirmationEmail({
      to: user.email,
      name: user.name,
      verificationCode,
      verificationToken,
      origin,
    });

    return NextResponse.json({
      success: true,
      message: "Novo e-mail de confirmação enviado com sucesso!",
      emailDispatch: {
        provider: emailResult.provider,
        previewUrl: emailResult.previewUrl,
        subject: emailResult.subject,
        from: emailResult.from,
        to: emailResult.to,
        verificationUrl: emailResult.verificationUrl,
        htmlContent: emailResult.htmlContent,
        codeHint: emailResult.provider !== "smtp" && emailResult.provider !== "resend" ? verificationCode : undefined,
      },
    });
  } catch (error: any) {
    console.error("Erro ao reenviar confirmação:", error);
    return NextResponse.json(
      { error: `Erro ao reenviar e-mail: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
