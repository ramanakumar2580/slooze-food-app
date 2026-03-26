import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { groupId, memberId } = await request.json();

    if (!groupId || !memberId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Remove the user from the GroupOrder's members list
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedGroup = await prisma.groupOrder.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });

    // 2. Also delete any food items this member added to that specific group cart
    await prisma.groupCartItem.deleteMany({
      where: {
        groupOrderId: groupId,
        userId: memberId,
      },
    });

    // 3. Update any accepted invites to rejected/deleted so they don't reappear
    await prisma.groupInvite.deleteMany({
      where: {
        groupId: groupId,
        receiverId: memberId,
      },
    });

    return NextResponse.json({ message: "Member removed/exited successfully" });
  } catch (error) {
    console.error("Member Removal Error:", error);
    return NextResponse.json(
      { error: "Failed to process member removal" },
      { status: 500 },
    );
  }
}
