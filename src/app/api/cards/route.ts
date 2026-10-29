import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCents } from "@/lib/math";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") || "test-user-id";
    const cards = await prisma.card.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ success: true, cards });
  } catch (error: any) {
    console.error("Erro ao buscar cartões:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar cartões" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") || "test-user-id";
    const body = await request.json();
    const { name, type, cardNumber, expirationDate, holderName, limit, currentInvoice, dueDate } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Nome do cartão é obrigatório." }, { status: 400 });
    }

    const lastDigits = (cardNumber || "4829").replace(/\D/g, "").slice(-4) || "4829";
    const formattedCardNumber = `•••• •••• •••• ${lastDigits}`;

    const limitCents = typeof limit === "number" ? limit : toCents(limit || 0);
    const invoiceCents = typeof currentInvoice === "number" ? currentInvoice : toCents(currentInvoice || 0);

    const card = await prisma.card.create({
      data: {
        userId,
        name: name.trim(),
        type: type || "CREDIT",
        cardNumber: formattedCardNumber,
        expirationDate: expirationDate || "12/28",
        holderName: (holderName || "ALEX SILVA").toUpperCase(),
        limit: limitCents,
        currentInvoice: invoiceCents,
        dueDate: dueDate || "10 Out"
      }
    });

    return NextResponse.json({ success: true, card });
  } catch (error: any) {
    console.error("Erro ao criar cartão:", error);
    return NextResponse.json({ error: error.message || "Erro ao cadastrar cartão" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") || "test-user-id";
    const body = await request.json();
    const { id, name, type, cardNumber, expirationDate, holderName, limit, currentInvoice, dueDate } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do cartão é obrigatório." }, { status: 400 });
    }

    const existingCard = await prisma.card.findUnique({
      where: { id }
    });

    if (!existingCard || existingCard.userId !== userId) {
      return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    }

    let formattedCardNumber = existingCard.cardNumber;
    if (cardNumber) {
      const lastDigits = cardNumber.replace(/\D/g, "").slice(-4) || "4829";
      formattedCardNumber = `•••• •••• •••• ${lastDigits}`;
    }

    const limitCents = typeof limit === "number" ? limit : toCents(limit || 0);
    const invoiceCents = typeof currentInvoice === "number" ? currentInvoice : toCents(currentInvoice || 0);

    const card = await prisma.card.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingCard.name,
        type: type || existingCard.type,
        cardNumber: formattedCardNumber,
        expirationDate: expirationDate || existingCard.expirationDate,
        holderName: holderName ? holderName.toUpperCase() : existingCard.holderName,
        limit: limitCents,
        currentInvoice: invoiceCents,
        dueDate: dueDate || existingCard.dueDate
      }
    });

    return NextResponse.json({ success: true, card });
  } catch (error: any) {
    console.error("Erro ao atualizar cartão:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar cartão" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") || "test-user-id";
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do cartão é obrigatório." }, { status: 400 });
    }

    const existingCard = await prisma.card.findUnique({
      where: { id }
    });

    if (!existingCard || existingCard.userId !== userId) {
      return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    }

    await prisma.card.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir cartão:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir cartão" }, { status: 500 });
  }
}
