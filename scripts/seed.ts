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
    title: "Golden Orchid",
    description: "Exotic orchid with bright golden petals",
    price: 45,
    count: 5,
  },
  {
    title: "White Lily",
    description: "Elegant flower with soft fragrance",
    price: 30,
    count: 8,
  },
  {
    title: "Spring Tulip Set",
    description: "Colorful tulips perfect for spring gardens",
    price: 25,
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
