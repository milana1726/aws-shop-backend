import { handler } from "../lambda/getProductById";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mockRequestContext, mockContext, mockCallback } from "./mocks";

function assertResult(
  result: unknown,
): asserts result is { statusCode: number; body: string } {
  if (typeof result !== "object" || result === null) {
    throw new Error("No result returned from lambda");
  }
}

describe("getProductsById lambda", () => {
  it("returns product when product exists", async () => {
    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      path: "/products/1",
      pathParameters: { productId: "1" },
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products/{productId}",
      requestContext: mockRequestContext,
    };

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe("1");
  });

  it("returns 404 when productId is missing", async () => {
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

    expect(result.statusCode).toBe(404);

    const body = JSON.parse(result.body);
    expect(body.message).toContain("not found");
  });
});
