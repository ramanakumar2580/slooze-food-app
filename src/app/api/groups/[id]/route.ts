/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    if (body.status === "APPROVED" && body.approveUserId) {
      let whereClause: any = {};

      // ✅ PRIORITY 1: exact items
      if (
        body.itemIds &&
        Array.isArray(body.itemIds) &&
        body.itemIds.length > 0
      ) {
        whereClause = { id: { in: body.itemIds } };
      }
      // ✅ PRIORITY 2: STRICT session-based isolation
      else if (body.sessionId) {
        whereClause = { sessionId: body.sessionId };
      } else {
        throw new Error("sessionId or itemIds required for approval");
      }

      const groupData = await prisma.groupOrder.findUnique({
        where: { id: groupId },
        include: { items: { where: whereClause, include: { menuItem: true } } },
      });

      if (groupData && groupData.items.length > 0) {
        const itemsBySessionAndRestaurant: Record<string, any[]> = {};

        groupData.items.forEach((item: any) => {
          const key = `${item.sessionId}_${item.menuItem?.restaurantId}`;

          if (!itemsBySessionAndRestaurant[key]) {
            itemsBySessionAndRestaurant[key] = [];
          }

          itemsBySessionAndRestaurant[key].push(item);
        });

        // Create REAL Orders (NO MERGE BETWEEN SESSIONS)
        const orderPromises = Object.entries(
          itemsBySessionAndRestaurant,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ).map(async ([_, rItems]) => {
          const restaurantId = rItems[0].menuItem?.restaurantId;

          // FIX: Use the original member's ID who placed the order, NOT the manager's ID
          const originalUserId = rItems[0].userId || body.approveUserId;

          const totalAmount = rItems.reduce(
            (sum, i) => sum + (i.menuItem?.price || 0) * i.quantity,
            0,
          );

          const orderData: any = {
            userId: originalUserId, // 👈 FIXED HERE! Now it shows up in Member's "My Orders"
            restaurantId: restaurantId,
            totalAmount: totalAmount,
            status: "PREPARING",
            paymentStatus: "APPROVED",
            // We can optionally store the manager who approved it
            approvalBy: body.approveUserId,
            orderItems: {
              create: rItems.map((i: any) => ({
                menuItemId: i.menuItemId,
                quantity: i.quantity,
              })),
            },
          };

          try {
            return await prisma.order.create({
              data: {
                ...orderData,
                isGroupOrder: true,
                groupOrderId: groupId,
              },
            });
          } catch {
            console.warn("Fallback to standard order creation.");
            return await prisma.order.create({ data: orderData });
          }
        });

        await Promise.all(orderPromises);

        // Delete ONLY approved items
        const itemIdsToDelete = groupData.items.map((i) => i.id);
        await prisma.groupCartItem.deleteMany({
          where: { id: { in: itemIdsToDelete } },
        });
      }

      return NextResponse.json({ message: "Precise Approval Success" });
    }

    if (body.status === "CANCELLED" && body.rejectUserId) {
      if (
        body.itemIds &&
        Array.isArray(body.itemIds) &&
        body.itemIds.length > 0
      ) {
        await prisma.groupCartItem.deleteMany({
          where: {
            id: { in: body.itemIds },
          },
        });
        return NextResponse.json({ message: "Precise Rejection Success" });
      }

      // ✅ STRICT session-based rejection
      if (body.sessionId) {
        await prisma.groupCartItem.deleteMany({
          where: {
            groupOrderId: groupId,
            sessionId: body.sessionId,
          },
        });
        return NextResponse.json({ message: "Precise Rejection Success" });
      }

      throw new Error("sessionId or itemIds required for rejection");
    }

    const updatedGroup = await prisma.groupOrder.update({
      where: { id: groupId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    await prisma.groupCartItem.deleteMany({ where: { groupOrderId: groupId } });

    await prisma.groupCartSession.deleteMany({
      where: { groupOrderId: groupId },
    });

    await prisma.groupInvite.deleteMany({ where: { groupId: groupId } });
    await prisma.groupOrder.update({
      where: { id: groupId },
      data: { members: { set: [] } },
    });
    await prisma.groupOrder.delete({ where: { id: groupId } });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 },
    );
  }
}
