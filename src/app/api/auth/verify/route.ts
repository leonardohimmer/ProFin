import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptJWT } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const token = (body.token || "").trim();

    if (!token && (!email || !code)) {
      return NextResponse.json(
        { error: "Informe o código de 6 dígitos ou o token de confirmação." },
        { status: 400 }
      );
    }

    let user = null;

    if (token) {
      user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });
      if (!user && email) {
        // Caso o usuário já tenha confirmado anteriormente pelo mesmo link
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail?.emailVerified) {
          user = byEmail;
        }
      }
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Conta não encontrada ou link de verificação inválido." },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
        return NextResponse.json(
          { error: "O código de confirmação expirou. Solicite um novo envio." },
          { status: 400 }
        );
      }

      if (token) {
        if (user.verificationToken !== token) {
          return NextResponse.json(
            { error: "Token de confirmação inválido." },
            { status: 400 }
          );
        }
      } else {
        if (user.verificationCode !== code) {
          return NextResponse.json(
            { error: "Código de confirmação incorreto. Verifique os 6 dígitos enviados ao seu e-mail." },
            { status: 400 }
          );
        }
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationToken: null,
          verificationExpires: null,
        },
      });
    }

    const sessionToken = await encryptJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      verified: true,
      email: user.email,
      name: user.name,
      role: user.role,
      message: "E-mail confirmado com sucesso! Seu login foi liberado.",
    });

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
    console.error("Erro ao confirmar e-mail:", error);
    return NextResponse.json(
      { error: `Erro ao confirmar e-mail: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
