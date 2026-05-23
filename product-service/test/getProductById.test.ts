import { handler } from "../lambda/getProductById";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mockRequestContext, mockContext, mockCallback } from "./mocks";
import { docClient } from "../lambda/db";

jest.mock("../lambda/db", () => ({
  docClient: {
    send: jest.fn(),
  },
  PRODUCTS_TABLE: "products",
  STOCKS_TABLE: "stocks",
}));

function assertResult(
  result: unknown,
): asserts result is { statusCode: number; body: string } {
  if (typeof result !== "object" || result === null) {
    throw new Error("No result returned from lambda");
  }
}

describe("getProductsById lambda", () => {
  it("returns product when product exists", async () => {
    const mockProduct = {
      id: "1",
      title: "Test Product",
      price: 10,
      description: "Test",
    };

    const mockStock = {
      product_id: "1",
      count: 5,
    };

    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({ Item: mockProduct })
      .mockResolvedValueOnce({ Item: mockStock });

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
    expect(body).toEqual({
      ...mockProduct,
      count: 5,
    });
  });

  it("returns product with count 0 when stock is missing", async () => {
    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({ Item: { id: "1", title: "P" } })
      .mockResolvedValueOnce({ Item: undefined });

    const event = {
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
    } satisfies APIGatewayProxyEvent;

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);

    const body = JSON.parse(result.body);

    expect(body.count).toBe(0);
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

  it("returns 404 when product is not found", async () => {
    (docClient.send as jest.Mock).mockResolvedValueOnce({ Item: undefined });

    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      path: "/products/999",
      pathParameters: { productId: "999" },
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products/{productId}",
      requestContext: mockRequestContext,
    };

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);

    expect(result.statusCode).toBe(404);
  });

  it("returns 500 when an error occurs", async () => {
    (docClient.send as jest.Mock).mockRejectedValueOnce(
      new Error("DB failure"),
    );

    const event = {
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
    } satisfies APIGatewayProxyEvent;

    const result = await handler(event, mockContext, mockCallback);

    assertResult(result);

    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Internal server error");
  });
});
