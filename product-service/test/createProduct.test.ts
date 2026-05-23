import { handler } from "../lambda/createProduct";
import { docClient } from "../lambda/db";
import { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { mockContext, mockCallback, mockRequestContext } from "./mocks";

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

describe("createProduct lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates product successfully", async () => {
    (docClient.send as jest.Mock).mockResolvedValue({});

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "Test Product",
        description: "Test description",
        price: 100,
        count: 5,
      }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    };

    const context = mockContext as Context;
    const callback = mockCallback as Callback;

    const result = await handler(event, context, callback);

    assertResult(result);

    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);
    expect(body.id).toBeDefined();
  });

  it("returns 400 when body is missing", async () => {
    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    };

    const result = await handler(
      event,
      mockContext as Context,
      mockCallback as Callback,
    );

    assertResult(result);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Body is required");
  });

  it("returns 400 when input is invalid", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "",
        price: "wrong",
        count: "wrong",
      }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    };

    const result = await handler(
      event,
      mockContext as Context,
      mockCallback as Callback,
    );

    assertResult(result);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Invalid input");
  });

  it("returns 500 when DynamoDB fails", async () => {
    (docClient.send as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "Test",
        description: "Test",
        price: 10,
        count: 1,
      }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/products",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/products",
      requestContext: mockRequestContext,
    };

    const result = await handler(
      event,
      mockContext as Context,
      mockCallback as Callback,
    );

    assertResult(result);

    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Internal server error");
  });
});
