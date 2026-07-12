import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptJWT } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    let userId = "test-user-id"; // Fallback for dev

    if (sessionCookie?.value) {
      try {
        const payload = await decryptJWT(sessionCookie.value);
        if (payload?.sub) {
          userId = payload.sub;
        }
      } catch (err) {
        console.error("Erro ao decodificar cookie de sessão:", err);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
