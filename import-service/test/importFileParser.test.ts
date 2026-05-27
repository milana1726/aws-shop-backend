import { handler } from "../lambda/importFileParser";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

import { S3Event, Context, Callback } from "aws-lambda";
import { Readable } from "stream";

describe("importFileParser Lambda", () => {
  let s3Mock: jest.Mock;
  let sqsMock: jest.Mock;

  const context = {} as Context;
  const callback: Callback<void> = jest.fn();

  beforeEach(() => {
    s3Mock = jest.fn();
    sqsMock = jest.fn();

    jest.clearAllMocks();

    jest.spyOn(S3Client.prototype, "send").mockImplementation(s3Mock);
    jest.spyOn(SQSClient.prototype, "send").mockImplementation(sqsMock);
  });

  const createS3Event = (key: string): S3Event => ({
    Records: [
      {
        eventVersion: "2.1",
        eventSource: "aws:s3",
        awsRegion: "eu-west-1",
        eventTime: "2020-01-01T00:00:00.000Z",
        eventName: "ObjectCreated:Put",
        userIdentity: { principalId: "test" },
        requestParameters: { sourceIPAddress: "127.0.0.1" },
        responseElements: {
          "x-amz-request-id": "test",
          "x-amz-id-2": "test",
        },
        s3: {
          s3SchemaVersion: "1.0",
          configurationId: "test",
          bucket: {
            name: "test-bucket",
            ownerIdentity: { principalId: "test" },
            arn: "arn:aws:s3:::test-bucket",
          },
          object: {
            key,
            size: 100,
            eTag: "etag",
            sequencer: "123",
          },
        },
      },
    ],
  });

  it("should parse CSV, send messages to SQS and move file", async () => {
    const csvData = `title,description,price,count
Flower,desc,10,5`;

    const stream = Readable.from([csvData]);

    s3Mock
      .mockResolvedValueOnce({ Body: stream })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    sqsMock.mockResolvedValue({});

    process.env.SQS_URL = "test-queue";

    const event = createS3Event("uploaded/test.csv");

    await handler(event, context, callback);

    expect(sqsMock).toHaveBeenCalledTimes(1);

    expect(sqsMock).toHaveBeenCalledWith(expect.any(SendMessageCommand));

    expect(s3Mock).toHaveBeenNthCalledWith(1, expect.any(GetObjectCommand));
    expect(s3Mock).toHaveBeenNthCalledWith(2, expect.any(CopyObjectCommand));
    expect(s3Mock).toHaveBeenNthCalledWith(3, expect.any(DeleteObjectCommand));
  });

  it("should NOT move file if not in uploaded/", async () => {
    const csvData = `title,description,price,count
Flower,desc,10,5`;

    const stream = Readable.from([csvData]);

    s3Mock.mockResolvedValueOnce({ Body: stream });
    sqsMock.mockResolvedValue({});

    process.env.SQS_URL = "test-queue";

    const event = createS3Event("test.csv");

    await handler(event, context, callback);

    expect(s3Mock).toHaveBeenCalledTimes(1);

    expect(sqsMock).toHaveBeenCalledTimes(1);
  });

  it("should throw error when S3 fails", async () => {
    const event = createS3Event("uploaded/test.csv");

    s3Mock.mockRejectedValue(new Error("S3 error"));

    await expect(handler(event, context, callback)).rejects.toThrow("S3 error");
  });
});
