import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION || "eu-west-1";
const PRODUCTS_TABLE = "products";
const STOCKS_TABLE = "stocks";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION }),
);

const seedData = [
  {
    title: "Phalaenopsis Golden Beauty",

    description:
      "Golden Beauty Phalaenopsis with warm yellow flowers and long blooming period.",
    price: 45,
    count: 5,
  },
  {
    title: "Dendrobium Nobile",

    description:
      "Dendrobium Nobile orchid with delicate fragrant flowers on elegant canes.",
    price: 60,
    count: 8,
  },
  {
    title: "Cattleya Labiata",
    description:
      "Classic Cattleya Labiata orchid famous for large vivid blooms and strong fragrance.",
    price: 70,
    count: 6,
  },
];

async function seed() {
  try {
    console.log("🚀 Starting database seeding...");

    const products = seedData.map((item) => ({
      id: randomUUID(),
      title: item.title,
      description: item.description,
      price: item.price,
    }));

    const stocks = products.map((product, index) => ({
      product_id: product.id,
      count: seedData[index].count,
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [PRODUCTS_TABLE]: products.map((Item) => ({
            PutRequest: { Item },
          })),
        },
      }),
    );

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [STOCKS_TABLE]: stocks.map((Item) => ({
            PutRequest: { Item },
          })),
        },
      }),
    );

    console.log("✅ Seeding completed successfully!");
    console.log(`📦 Products inserted: ${products.length}`);
    console.log(
      "🔑 Sample IDs:",
      products.map((p) => p.id),
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
