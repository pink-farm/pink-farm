# Pink Farm

Pink Farm is a Next.js storefront for packaged foods. Its server uses MongoDB through Prisma, Resend for customer email OTP, and signed HTTP-only sessions. Razorpay credentials are placeholders; online payment is not enabled until payment integration is configured.

## Local setup

1. Install Node.js and run `npm install`.
2. Create a MongoDB Atlas database (or a local MongoDB replica set). Add its connection string to `DATABASE_URL`. MongoDB transactions require a replica set, including for local development.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `SESSION_SECRET` of at least 32 characters, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` on a verified Resend domain, `ADMIN_EMAIL`, and a strong unique `ADMIN_PASSWORD` (at least 16 characters).
4. Run `npm run db:generate`, then `npm run db:push`, then `npm run db:seed`.
5. Start the store with `npm run dev`.

The seed command creates the admin using the supplied email and a bcrypt password hash. Do not commit `.env` or use development credentials in production.

## Backend state

- Customer sign-in uses a six-digit email code sent through Resend. Codes are stored as hashes, expire after ten minutes, and permit at most five verification attempts. Requests are throttled per address.
- Admin sessions and pages require verified credentials. Admin API mutations also enforce the session on the server.
- Order totals are calculated on the server from current catalog prices, stock, delivery settings, and coupon eligibility. Checkout currently supports cash on delivery; stock is reserved as part of the order transaction and restored if the order is cancelled. Razorpay online payments are not enabled yet.
- Customer order history and cancellation are bound to the signed-in customer ID. Guest orders can be created, but are not exposed through the authenticated account.
- Customer profile and address management, transactional notifications, shipping carrier integration, payment collection/refunds, production stock reservations, and deployment monitoring still need implementation before launch.

## Production deployment

Provision MongoDB with network access restricted to the deployed application, set all secrets in the deployment platform, configure a verified Resend sender domain and DNS records, run Prisma generation and schema push against the intended database, seed the initial admin securely, and verify the deployed domain uses HTTPS. Configure Razorpay only when ready to enable paid orders.
