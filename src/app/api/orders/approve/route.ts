import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, approverId, approverRole } = body;

    // 1. Security Check: Only Managers and Admins can approve payments
    if (approverRole === "MEMBER") {
      return NextResponse.json(
        { error: "Unauthorized: Members cannot approve payments." },
        { status: 403 },
      );
    }

    // 2. Update the database
    const approvedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PREPARING", // Moves order to the kitchen/vendor
        approvalBy: approverId, // Records who approved it
      },
    });

    return NextResponse.json({ success: true, order: approvedOrder });
  } catch (error) {
    console.error("Approval API Error:", error);
    return NextResponse.json(
      { error: "Payment approval failed." },
      { status: 500 },
    );
  }
}
