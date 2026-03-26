// app/api/groups/[id]/members/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Delete all cart items for this specific user in this specific group
    await prisma.groupCartItem.deleteMany({
      where: {
        groupOrderId: groupId,
        userId: userId,
      },
    });

    // 2. Disconnect the user from the group members list
    await prisma.groupOrder.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    return NextResponse.json({
      message: "Member and items removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
