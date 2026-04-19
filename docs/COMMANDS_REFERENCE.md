# SolarTrack Pro - Commands Reference

**All npm scripts and useful commands**

## NPM Scripts

### Development

```bash
npm run dev              # Start development server on http://localhost:5173
npm run build            # Build for production
npm run preview          # Preview production build locally
```

### Quality Assurance

```bash
npm run type-check       # TypeScript type checking
npm run type-check:watch # Watch mode type checking
npm run lint             # ESLint check and fix
npm run lint:check       # ESLint check only
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Testing

```bash
npm run test             # Run all tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Combined Commands

```bash
# Run all quality checks (before committing)
npm run test && npm run type-check && npm run lint

# Full check with formatting
npm run format && npm run lint && npm run type-check && npm run test
```

---

## Git Commands

### Branches

```bash
# Create feature branch
git checkout -b feature/feature-name

# Create bug fix branch
git checkout -b fix/bug-description

# Create documentation branch
git checkout -b docs/documentation

# Switch branches
git checkout main
git checkout feature-name

# List all branches
git branch -a

# Delete branch
git branch -d feature-name          # Local
git push origin --delete feature-name # Remote
```

### Commits

```bash
# Check status
git status

# Stage files for commit
git add src/                        # Add whole directory
git add src/file.jsx                # Add specific file
git add .                           # Add all changes

# Commit with message
git commit -m "feat: add project filters"

# Commit with detailed message
git commit -m "feat: add project filters

This adds ability to filter projects by status and date range.

- Adds FilterPanel component
- Updates ProjectService with filter method
- Adds tests for filtering logic"

# Amend last commit (if not pushed)
git commit --amend -m "new message"

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Pushing & Pulling

```bash
# Push branch to GitHub
git push origin feature-name        # First time
git push                            # Subsequent pushes

# Push with upstream tracking
git push -u origin feature-name

# Pull latest changes
git pull origin main                # Pull specific branch
git pull                            # Pull current branch

# Fetch without merging
git fetch origin
```

### History & Logs

```bash
# View commit history
git log                             # Full history
git log --oneline                   # Condensed
git log --graph --oneline --all    # Visual branch history

# View specific commit
git show commit-hash

# Compare branches
git diff main feature-name

# Find who changed a line
git blame src/file.jsx
```

### Working with PRs

```bash
# Create branch, make changes, push
git checkout -b feature/new-feature
git add .
git commit -m "feat: description"
git push origin feature/new-feature

# Then on GitHub: Create Pull Request

# After review, merge to main:
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main

# Clean up
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

---

## Vite Commands

These are run automatically by npm scripts, but useful to know:

```bash
# Start dev server (npm run dev does this)
vite

# Build (npm run build does this)
vite build

# Preview build
vite preview

# Analyze bundle
vite --analyze
```

---

## TypeScript Commands

```bash
# Check types
tsc --noEmit

# Watch mode
tsc --noEmit --watch
```

---

## Browser Console Commands

Useful for debugging in browser DevTools:

```javascript
// Check auth state
localStorage.getItem('supabase.auth.token')

// Check current user
console.log(window.__AUTH_USER__)

// Clear local storage
localStorage.clear()

// Reload page
location.reload()
```

---

## Troubleshooting Commands

```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Clear build output
rm -rf dist

# Full clean (dangerous - removes all!)
npm run clean  # (if configured in package.json)
```

---

## Useful Shell Aliases

Add to `.bashrc` or `.zshrc`:

```bash
# Development
alias st-dev="npm run dev"
alias st-build="npm run build"
alias st-test="npm run test:watch"

# Quality checks
alias st-lint="npm run lint"
alias st-format="npm run format"
alias st-check="npm run type-check && npm run lint && npm run test"

# Git
alias gst="git status"
alias gadd="git add"
alias gcom="git commit"
alias gpush="git push"
alias gpull="git pull"
```

---

## Production Deployment

```bash
# Build for production
npm run build

# This creates optimized build in dist/

# Then deploy dist/ to hosting platform:
# - Vercel: git push triggers automatic deployment
# - Netlify: npm run build runs automatically
# - Others: Follow their deployment guide
```

---

## CI/CD Pipeline Commands

These run automatically in GitHub Actions, but good to understand:

```bash
# Type checking
npm run type-check

# Linting
npm run lint:check

# Testing
npm run test -- --coverage

# Build
npm run build
```

---

## Visual Studio Code Command Palette

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac):

```
> Format Document              - Format current file
> Organize Imports             - Sort imports
> Go to Definition             - Jump to definition
> Find References              - Find all uses
> Rename Symbol                - Rename variable/function
> Start Debugging              - Start debugger
```

---

## Performance Analysis

```bash
# Analyze bundle size
npm run build && npx vite-plugin-visualizer

# Check performance metrics
npm run build -- --analyze
```

---

## Useful Resources

- [npm commands docs](https://docs.npmjs.com/cli/commands)
- [Git documentation](https://git-scm.com/doc)
- [Vite guide](https://vitejs.dev/)
- [TypeScript CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

---

**Quick Reference:** Keep this open while developing!
