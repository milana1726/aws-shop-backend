# 📥 Import Service

Backend service for importing product data using AWS Lambda, API Gateway, and S3.

---

## 🚀 Overview

Import Service implements a file upload and processing pipeline:

- Generate presigned URL for secure file upload
- Upload CSV files to S3
- Automatically parse CSV files using Lambda
- Move processed files from `uploaded/` to `parsed/`

---

## ✅ API Endpoint

| Method | Endpoint            | Description                       |
| ------ | ------------------- | --------------------------------- |
| GET    | /import?name=<file> | Generate presigned URL for upload |

---

## ✅ Example Request

```http
GET /import?name=products.csv
```

---

## Scripts

```
npm run build         # compile TypeScript
npm run test          # run tests with coverage
npm run cdk:deploy    # deploy backend
npm run cdk:destroy   # destroy stack
```
