# Banking Platform - API Documentation

Complete reference for all REST endpoints in the banking microservices platform.

## Base URL

```
http://localhost/api
```

## Authentication

All endpoints (except `/register` and `/login`) require JWT Bearer token in header:

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>"
```

Token obtained from `/register` or `/login` endpoints.

---

## Authentication Endpoints

### Register New User

**Endpoint:** `POST /api/register`

**Rate Limited:** Yes (60 req/sec)

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "user"
}
```

**Response (200 Created):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "status": "error",
  "data": null,
  "message": "Validation failed: email already exists"
}
```

---

### Login

**Endpoint:** `POST /api/login`

**Rate Limited:** Yes (60 req/sec)

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
$base='http://localhost'
$login = Invoke-RestMethod -Uri "$base/api/login" -Method Post -ContentType 'application/json' -Body (@{email='alice3@example.com'; password='Secret123!'} | ConvertTo-Json)
$login.data.token
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "data": null,
  "message": "Invalid credentials"
}
```

---

### Get Authenticated User

**Endpoint:** `GET /api/user`

**Authentication:** Required

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "message": "User fetched"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "data": null,
  "message": "Unauthorized"
}
```

---

## Account Service Endpoints

**Base:** `http://localhost/api/spring/accounts` (routed through Laravel gateway)

### Create Account

**Endpoint:** `POST /api/spring/accounts`

**Service:** Account Service (port 8081)

**Authentication:** Required

**Request Body:**
```json
{
  "userId": 1,
  "balance": 1000.00
}
```

**Validation:**
- `userId` (Long): Required, must be positive
- `balance` (BigDecimal): Required, must be >= 0

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "balance": 1000.00,
    "createdAt": "2026-03-28T10:30:00Z",
    "updatedAt": "2026-03-28T10:30:00Z"
  },
  "message": "Account created"
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "data": null,
  "message": "Balance cannot be negative"
}
```

---

### Retrieve Account by ID

**Endpoint:** `GET /api/spring/accounts/{id}`

**Service:** Account Service (port 8081)

**Authentication:** Required

**Path Parameters:**
- `id` (Long): Account ID

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "balance": 950.00,
    "createdAt": "2026-03-28T10:30:00Z",
    "updatedAt": "2026-03-28T10:35:00Z"
  },
  "message": "Account fetched"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "data": null,
  "message": "Account not found"
}
```

---

### List Accounts by User

**Endpoint:** `GET /api/spring/accounts/user/{userId}`

**Service:** Account Service (port 8081)

**Authentication:** Required

**Path Parameters:**
- `userId` (Long): User ID

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "balance": 950.00,
      "createdAt": "2026-03-28T10:30:00Z",
      "updatedAt": "2026-03-28T10:35:00Z"
    },
    {
      "id": 3,
      "userId": 1,
      "balance": 500.00,
      "createdAt": "2026-03-28T10:20:00Z",
      "updatedAt": "2026-03-28T10:20:00Z"
    }
  ],
  "message": "Accounts fetched"
}
```

---

### Adjust Account Balance (Internal)

**Endpoint:** `PUT /api/spring/accounts/{id}/balance`

**Service:** Account Service (port 8081)

**Authentication:** Required

**Note:** Typically called internally by Transaction Service during transfers

**Request Body:**
```json
{
  "delta": -500.00
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "balance": 450.00,
    "createdAt": "2026-03-28T10:30:00Z",
    "updatedAt": "2026-03-28T10:40:00Z"
  },
  "message": "Balance updated"
}
```

**Error Response (400 Bad Request - Insufficient Balance):**
```json
{
  "status": "error",
  "data": null,
  "message": "Insufficient balance"
}
```

---

## Transaction Service Endpoints

**Base:** `http://localhost/api/spring/transactions` (routed through Laravel gateway)

### Execute Transfer

**Endpoint:** `POST /api/spring/transactions/transfer`

**Service:** Transaction Service (port 8082)

**Authentication:** Required

**Request Body:**
```json
{
  "fromAccount": 1,
  "toAccount": 2,
  "amount": 500.00
}
```

**Validation:**
- `fromAccount` (Long): Required, must exist
- `toAccount` (Long): Required, must exist
- `amount` (BigDecimal): Required, must be > 0 and <= sender balance

**Process Flow:**
1. Validate both accounts exist
2. Check sender has sufficient balance
3. Debit amount from sender account
4. Credit amount to recipient account
5. Generate blockchain hash of transaction
6. Persist transaction record
7. Return transaction with status COMPLETED

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": 5,
    "fromAccount": 1,
    "toAccount": 2,
    "amount": 500.00,
    "status": "COMPLETED",
    "blockchainHash": "a3f8e2c1d5b9f4e7c2a1b8d9e3f5c7a2b1d4e6f8c9a2b3d5e7f9a1c3e5f7a9",
    "createdAt": "2026-03-28T10:45:00Z"
  },
  "message": "Transfer successful"
}
```

**Transaction Status Values:**
- `PENDING` - Transfer initiated, waiting for processing
- `COMPLETED` - Transfer successful, funds transferred
- `FAILED` - Transfer failed, balances unchanged

**Error Response (400 Bad Request - Insufficient Balance):**
```json
{
  "status": "error",
  "data": null,
  "message": "Insufficient balance"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "data": null,
  "message": "Account not found"
}
```

---

### List Transactions by Account

**Endpoint:** `GET /api/spring/transactions/{accountId}`

**Service:** Transaction Service (port 8082)

**Authentication:** Required

**Path Parameters:**
- `accountId` (Long): Account ID to list transactions for

**Query Parameters:**
- `limit` (Integer, optional): Maximum results (default: 100)
- `offset` (Integer, optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 5,
      "fromAccount": 1,
      "toAccount": 2,
      "amount": 500.00,
      "status": "COMPLETED",
      "blockchainHash": "a3f8e2c1...",
      "createdAt": "2026-03-28T10:45:00Z"
    },
    {
      "id": 3,
      "fromAccount": 2,
      "toAccount": 1,
      "amount": 150.00,
      "status": "COMPLETED",
      "blockchainHash": "b4f9e3d2...",
      "createdAt": "2026-03-28T10:30:00Z"
    }
  ],
  "message": "Transactions fetched"
}
```

---

## Blockchain Service Endpoints

**Base:** `http://localhost/api/spring/blockchain` (routed through Laravel gateway)

### Generate and Store Hash

**Endpoint:** `POST /api/spring/blockchain/hash`

**Service:** Blockchain Service (port 8083)

**Authentication:** Required

**Request Body:**
```json
{
  "data": "fromAccount:1,toAccount:2,amount:500,timestamp:1711612800"
}
```

**Process:**
1. Receives transaction data
2. Computes SHA-256 hash
3. Stores hash in in-memory ledger
4. Returns hash to caller

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "hash": "a3f8e2c1d5b9f4e7c2a1b8d9e3f5c7a2b1d4e6f8c9a2b3d5e7f9a1c3e5f7a9"
  },
  "message": "Hash stored successfully"
}
```

**Hash Format:** 64-character hexadecimal string (SHA-256)

---

### Verify Hash

**Endpoint:** `GET /api/spring/blockchain/verify/{hash}`

**Service:** Blockchain Service (port 8083)

**Authentication:** Required

**Path Parameters:**
- `hash` (String): SHA-256 hash to verify (64 hex chars)

**Response (200 OK - Hash Valid):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "message": "Hash found in ledger"
  },
  "message": "Hash verification successful"
}
```

**Response (200 OK - Hash Invalid):**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "message": "Hash not found in ledger"
  },
  "message": "Hash verification successful"
}
```

---

## Error Codes

| HTTP Status | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | Account retrieved |
| 201 | Created | Account created, transfer completed |
| 400 | Bad Request | Invalid input, insufficient balance |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Account/resource doesn't exist |
| 422 | Validation Failed | Email already registered |
| 429 | Too Many Requests | Rate limit exceeded (60 req/sec) |
| 500 | Server Error | Internal service error |

---

## Rate Limiting

All public endpoints are rate-limited:

- **Limit:** 60 requests per second per IP
- **Burst:** Additional 20 requests allowed
- **Response Header:** `RateLimit-Remaining: 58`

When limit exceeded (429 Too Many Requests):
```json
{
  "status": "error",
  "data": null,
  "message": "Rate limit exceeded. Try again later."
}
```

---

## Example Workflows

### Complete Banking Flow

```bash
# 1. Register user
TOKEN=$(curl -s -X POST http://localhost/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"Pass123!","role":"user"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Create account with 1000 balance
ACCOUNT_ID=$(curl -s -X POST http://localhost/api/spring/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"balance":1000}' \
  | grep -o '"id":[0-9]*' | cut -d':' -f2)

# 3. Execute transfer
HASH=$(curl -s -X POST http://localhost/api/spring/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":'$ACCOUNT_ID',"toAccount":2,"amount":500}' \
  | grep -o '"blockchainHash":"[^"]*' | cut -d'"' -f4)

# 4. Verify transaction hash
curl -s -X GET "http://localhost/api/spring/blockchain/verify/$HASH" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.valid'
# true
```

---

## Testing with cURL

### Create Multiple Test Users

```bash
for i in {1..5}; do
  curl -X POST http://localhost/api/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"User$i\",\"email\":\"user$i@example.com\",\"password\":\"Pass123!\",\"role\":\"user\"}"
done
```

### Stress Test Rate Limiting

```bash
for i in {1..100}; do
  curl -X POST http://localhost/api/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"StressTest$i\",\"email\":\"stress$i@example.com\",\"password\":\"Pass123!\",\"role\":\"user\"}" &
done
wait
```

---

## Postman Collection

Import this into Postman to test all endpoints:

```json
{
  "info": {
    "name": "Banking Platform API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "{{base}}/api/register",
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"John\",\"email\":\"john@example.com\",\"password\":\"Pass123!\",\"role\":\"user\"}"
        }
      }
    },
    {
      "name": "Create Account",
      "request": {
        "method": "POST",
        "url": "{{base}}/api/spring/accounts",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"userId\":1,\"balance\":1000}"
        }
      }
    }
  ]
}
```

---

## SDK Support

Libraries for consuming this API:

**cURL:**
```bash
curl -X POST http://localhost/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123!","role":"user"}'
```

**Python (requests):**
```python
import requests

requests.post(
    'http://localhost/api/register',
    json={'name': 'Test', 'email': 'test@example.com', 'password': 'Pass123!', 'role': 'user'}
)
```

**JavaScript (fetch):**
```javascript
fetch('http://localhost/api/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Test', email: 'test@example.com', password: 'Pass123!', role: 'user'})
})
```

---

## OpenAPI/Swagger Schema

View interactive API documentation:

- **Account Service:** http://localhost/spring/accounts/swagger-ui.html
- **Transaction Service:** http://localhost/spring/transactions/swagger-ui.html
- **Blockchain Service:** http://localhost/spring/blockchain/swagger-ui.html

Download OpenAPI spec:
- http://localhost/spring/accounts/v3/api-docs
- http://localhost/spring/transactions/v3/api-docs
- http://localhost/spring/blockchain/v3/api-docs
