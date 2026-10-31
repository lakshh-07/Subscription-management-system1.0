# BrightLoop Autopilot – API Contract

## 1. Project Overview

BrightLoop Autopilot is a subscription management system that manages customers, plans, subscriptions, recurring billing, invoices and payments.

## 2. Technology Configuration

| Component | Technology / Configuration |
|---|---|
| Frontend | React.js + Vite |
| Frontend CSS | Tailwind CSS |
| Frontend Port | 5173 |
| Backend | Node.js + Express.js |
| Backend Port | 5000 |
| ORM | Prisma |
| Database | SQLite |
| Validation | Zod |
| Environment Variables | dotenv |
| Communication | HTTP / JSON |
| CORS | Enabled |

### Application URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API Base URL: `http://localhost:5000/api`

## 3. Database Models

The backend currently plans to implement six models:

1. Customer
2. Plan
3. Subscription
4. Invoice
5. InvoiceLine
6. Payment

Detailed field definitions and relationships will be documented after confirmation from the backend developer.

## 4. API Endpoints

All endpoints use the `/api` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/customers?page=1&pageSize=10` | Get paginated customers |
| POST | `/api/customers` | Create a customer |
| GET | `/api/plans` | List plans and billing periods |
| POST | `/api/subscriptions` | Create a subscription |
| GET | `/api/subscriptions` | List subscriptions with status |
| POST | `/api/billing/preview` | Preview invoices without creating them |
| POST | `/api/billing/run` | Generate invoices for subscriptions due for billing |
| GET | `/api/invoices` | List invoices and payment details |
| POST | `/api/invoices/:id/payments` | Record partial or full payments |

## 5. Request and Response Formats

The exact JSON request and response structures are pending agreement between frontend and backend developers.

Each endpoint must document:

- Required request fields.
- Optional request fields.
- Data types and validation rules.
- Successful response structure.
- Error response structure.
- HTTP status codes.

## 6. Monetary Data Convention

All monetary values must be stored and transferred as integer paise.

Examples:

| Amount in INR | Integer paise |
|---|---:|
| ₹100.00 | 10000 |
| ₹560.00 | 56000 |
| ₹649.00 | 64900 |

The frontend must convert paise to INR for display.

The backend must perform monetary calculations using integer paise.

## 7. Billing Rules

1. Billing preview must not create invoices.
2. Billing runs must generate invoices for subscriptions due for billing.
3. Invoice generation must use database transactions.
4. Repeated billing runs must not create duplicate invoices for the same subscription and billing period.
5. Partial payments must reduce the outstanding balance.
6. When payments reach or exceed the invoice total, the invoice status becomes `PAID`.
7. Payments are simulated; no real payment gateway is integrated.

## 8. Frontend and Backend Integration

Frontend origin:

`http://localhost:5173`

Backend origin:

`http://localhost:5000`

API base URL:

`http://localhost:5000/api`

The backend must enable CORS for the frontend origin.

All API communication must use consistent JSON structures.

## 9. GitHub Workflow

| Member | Branch | Responsibility |
|---|---|---|
| Member 1 | `backend-dev` | Backend and billing engine |
| Member 2 | `frontend-dev` | Frontend and UI |
| Member 3 | `innovation-dev` | Documentation, integration testing and coordination |

- Members should push changes at hourly checkpoints.
- Member 3 coordinates reviews and merges into `main`.
- Members should avoid directly editing another member's assigned folders without coordination.

## 10. Pending Confirmations

- Final request and response JSON schemas.
- Database model fields and relationships.
- Authentication and role-management approach.
- Invoice and subscription status values.
- Error response format.
- Treatment of payments exceeding the invoice balance.
- Scope of products, quotations, taxes, discounts and staff management.

---

**Document Status:** Initial API contract based on the team's updated technical plan.

**Project:** BrightLoop Autopilot 1.0