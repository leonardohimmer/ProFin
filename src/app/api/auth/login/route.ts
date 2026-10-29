import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { comparePassword, encryptJWT } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/db-init";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Garante que as tabelas e o usuário padrão existam no banco antes de consultar
    await ensureDatabaseInitialized();

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Mensagem genérica para prevenir enumeração de usuários (Anti-Força Bruta)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Verifica a senha
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Bloqueia login caso o e-mail ainda não tenha sido confirmado
    if (user.emailVerified === false) {
      const verificationCode =
        user.verificationCode || Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = user.verificationToken || crypto.randomUUID();
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

      return NextResponse.json(
        {
          error: "Confirme seu e-mail antes de acessar. Enviamos um código de confirmação para sua caixa de entrada.",
          requiresVerification: true,
          email: user.email,
          name: user.name,
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
        },
        { status: 403 }
      );
    }

    // Gera o token JWT
    const sessionToken = await encryptJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Configura a resposta com o cookie seguro
    const response = NextResponse.json({ success: true, role: user.role, name: user.name });
    
    response.cookies.set({
      name: "session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 horas
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: `Erro no servidor: ${error.message || String(error)}` }, { status: 500 });
  }
}
