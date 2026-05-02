import { APIGatewayProxyHandler } from "aws-lambda";
import { products } from "./mock/products";

export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(products),
  };
};
