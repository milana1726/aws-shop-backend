import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubLogin = process.env.GITHUB_LOGIN;
    const testPassword = process.env.TEST_PASSWORD;

    if (!githubLogin || !testPassword) {
      throw new Error(
        "GITHUB_LOGIN or TEST_PASSWORD environment variables are not set. Please add them to authorization-service/.env file!",
      );
    }

    const basicAuthorizer = new NodejsFunction(this, "BasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/basicAuthorizer.ts"),
      handler: "handler",
      functionName: "basicAuthorizer",

      environment: {
        [githubLogin]: testPassword,
      },
    });

    basicAuthorizer.grantInvoke(
      new iam.ServicePrincipal("apigateway.amazonaws.com"),
    );

    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: basicAuthorizer.functionArn,
      exportName: "BasicAuthorizerArn",
    });
  }
}
