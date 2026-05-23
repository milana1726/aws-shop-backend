import { handler } from "../lambda/getProductsList";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { mockContext, mockCallback, mockRequestContext } from "./mocks";
import { docClient } from "../lambda/db";

jest.mock("../lambda/db", () => ({
  docClient: {
    send: jest.fn(),
  },
  PRODUCTS_TABLE: "products",
  STOCKS_TABLE: "stocks",
}));

function assertResult(
  result: void | APIGatewayProxyResult,
): asserts result is APIGatewayProxyResult {
  if (!result) {
    throw new Error("Lambda returned void");
  }
}

describe("getProductsList lambda", () => {
  it("returns list of products with stock", async () => {
    const mockProducts = [
      {
        id: "1",
        title: "Product 1",
        price: 10,
        description: "Test",
      },
    ];

    const mockStocks = [
      {
        product_id: "1",
        count: 5,
      },
    ];

    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({ Items: mockProducts })
      .mockResolvedValueOnce({ Items: mockStocks });

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

    const body = JSON.parse(result.body);

    expect(body).toEqual([
      {
        ...mockProducts[0],
        count: 5,
      },
    ]);
  });

  it("returns empty array when no products", async () => {
    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Items: [] });

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

    const body = JSON.parse(result.body);
    expect(body).toEqual([]);
  });

  it("sets count to 0 when stock not found", async () => {
    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({
        Items: [{ id: "1", title: "P", price: 1 }],
      })
      .mockResolvedValueOnce({ Items: [] });

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

    const body = JSON.parse(result.body);

    expect(body[0].count).toBe(0);
  });

  it("handles undefined Items from DynamoDB", async () => {
    (docClient.send as jest.Mock)
      .mockResolvedValueOnce({ Items: undefined })
      .mockResolvedValueOnce({ Items: undefined });

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

    const body = JSON.parse(result.body);
    expect(body).toEqual([]);
  });

  it("returns 500 on error", async () => {
    (docClient.send as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

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
  });
});
