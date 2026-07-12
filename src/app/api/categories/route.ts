import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const categories = await prisma.category.findMany({
      where: { userId },
      include: { children: true, transactions: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const { name, parentId, type } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type: type || "DEBIT",
        parentId: parentId || null,
        userId
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const { id, name, type } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    // Verifica se pertence ao usuário
    const existing = await prisma.category.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        type: type || existing.type
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Desvincula transações antes da exclusão se houver
    await prisma.transaction.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 });
  }
}
