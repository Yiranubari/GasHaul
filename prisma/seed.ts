import { PrismaClient, CylinderSize } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL must be set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

if (process.env.NODE_ENV === "production") {
  console.error("Seed script must not run in production. Aborting.");
  process.exit(1);
}

const naira = (amount: number) => amount * 100;

const vendorData = [
  {
    name: "Adeyemi Gas Hub",
    latitude: 6.5244,
    longitude: 3.3792,
    pricing: {
      KG_3: naira(4500),
      KG_5: naira(7200),
      KG_12_5: naira(17500),
      KG_50: naira(68000),
    },
    completedOrdersWithFeedback: 1428,
    ordersWithIssues: 57,
  },
  {
    name: "Chinyere Cylinders",
    latitude: 6.5355,
    longitude: 3.3087,
    pricing: {
      KG_3: naira(4400),
      KG_5: naira(7100),
      KG_12_5: naira(17200),
      KG_50: naira(67000),
    },
    completedOrdersWithFeedback: 842,
    ordersWithIssues: 67,
  },
  {
    name: "Ikeja Flame Depot",
    latitude: 6.6018,
    longitude: 3.3515,
    pricing: {
      KG_3: naira(4600),
      KG_5: naira(7300),
      KG_12_5: naira(17800),
      KG_50: naira(69000),
    },
    completedOrdersWithFeedback: 612,
    ordersWithIssues: 73,
  },
  {
    name: "Mama Tunde Refills",
    latitude: 6.4698,
    longitude: 3.5852,
    pricing: {
      KG_3: naira(4350),
      KG_5: naira(7000),
      KG_12_5: naira(17000),
      KG_50: naira(66000),
    },
    completedOrdersWithFeedback: 309,
    ordersWithIssues: 59,
  },
  {
    name: "Yaba Quick Gas",
    latitude: 6.5158,
    longitude: 3.3713,
    pricing: {
      KG_3: naira(4500),
      KG_5: naira(7250),
      KG_12_5: naira(17600),
      KG_50: naira(68500),
    },
    completedOrdersWithFeedback: 142,
    ordersWithIssues: 37,
  },
  {
    name: "Surulere Cooking Gas",
    latitude: 6.5006,
    longitude: 3.3553,
    pricing: {
      KG_3: naira(4250),
      KG_5: naira(6900),
      KG_12_5: naira(16800),
      KG_50: naira(65000),
    },
    completedOrdersWithFeedback: 78,
    ordersWithIssues: 36,
  },
  {
    name: "FreshFire Vendors",
    latitude: 6.5795,
    longitude: 3.3211,
    pricing: {
      KG_3: naira(4600),
      KG_5: naira(7400),
      KG_12_5: naira(17900),
      KG_50: naira(69500),
    },
    completedOrdersWithFeedback: 0,
    ordersWithIssues: 0,
  },
  {
    name: "Apapa Cylinder Co",
    latitude: 6.4474,
    longitude: 3.3611,
    pricing: {
      KG_3: naira(4400),
      KG_5: naira(7150),
      KG_12_5: naira(17400),
      KG_50: naira(67500),
    },
    completedOrdersWithFeedback: 234,
    ordersWithIssues: 21,
  },
];

function calculateTrustScore(
  completed: number,
  withIssues: number,
): number | null {
  if (completed < 5) return null;
  return Math.round(((completed - withIssues) / completed) * 100);
}

async function main() {
  console.log("Seeding database...");

  await prisma.$transaction(async (tx) => {
    for (const v of vendorData) {
      const trustScore = calculateTrustScore(
        v.completedOrdersWithFeedback,
        v.ordersWithIssues,
      );
      const flagged = trustScore !== null && trustScore < 60;

      const vendor = await tx.vendor.upsert({
        where: { name: v.name },
        update: {
          latitude: v.latitude,
          longitude: v.longitude,
          completedOrdersWithFeedback: v.completedOrdersWithFeedback,
          ordersWithIssues: v.ordersWithIssues,
          trustScore,
          flaggedForReview: flagged,
          isActive: true,
        },
        create: {
          name: v.name,
          latitude: v.latitude,
          longitude: v.longitude,
          completedOrdersWithFeedback: v.completedOrdersWithFeedback,
          ordersWithIssues: v.ordersWithIssues,
          trustScore,
          flaggedForReview: flagged,
          isActive: true,
        },
      });

      for (const [size, price] of Object.entries(v.pricing)) {
        await tx.vendorPricing.upsert({
          where: {
            vendorId_cylinderSize: {
              vendorId: vendor.id,
              cylinderSize: size as CylinderSize,
            },
          },
          update: { priceKobo: price },
          create: {
            vendorId: vendor.id,
            cylinderSize: size as CylinderSize,
            priceKobo: price,
          },
        });
      }

      console.log(
        `  ✓ ${v.name} (${trustScore !== null ? `${trustScore}%` : "New"}${flagged ? ", flagged" : ""})`,
      );
    }

    const userPasswordHash = await bcrypt.hash("password123", 10);
    const testUser = await tx.user.upsert({
      where: { phone: "+2348030000001" },
      update: {
        passwordHash: userPasswordHash,
        phoneVerified: true,
      },
      create: {
        fullName: "Test User",
        phone: "+2348030000001",
        passwordHash: userPasswordHash,
        phoneVerified: true,
        smsNotifications: true,
      },
    });

    await tx.address.upsert({
      where: { userId: testUser.id },
      update: {
        streetAddress: "12 Awolowo Road",
        area: "Ikoyi",
        city: "Lagos",
        landmark: "Opposite Falomo Shopping Centre",
        latitude: 6.4502,
        longitude: 3.4302,
      },
      create: {
        userId: testUser.id,
        streetAddress: "12 Awolowo Road",
        area: "Ikoyi",
        city: "Lagos",
        landmark: "Opposite Falomo Shopping Centre",
        latitude: 6.4502,
        longitude: 3.4302,
      },
    });

    console.log(`  ✓ Test user: +2348030000001 / password123`);

    const riderPasswordHash = await bcrypt.hash("password123", 10);
    await tx.rider.upsert({
      where: { phone: "+2348030000002" },
      update: {
        passwordHash: riderPasswordHash,
        isActive: true,
      },
      create: {
        fullName: "Test Rider",
        phone: "+2348030000002",
        passwordHash: riderPasswordHash,
        isActive: true,
      },
    });

    console.log(`  ✓ Test rider: +2348030000002 / password123`);
  });

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
