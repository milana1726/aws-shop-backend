import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";

const CATALOG_QUEUE_NAME = "catalogItemsQueue";
export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceBucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: `aws-shop-import-bucket-${this.account}-${this.region}`,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    });

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      `arn:aws:sqs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:${CATALOG_QUEUE_NAME}`,
    );

    const queueUrl = `https://sqs.${this.region}.amazonaws.com/${this.account}/${CATALOG_QUEUE_NAME}`;

    const importProductsFile = new NodejsFunction(this, "ImportProductsFile", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/importProductsFile.ts"),
      handler: "handler",
      functionName: "ImportProductsFile",
      environment: {
        BUCKET: importServiceBucket.bucketName,
      },
    });

    const importFileParser = new NodejsFunction(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/importFileParser.ts"),
      handler: "handler",
      functionName: "ImportFileParser",
      environment: {
        SQS_URL: queueUrl,
      },
    });

    importServiceBucket.grantPut(importProductsFile);
    importServiceBucket.grantReadWrite(importFileParser);

    catalogItemsQueue.grantSendMessages(importFileParser);

    importServiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      {
        prefix: "uploaded/",
      },
    );

    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      },
    );

    new cdk.CfnOutput(this, "ImportApiUrl", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "ImportBucketName", {
      value: importServiceBucket.bucketName,
    });
  }
}
