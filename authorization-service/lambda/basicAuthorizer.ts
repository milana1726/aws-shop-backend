import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Auth event:", event);

  try {
    const authHeader = event.authorizationToken;

    if (!authHeader) {
      throw new Error("Unauthorized"); // 401 Unauthorized
    }

    const [, token] = authHeader.split(" ");

    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = decoded.split(":");

    const expectedPassword = process.env[username];

    if (!expectedPassword || expectedPassword !== password) {
      return generatePolicy("user", "Deny", event.methodArn); //403 Forbidden
    }

    return generatePolicy("user", "Allow", event.methodArn); // 200 OK
  } catch (error) {
    console.error("❌ Auth error:", error);
    throw new Error("Unauthorized");
  }
};
