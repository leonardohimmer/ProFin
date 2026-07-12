import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, encryptJWT } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export async function POST(request: Request) {
  try {
    // Garante que as tabelas e o usuário padrão existam no banco antes de consultar
    await ensureDatabaseInitialized();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
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

    // Gera o token JWT
    const sessionToken = await encryptJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Configura a resposta com o cookie seguro
    const response = NextResponse.json({ success: true, role: user.role });
    
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
