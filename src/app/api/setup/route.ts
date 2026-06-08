import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    let admin = await prisma.user.findUnique({
      where: { email: "admin@gestao.com" }
    });

    if (!admin) {
      const hashedPassword = await hashPassword("admin123");
      admin = await prisma.user.create({
        data: {
          name: "Administrador Sistema",
          email: "admin@gestao.com",
          password: hashedPassword,
          role: "ADMIN",
          accounts: { create: { name: "Conta Principal" } }
        }
      });
    }

    const adminUser = admin;
    const defaultCategories = [
      { name: "Alimentação", subs: ["Supermercado", "Restaurante", "Padaria", "Delivery", "Feira"] },
      { name: "Moradia", subs: ["Aluguel", "Luz", "Água", "Internet"] },
      { name: "Transporte", subs: ["Combustível", "Uber/99", "Manutenção"] },
      { name: "Lazer", subs: ["Cinema", "Viagens", "Hobbies"] },
      { name: "Saúde", subs: ["Farmácia", "Consultas"] },
      { name: "Receitas", subs: ["Salário", "Investimentos", "Extras"] }
    ];

    for (const cat of defaultCategories) {
      let parent = await prisma.category.findFirst({
        where: { name: cat.name, userId: adminUser.id, parentId: null }
      });
      
      if (!parent) {
        parent = await prisma.category.create({
          data: { name: cat.name, userId: adminUser.id }
        });
      }

      for (const sub of cat.subs) {
        const existingSub = await prisma.category.findFirst({
          where: { name: sub, userId: adminUser.id, parentId: parent.id }
        });
        if (!existingSub) {
          await prisma.category.create({
            data: { name: sub, userId: adminUser.id, parentId: parent.id }
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Ambiente configurado com categorias!" });
  } catch (error) {
    console.error("Erro no setup:", error);
    return NextResponse.json({ error: "Erro ao configurar ambiente" }, { status: 500 });
  }
}
