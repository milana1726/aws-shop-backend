import { handler } from "../lambda/getProductsList";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { mockContext, mockCallback, mockRequestContext } from "./mocks";
import { products } from "../lambda/mock/products";

function assertResult(
  result: void | APIGatewayProxyResult,
): asserts result is APIGatewayProxyResult {
  if (!result) {
    throw new Error("Lambda returned void");
  }
}

describe("getProductsList lambda", () => {
  it("returns list of products", async () => {
    const event = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    } satisfies APIGatewayProxyEvent;

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);
    expect(result.statusCode).toBe(200);
  });

  it("returns 500 when JSON serialization fails", async () => {
    const original = products[0];
    (products as unknown as Record<string, unknown>)[0] = { self: {} };
    (products as unknown as any)[0].self = products[0];

    const event = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    } satisfies APIGatewayProxyEvent;

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);
    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Internal server error");

    products[0] = original;
  });
});
