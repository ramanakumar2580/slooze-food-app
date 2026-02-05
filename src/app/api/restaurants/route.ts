import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");

  try {
    // 1. Fetch restaurants from DB
    // If region is provided, filter by it. Otherwise, return all (for Admin).
    const restaurants = await prisma.restaurant.findMany({
      where: region && region !== "ALL" ? { region } : {},
      include: {
        menu: true, // Includes the MenuItem array for each restaurant
      },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 },
    );
  }
}

// POST: Add a new restaurant (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, region, menuItems } = body;

    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        region,
        menu: {
          create: menuItems, // Creates associated menu items at the same time
        },
      },
      include: { menu: true },
    });

    return NextResponse.json(newRestaurant, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 },
    );
  }
}
