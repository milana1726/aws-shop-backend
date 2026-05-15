# 🛒 AWS Shop Backend

Backend service for product management built with AWS Lambda, API Gateway and DynamoDB.

---

## 🚀 Overview

Implementing Product Service with the following features:

- Retrieve all products
- Retrieve product by ID
- Create new product with stock

---

## ✅ API Endpoints

| Method | Endpoint              | Description                     |
| ------ | --------------------- | ------------------------------- |
| GET    | /products             | Get list of products with stock |
| GET    | /products/{productId} | Get product by ID               |
| POST   | /products             | Create new product              |

---

## ✅ Example Request

```json
POST /products
```

{
"title": "Oncidium Orchid",
"description": "Elegant orchid with delicate golden flowers",
"price": 120,
"count": 3
}

## ✅ Example Response

{
"id": "generated-uuid"
}

---

## Scripts

```
npm run build         # compile TypeScript
npm run test          # run tests with coverage
npm run cdk:deploy    # deploy backend
npm run cdk:destroy   # destroy stack
npm run seed          # populate DynamoDB
```
