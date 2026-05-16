import {
  APIGatewayEventRequestContext,
  Context,
  Callback,
  APIGatewayProxyResult,
} from "aws-lambda";

export const mockRequestContext: APIGatewayEventRequestContext = {
  accountId: "test",
  apiId: "test",
  authorizer: undefined,
  httpMethod: "GET",
  identity: {
    accessKey: null,
    accountId: null,
    apiKey: null,
    apiKeyId: null,
    caller: null,
    clientCert: null,
    cognitoAuthenticationProvider: null,
    cognitoAuthenticationType: null,
    cognitoIdentityId: null,
    cognitoIdentityPoolId: null,
    principalOrgId: null,
    sourceIp: "127.0.0.1",
    user: null,
    userAgent: null,
    userArn: null,
  },
  path: "/products",
  protocol: "HTTP/1.1",
  requestId: "test",
  requestTimeEpoch: Date.now(),
  resourceId: "test",
  resourcePath: "/products",
  stage: "test",
};

export const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test",
  functionVersion: "1",
  invokedFunctionArn: "arn:test",
  memoryLimitInMB: "128",
  awsRequestId: "test",
  logGroupName: "test",
  logStreamName: "test",
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

export const mockCallback: Callback<APIGatewayProxyResult> = () => {};
