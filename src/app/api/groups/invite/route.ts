import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  // 1. Fix: Ensure userId is a string and not null
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const invites = await prisma.groupInvite.findMany({
    where: {
      receiverId: userId, // TypeScript is happy now because we checked for null above
      status: "PENDING",
    },
    include: {
      group: {
        include: {
          host: true,
        },
      },
    },
  });

  return NextResponse.json(invites);
}

export async function POST(request: Request) {
  try {
    const { action, groupId, receiverId, inviteId } = await request.json();

    if (action === "SEND") {
      const invite = await prisma.groupInvite.create({
        data: { groupId, receiverId },
      });
      return NextResponse.json(invite);
    }

    if (action === "ACCEPT") {
      // Logic: Update invite and connect user to the group members list
      await prisma.groupInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      });

      await prisma.groupOrder.update({
        where: { id: groupId },
        data: {
          members: {
            connect: { id: receiverId },
          },
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "REJECT") {
      await prisma.groupInvite.update({
        where: { id: inviteId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
