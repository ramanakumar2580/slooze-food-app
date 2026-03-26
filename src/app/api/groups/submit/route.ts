import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { groupId } = await request.json();
    const activeSession = await prisma.groupCartSession.findFirst({
      where: {
        groupOrderId: groupId,
        status: "OPEN",
      },
    });

    if (!activeSession) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }
    const sessionItems = await prisma.groupCartItem.findMany({
      where: {
        groupOrderId: groupId,
        sessionId: activeSession.id,
      },
      include: { menuItem: true },
    });

    if (!sessionItems || sessionItems.length === 0) {
      return NextResponse.json(
        { error: "No items in current session" },
        { status: 400 },
      );
    }
    const itemsByRestaurant: Record<string, typeof sessionItems> = {};
    sessionItems.forEach((item) => {
      const rId = item.menuItem.restaurantId;
      if (!itemsByRestaurant[rId]) itemsByRestaurant[rId] = [];
      itemsByRestaurant[rId].push(item);
    });

    const createdOrders = [];
    for (const [restaurantId, rItems] of Object.entries(itemsByRestaurant)) {
      const total = rItems.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0,
      );

      const actualUserId = rItems[0].userId;

      const finalOrder = await prisma.order.create({
        data: {
          userId: actualUserId,
          restaurantId: restaurantId,
          totalAmount: total,
          status: "PENDING", // Manager inka approve cheyali
          isGlobal: false,
          isGroupOrder: true, // Tag it as a squad order
          groupOrderId: groupId,
          orderItems: {
            create: rItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
            })),
          },
        },
      });

      createdOrders.push(finalOrder);
    }

    await prisma.groupCartSession.update({
      where: { id: activeSession.id },
      data: { status: "SUBMITTED" },
    });
    await prisma.groupOrder.update({
      where: { id: groupId },
      data: { status: "SUBMITTED" },
    });

    // Return the first created order for the frontend to process
    return NextResponse.json(createdOrders[0]);
  } catch (error) {
    console.error("Submit Error:", error);
    return NextResponse.json(
      { error: "Failed to submit group order" },
      { status: 500 },
    );
  }
}
