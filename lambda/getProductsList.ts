import { APIGatewayProxyHandler } from "aws-lambda";
import { products } from "./mock/products";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(products),
    };
  } catch {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
