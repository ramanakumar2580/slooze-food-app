import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Add an item to a specific group cart session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupOrderId, userId, menuItemId, action } = body;

    if (!groupOrderId) {
      return NextResponse.json(
        { error: "groupOrderId is required" },
        { status: 400 },
      );
    }
    if (action === "SUBMIT_ORDER") {
      const activeSession = await prisma.groupCartSession.findFirst({
        where: {
          groupOrderId,
          status: "OPEN",
        },
        orderBy: { createdAt: "desc" }, // Always get the latest open one
      });

      if (activeSession) {
        await prisma.groupCartSession.update({
          where: { id: activeSession.id },
          data: { status: "SUBMITTED" }, // 🔥 CLOSE SESSION HERE. Merging is now IMPOSSIBLE!
        });
      }

      return NextResponse.json({
        success: true,
        message: "Session closed successfully",
      });
    }
    if (!userId || !menuItemId) {
      return NextResponse.json(
        { error: "userId and menuItemId are required to add items" },
        { status: 400 },
      );
    }

    let activeSession = await prisma.groupCartSession.findFirst({
      where: {
        groupOrderId: groupOrderId,
        status: "OPEN",
      },
      orderBy: { createdAt: "desc" },
    });

    // If there isn't an open session, create a fresh one safely
    if (!activeSession) {
      try {
        activeSession = await prisma.groupCartSession.create({
          data: {
            groupOrderId: groupOrderId,
            status: "OPEN",
          },
        });
      } catch {
        // Fallback for Promise.all() race conditions (if another item created it a millisecond ago)
        activeSession = await prisma.groupCartSession.findFirst({
          where: { groupOrderId: groupOrderId, status: "OPEN" },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (!activeSession) {
      throw new Error("Failed to retrieve active session");
    }

    const existingItem = await prisma.groupCartItem.findFirst({
      where: {
        groupOrderId,
        userId,
        menuItemId,
        sessionId: activeSession.id, // STRICTLY checking inside this session
      },
    });

    if (existingItem) {
      // Increment quantity ONLY inside the current session
      await prisma.groupCartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    } else {
      // Create new cart item securely locked to this session
      await prisma.groupCartItem.create({
        data: {
          groupOrderId,
          userId,
          menuItemId,
          quantity: 1,
          sessionId: activeSession.id, // ✅ CRITICAL
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
