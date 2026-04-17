# Maran Farms Backend (Node + MongoDB + Razorpay)

This backend is fully wired for:
- Auth (register/login/JWT)
- Products API (public read, admin CRUD)
- Orders API (checkout + payment verify + order history)
- Razorpay payment integration

## Free Stack Used
- Runtime: Node.js + Express
- Database: MongoDB Atlas Free Tier (M0)
- Payment: Razorpay (no monthly fee, pay-per-transaction in live mode)
- Hosting (recommended): Render/Railway free tier for API

## 1) Create Free Services
1. Create MongoDB Atlas free cluster and copy connection string.
2. Create Razorpay account and switch to Test Mode.
3. Copy Razorpay `Key ID` and `Key Secret`.

## 2) Backend Setup
1. Go to `backend`.
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Fill env values:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` as `http://localhost:8080`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
5. Seed products:
   - `npm run seed`
6. Run server:
   - `npm run dev`

API base URL: `http://localhost:4000/api`

## 3) API Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PATCH /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/orders/checkout`
- `POST /api/orders/verify-payment`
- `GET /api/orders/my`
- `GET /api/orders` (admin)
- `PATCH /api/orders/:id/status` (admin)

## 4) Admin User
Register using:
- `admin@maranfarms.com`

This email is automatically marked as admin during registration.

## 5) Payment Flow
1. Frontend calls `/orders/checkout` with cart + delivery details.
2. Backend creates order in DB and Razorpay order.
3. Frontend opens Razorpay popup.
4. On success, frontend calls `/orders/verify-payment`.
5. Backend verifies signature, marks order as paid, reduces stock.
