import { handler } from "../lambda/importProductsFile";
import {
  APIGatewayProxyEvent,
  Context,
  Callback,
  APIGatewayProxyResult,
} from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

const createEvent = (name?: string): APIGatewayProxyEvent => ({
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "/import",
  pathParameters: null,
  queryStringParameters: name ? { name } : null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: "",
  requestContext: {} as APIGatewayProxyEvent["requestContext"],
});

const context = {} as Context;
const callback: Callback<APIGatewayProxyResult> = jest.fn();

describe("importProductsFile Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if name is missing", async () => {
    const event = createEvent();

    const result = await handler(event, context, callback);

    expect(result?.statusCode).toBe(400);
    expect(result?.body).toContain("Query parameter 'name' is required");
  });

  it("should return signed URL when name is provided", async () => {
    mockedGetSignedUrl.mockResolvedValue("signed-url");

    const event = createEvent("test.csv");

    const result = await handler(event, context, callback);

    expect(result?.statusCode).toBe(200);
    expect(result?.body).toBe("signed-url");

    expect(mockedGetSignedUrl).toHaveBeenCalled();
  });

  it("should return 500 when getSignedUrl throws error", async () => {
    mockedGetSignedUrl.mockRejectedValue(new Error("fail"));

    const event = createEvent("test.csv");

    const result = await handler(event, context, callback);

    expect(result?.statusCode).toBe(500);
    expect(result?.body).toContain("Internal Server Error");
  });
});
