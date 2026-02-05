import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("userId") || "";
  const role = searchParams.get("role") || "MEMBER";
  const country = searchParams.get("country") || "";

  try {
    let orderCount = 0;
    let pendingApprovals = 0;
    let revenueUSD = 0;
    let revenueINR = 0;
    let userCount = 0;
    let restaurantCount = 0;

    // 1. ADMIN LOGIC
    if (role === "ADMIN") {
      const regionFilter = country ? { restaurant: { region: country } } : {};

      // A. Count Orders (Excluding Cancelled)
      orderCount = await prisma.order.count({
        where: {
          ...regionFilter,
          status: { not: "CANCELLED" },
        },
      });

      // B. Count Pending Approvals
      pendingApprovals = await prisma.order.count({
        where: {
          ...regionFilter,
          paymentStatus: "PENDING",
          status: { not: "CANCELLED" },
        },
      });

      // C. Revenue (Excluding Cancelled)
      const usaStats = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...regionFilter,
          paymentStatus: "PAID",
          status: { not: "CANCELLED" },
          restaurant: { region: "USA" },
        },
      });

      const indiaStats = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...regionFilter,
          paymentStatus: "PAID",
          status: { not: "CANCELLED" },
          restaurant: { region: "INDIA" },
        },
      });

      revenueUSD = usaStats._sum.totalAmount || 0;
      revenueINR = indiaStats._sum.totalAmount || 0;

      // D. System Health
      const userFilter = country ? { country: country } : {};
      const restFilter = country ? { region: country } : {};

      userCount = await prisma.user.count({
        where: { isActive: true, ...userFilter },
      });
      restaurantCount = await prisma.restaurant.count({
        where: { isActive: true, ...restFilter },
      });
    }

    // 2. MANAGER LOGIC (The Fix is Here)
    else if (role === "MANAGER") {
      const teamOrders = await prisma.order.findMany({
        where: {
          restaurant: { region: country },
          status: { not: "CANCELLED" }, // 1. Exclude Cancelled
          user: { role: { not: "ADMIN" } }, // 2. EXCLUDE ADMIN ORDERS
        },
      });

      orderCount = teamOrders.length;
      pendingApprovals = teamOrders.filter(
        (o) => o.paymentStatus === "PENDING",
      ).length;

      const totalRaw = teamOrders.reduce(
        (acc, order) =>
          acc + (order.paymentStatus === "PAID" ? order.totalAmount : 0),
        0,
      );

      // Assign to correct currency bucket
      if (country === "USA") {
        revenueUSD = totalRaw;
      } else {
        revenueINR = totalRaw;
      }

      userCount = await prisma.user.count({
        where: { isActive: true, country },
      });

      restaurantCount = await prisma.restaurant.count({
        where: { isActive: true, region: country },
      });
    }

    // 3. MEMBER LOGIC
    else {
      const myOrders = await prisma.order.findMany({ where: { userId } });

      orderCount = myOrders.length;
      pendingApprovals = myOrders.filter(
        (o) => o.paymentStatus === "PENDING",
      ).length;

      const totalRaw = myOrders.reduce(
        (acc, order) =>
          acc +
          (order.paymentStatus === "PAID" && order.status !== "CANCELLED"
            ? order.totalAmount
            : 0),
        0,
      );

      revenueUSD = totalRaw;
      userCount = 0;
      restaurantCount = 0;
    }

    return NextResponse.json({
      orderCount,
      pendingApprovals,
      revenueUSD,
      revenueINR,
      userCount,
      restaurantCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
