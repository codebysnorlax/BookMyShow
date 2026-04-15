# BookMyShow - Info

## What this project does

A simplified movie seat booking backend. Users register, log in, and book seats. Each user gets a random starting balance. Seats have different prices based on their type and row. Booking deducts the seat price from the user's balance.

---

## Tech Stack

- Node.js with Express (ESM / .mjs)
- PostgreSQL via Docker
- bcryptjs for password hashing
- jsonwebtoken (JWT) for authentication
- dotenv for environment config

---

## Setup

### 1. Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed

### 2. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL container named `chai_sql_db` on port `5433`. The `init.sql` file runs automatically and creates the `seats` and `users` tables with seed data.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

The `.env` file is already present with default values:

```
PORT=8080
JWT_SECRET=supersecret

DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sql_book_my_show_db
```

Change `JWT_SECRET` to something strong before deploying.

### 5. Start the server

```bash
npm start
```

Server runs at `http://localhost:8080`.

---

## API Flow

### Register a user

```
POST /register
Content-Type: application/json

{ "username": "alice", "password": "pass123" }
```

Creates a new user. A random balance between $300 and $1500 is assigned automatically. Returns `201` on success.

---

### Login

```
POST /login
Content-Type: application/json

{ "username": "alice", "password": "pass123" }
```

Returns a JWT token and the user's current balance. Use this token in all protected requests.

```json
{ "token": "<jwt>", "balance": 850 }
```

---

### View all seats

```
GET /seats
```

Public endpoint. Returns all 30 seats with their id, price, type, booking status, and the name of who booked them (if booked).

Seat layout:
- Row 0: 5 sofa seats ($1200-$1500)
- Row 1: 5 premium seats ($750-$900)
- Row 2: 5 standard seats ($450-$580)
- Row 3: 5 economy seats ($220-$320)
- Row 4: 5 cheap seats ($60-$130)
- Row 5: 5 last-row seats ($40-$80)

---

### Book a seat (protected)

```
PUT /:id
Authorization: Bearer <token>
```

Replace `:id` with the seat number (e.g. `PUT /5`).

Rules:
- You must be logged in (valid JWT required).
- The seat must not already be booked.
- If it is your first booking, you can book even if your balance is low (balance will not go below 0).
- For any booking after the first, you need enough balance to cover the seat price.
- The seat is locked during the transaction to prevent double-booking.

Returns the updated balance on success.

---

### Apply a coupon (protected)

```
POST /coupon
Authorization: Bearer <token>
Content-Type: application/json

{ "code": "SNOR99" }
```

Available codes:
- `SNOR99` — adds $100
- `CHAI50` — adds $50
- `VIP500` — adds $500

Each code can only be used once per user.

---

## Database

Connect directly to inspect data:

```bash
docker exec -it chai_sql_db psql -U postgres -d sql_book_my_show_db
```

Useful queries:

```sql
-- See all seats and who booked them
SELECT * FROM seats ORDER BY id;

-- See all registered users
SELECT * FROM users;

-- Reset all seats to unbooked
UPDATE seats SET name = NULL, isbooked = 0;
```

---

## Notes

- The server auto-creates tables on startup if they do not exist, so the database just needs to be running.
- Passwords are hashed with bcrypt (10 rounds) and never stored in plain text.
- JWT tokens expire after 1 day.
- The frontend (`index.html`) is served at `GET /` but is optional for evaluation.


# start
```bash
docker compose up

docker exec -it chai_sql_db psql -U postgres -d sql_book_my_show_db

```
```sql
-- to see who are taken seat and how much
SELECT * FROM seats ORDER BY id;
-- to see user that has been registered 
SELECT * FROM users;
-- ! for set seats to default values
UPDATE seats SET name = NULL, isbooked = 0;
```
--- 
# instructions
Your goal is to build a simplified Book My Ticket platform where:

    Users can register
    Users can login
    Only authenticated users can access protected endpoints
    Logged-in users can book seats for a movie

For now, you can assume mock movie data and focus mainly on authentication and seat booking logic. Frontend is optional. You can build it if you want, but evaluation will be based on backend implementation.

This assignment is designed to simulate a real developer scenario where you extend an existing production codebase instead of starting fresh.
Rules & Guidelines

    Starter source code must be used as the base
    Do not remove or break existing endpoints
    Add authentication layer on top of the current system
    Implement register and login functionality
    Protect booking related endpoints using auth middleware
    Only logged-in users should be allowed to book seats
    Prevent duplicate seat bookings
    Associate bookings with logged-in users
    Keep movie data mocked for now
    Frontend is optional
    Code should be clean, structured and readable
    Submit a working GitHub repository with proper README explaining setup and flow
