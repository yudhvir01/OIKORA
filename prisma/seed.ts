import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

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

const LOCATIONS = [
  { name: "Main Warehouse", address: "100 Industrial Pkwy, Springfield" },
  { name: "Downtown Store", address: "45 Market St, Springfield" },
  { name: "North Depot", address: "12 Harbor Rd, Rivertown" },
];

async function main() {
  const userIds = new Map<string, string>();
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
    });
    userIds.set(user.email, record.id);
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

  const locationIds = new Map<string, string>();
  for (const location of LOCATIONS) {
    const record = await prisma.location.upsert({
      where: { name: location.name },
      update: { address: location.address },
      create: location,
    });
    locationIds.set(location.name, record.id);
  }
  console.log(`Seeded ${LOCATIONS.length} locations.`);

  const productIds = new Map<string, string>();
  for (const product of PRODUCTS) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) {
      throw new Error(`Unknown category "${product.category}" for product ${product.sku}`);
    }
    const record = await prisma.product.upsert({
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
    productIds.set(product.sku, record.id);
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);

  // Reset stock movements for seeded products so this script can be re-run
  // without piling up duplicate transactions/levels.
  const seededProductIds = [...productIds.values()];
  await prisma.stockTransaction.deleteMany({
    where: { productId: { in: seededProductIds } },
  });
  await prisma.stockLevel.deleteMany({
    where: { productId: { in: seededProductIds } },
  });

  const admin = userIds.get("admin@example.com")!;
  const staff = userIds.get("staff@example.com")!;
  const wh = locationIds.get("Main Warehouse")!;
  const store = locationIds.get("Downtown Store")!;
  const depot = locationIds.get("North Depot")!;

  async function stockIn(
    sku: string,
    locationId: string,
    quantity: number,
    createdById: string,
    createdAt: Date,
    note: string,
  ) {
    const productId = productIds.get(sku)!;
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId, locationId } },
      create: { productId, locationId, quantity },
      update: { quantity: { increment: quantity } },
    });
    await prisma.stockTransaction.create({
      data: {
        type: "STOCK_IN",
        quantity,
        productId,
        locationId,
        note,
        createdById,
        createdAt,
      },
    });
  }

  async function stockOut(
    sku: string,
    locationId: string,
    quantity: number,
    createdById: string,
    createdAt: Date,
    note: string,
  ) {
    const productId = productIds.get(sku)!;
    await prisma.stockLevel.update({
      where: { productId_locationId: { productId, locationId } },
      data: { quantity: { decrement: quantity } },
    });
    await prisma.stockTransaction.create({
      data: {
        type: "STOCK_OUT",
        quantity,
        productId,
        locationId,
        note,
        createdById,
        createdAt,
      },
    });
  }

  async function transfer(
    sku: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    createdById: string,
    createdAt: Date,
    note: string,
  ) {
    const productId = productIds.get(sku)!;
    await prisma.stockLevel.update({
      where: { productId_locationId: { productId, locationId: fromLocationId } },
      data: { quantity: { decrement: quantity } },
    });
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId, locationId: toLocationId } },
      create: { productId, locationId: toLocationId, quantity },
      update: { quantity: { increment: quantity } },
    });
    await prisma.stockTransaction.create({
      data: {
        type: "TRANSFER_OUT",
        quantity,
        productId,
        locationId: fromLocationId,
        note,
        createdById,
        createdAt,
      },
    });
    await prisma.stockTransaction.create({
      data: {
        type: "TRANSFER_IN",
        quantity,
        productId,
        locationId: toLocationId,
        note,
        createdById,
        createdAt,
      },
    });
  }

  // Well-stocked product spread across all three locations, with a transfer.
  await stockIn("BEV-0001", wh, 200, admin, daysAgo(14), "Initial warehouse delivery");
  await stockIn("BEV-0001", store, 60, staff, daysAgo(13), "Store opening stock");
  await stockOut("BEV-0001", wh, 50, staff, daysAgo(7), "Weekly restock delivery to store");
  await transfer("BEV-0001", wh, depot, 40, admin, daysAgo(3), "Balancing stock for new depot");

  // Depleted by heavy stock-out — ends up below reorder point (low stock).
  await stockIn("BEV-0002", wh, 40, admin, daysAgo(12), "Initial warehouse delivery");
  await stockOut("BEV-0002", wh, 10, staff, daysAgo(6), "Café restock");
  await stockOut("BEV-0002", wh, 22, staff, daysAgo(2), "Bulk order for downtown event");

  // Spread across all three locations with a transfer back to the warehouse.
  await stockIn("SNK-0001", store, 120, staff, daysAgo(11), "Initial store delivery");
  await stockIn("SNK-0001", depot, 40, admin, daysAgo(9), "Initial depot delivery");
  await transfer("SNK-0001", store, wh, 30, staff, daysAgo(4), "Redistributing surplus to warehouse");

  // Small initial batch only, below reorder point — low stock example.
  await stockIn("SNK-0002", wh, 15, admin, daysAgo(10), "Initial stock, smaller batch due to short supplier lead time");

  // Well stocked then hit with a large contract fulfillment — low stock.
  await stockIn("CLN-0001", wh, 60, admin, daysAgo(13), "Initial warehouse delivery");
  await stockOut("CLN-0001", wh, 55, staff, daysAgo(1), "Large janitorial contract fulfillment");

  // Well stocked at store and depot only, no warehouse presence.
  await stockIn("CLN-0002", store, 200, staff, daysAgo(9), "Initial store delivery");
  await stockIn("CLN-0002", depot, 150, staff, daysAgo(8), "Initial depot delivery");

  // Richest history: warehouse receiving, two transfers out, then a stock-out.
  await stockIn("OFF-0001", wh, 100, admin, daysAgo(14), "Bulk paper order received");
  await transfer("OFF-0001", wh, store, 40, admin, daysAgo(10), "Store restock request");
  await transfer("OFF-0001", wh, depot, 20, staff, daysAgo(5), "Depot restock request");
  await stockOut("OFF-0001", wh, 30, staff, daysAgo(2), "Office restock request");

  // OFF-0002 (Ballpoint Pen Box) intentionally has zero movement — an
  // out-of-stock product with no StockLevel rows at all.

  console.log("Seeded stock levels and transactions across 3 locations.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
