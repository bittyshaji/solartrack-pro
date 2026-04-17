# CloudCatholic Pro - Quick Reference

## Project Overview

**What**: Modern ecommerce platform for Catholic products (India-focused)
**Target**: Launch MVP in 2-3 weeks, zero startup cost
**Stack**: Next.js + Supabase + Razorpay

---

## 5-Minute Setup

```bash
# 1. Create project
npx create-next-app@latest cloudcatholic-pro --typescript --tailwind

# 2. Install deps
npm install @supabase/supabase-js razorpay

# 3. Create .env.local with keys from Supabase & Razorpay

# 4. Run locally
npm run dev
```

---

## Key Files to Create

### Database Schema
**File**: Supabase SQL Editor
**Content**: Tables (products, categories, orders, order_items)

### API Routes (Backend)
- `app/api/products/route.ts` - GET products
- `app/api/categories/route.ts` - GET categories
- `app/api/orders/route.ts` - POST create order
- `app/api/payments/razorpay-create/route.ts` - Create payment
- `app/api/payments/razorpay-verify/route.ts` - Verify payment

### Pages (Routes)
- `app/page.tsx` - Homepage
- `app/products/page.tsx` - Product listing
- `app/products/[slug]/page.tsx` - Product detail
- `app/cart/page.tsx` - Shopping cart
- `app/checkout/page.tsx` - Checkout form
- `app/checkout/success/page.tsx` - Order confirmation

### Components
- `components/Header.tsx` - Navigation
- `components/ProductCard.tsx` - Product card
- `hooks/useCart.ts` - Cart state

---

## MVP Features Checklist

- [ ] Homepage with hero section
- [ ] Category-based product listing
- [ ] Product detail page
- [ ] Add to cart (localStorage)
- [ ] Shopping cart page
- [ ] Checkout form (address, phone)
- [ ] Razorpay payment integration
- [ ] Order confirmation page
- [ ] Order storage in database

---

## Razorpay Payment Flow

```
Customer clicks "Pay"
    ↓
Create order in Supabase (status: pending)
    ↓
Call API: POST /api/payments/razorpay-create
    ↓
Get Razorpay order ID
    ↓
Show Razorpay payment form (UPI/Card/Netbanking)
    ↓
Customer pays
    ↓
Razorpay calls handler with payment details
    ↓
Call API: POST /api/payments/razorpay-verify
    ↓
Verify signature with RAZORPAY_KEY_SECRET
    ↓
Update order: status = 'confirmed', payment_status = 'paid'
    ↓
Redirect to /checkout/success?order=ORD-...
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=         # From Supabase Settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase Settings
SUPABASE_SERVICE_ROLE_KEY=        # From Supabase Settings

NEXT_PUBLIC_RAZORPAY_KEY_ID=      # From Razorpay Settings
RAZORPAY_KEY_SECRET=              # From Razorpay Settings

NEXT_PUBLIC_APP_URL=              # http://localhost:3000 (local)
```

---

## Database Quick Ref

### Categories Table
```
id | name | slug | description | image_url | display_order | is_active
```

### Products Table
```
id | category_id | name | slug | description | price | image_url | stock_quantity | is_active
```

### Orders Table
```
id | order_number | customer_name | customer_email | customer_phone
street_address | city | state | postal_code
subtotal | shipping_cost | tax_amount | discount_amount | total_amount
payment_status | razorpay_order_id | razorpay_payment_id
status | created_at | updated_at
```

### Order Items Table
```
id | order_id | product_id | product_name | product_price | quantity | line_total
```

---

## Common Tasks

### Add New Product Category

```sql
INSERT INTO categories (name, slug, description, display_order) 
VALUES ('Books', 'books', 'Catholic books and devotionals', 1);
```

### Add New Product

```sql
INSERT INTO products (category_id, name, slug, description, price, image_url, stock_quantity)
VALUES (1, 'The Catechism', 'catechism', 'Complete Catholic faith guide', 599.99, 'url', 50);
```

### Get Orders Report

```sql
SELECT 
  o.order_number,
  o.customer_name,
  o.total_amount,
  o.payment_status,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Export Orders to CSV

In Supabase UI:
1. Go to Data Editor
2. Select "orders" table
3. Click "Export" → "CSV"

---

## UI/UX Best Practices

- Use TailwindCSS utility classes
- Mobile-first responsive design
- High-quality product images (300x300px min)
- Clear pricing in INR
- Trust signals (secure badge, fast shipping)
- Fast checkout (3 fields max)
- Error messages in red, success in green

---

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Homepage | < 2s | Image optimization + CDN |
| Product page | < 1.5s | ISR (static generation) |
| Cart | < 500ms | localStorage (client-side) |
| Checkout | < 2s | Form validation before API |
| Mobile | 80+ Lighthouse | Responsive design + lazy load |

---

## Deployment Command

```bash
# Deploy to Vercel
git push origin main  # Vercel auto-deploys

# Or manual:
vercel --prod
```

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Razorpay Docs: https://razorpay.com/docs
- TailwindCSS: https://tailwindcss.com

---

**Last Updated**: March 26, 2026
**Status**: Ready to build! 🚀
