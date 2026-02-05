export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: region && region !== "ALL" ? { region } : {},
      include: {
        menu: true,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, region, menuItems } = body;

    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        region,
        menu: {
          create: menuItems,
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
