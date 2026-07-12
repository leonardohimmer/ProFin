import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        entries: {
          include: { transaction: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const accountsData = accounts.map(acc => {
      let balance = 0;
      acc.entries.forEach(entry => {
        if (entry.type === "CREDIT") {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
      });

      return {
        id: acc.id,
        name: acc.name,
        balance,
        entriesCount: acc.entries.length,
        createdAt: acc.createdAt
      };
    });

    return NextResponse.json({ success: true, accounts: accountsData });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar contas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await request.json();

    const { name, initialBalance } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "O nome da conta é obrigatório" }, { status: 400 });
    }

    // Verifica se já existe uma conta com o mesmo nome para o usuário
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        name: {
          equals: name.trim(),
          mode: "insensitive"
        }
      }
    });

    if (existingAccount) {
      return NextResponse.json({ success: false, error: "Já existe uma conta com este nome" }, { status: 400 });
    }

    const newAccount = await prisma.account.create({
      data: {
        userId,
        name: name.trim()
      }
    });

    // Se foi fornecido saldo inicial diferente de zero, cria transação de ajuste
    const balanceCents = Math.round(Number(initialBalance || 0));
    if (balanceCents !== 0) {
      const isPositive = balanceCents > 0;
      await prisma.transaction.create({
        data: {
          description: `Saldo Inicial - ${newAccount.name}`,
          categoryName: "Outros",
          paymentType: "A VISTA",
          paymentMethod: "INDEFINIDO",
          isPaid: true,
          status: "COMPLETED",
          entries: {
            create: {
              accountId: newAccount.id,
              amount: Math.abs(balanceCents),
              type: isPositive ? "CREDIT" : "DEBIT"
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true, account: { ...newAccount, balance: balanceCents } });
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json({ success: false, error: "Erro ao criar conta" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await request.json();

    const { id, name, newBalance } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID da conta é obrigatório" }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { id, userId },
      include: { entries: true }
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Conta não encontrada" }, { status: 404 });
    }

    // Atualiza o nome da conta se fornecido e se não for duplicado
    if (name && name.trim() !== "" && name.trim() !== account.name) {
      const existing = await prisma.account.findFirst({
        where: {
          userId,
          name: { equals: name.trim(), mode: "insensitive" },
          NOT: { id }
        }
      });

      if (existing) {
        return NextResponse.json({ success: false, error: "Já existe outra conta com este nome" }, { status: 400 });
      }

      await prisma.account.update({
        where: { id },
        data: { name: name.trim() }
      });
    }

    // Se foi solicitado ajuste de saldo, calcula o saldo atual e aplica a diferença no ledger
    if (newBalance !== undefined && newBalance !== null) {
      let currentBalance = 0;
      account.entries.forEach(entry => {
        if (entry.type === "CREDIT") {
          currentBalance += entry.amount;
        } else {
          currentBalance -= entry.amount;
        }
      });

      const targetBalance = Math.round(Number(newBalance));
      const diff = targetBalance - currentBalance;

      if (diff !== 0) {
        await prisma.transaction.create({
          data: {
            description: `Ajuste de Saldo - ${name || account.name}`,
            categoryName: "Outros",
            paymentType: "A VISTA",
            paymentMethod: "INDEFINIDO",
            isPaid: true,
            status: "COMPLETED",
            entries: {
              create: {
                accountId: id,
                amount: Math.abs(diff),
                type: diff > 0 ? "CREDIT" : "DEBIT"
              }
            }
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Conta atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json({ success: false, error: "Erro ao atualizar conta" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID da conta é obrigatório" }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Conta não encontrada ou não pertence ao usuário" }, { status: 404 });
    }

    // 1. Apaga as entradas do livro-razão (LedgerEntry) desta conta
    await prisma.ledgerEntry.deleteMany({
      where: { accountId: id }
    });

    // 2. Remove transações que ficaram sem nenhuma entrada (órfãs / apenas ajustes)
    await prisma.transaction.deleteMany({
      where: {
        entries: {
          none: {}
        }
      }
    });

    // 3. Remove a conta do banco de dados
    await prisma.account.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Conta excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json({ success: false, error: "Erro ao excluir conta" }, { status: 500 });
  }
}
