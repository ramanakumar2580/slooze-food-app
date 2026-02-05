import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch ALL vendors/restaurants (No limits)
export async function GET() {
  try {
    const vendors = await prisma.restaurant.findMany({
      include: { menu: true }, // Includes all menu items
      orderBy: { createdAt: "desc" }, // Newest first
    });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}

// POST: Add a new vendor/restaurant
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

// DELETE: Remove a vendor
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    // Delete all menu items first, then delete the restaurant
    await prisma.menuItem.deleteMany({ where: { restaurantId: id as string } });
    await prisma.restaurant.delete({ where: { id: id as string } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
