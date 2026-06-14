import { handler } from "../lambda/basicAuthorizer";
import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

const makeEvent = (token?: string): APIGatewayTokenAuthorizerEvent =>
  ({
    type: "TOKEN",
    methodArn: "arn:aws:execute-api:test",
    authorizationToken: token,
  }) as APIGatewayTokenAuthorizerEvent;

describe("basicAuthorizer", () => {
  beforeEach(() => {
    process.env.hello123 = "TEST_PASSWORD";
  });

  it("should return 401 if no Authorization header", async () => {
    await expect(handler(makeEvent(undefined))).rejects.toThrow("Unauthorized");
  });

  it("should return Deny policy for invalid credentials", async () => {
    const token = Buffer.from("hello123:WRONG").toString("base64");

    const result = await handler(makeEvent(`Basic ${token}`));

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("should return Allow policy for valid credentials", async () => {
    const token = Buffer.from("hello123:TEST_PASSWORD").toString("base64");

    const result = await handler(makeEvent(`Basic ${token}`));

    expect(result.policyDocument.Statement[0].Effect).toBe("Allow");
  });
});
