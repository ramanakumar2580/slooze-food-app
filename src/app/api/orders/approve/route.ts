export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, approverId, approverRole } = body;
    if (approverRole === "MEMBER") {
      return NextResponse.json(
        { error: "Unauthorized: Members cannot approve payments." },
        { status: 403 },
      );
    }

    const approvedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PREPARING",
        approvalBy: approverId,
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
