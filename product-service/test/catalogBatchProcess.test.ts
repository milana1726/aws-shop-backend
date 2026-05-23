import { handler } from "../lambda/catalogBatchProcess";

import { SQSEvent, Context, Callback } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const sendMock = jest.fn();

jest.mock("../lambda/db", () => ({
  docClient: {
    send: (...args: unknown[]) => sendMock(...args),
  },
}));

const snsSendMock = jest.fn();

jest.spyOn(SNSClient.prototype, "send").mockImplementation(snsSendMock);

const context = {} as Context;
const callback: Callback = jest.fn();

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.PRODUCTS_TABLE = "products";
    process.env.STOCKS_TABLE = "stocks";
    process.env.SNS_TOPIC_ARN = "test-arn";
  });

  const createSQSEvent = (body: object): SQSEvent => ({
    Records: [
      {
        messageId: "1",
        receiptHandle: "abc",
        body: JSON.stringify(body),
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "0",
          SenderId: "test",
          ApproximateFirstReceiveTimestamp: "0",
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "",
        awsRegion: "eu-west-1",
      },
    ],
  });

  it("should create product and send SNS", async () => {
    sendMock.mockResolvedValue({});
    snsSendMock.mockResolvedValue({});

    const event = createSQSEvent({
      title: "Test",
      description: "Desc",
      price: "120",
      count: "5",
    });

    await handler(event, context, callback);

    expect(sendMock).toHaveBeenCalledTimes(1);

    const dbCall = sendMock.mock.calls[0][0];
    expect(dbCall).toBeInstanceOf(TransactWriteCommand);

    expect(snsSendMock).toHaveBeenCalledTimes(1);

    const snsCall = snsSendMock.mock.calls[0][0];
    expect(snsCall).toBeInstanceOf(PublishCommand);

    const input = snsCall.input;

    expect(input.TopicArn).toBe("test-arn");
    expect(input.Message).toContain("Test");

    expect(input.MessageAttributes?.price.StringValue).toBe("120");
  });

  it("should skip invalid JSON", async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "abc",
          body: "invalid json",
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "test",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "",
          awsRegion: "eu-west-1",
        },
      ],
    };

    await handler(event, context, callback);

    expect(sendMock).toHaveBeenCalledTimes(0);
    expect(snsSendMock).toHaveBeenCalledTimes(0);
  });

  it("should skip invalid data structure", async () => {
    const event = createSQSEvent({
      title: "",
      description: "",
      price: "",
      count: "",
    });

    await handler(event, context, callback);

    expect(sendMock).toHaveBeenCalledTimes(0);
    expect(snsSendMock).toHaveBeenCalledTimes(0);
  });

  it("should skip invalid numeric values", async () => {
    const event = createSQSEvent({
      title: "Test",
      description: "Desc",
      price: "NaN",
      count: "abc",
    });

    await handler(event, context, callback);

    expect(sendMock).toHaveBeenCalledTimes(0);
    expect(snsSendMock).toHaveBeenCalledTimes(0);
  });

  it("should not create notification if product creation fails", async () => {
    sendMock.mockRejectedValue(new Error("DB error"));
    snsSendMock.mockResolvedValue({});

    const event = createSQSEvent({
      title: "Test",
      description: "Desc",
      price: "120",
      count: "5",
    });

    await handler(event, context, callback);

    expect(sendMock).toHaveBeenCalledTimes(1);

    expect(snsSendMock).toHaveBeenCalledTimes(0);
  });
});
