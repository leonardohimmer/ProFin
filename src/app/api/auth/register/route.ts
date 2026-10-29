import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { ensureDatabaseInitialized, seedNewUserDefaults } from "@/lib/db-init";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const hashedPassword = await hashPassword(password);

    let user;

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "Este e-mail já está cadastrado e confirmado. Faça login para acessar." },
          { status: 409 }
        );
      }

      // Atualiza o cadastro pendente de confirmação com novo código/token
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          password: hashedPassword,
          verificationCode,
          verificationToken,
          verificationExpires,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "OPERATOR",
          emailVerified: false,
          verificationCode,
          verificationToken,
          verificationExpires,
        },
      });

      await seedNewUserDefaults(user.id);
    }

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
      requiresVerification: true,
      email: user.email,
      name: user.name,
      message: "Conta criada! Enviamos um e-mail de confirmação para liberar seu login.",
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
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: `Erro ao criar conta: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
