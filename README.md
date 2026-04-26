# api-gateway

Single entry point for all client requests. Validates JWT tokens, enforces role-based access, and proxies requests to the appropriate upstream service. Also contains the checkout orchestration logic that coordinates between product-service and order-service.

**Tech:** NestJS · TypeScript · Axios · Passport JWT · Swagger / OpenAPI

**Exposed port:** `3000` — the only service accessible from outside Docker

---

## Routing Table

| Path prefix | Upstream | Notes |
|---|---|---|
| `/api/auth/**` | auth-service:3001 | Login, register, refresh, me |
| `/api/products/**` | product-service:3002 | Product catalog, image upload |
| `/api/products/skus/**` | product-service:3002 | SKU management |
| `/api/order/**` | order-service:3003 | Cart, orders, checkout |
| `/api/payment/**` | payment-service:3003 | Payment status, webhook |

Swagger UI: `http://localhost:3000/api/docs`

---

## Authentication & Authorization

- JWT validation at the gateway — tokens are not forwarded raw to upstream services
- Validated user identity is passed downstream via `x-user-id` header
- Two roles: `ADMIN` and `USER`
- Public routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/products` (GET), `/api/payment/webhook/qris`

---

## Checkout Orchestration

The checkout endpoint (`POST /api/order/cart/checkout`) is the most complex operation — it runs in the gateway itself rather than a single service:

```
Client POST /api/order/cart/checkout
  │
  ▼
[ API Gateway ]
  │
  ├── 1. GET cart from order-service
  │        └── Validate cart is not empty
  │
  ├── 2. POST /skus/validate to product-service
  │        ├── Confirm all SKUs are active
  │        └── Fetch current prices (price lock at checkout time)
  │
  ├── 3. POST /orders/cart/checkout to order-service
  │        └── Send cart items with locked prices
  │
  └── Return order (status: PENDING)
        └── RabbitMQ flow continues async (stock reservation → payment)
```

This ensures prices are always locked at checkout time, not at add-to-cart time.

---

## Error Handling

| Component | Responsibility |
|---|---|
| `AxiosExceptionInterceptor` | Catches Axios HTTP errors from upstream services and normalizes them to consistent gateway responses |
| `GatewayExceptionFilter` | Catches any unhandled exceptions and formats them into a uniform error response |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | JWT | Get current user |

### Products & SKUs
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List all products |
| GET | `/api/products/:id` | Public | Get product with SKUs |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/image` | Admin | Upload product image |
| GET | `/api/products/skus/:id` | Public | Get SKU detail |
| POST | `/api/products/skus` | Admin | Create SKU |
| POST | `/api/products/skus/:id/restock` | Admin | Restock SKU |
| POST | `/api/products/skus/:id/image` | Admin | Upload SKU image |

### Orders & Cart
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/order/cart` | JWT | Get cart |
| POST | `/api/order/cart/items` | JWT | Add item to cart |
| PATCH | `/api/order/cart/items/:skuId` | JWT | Update cart item |
| DELETE | `/api/order/cart/items/:skuId` | JWT | Remove cart item |
| DELETE | `/api/order/cart` | JWT | Clear cart |
| POST | `/api/order/cart/checkout` | JWT | Checkout |
| GET | `/api/order/user/me` | JWT | Get my orders |
| GET | `/api/order/:id` | JWT | Get order detail |
| GET | `/api/order` | Admin | Get all orders |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/payment/order/:orderId` | JWT | Get payment & QR code |
| POST | `/api/payment/webhook/qris` | Public | Midtrans webhook |

---

## Project Structure

```
gateway/
└── src/
    ├── auth/
    │   ├── auth.controller.ts          # Login, register, refresh, me
    │   ├── jwt-auth.guard.ts           # JWT validation guard
    │   ├── roles.guard.ts              # Role enforcement guard
    │   └── roles.decorator.ts          # @Roles('ADMIN', 'USER')
    ├── product/
    │   └── product.controller.ts       # Product + SKU proxy endpoints
    ├── order/
    │   └── order.controller.ts         # Cart + order proxy + checkout logic
    ├── payment/
    │   └── payment.controller.ts       # Payment status + webhook proxy
    ├── upstream/
    │   └── upstream.service.ts         # Shared Axios HTTP client config
    └── common/interceptors/
        ├── axios-exception.interceptor.ts
        └── gateway-exception.filter.ts
```

---

## Environment Variables

```env
PORT=3000

JWT_SECRET=your_jwt_secret

AUTH_SERVICE_URL=http://auth-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3003
```

---

## Running Locally

```bash
npm install
npm run start:dev
```

Gateway runs on `http://localhost:3000`. All upstream services must be running first.

Swagger UI available at `http://localhost:3000/api/docs`.

## Docker

```bash
docker build -t api-gateway .
docker run --env-file .env -p 3000:3000 api-gateway
```

## Part of

[E-Commerce Microservices Platform](../README.md)
