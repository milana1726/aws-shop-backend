import { APIGatewayProxyHandler } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

const BUCKET = process.env.BUCKET!;
const UPLOAD_PREFIX = "uploaded/";
const SIGNED_URL_EXPIRATION = 3600;

export const handler: APIGatewayProxyHandler = async (event) => {
  const fileName = event.queryStringParameters?.name;
  const key = `${UPLOAD_PREFIX}${fileName}`;

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Query parameter 'name' is required" }),
    };
  }
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: SIGNED_URL_EXPIRATION,
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: signedUrl,
    };
  } catch (error) {
    console.error("❌ Error generating signed URL:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
