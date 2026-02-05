export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, name, category, price } = body;

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        category,
        price,
        restaurantId,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Menu Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to add menu item" },
      { status: 500 },
    );
  }
}
