import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/getProductsList.ts"),
      handler: "handler",
      functionName: "GetProductsList",
      environment,
    });

    const getProductById = new NodejsFunction(this, "GetProductById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/getProductById.ts"),
      handler: "handler",
      functionName: "GetProductById",
      environment,
    });

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/createProduct.ts"),
      handler: "handler",
      functionName: "CreateProduct",
      environment,
    });

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductById);

    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

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
  }
}
