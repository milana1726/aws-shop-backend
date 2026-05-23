import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "eu-west-1";

export const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "products";
export const STOCKS_TABLE = process.env.STOCKS_TABLE || "stocks";

const client = new DynamoDBClient({ region: REGION });

export const docClient = DynamoDBDocumentClient.from(client);
