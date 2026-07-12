import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    });

    // Calcula estatísticas consolidadas
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    const allocation: Record<string, number> = {};

    investments.forEach((inv) => {
      totalPurchaseValue += inv.purchaseValue;
      totalCurrentValue += inv.currentValue;

      // Soma por tipo
      const type = inv.type;
      allocation[type] = (allocation[type] || 0) + inv.currentValue;
    });

    const totalGain = totalCurrentValue - totalPurchaseValue;
    const gainPercent = totalPurchaseValue > 0 ? (totalGain / totalPurchaseValue) * 100 : 0;

    return NextResponse.json({
      success: true,
      investments,
      stats: {
        totalPurchaseValue,
        totalCurrentValue,
        totalGain,
        gainPercent,
        allocation
      }
    });
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar investimentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await request.json();

    const { name, type, purchaseValue, currentValue, quantity, accountId } = body;

    if (!name || !type || purchaseValue === undefined) {
      return NextResponse.json({ success: false, error: "Dados incompletos para investimento" }, { status: 400 });
    }

    const pVal = Math.round(Number(purchaseValue));
    const cVal = Math.round(Number(currentValue !== undefined ? currentValue : purchaseValue));

    const newInv = await prisma.investment.create({
      data: {
        userId,
        name,
        type,
        purchaseValue: pVal,
        currentValue: cVal,
        quantity: Number(quantity || 1.0)
      }
    });

    // Se uma conta foi informada, debita o valor de compra dela para simular a aquisição do ativo
    if (accountId) {
      const category = await prisma.category.findFirst({
        where: { name: "Investimentos", userId }
      }) || await prisma.category.create({
        data: { name: "Investimentos", userId }
      });

      await prisma.transaction.create({
        data: {
          description: `Compra de ativo: ${name}`,
          categoryName: "Investimentos",
          categoryId: category.id,
          paymentType: "A VISTA",
          paymentMethod: "INDEFINIDO",
          isPaid: true,
          status: "COMPLETED",
          entries: {
            create: {
              accountId,
              amount: pVal,
              type: "DEBIT" // Debita da conta corrente para investir
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true, investment: newInv });
  } catch (error) {
    console.error("Erro ao criar investimento:", error);
    return NextResponse.json({ success: false, error: "Erro ao criar investimento" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const accountId = searchParams.get("accountId"); // Opcional: Conta para creditar o resgate

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 });
    }

    const inv = await prisma.investment.findFirst({
      where: { id, userId }
    });

    if (!inv) {
      return NextResponse.json({ success: false, error: "Investimento não encontrado" }, { status: 404 });
    }

    // Se uma conta de resgate foi selecionada, credita o saldo atual do investimento nela
    if (accountId) {
      const category = await prisma.category.findFirst({
        where: { name: "Investimentos", userId }
      }) || await prisma.category.create({
        data: { name: "Investimentos", userId }
      });

      await prisma.transaction.create({
        data: {
          description: `Venda/Resgate de ativo: ${inv.name}`,
          categoryName: "Investimentos",
          categoryId: category.id,
          paymentType: "A VISTA",
          paymentMethod: "INDEFINIDO",
          isPaid: true,
          status: "COMPLETED",
          entries: {
            create: {
              accountId,
              amount: inv.currentValue,
              type: "CREDIT" // Credita na conta corrente o valor de resgate
            }
          }
        }
      });
    }

    await prisma.investment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Investimento removido com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir investimento:", error);
    return NextResponse.json({ success: false, error: "Erro ao excluir investimento" }, { status: 500 });
  }
}
