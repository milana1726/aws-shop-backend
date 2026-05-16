import { S3Event, S3Handler } from "aws-lambda";
import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import csvParser from "csv-parser";

const s3 = new S3Client({ region: process.env.AWS_REGION });

const UPLOADED_PREFIX = "uploaded/";
const PARSED_PREFIX = "parsed/";

export const handler: S3Handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key);

      console.log("Processing file:", key);

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3.send(command);

      const stream = response.Body as NodeJS.ReadableStream;

      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on("data", (data: Record<string, string>) => {
            console.log("Parsed data:", data);
          })
          .on("end", resolve)
          .on("error", reject);
      });

      console.log("Finished processing:", key);

      if (key.startsWith(UPLOADED_PREFIX)) {
        const parsedKey = key.replace(UPLOADED_PREFIX, PARSED_PREFIX);

        await s3.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${key}`,
            Key: parsedKey,
          }),
        );

        console.log("File copied to:", parsedKey);

        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );

        console.log("Original file deleted:", key);
      }
    }
  } catch (error) {
    console.error("❌ Error parsing file:", error);
    throw error;
  }
};
