import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function createTablesIfNotExist() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'OPERATOR',
      "password" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "parentId" TEXT,
      "userId" TEXT NOT NULL,
      CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "idempotencyKey" TEXT,
      "description" TEXT NOT NULL,
      "categoryId" TEXT,
      "categoryName" TEXT NOT NULL DEFAULT 'OUTROS',
      "contact" TEXT,
      "paymentType" TEXT NOT NULL DEFAULT 'A VISTA',
      "paymentMethod" TEXT NOT NULL DEFAULT 'INDEFINIDO',
      "isPaid" BOOLEAN NOT NULL DEFAULT true,
      "status" TEXT NOT NULL DEFAULT 'COMPLETED',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "LedgerEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "transactionId" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Card" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "cardNumber" TEXT NOT NULL,
      "expirationDate" TEXT NOT NULL,
      "holderName" TEXT NOT NULL,
      "limit" INTEGER NOT NULL,
      "currentInvoice" INTEGER NOT NULL,
      "dueDate" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Budget" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "categoryName" TEXT NOT NULL,
      "targetAmount" INTEGER NOT NULL,
      "spentAmount" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Goal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "targetAmount" INTEGER NOT NULL,
      "currentAmount" INTEGER NOT NULL,
      "deadline" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Investment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "purchaseValue" INTEGER NOT NULL,
      "currentValue" INTEGER NOT NULL,
      "quantity" REAL NOT NULL DEFAULT 1.0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
    `CREATE INDEX IF NOT EXISTS "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");`,
    `CREATE INDEX IF NOT EXISTS "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_userId_parentId_key" ON "Category"("name", "userId", "parentId");`
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}

export async function GET() {
  try {
    console.log("Sincronizando tabelas do banco de dados...");
    await createTablesIfNotExist();
    console.log("Banco de dados sincronizado via SQL!");

    const defaultUserId = "test-user-id";
    const defaultUserEmail = "joao@gestao.com";

    // 1. Cria ou atualiza o usuário Alexandre Silva
    let alex = await prisma.user.findUnique({
      where: { id: defaultUserId }
    });

    const hashedPassword = await hashPassword("joao123");

    if (!alex) {
      alex = await prisma.user.create({
        data: {
          id: defaultUserId,
          name: "Alexandre Silva",
          email: defaultUserEmail,
          password: hashedPassword,
          role: "OPERATOR"
        }
      });
    } else {
      alex = await prisma.user.update({
        where: { id: defaultUserId },
        data: {
          name: "Alexandre Silva",
          email: defaultUserEmail,
          password: hashedPassword
        }
      });
    }

    // 2. Limpa dados antigos
    await prisma.ledgerEntry.deleteMany({
      where: { account: { userId: defaultUserId } }
    });
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { category: { userId: defaultUserId } },
          { entries: { some: { account: { userId: defaultUserId } } } }
        ]
      }
    });
    await prisma.account.deleteMany({
      where: { userId: defaultUserId }
    });
    await prisma.category.deleteMany({
      where: { userId: defaultUserId }
    });
    await prisma.card.deleteMany({
      where: { userId: defaultUserId }
    });
    await prisma.budget.deleteMany({
      where: { userId: defaultUserId }
    });
    await prisma.goal.deleteMany({
      where: { userId: defaultUserId }
    });
    await prisma.investment.deleteMany({
      where: { userId: defaultUserId }
    });

    // 3. Cria as contas
    const accountsData = [
      { name: "Caixa" },
      { name: "PicPay" },
      { name: "Santander" },
      { name: "Sodexo" },
      { name: "SX" }
    ];

    const accountsMap: Record<string, any> = {};

    for (const acc of accountsData) {
      const account = await prisma.account.create({
        data: {
          name: acc.name,
          userId: defaultUserId
        }
      });
      accountsMap[acc.name] = account;
    }

    // 4. Cria as categorias padrão de Alexandre Silva
    const categoriesList = [
      { name: "Mercado" },
      { name: "Moradia" },
      { name: "Pagamentos" },
      { name: "Pet" },
      { name: "PIX" },
      { name: "Presentes" },
      { name: "Roupa" },
      { name: "Saúde" },
      { name: "Vestuário" },
      { name: "Água" },
      { name: "Carro" },
      { name: "Alimentação" },
      { name: "Lazer" },
      { name: "Transporte" }
    ];

    const categoriesMap: Record<string, any> = {};

    for (const cat of categoriesList) {
      const category = await prisma.category.create({
        data: {
          name: cat.name,
          userId: defaultUserId
        }
      });
      categoriesMap[cat.name] = category;
    }

    // 5. Cria cartões de crédito (Conforme Imagem 1)
    await prisma.card.createMany({
      data: [
        {
          userId: defaultUserId,
          name: "Premium Visa",
          type: "CREDIT",
          cardNumber: "•••• •••• •••• 4829",
          expirationDate: "08/28",
          holderName: "ALEX SILVA",
          limit: 550000,           // R$ 5.500,00 em centavos
          currentInvoice: 245000,  // R$ 2.450,00 em centavos
          dueDate: "15 Out"
        },
        {
          userId: defaultUserId,
          name: "Business Elite",
          type: "CREDIT",
          cardNumber: "•••• •••• •••• 9912",
          expirationDate: "11/26",
          holderName: "ALEX SILVA",
          limit: 1100000,          // R$ 11.000,00 em centavos
          currentInvoice: 892045,  // R$ 8.920,45 em centavos
          dueDate: "05 Out"
        }
      ]
    });

    // 6. Cria planejamentos/budgets (Conforme Imagem 2)
    await prisma.budget.createMany({
      data: [
        {
          userId: defaultUserId,
          categoryName: "Alimentação",
          targetAmount: 150000, // R$ 1.500,00 em centavos
          spentAmount: 132000   // R$ 1.320,00 em centavos
        },
        {
          userId: defaultUserId,
          categoryName: "Lazer",
          targetAmount: 80000,  // R$ 800,00 em centavos
          spentAmount: 33600    // R$ 336,00 em centavos
        },
        {
          userId: defaultUserId,
          categoryName: "Transporte",
          targetAmount: 120000, // R$ 1.200,00 em centavos
          spentAmount: 126000   // R$ 1.260,00 em centavos (Estourado 105%)
        },
        {
          userId: defaultUserId,
          categoryName: "Moradia",
          targetAmount: 300000, // R$ 3.000,00 em centavos
          spentAmount: 285000   // R$ 2.850,00 em centavos
        }
      ]
    });

    // 6.5 Cria metas/goals (Mobills-style)
    await prisma.goal.createMany({
      data: [
        {
          userId: defaultUserId,
          name: "Reserva de Emergência",
          targetAmount: 1000000, // R$ 10.000,00
          currentAmount: 450000, // R$ 4.500,00
        },
        {
          userId: defaultUserId,
          name: "Viagem de Férias",
          targetAmount: 600000, // R$ 6.000,00
          currentAmount: 120000, // R$ 1.200,00
        }
      ]
    });

    // 6.6 Cria investimentos (Mobills-style)
    await prisma.investment.createMany({
      data: [
        {
          userId: defaultUserId,
          name: "Tesouro Selic 2029",
          type: "RENDA_FIXA",
          purchaseValue: 300000, // R$ 3.000,00
          currentValue: 312050,  // R$ 3.120,50
          quantity: 1.0
        },
        {
          userId: defaultUserId,
          name: "FII MXRF11",
          type: "FII",
          purchaseValue: 150000, // R$ 1.500,00
          currentValue: 158000,  // R$ 1.580,00
          quantity: 150.0
        },
        {
          userId: defaultUserId,
          name: "Bitcoin",
          type: "CRIPTOMOEDAS",
          purchaseValue: 200000, // R$ 2.000,00
          currentValue: 245000,  // R$ 2.450,00
          quantity: 0.0085
        }
      ]
    });

    // 7. Cria transações de exemplo para o cartão (Conforme Imagem 1)
    // Amazon.com.br (Premium Visa, Hoje, 14:20): -R$ 159,90 (ELETRÔNICOS)
    // Starbucks Coffee (Premium Visa, Ontem, 09:15): -R$ 24,50 (ALIMENTAÇÃO)
    // Netflix Mensalidade (Business Elite, 28 Set): -R$ 55,90 (ENTRETENIMENTO)

    const amazonTx = await prisma.transaction.create({
      data: {
        description: "Amazon.com.br",
        categoryName: "Eletrônicos",
        paymentType: "A VISTA",
        paymentMethod: "Premium Visa", // Identifica o cartão
        isPaid: true,
        status: "COMPLETED",
        createdAt: new Date(), // Hoje
        entries: {
          create: {
            accountId: accountsMap["SX"].id, // Associa ao cartão
            amount: 15990,
            type: "DEBIT"
          }
        }
      }
    });

    // Starbucks (Ontem)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 15, 0);

    const starbucksTx = await prisma.transaction.create({
      data: {
        description: "Starbucks Coffee",
        categoryName: "Alimentação",
        paymentType: "A VISTA",
        paymentMethod: "Premium Visa",
        isPaid: true,
        status: "COMPLETED",
        createdAt: yesterday,
        entries: {
          create: {
            accountId: accountsMap["SX"].id,
            amount: 2450,
            type: "DEBIT"
          }
        }
      }
    });

    // Netflix (28 Set)
    const netflixDate = new Date();
    netflixDate.setMonth(8); // Setembro (0-indexed, so 8 is September)
    netflixDate.setDate(28);
    netflixDate.setHours(12, 0, 0);

    const netflixTx = await prisma.transaction.create({
      data: {
        description: "Netflix Mensalidade",
        categoryName: "Entretenimento",
        paymentType: "A VISTA",
        paymentMethod: "Business Elite",
        isPaid: true,
        status: "COMPLETED",
        createdAt: netflixDate,
        entries: {
          create: {
            accountId: accountsMap["SX"].id,
            amount: 5590,
            type: "DEBIT"
          }
        }
      }
    });

    // 8. Lançamentos de saldo Caixa e Santander
    await prisma.transaction.create({
      data: {
        description: "Ajuste de Saldo Inicial Caixa",
        categoryName: "Outros",
        paymentType: "A VISTA",
        paymentMethod: "INDEFINIDO",
        isPaid: true,
        status: "COMPLETED",
        entries: {
          create: {
            accountId: accountsMap["Caixa"].id,
            amount: 100,
            type: "DEBIT"
          }
        }
      }
    });

    await prisma.transaction.create({
      data: {
        description: "Ajuste de Saldo Inicial Santander",
        categoryName: "Outros",
        paymentType: "A VISTA",
        paymentMethod: "INDEFINIDO",
        isPaid: true,
        status: "COMPLETED",
        entries: {
          create: {
            accountId: accountsMap["Santander"].id,
            amount: 1000,
            type: "DEBIT"
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Banco de dados configurado para Alexandre Silva com Cartões, Planejamento, Metas e Investimentos!",
      user: alex.name,
      cards: 2,
      budgets: 4,
      goals: 2,
      investments: 3
    });
  } catch (error) {
    console.error("Erro no setup:", error);
    return NextResponse.json({ error: "Erro ao configurar ambiente" }, { status: 500 });
  }
}
