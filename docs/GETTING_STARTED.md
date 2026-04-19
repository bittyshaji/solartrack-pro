# SolarTrack Pro - Quick Start Guide

**Get the app running in 5 minutes**

## Prerequisites (Already Installed?)

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version (need 9+)
npm --version
```

Not installed? Get from https://nodejs.org/

## 1. Clone & Install (2 min)

```bash
# Clone repository
git clone https://github.com/yourusername/solartrack-pro.git
cd solartrack-pro

# Install dependencies
npm install
```

## 2. Setup Environment (1 min)

```bash
# Copy example environment file
cp .env.example .env.local

# Add your Supabase credentials
# Ask team lead for: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

## 3. Run Development Server (1 min)

```bash
npm run dev
```

You'll see:

```
➜  Local:   http://localhost:5173/
```

Visit http://localhost:5173/ in your browser.

## 4. Create Test Account (1 min)

1. Click "Sign Up"
2. Enter email and password
3. Click "Create Account"
4. Check your email for verification link
5. Verify and login

Done! You're running SolarTrack Pro locally.

---

## Next Steps

- Read [ONBOARDING.md](../ONBOARDING.md) for detailed setup
- Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) to understand code layout
- See [CODING_STANDARDS.md](./CODING_STANDARDS.md) before making changes
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for workflow

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Quality checks
npm run test         # Run tests
npm run type-check   # Check TypeScript
npm run lint         # Lint code
npm run format       # Format code

# All checks
npm run test && npm run type-check && npm run lint
```

## Need Help?

- **Setup issues**: See [ONBOARDING.md](../ONBOARDING.md)
- **Common problems**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Questions**: Ask in #dev Slack channel
