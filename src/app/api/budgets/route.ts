import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await req.json();
    const { categoryName, targetAmount } = body;

    if (!categoryName || targetAmount === undefined) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryName,
        targetAmount,
        spentAmount: 0,
      }
    });

    return NextResponse.json({ success: true, budget });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ success: false, error: "Failed to create budget" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";
    const body = await req.json();
    const { id, targetAmount } = body;

    if (!id || targetAmount === undefined) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const budget = await prisma.budget.update({
      where: { id, userId },
      data: { targetAmount }
    });

    return NextResponse.json({ success: true, budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json({ success: false, error: "Failed to update budget" }, { status: 500 });
  }
}
