import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  // FIX: params is now a Promise in Next.js 15
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Await the params to extract the ID securely
    const { id } = await params;

    const body = await request.json();

    // 2. Extract the fields to update
    const { status, paymentStatus } = body;

    // 3. Update the order in the database
    const updatedOrder = await prisma.order.update({
      where: { id }, // Use the awaited ID
      data: {
        status,
        paymentStatus,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
