import { APIGatewayProxyHandler } from "aws-lambda";
import { Product, Stock, ProductWithStock } from "./types/product";
import { docClient, PRODUCTS_TABLE, STOCKS_TABLE } from "./db";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log("📥 getProductById invoked:", event.pathParameters);

    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: `Product not found` }),
      };
    }

    const productResult = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: {
          id: productId,
        },
      }),
    );

    if (!productResult.Item) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: `Product #${productId} not found` }),
      };
    }

    const stockResult = await docClient.send(
      new GetCommand({
        TableName: STOCKS_TABLE,
        Key: {
          product_id: productId,
        },
      }),
    );

    const productItem = productResult.Item as Product;
    const stockItem = stockResult.Item as Stock | undefined;

    const product: ProductWithStock = {
      ...productItem,
      count: stockItem?.count ?? 0,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error("❌ getProductById error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
