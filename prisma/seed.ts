import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Beverages", description: "Bottled and canned drinks" },
  { name: "Snacks", description: "Chips, crackers, and packaged snacks" },
  { name: "Cleaning Supplies", description: "Detergents and janitorial stock" },
  { name: "Office Supplies", description: "Paper, pens, and stationery" },
];

const PRODUCTS = [
  {
    sku: "BEV-0001",
    name: "Sparkling Water 500ml",
    unit: "bottle",
    reorderPoint: 48,
    category: "Beverages",
  },
  {
    sku: "BEV-0002",
    name: "Cold Brew Coffee 250ml",
    unit: "bottle",
    reorderPoint: 24,
    category: "Beverages",
  },
  {
    sku: "SNK-0001",
    name: "Sea Salt Kettle Chips",
    unit: "bag",
    reorderPoint: 36,
    category: "Snacks",
  },
  {
    sku: "SNK-0002",
    name: "Trail Mix 100g",
    unit: "bag",
    reorderPoint: 30,
    category: "Snacks",
  },
  {
    sku: "CLN-0001",
    name: "All-Purpose Cleaner 1L",
    unit: "bottle",
    reorderPoint: 12,
    category: "Cleaning Supplies",
  },
  {
    sku: "CLN-0002",
    name: "Microfiber Cloth",
    unit: "each",
    reorderPoint: 50,
    category: "Cleaning Supplies",
  },
  {
    sku: "OFF-0001",
    name: "A4 Copy Paper Ream",
    unit: "ream",
    reorderPoint: 20,
    category: "Office Supplies",
  },
  {
    sku: "OFF-0002",
    name: "Ballpoint Pen Box (12ct)",
    unit: "box",
    reorderPoint: 15,
    category: "Office Supplies",
  },
];

const USERS = [
  { email: "admin@example.com", name: "Admin User", password: "admin1234", role: "ADMIN" as const },
  { email: "staff@example.com", name: "Staff User", password: "staff1234", role: "STAFF" as const },
];

async function main() {
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`Seeded ${USERS.length} users.`);

  const categoryIds = new Map<string, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    categoryIds.set(category.name, record.id);
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  for (const product of PRODUCTS) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) {
      throw new Error(`Unknown category "${product.category}" for product ${product.sku}`);
    }
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        unit: product.unit,
        reorderPoint: product.reorderPoint,
        categoryId,
      },
      create: {
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        reorderPoint: product.reorderPoint,
        categoryId,
      },
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
