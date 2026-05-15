import { APIGatewayProxyHandler } from "aws-lambda";
import { docClient, PRODUCTS_TABLE, STOCKS_TABLE } from "./db";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { Product } from "./types/product";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log("📥 createProduct invoked:", event.body);

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Body is required" }),
      };
    }

    const { title, description, price, count } = JSON.parse(event.body);

    // validation
    if (
      !title ||
      typeof title !== "string" ||
      typeof price !== "number" ||
      typeof count !== "number"
    ) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Invalid input" }),
      };
    }

    const id = randomUUID();

    const product: Product = {
      id,
      title,
      description,
      price,
    };

    // transaction
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: product,
            },
          },
          {
            Put: {
              TableName: STOCKS_TABLE,
              Item: {
                product_id: id,
                count,
              },
            },
          },
        ],
      }),
    );

    console.log("✅ Product created:", id);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ id }),
    };
  } catch (error) {
    console.error("❌ createProduct error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};
