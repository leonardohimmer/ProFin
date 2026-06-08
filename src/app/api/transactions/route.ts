import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCents } from "@/lib/math";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { description, amount, type, categoryId, category, contact, paymentType, paymentMethod } = await request.json();

    if (!description || !amount || !type) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: userId }
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const amountInCents = toCents(amount);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          description,
          categoryId: categoryId || null,
          categoryName: category || "OUTROS",
          contact,
          paymentType: paymentType || "A VISTA",
          paymentMethod: paymentMethod || "INDEFINIDO",
          status: "COMPLETED",
          entries: {
            create: {
              accountId: account.id,
              amount: amountInCents,
              type: type
            }
          }
        }
      });
      return transaction;
    });

    return NextResponse.json({ success: true, transaction: result });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ error: "Erro interno ao salvar transação" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const entries = await prisma.ledgerEntry.findMany({
      where: { account: { userId: userId } },
      include: { 
        transaction: {
          include: { category: true }
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar extrato" }, { status: 500 });
  }
}
