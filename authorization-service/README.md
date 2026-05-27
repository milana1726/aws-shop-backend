# 🔐 Authorization Service

Backend service responsible for request authentication using AWS Lambda Authorizer.

---

## 🚀 Overview

Authorization Service provides Basic Authentication for protected API endpoints.

- Validate Authorization header (Basic token)
- Decode and verify user credentials
- Allow or deny access using IAM policy
- Prevent unauthorized access to protected resources

---

## ✅ Authorization Flow

- Client sends request with Authorization header:  
  `Authorization: Basic <base64(login:password)>`
- API Gateway invokes `basicAuthorizer` Lambda
- Lambda:
  - Decodes base64 token
  - Extracts username and password
  - Verifies credentials against environment variables

- Returns IAM policy:
  - ✅ Allow → request continues to target Lambda
  - ❌ Deny → API returns 403 Forbidden
  - ❌ Missing header → API returns 401 Unauthorized

---

## ✅ Configuration

Credentials are provided via environment variables:

```
GITHUB_LOGIN=your_github_login
TEST_PASSWORD=TEST_PASSWORD
```

`.env` file is used locally and **must not be committed to GitHub**.

---

## ✅ Integration

This service is used as a **Lambda Authorizer** in Import Service:

- Protects `/import` endpoint
- Ensures only authorized users can upload files

---

## ✅ Example

**Generate token:**

```
echo -n "your_github_login:TEST_PASSWORD" | base64
```

**Request:**

```
GET /import?name=products.csv
Authorization: Basic <token>
```

## Scripts

```
npm run build         # compile TypeScript
npm run test          # run tests with coverage
npm run cdk:deploy    # deploy backend
npm run cdk:destroy   # destroy stack
```
