import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { groupId, userId, menuItemId } = await request.json();

    // Add the item to the GroupCartItem table
    const groupItem = await prisma.groupCartItem.create({
      data: {
        groupOrderId: groupId,
        userId: userId,
        menuItemId: menuItemId,
        quantity: 1,
      },
    });

    return NextResponse.json(groupItem);
  } catch {
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 },
    );
  }
}
