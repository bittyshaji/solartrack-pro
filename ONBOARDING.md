# SolarTrack Pro - Developer Onboarding Guide

**Estimated setup time:** 30 minutes  
**Last updated:** April 2026

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Running Locally](#running-locally)
4. [First Steps](#first-steps)
5. [Troubleshooting](#troubleshooting)
6. [Resources](#resources)

---

## Prerequisites

### Required

- **Node.js 18+**: https://nodejs.org/
  - Verify: `node --version` (should be v18+)
- **npm 9+**: https://www.npmjs.com/
  - Verify: `npm --version`
- **Git**: https://git-scm.com/
  - Verify: `git --version`

### Recommended

- **Visual Studio Code**: https://code.visualstudio.com/
- **VS Code Extensions**:
  - ES7+ React/Redux/React-Native snippets
  - ESLint
  - Prettier - Code formatter
  - Thunder Client (for API testing)

### Accounts Needed

- GitHub account (for repository access)
- Supabase account (provided by team)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/solartrack-pro.git
cd solartrack-pro
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages defined in `package.json`.

### 3. Configure Environment Variables

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with provided credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:**
- Never commit `.env.local` (it's in `.gitignore`)
- Ask team lead for credentials
- Don't share credentials via email

### 4. VS Code Setup (Optional)

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Running Locally

### Start Development Server

```bash
npm run dev
```

Output should show:

```
VITE v5.1.0  ready in 123 ms

➜  Local:   http://localhost:5173/
```

Visit http://localhost:5173/ in browser.

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Watch mode testing |
| `npm run test:coverage` | Coverage report |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | Lint and fix code |
| `npm run format` | Format code with Prettier |

---

## First Steps

### 1. Review Project Structure

Read [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) to understand folder organization.

### 2. Understand Architecture

Read [ARCHITECTURE.md](./ARCHITECTURE.md) for high-level overview.

### 3. Create Test Account

1. Go to http://localhost:5173/
2. Click "Sign Up"
3. Create account with test email (e.g., test@example.com)
4. Verify email via Supabase dashboard

### 4. Make First Change

Create a simple feature to verify setup:

```javascript
// src/components/Welcome.jsx
export function Welcome() {
  return <h1>Welcome, {process.env.VITE_APP_NAME}!</h1>
}
```

Update `.env.local`:

```env
VITE_APP_NAME=Solar Developer
```

See your changes reflected at http://localhost:5173/

### 5. Run Tests

```bash
npm run test
```

Should show passing tests.

### 6. Format Your Code

```bash
npm run format
npm run lint
```

Ensures code follows project standards.

---

## Development Workflow

### Check Out a Feature Branch

```bash
# Create branch from main
git checkout -b feature/your-feature-name
```

### Make Changes

Follow guidelines in [CODING_STANDARDS.md](./docs/CODING_STANDARDS.md).

### Test Your Changes

```bash
# Unit tests
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Commit Changes

```bash
# Stage files
git add src/

# Commit with descriptive message
git commit -m "feat: add project status filter"

# Push to GitHub
git push origin feature/your-feature-name
```

### Create Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Follow PR template
4. Request review from team members

---

## Database Setup

### Access Supabase Dashboard

1. Go to https://supabase.com/
2. Sign in with provided credentials
3. Select project

### Explore Schema

- Navigate to "SQL Editor"
- Review table schemas
- Run sample queries

### Run Migrations (if needed)

```bash
# Supabase CLI (optional setup)
npm install -g supabase

# Login
supabase login

# Apply migrations
supabase migration pull
supabase db push
```

---

## Troubleshooting

### Port Already in Use

If `npm run dev` fails with port error:

```bash
# Use different port
npm run dev -- --port 3001
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Error

1. Verify `.env.local` has correct credentials
2. Check internet connection
3. Verify Supabase project is active
4. Check browser console for specific error

### TypeScript Errors

```bash
# Run type checker
npm run type-check

# Fix errors shown
# Common issues in TROUBLESHOOTING.md
```

### Build Failure

```bash
# Clear Vite cache
rm -rf .vite

# Rebuild
npm run build
```

---

## Testing Your Setup

Create a simple integration test:

```javascript
// src/components/Welcome.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Welcome } from './Welcome'

describe('Welcome', () => {
  it('displays welcome message', () => {
    render(<Welcome />)
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument()
  })
})
```

Run test:

```bash
npm run test
```

---

## Key Concepts to Understand

1. **React Hooks**: Custom hooks like `useAuth()`, `useService()`
2. **Supabase Client**: Direct DB access via `/src/lib/api/client.js`
3. **Zod Validation**: Type-safe schema validation
4. **React Router**: Page navigation
5. **React Context**: Global state (auth, projects)

---

## Next Steps

1. **Read Core Documentation**
   - SYSTEM_DESIGN.md - Detailed architecture
   - CONTRIBUTING.md - Development guidelines

2. **Explore Codebase**
   - Start with `src/contexts/AuthContext.jsx`
   - Then `src/hooks/useAuth.js`
   - Then simple feature (e.g., projects list)

3. **Set Up IDE**
   - Install recommended extensions
   - Configure formatters and linters
   - Set up debug configuration

4. **Join Team Communication**
   - Ask questions in #dev channel
   - Attend standup meetings
   - Review team decisions in `/docs/adr/`

---

## Resources

### Documentation

- [Architecture Documentation](./ARCHITECTURE.md)
- [System Design](./SYSTEM_DESIGN.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [ADRs (Architecture Decisions)](./docs/adr/)

### External Resources

- [React Docs](https://react.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)

### Tools

- [Supabase Dashboard](https://supabase.com/)
- [VS Code](https://code.visualstudio.com/)

---

## Getting Help

- **Setup Issues**: Post in #dev-help Slack channel
- **Code Questions**: Ask in PR review or #dev channel
- **Documentation**: Check CONTRIBUTING.md and TROUBLESHOOTING.md
- **Blocked**: Escalate to tech lead

**Welcome to the team!**
