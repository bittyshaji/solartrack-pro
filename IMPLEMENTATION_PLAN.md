# CloudCatholic Pro - Step-by-Step Implementation Plan

**Phase**: MVP (Weeks 1-3)
**Target**: Production-ready ecommerce with Razorpay integration
**Date**: March 26, 2026

---

## QUICK START - 7 STEPS TO LAUNCH

### STEP 1: Project Setup (Day 1)

```bash
npx create-next-app@latest cloudcatholic-pro --typescript --tailwind
cd cloudcatholic-pro
npm install @supabase/supabase-js razorpay axios lucide-react
npm install -D @types/razorpay
```

### STEP 2: Setup Supabase (Day 1)

1. Create free project at supabase.com
2. Run the SQL schema from `ECOMMERCE_ARCHITECTURE.md`
3. Copy API keys to `.env.local`

### STEP 3: Setup Razorpay (Day 1)

1. Create merchant account at razorpay.com
2. Get API keys from Settings
3. Add to `.env.local`

### STEP 4: Create Core API Routes (Day 2)

- `/api/products` - GET products
- `/api/categories` - GET categories
- `/api/orders` - POST new orders
- `/api/payments/razorpay-create` - Create payment
- `/api/payments/razorpay-verify` - Verify payment

### STEP 5: Build Components (Day 3)

- Header (navigation + cart icon)
- ProductCard (product display)
- ProductGrid (grid layout)
- Cart (item management)
- CheckoutForm (address + payment)

### STEP 6: Create Pages (Day 4)

- `/` - Homepage
- `/products` - Product listing with filters
- `/products/[slug]` - Product detail
- `/cart` - Shopping cart
- `/checkout` - Checkout form
- `/checkout/success` - Order confirmation

### STEP 7: Deploy (Day 5)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy with 1 click

---

## TECH STACK SUMMARY

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 | SSR, API routes, Vercel optimized |
| Backend | Supabase | PostgreSQL, auth, storage, free tier |
| Database | PostgreSQL | Relational, scalable, export-friendly |
| Payments | Razorpay | India #1, UPI support, developer-friendly |
| Hosting | Vercel | Next.js native, auto-scaling, $0 startup |

---

## KEY DELIVERABLES

### Database Schema (PostgreSQL)
- products
- categories
- orders
- order_items
- customers (for Phase 2)

### API Routes (Next.js)
- GET /api/products - List all products
- GET /api/categories - List categories
- POST /api/orders - Create order
- POST /api/payments/razorpay-create - Initialize payment
- POST /api/payments/razorpay-verify - Verify payment signature

### Pages
- Homepage with hero + categories
- Products listing with filters
- Product detail page
- Shopping cart
- Checkout form
- Order success page

### Components
- Header with navigation
- ProductCard for product display
- Cart management
- Checkout form
- Toast notifications

---

## ENVIRONMENT VARIABLES

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## NEXT STEPS

1. Follow ECOMMERCE_ARCHITECTURE.md for detailed design
2. Create Supabase project and run SQL schema
3. Setup Razorpay merchant account
4. Initialize Next.js project
5. Build API routes first (backend)
6. Build components (reusable UI)
7. Build pages (routes)
8. Test entire checkout flow
9. Deploy to Vercel

---

See ECOMMERCE_ARCHITECTURE.md for complete technical details and code patterns.
