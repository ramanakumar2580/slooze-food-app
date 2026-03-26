import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all groups for a specific region with pending items and completed orders
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");

  if (!region)
    return NextResponse.json({ error: "Region required" }, { status: 400 });

  try {
    const groups = await prisma.groupOrder.findMany({
      where: {
        region: region,
      },
      include: {
        host: { select: { id: true, name: true } },
        members: { select: { id: true, name: true } },

        // 1. FETCH PENDING ITEMS: Foods waiting to be approved
        items: {
          include: {
            user: { select: { id: true, name: true } },
            menuItem: {
              include: { restaurant: true }, // <--- Add this!
            },
          },
          orderBy: { addedAt: "desc" },
        },

        // 2. FETCH COMPLETED ORDERS: This makes your history cards work!
        orders: {
          include: {
            user: { select: { id: true, name: true } }, // Shows who placed the order
            restaurant: true, // Shows the restaurant logo/name
            orderItems: {
              include: { menuItem: true }, // The actual food items delivered
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Fetch Groups Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 },
    );
  }
}

// POST: Create a new Group Order and auto-join Host
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, hostId, region } = body;

    const newGroup = await prisma.groupOrder.create({
      data: {
        name,
        hostId,
        region,
        // Logic: When you create a group, you are automatically a member of it
        members: {
          connect: { id: hostId },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Create Group Error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 },
    );
  }
}

// PATCH: Update group status (Used by Manager to 'Finalize' or 'Close')
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { groupId, status } = body;

    if (!groupId || !status) {
      return NextResponse.json(
        { error: "Missing groupId or status" },
        { status: 400 },
      );
    }

    const updatedGroup = await prisma.groupOrder.update({
      where: { id: groupId },
      data: { status: status },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Update Status Error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
