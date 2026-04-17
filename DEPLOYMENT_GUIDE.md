# CloudCatholic Pro - Deployment Guide

**Target**: Production deployment on Vercel + Supabase (zero cost to start)

---

## PHASE 1: SETUP EXTERNAL SERVICES

### 1. Supabase Setup (PostgreSQL Database)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (or email)
4. Create new project:
   - Organization: Choose free tier
   - Project name: `cloudcatholic-pro`
   - Database password: Save securely
   - Region: Choose India (Mumbai) for low latency
   - Edition: Free

5. Wait for project to initialize (2-3 minutes)

6. Go to **Settings → API**:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

7. Go to **SQL Editor**, run schema:
   ```sql
   -- Paste entire schema from ECOMMERCE_ARCHITECTURE.md
   ```

8. Go to **Storage**, create bucket:
   - Name: `product-images`
   - Make public

### 2. Razorpay Setup (Payments)

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up:
   - Business type: E-commerce Store
   - Product category: Books/Religious Goods
   - Monthly transaction volume: < ₹1 lakh (start)

3. Complete KYC:
   - Business details
   - Bank account
   - Expected timeline: 2-3 business days

4. Once activated, go to **Settings → API Keys**:
   - Copy `Key ID` → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Copy `Key Secret` → `RAZORPAY_KEY_SECRET`

5. Enable payment methods:
   - Go to Settings → Payments
   - Enable: UPI, Debit Card, Credit Card, Netbanking

### 3. GitHub Setup

1. Create GitHub repo:
   - Name: `cloudcatholic-pro`
   - Visibility: Public
   - Add .gitignore for Node.js

2. Clone and setup:
   ```bash
   git clone https://github.com/yourname/cloudcatholic-pro.git
   cd cloudcatholic-pro
   npm install
   ```

---

## PHASE 2: LOCAL DEVELOPMENT

### 1. Create Environment File

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_xxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Test Locally

```bash
npm run dev
# Open http://localhost:3000
```

Test:
- Homepage loads
- Products display
- Add to cart works
- Checkout form appears
- Payment flow initializes

### 3. Test Razorpay Sandbox

1. In `.env.local`, use **test keys** from Razorpay dashboard
2. Complete checkout flow
3. You'll get Razorpay sandbox payment form
4. Use test card: `4111 1111 1111 1111`
5. Any future date, any CVV

---

## PHASE 3: PRODUCTION DEPLOYMENT

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit: CloudCatholic Pro MVP"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Import Project"**
4. Select `cloudcatholic-pro` repo
5. Click **"Import"**

### 3. Add Environment Variables

In Vercel dashboard:
1. Go to **Settings → Environment Variables**
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com` (update later)

3. Set for: Production, Preview, Development

### 4. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Vercel auto-deploys on every push to main
4. Get unique URL: `cloudcatholic-pro-xxx.vercel.app`

---

## PHASE 4: CUSTOM DOMAIN (Optional)

### 1. Buy Domain

Recommended registrars (India-friendly):
- [Namecheap.com](https://namecheap.com) - ₹100-300/year
- [GoDaddy.com](https://godaddy.com) - ₹200-400/year
- [Hostinger.com](https://hostinger.com) - ₹200-500/year

Buy domain: `cloudcatholic.in` or similar

### 2. Add Domain to Vercel

1. In Vercel project, go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter domain: `cloudcatholic.in`
4. Select: "Connect Domain"
5. Add DNS records shown (usually automated)

### 3. Update DNS (at Registrar)

1. Go to registrar DNS settings
2. Add records provided by Vercel:
   - A record
   - CNAME record
   - TXT record (verification)

3. Wait 15-30 minutes for DNS propagation
4. Vercel auto-generates SSL certificate

### 4. Update App URL

In Vercel **Settings → Environment Variables**:
- Change `NEXT_PUBLIC_APP_URL` to `https://cloudcatholic.in`
- Redeploy

---

## PHASE 5: POST-LAUNCH

### 1. Performance Monitoring

- Vercel dashboard shows:
  - Build times
  - Function execution times
  - Error rates

- Supabase dashboard shows:
  - Database queries
  - Storage usage
  - Auth events

### 2. Analytics

Add free analytics:

Option A: Vercel Web Analytics (built-in)
- No code needed
- Enabled by default
- See in Vercel dashboard

Option B: Google Analytics (free)
```typescript
// In layout.tsx
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### 3. Email Notifications (Optional)

For transactional emails (order confirmation):

```bash
npm install resend
```

```typescript
// app/api/orders/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// After order created:
await resend.emails.send({
  from: 'orders@cloudcatholic.in',
  to: customer_email,
  subject: `Order Confirmed: ${order_number}`,
  html: `<p>Thank you for your order!</p>...`,
});
```

### 4. Monitoring Checklist

- [ ] All pages load < 2 seconds
- [ ] Images optimized
- [ ] Cart persists across sessions
- [ ] Payment flow works end-to-end
- [ ] Order emails send
- [ ] Mobile responsive (test on phone)
- [ ] Lighthouse score > 80

---

## TROUBLESHOOTING

### Deployment Fails

**Error**: "Environment variables missing"
**Fix**: Add all env vars in Vercel Settings

**Error**: "Database connection failed"
**Fix**: Check Supabase URL and keys in .env.local

### Payment Flow Broken

**Error**: "Razorpay key undefined"
**Fix**: Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is in Vercel env vars (with NEXT_PUBLIC_ prefix)

**Error**: "Payment verified but order not created"
**Fix**: Check Supabase RLS policies, may need to update

### Images Not Loading

**Error**: "403 Forbidden" on product images
**Fix**: Make Supabase Storage bucket public

```sql
-- In Supabase SQL:
UPDATE storage.buckets SET public = true WHERE name = 'product-images';
```

---

## COST ANALYSIS

### Startup Costs: ₹0

| Service | Free Tier | Monthly Limit |
|---------|-----------|---------------|
| Supabase | ✅ | 500MB DB, 1GB storage |
| Vercel | ✅ | Unlimited deployments |
| Razorpay | ✅ | No monthly fee (2% + ₹3 per txn) |

### When You Scale

| Service | Usage | Est. Cost/Month |
|---------|-------|-----------------|
| Supabase | 50GB storage | ₹500-1000 |
| Vercel | 100GB bandwidth | ₹500-2000 |
| Razorpay | 100 orders @ ₹500 avg | ₹950 (2%) + ₹300 (flat) |

**You pay only after making money!**

---

## FINAL CHECKLIST

- [ ] Supabase project created
- [ ] Database schema loaded
- [ ] Razorpay merchant account active
- [ ] GitHub repo initialized
- [ ] Environment variables set
- [ ] Local testing passed
- [ ] Deployed to Vercel
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] Payment flow tested (sandbox)
- [ ] Order confirmation emails working
- [ ] Analytics configured
- [ ] Monitoring dashboard setup

---

## GOING LIVE WITH REAL PAYMENTS

1. Switch Razorpay to **Live Keys** (not test)
2. Update `.env.local` and redeploy to Vercel
3. Run payment test with ₹1-10 order
4. Verify payment appears in Razorpay dashboard
5. Confirm order appears in Supabase
6. Launch marketing

---

**Estimated Time**: Setup ~4 hours, Deployment ~30 minutes
**Estimated Cost**: ₹0 to start, ₹0 until first sale

Ready to launch! 🚀
