import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. CLEANUP (Optional: Clears database so you can re-run this script safely)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  // 2. CREATE USERS (Based strictly on the Assignment Doc)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Nick Fury",
        email: "nick@slooze.com",
        password: "password123",
        role: "ADMIN",
        country: "USA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Captain Marvel",
        email: "marvel@slooze.com",
        password: "password123",
        role: "MANAGER",
        country: "INDIA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Captain America",
        email: "cap@slooze.com",
        password: "password123",
        role: "MANAGER",
        country: "USA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Thanos",
        email: "thanos@slooze.com",
        password: "password123",
        role: "MEMBER",
        country: "INDIA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Thor",
        email: "thor@slooze.com",
        password: "password123",
        role: "MEMBER",
        country: "INDIA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Travis",
        email: "travis@slooze.com",
        password: "password123",
        role: "MEMBER",
        country: "USA",
      },
    }),
  ]);

  // Using the 'users' variable to fix the warning
  console.log(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    `✅ Created ${users.length} Users: ${users.map((u: { name: any }) => u.name).join(", ")}`,
  );

  // 3. CREATE RESTAURANTS & MENU (India & USA)
  const spiceGarden = await prisma.restaurant.create({
    data: {
      name: "Spice Garden",
      region: "INDIA",
      menu: {
        create: [
          { name: "Butter Chicken", category: "Main Course", price: 320 },
          { name: "Garlic Naan", category: "Bread", price: 40 },
          { name: "Mango Lassi", category: "Beverages", price: 80 },
        ],
      },
    },
  });

  const dosaPlaza = await prisma.restaurant.create({
    data: {
      name: "Dosa Plaza",
      region: "INDIA",
      menu: {
        create: [
          { name: "Masala Dosa", category: "Main Course", price: 150 },
          { name: "Idli Sambhar", category: "Main Course", price: 90 },
          { name: "Filter Coffee", category: "Beverages", price: 30 },
        ],
      },
    },
  });

  const libertyBurger = await prisma.restaurant.create({
    data: {
      name: "Liberty Burger",
      region: "USA",
      menu: {
        create: [
          { name: "Texas BBQ Burger", category: "Main Course", price: 15 },
          { name: "Cajun Fries", category: "Sides", price: 5 },
          { name: "Iced Tea", category: "Beverages", price: 3 },
        ],
      },
    },
  });

  const pizzaLoft = await prisma.restaurant.create({
    data: {
      name: "NYC Pizza Loft",
      region: "USA",
      menu: {
        create: [
          { name: "Pepperoni Slice", category: "Main Course", price: 6 },
          { name: "Garlic Knots", category: "Sides", price: 7 },
          { name: "Coke", category: "Beverages", price: 2 },
        ],
      },
    },
  });

  // Using the restaurant variables to fix the warnings
  console.log("✅ Created 4 Restaurants:");
  console.log(`  - ${spiceGarden.name} (${spiceGarden.region})`);
  console.log(`  - ${dosaPlaza.name} (${dosaPlaza.region})`);
  console.log(`  - ${libertyBurger.name} (${libertyBurger.region})`);
  console.log(`  - ${pizzaLoft.name} (${pizzaLoft.region})`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
