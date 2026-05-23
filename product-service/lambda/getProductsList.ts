import { APIGatewayProxyHandler } from "aws-lambda";
import { docClient, PRODUCTS_TABLE, STOCKS_TABLE } from "./db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Product, Stock, ProductWithStock } from "./types/product";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    console.log("📥 getProductsList invoked");

    const productsResult = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
      }),
    );

    const stocksResult = await docClient.send(
      new ScanCommand({
        TableName: STOCKS_TABLE,
      }),
    );

    const products = (productsResult.Items || []) as Product[];
    const stocks = (stocksResult.Items || []) as Stock[];

    const stocksMap = new Map<string, number>(
      stocks.map((s) => [s.product_id, s.count]),
    );

    const productsList: ProductWithStock[] = products.map((product) => ({
      ...product,
      count: stocksMap.get(product.id) ?? 0,
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(productsList),
    };
  } catch (error) {
    console.error("❌ getProductsList error:", error);

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
