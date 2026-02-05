import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all employees (For the Admin "Manage Employees" table)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST: Add a new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, country, managerId } = body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production, always hash this!
        role,
        country,
        managerId,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
// DELETE: Remove an employee
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    await prisma.user.delete({ where: { id: id as string } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
