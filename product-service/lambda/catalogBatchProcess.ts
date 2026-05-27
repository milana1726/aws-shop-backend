import { docClient } from "./db";

import { SQSHandler } from "aws-lambda";
import { randomUUID } from "crypto";

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

import { PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const sns = new SNSClient({});

interface ProductInput {
  title: string;
  description: string;
  price: string;
  count: string;
}

export const handler: SQSHandler = async (event) => {
  console.log("Received SQS event:", JSON.stringify(event));

  for (const record of event.Records) {
    let data: ProductInput;

    try {
      data = JSON.parse(record.body);
    } catch {
      console.error("Invalid JSON:", record.body);
      continue;
    }

    if (!data.title || !data.description || !data.price || !data.count) {
      console.error("Invalid data structure:", data);
      continue;
    }

    const price = Number(data.price);
    const count = Number(data.count);

    if (isNaN(price) || isNaN(count)) {
      console.error("Invalid numeric values:", data);
      continue;
    }

    const id = randomUUID();

    try {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.PRODUCTS_TABLE,
                Item: {
                  id,
                  title: data.title,
                  description: data.description,
                  price,
                },
              },
            },
            {
              Put: {
                TableName: process.env.STOCKS_TABLE,
                Item: {
                  product_id: id,
                  count,
                },
              },
            },
          ],
        }),
      );

      console.log("Product created:", id, data.title);

      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: "New product created",
          Message: JSON.stringify({
            id,
            title: data.title,
            description: data.description,
            price,
            count,
          }),

          MessageAttributes: {
            price: {
              DataType: "Number",
              StringValue: price.toString(),
            },
          },
        }),
      );

      console.log("SNS notification sent");
    } catch (error) {
      console.error("Error processing record:", error);
    }
  }
};
