import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

const EMAIL = "melnychuk.frontend.dev@gmail.com";
export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(60),
    });

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(
      new subs.EmailSubscription(EMAIL, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 100,
          }),
        },
      }),
    );

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      "products",
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      "stocks",
    );

    const environment = {
      PRODUCTS_TABLE: productsTable.tableName,
      STOCKS_TABLE: stocksTable.tableName,
    };

    const getProductsList = new NodejsFunction(this, "GetProductsList", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/getProductsList.ts"),
      handler: "handler",
      functionName: "GetProductsList",
      environment,
    });

    const getProductById = new NodejsFunction(this, "GetProductById", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/getProductById.ts"),
      handler: "handler",
      functionName: "GetProductById",
      environment,
    });

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/createProduct.ts"),
      handler: "handler",
      functionName: "CreateProduct",
      environment,
    });

    const catalogBatchProcess = new NodejsFunction(
      this,
      "CatalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../lambda/catalogBatchProcess.ts"),
        handler: "handler",
        functionName: "CatalogBatchProcess",
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      },
    );

    catalogBatchProcess.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      }),
    );

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductById);

    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Product Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList),
    );
    products.addMethod("POST", new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource("{productId}");
    product.addMethod("GET", new apigateway.LambdaIntegration(getProductById));

    new cdk.CfnOutput(this, "catalogItemsQueueUrl", {
      value: catalogItemsQueue.queueUrl,
    });
  }
}
