export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("userId") || "";
  const role = searchParams.get("role") || "MEMBER";
  const country = searchParams.get("country") || "";
  const view = searchParams.get("view") || "MY_ORDERS";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {};

    if (view === "MY_ORDERS") {
      query = { userId };
    } else if (view === "TEAM_ORDERS" && role === "MANAGER") {
      query = {
        restaurant: { region: country },
        status: { not: "CANCELLED" },
      };
    } else if (view === "GLOBAL" && role === "ADMIN") {
      query = {
        ...(country ? { restaurant: { region: country } } : {}),
        status: { not: "CANCELLED" },
      };
    }

    const orders = await prisma.order.findMany({
      where: query,
      include: {
        user: true,
        restaurant: true,
        orderItems: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, restaurantId, totalAmount, role, items } = body;

    const isManagerOrAdmin = role === "MANAGER" || role === "ADMIN";
    const initialStatus = isManagerOrAdmin ? "PREPARING" : "PENDING";
    const initialPaymentStatus = isManagerOrAdmin ? "PAID" : "PENDING";

    const newOrder = await prisma.order.create({
      data: {
        userId,
        restaurantId,
        totalAmount,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        orderItems: {
          create: items.map((item: { id: string; quantity: number }) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        },
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
