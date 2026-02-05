export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.restaurant.findMany({
      include: { menu: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newVendor = await prisma.restaurant.create({
      data: { name: body.name, region: body.region },
    });
    return NextResponse.json(newVendor, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    await prisma.menuItem.deleteMany({ where: { restaurantId: id as string } });
    await prisma.restaurant.delete({ where: { id: id as string } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
