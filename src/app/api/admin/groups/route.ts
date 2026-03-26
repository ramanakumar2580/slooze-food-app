import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch absolutely ALL groups across the entire database (Admin Only)
export async function GET() {
  try {
    const groups = await prisma.groupOrder.findMany({
      include: {
        host: { select: { id: true, name: true } },
        members: { select: { id: true, name: true } },

        // 1. FETCH PENDING ITEMS
        items: {
          include: {
            user: { select: { id: true, name: true } },
            menuItem: {
              include: { restaurant: true },
            },
          },
          orderBy: { addedAt: "desc" },
        },

        // 2. FETCH COMPLETED ORDERS
        orders: {
          include: {
            user: { select: { id: true, name: true } },
            restaurant: true,
            orderItems: {
              include: { menuItem: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Admin Fetch All Groups Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch global groups" },
      { status: 500 },
    );
  }
}
