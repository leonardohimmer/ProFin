import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

declare global {
  var isDbInitialized: boolean | undefined;
}

export async function ensureDatabaseInitialized() {
  if (globalThis.isDbInitialized) {
    return;
  }

  try {
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

    const defaultUserId = "test-user-id";
    const defaultUserEmail = "joao@gestao.com";
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      const hashedPassword = await hashPassword("joao123");
      await prisma.user.create({
        data: {
          id: defaultUserId,
          name: "Alexandre Silva",
          email: defaultUserEmail,
          password: hashedPassword,
          role: "OPERATOR",
          accounts: {
            create: [
              { id: "acc-nubank", name: "Nubank Principal" },
              { id: "acc-carteira", name: "Carteira / Dinheiro" },
              { id: "acc-santander", name: "Santander" },
              { id: "acc-inter", name: "Banco Inter PJ" },
              { id: "acc-xp", name: "XP Investimentos" }
            ]
          }
        }
      });
      console.log("Usuário padrão criado pelo ensureDatabaseInitialized!");
    }

    globalThis.isDbInitialized = true;
  } catch (error) {
    console.error("Erro na auto-inicialização do banco de dados:", error);
  }
}
