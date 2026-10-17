# Pink Farm

Pink Farm is a Next.js storefront for packaged foods. Its server uses MongoDB through Prisma, Brevo for customer email OTP, and signed HTTP-only sessions. Online payment is disabled; checkout currently offers cash on delivery only.

## Local setup

1. Install Node.js and run `npm install`.
2. Create a MongoDB Atlas database (or a local MongoDB replica set). Add its connection string to `DATABASE_URL`. MongoDB transactions require a replica set, including for local development.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `SESSION_SECRET` of at least 32 characters, `BREVO_API_KEY`, `BREVO_FROM_EMAIL` on a verified sender domain, and a strong unique `ADMIN_PASSWORD` (at least 16 characters). The admin email defaults to `pinkfarmofficial@gmail.com`; set `ADMIN_EMAIL` to override it. `ADMIN_JWT_SECRET` is deprecated; sessions and OTPs use `SESSION_SECRET`.
4. Run `npm run db:generate`, then `npm run db:push`, then `npm run db:seed`.
5. Start the store with `npm run dev`.

The seed command creates the admin using the supplied email and a bcrypt password hash. Do not commit `.env` or use development credentials in production.

## Backend state

- Customer sign-in uses a six-digit email code sent through Brevo. Codes are stored as hashes, expire after ten minutes, and permit at most five verification attempts. OTP request, verification, password reset, and password-login attempts are throttled in MongoDB so limits are shared by serverless instances. Authentication fails closed if the limiter collection is unavailable.
- Admin sessions expire after eight hours; customer sessions expire after 30 days. Sessions use `SESSION_SECRET`, issuer and audience claims, and server-side revocation on logout. Admin pages use Proxy as an early redirect and continue to enforce authorization in the protected layout and API routes.
- Order totals are calculated on the server from current catalog prices, stock, delivery settings, and coupon eligibility. Checkout supports cash on delivery; stock is reserved as part of the order transaction and restored if the order is cancelled. Razorpay online payments are not enabled.
- Customer order history and cancellation are bound to the signed-in customer ID. Guest orders can be created, but are not exposed through the authenticated account.
- Customer profile and address management, transactional notifications, shipping carrier integration, payment collection/refunds, production stock reservations, and deployment monitoring still need implementation before launch.

## Production deployment

Provision MongoDB with network access restricted to the deployed application, set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, and Brevo sender credentials in the deployment platform, optionally set `ADMIN_EMAIL` to override the default owner address, run Prisma generation and schema push against the intended database, seed the initial admin securely, and verify the deployed domain uses HTTPS. Configure Razorpay only as part of a separately reviewed online-payment implementation; setting Razorpay secrets alone does not enable online payments.

The `AuthRateLimit` collection is a new additive schema requirement. Back up the intended database, review Prisma's proposed schema changes, and apply `npm run db:push` to the target environment before deployment. Do not run it against production without a current backup and an approved maintenance plan.
