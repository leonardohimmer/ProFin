import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCents } from "@/lib/math";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { description, amount, type, accountId, destinationAccountId, cardId, categoryId, category, contact, paymentType, paymentMethod, date, isPaid, installmentCount } = await request.json();

    if (!description || !amount || !type) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const amountInCents = toCents(amount);
    const transactionDate = date ? new Date(date) : new Date();

    // Determina o número de parcelas
    let totalInstallments = 1;
    if (installmentCount && typeof installmentCount === "number" && installmentCount > 1) {
      totalInstallments = installmentCount;
    } else if (paymentType && typeof paymentType === "string" && /\d+X/i.test(paymentType)) {
      const match = paymentType.match(/(\d+)X/i);
      if (match) {
        totalInstallments = parseInt(match[1], 10);
      }
    }

    const perInstallmentCents = totalInstallments > 1 ? Math.round(amountInCents / totalInstallments) : amountInCents;

    const result = await prisma.$transaction(async (tx) => {
      let targetAccountId = accountId;

      if (!targetAccountId) {
        const firstAccount = await tx.account.findFirst({
          where: { userId: userId }
        });
        if (!firstAccount) {
          throw new Error("Conta não encontrada");
        }
        targetAccountId = firstAccount.id;
      }

      // Se for despesa no cartão de crédito, atualiza a fatura atual do cartão com a 1ª parcela (ou valor total se à vista)
      if (cardId) {
        const cardExists = await tx.card.findUnique({ where: { id: cardId } });
        if (cardExists) {
          await tx.card.update({
            where: { id: cardId },
            data: { currentInvoice: { increment: perInstallmentCents } }
          });
        }
      } else if (type === "CREDIT_CARD" && paymentMethod) {
        const matchingCard = await tx.card.findFirst({
          where: { userId: userId, name: paymentMethod }
        });
        if (matchingCard) {
          await tx.card.update({
            where: { id: matchingCard.id },
            data: { currentInvoice: { increment: perInstallmentCents } }
          });
        }
      }

      if (type === "TRANSFER") {
        if (!destinationAccountId) {
          throw new Error("Conta de destino é necessária para transferência");
        }

        const transaction = await tx.transaction.create({
          data: {
            description,
            categoryId: categoryId || null,
            categoryName: category || "Transferência",
            contact,
            paymentType: "A VISTA",
            paymentMethod: "TRANSFERENCIA",
            isPaid: true,
            status: "COMPLETED",
            createdAt: transactionDate,
            entries: {
              create: [
                {
                  accountId: targetAccountId,
                  amount: amountInCents,
                  type: "DEBIT", // Debita da conta de origem
                  createdAt: transactionDate
                },
                {
                  accountId: destinationAccountId,
                  amount: amountInCents,
                  type: "CREDIT", // Credita na conta de destino
                  createdAt: transactionDate
                }
              ]
            }
          }
        });
        return transaction;
      } else {
        // Se for parcelado, gera N transações sequenciais, uma para cada mês seguinte
        if (totalInstallments > 1) {
          function addMonths(baseDate: Date, monthsToAdd: number): Date {
            const d = new Date(baseDate);
            const targetMonth = d.getMonth() + monthsToAdd;
            d.setMonth(targetMonth);
            if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
              d.setDate(0);
            }
            return d;
          }

          let firstTransaction = null;
          for (let i = 0; i < totalInstallments; i++) {
            const instDate = addMonths(transactionDate, i);
            const instDescription = `${description} (${i + 1}/${totalInstallments})`;

            const transaction = await tx.transaction.create({
              data: {
                description: instDescription,
                categoryId: categoryId || null,
                categoryName: category || "OUTROS",
                contact,
                paymentType: `${i + 1}/${totalInstallments}`,
                paymentMethod: paymentMethod || (type === "CREDIT_CARD" ? "CARTAO" : "INDEFINIDO"),
                isPaid: i === 0 ? (typeof isPaid === "boolean" ? isPaid : true) : false, // 1ª parcela paga, seguintes no vencimento
                status: "COMPLETED",
                createdAt: instDate,
                entries: {
                  create: {
                    accountId: targetAccountId,
                    amount: perInstallmentCents,
                    type: type === "CREDIT" ? "CREDIT" : "DEBIT",
                    createdAt: instDate
                  }
                }
              }
            });

            if (i === 0) firstTransaction = transaction;
          }
          return firstTransaction;
        } else {
          // Transação Normal À Vista
          const transaction = await tx.transaction.create({
            data: {
              description,
              categoryId: categoryId || null,
              categoryName: category || "OUTROS",
              contact,
              paymentType: paymentType || "A VISTA",
              paymentMethod: paymentMethod || (type === "CREDIT_CARD" ? "CARTAO" : "INDEFINIDO"),
              isPaid: typeof isPaid === "boolean" ? isPaid : true,
              status: "COMPLETED",
              createdAt: transactionDate,
              entries: {
                create: {
                  accountId: targetAccountId,
                  amount: amountInCents,
                  type: type === "CREDIT" ? "CREDIT" : "DEBIT",
                  createdAt: transactionDate
                }
              }
            }
          });
          return transaction;
        }
      }
    });

    return NextResponse.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao salvar transação" }, { status: 500 });
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
