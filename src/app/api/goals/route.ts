import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar metas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await request.json();

    const { name, targetAmount, currentAmount, deadline } = body;

    if (!name || targetAmount === undefined) {
      return NextResponse.json({ success: false, error: "Nome e valor alvo são obrigatórios" }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        userId,
        name,
        targetAmount: Math.round(Number(targetAmount)),
        currentAmount: Math.round(Number(currentAmount || 0)),
        deadline: deadline ? new Date(deadline) : null
      }
    });

    return NextResponse.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json({ success: false, error: "Erro ao criar meta" }, { status: 500 });
  }
}

// Para depósitos ou resgates de metas
export async function PUT(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await request.json();

    const { goalId, amount, type, accountId } = body; // type: 'DEPOSIT' | 'WITHDRAW'

    if (!goalId || !amount || !type) {
      return NextResponse.json({ success: false, error: "Dados incompletos para a transação" }, { status: 400 });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId }
    });

    if (!goal) {
      return NextResponse.json({ success: false, error: "Meta não encontrada" }, { status: 404 });
    }

    const changeAmount = Math.round(Number(amount));
    let newAmount = goal.currentAmount;

    if (type === "DEPOSIT") {
      newAmount += changeAmount;
    } else if (type === "WITHDRAW") {
      if (newAmount < changeAmount) {
        return NextResponse.json({ success: false, error: "Saldo insuficiente na meta para resgate" }, { status: 400 });
      }
      newAmount -= changeAmount;
    } else {
      return NextResponse.json({ success: false, error: "Tipo inválido" }, { status: 400 });
    }

    // Se uma conta de origem foi selecionada, registra a movimentação no ledger para atualizar o saldo
    if (accountId) {
      // Cria a transação de movimentação de meta
      const category = await prisma.category.findFirst({
        where: { name: "Metas", userId }
      }) || await prisma.category.create({
        data: { name: "Metas", userId }
      });

      await prisma.transaction.create({
        data: {
          description: type === "DEPOSIT" ? `Reserva para: ${goal.name}` : `Resgate de: ${goal.name}`,
          categoryName: "Metas",
          categoryId: category.id,
          paymentType: "A VISTA",
          paymentMethod: "INDEFINIDO",
          isPaid: true,
          status: "COMPLETED",
          entries: {
            create: {
              accountId,
              amount: changeAmount,
              type: type === "DEPOSIT" ? "DEBIT" : "CREDIT" // Se deposita na meta, debita do banco. Se resgata, credita no banco.
            }
          }
        }
      });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { currentAmount: newAmount }
    });

    return NextResponse.json({ success: true, goal: updatedGoal });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    return NextResponse.json({ success: false, error: "Erro ao atualizar meta" }, { status: 500 });
  }
}
