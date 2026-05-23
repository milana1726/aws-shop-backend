import { handler } from "../lambda/importFileParser";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { S3Event, Context, Callback } from "aws-lambda";
import { Readable } from "stream";

describe("importFileParser Lambda", () => {
  let mockSend: jest.Mock;

  const context = {} as Context;
  const callback: Callback<void> = jest.fn();

  beforeEach(() => {
    mockSend = jest.fn();

    jest.clearAllMocks();

    jest.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);
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

  it("should parse CSV and move file", async () => {
    const csvData = `title,description,price,count
Flower,desc,10,5`;

    const stream = Readable.from([csvData]);

    mockSend
      .mockResolvedValueOnce({ Body: stream })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const event = createS3Event("uploaded/test.csv");

    await handler(event, context, callback);

    expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetObjectCommand));
    expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(CopyObjectCommand));
    expect(mockSend).toHaveBeenNthCalledWith(
      3,
      expect.any(DeleteObjectCommand),
    );
  });

  it("should NOT move file if key does not start with uploaded/", async () => {
    const csvData = `title,description,price,count
Flower,desc,10,5`;

    const stream = Readable.from([csvData]);

    mockSend.mockResolvedValueOnce({ Body: stream });

    const event = createS3Event("test.csv");

    await handler(event, context, callback);

    expect(mockSend).toHaveBeenCalledTimes(1);

    expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetObjectCommand));
  });

  it("should throw error when S3 getObject fails", async () => {
    const event = createS3Event("uploaded/test.csv");

    mockSend.mockRejectedValue(new Error("S3 error"));

    await expect(handler(event, context, callback)).rejects.toThrow("S3 error");
  });
});
