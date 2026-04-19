# Contributing to SolarTrack Pro

**Status:** Active Development  
**Last Updated:** April 2026

Welcome! This guide explains how to contribute to SolarTrack Pro.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Commit Messages](#commit-messages)
8. [Review Guidelines](#review-guidelines)

---

## Code of Conduct

- Treat all team members with respect
- Provide constructive feedback
- Ask questions rather than assume
- Share knowledge and help others
- Report issues through proper channels

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- VS Code (recommended)

### Initial Setup

See [ONBOARDING.md](./ONBOARDING.md) for detailed setup instructions.

Quick start:

```bash
git clone <repo>
cd solartrack-pro
npm install
cp .env.example .env.local  # Add credentials
npm run dev
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/feature-name
# or for bugs:
git checkout -b fix/bug-name
# or for docs:
git checkout -b docs/documentation-name
```

Branch naming: `feature/`, `fix/`, `docs/`, `refactor/` prefix.

### 2. Make Changes

- Follow [CODING_STANDARDS.md](./docs/CODING_STANDARDS.md)
- One feature per branch
- Commit frequently with clear messages
- Write tests for new features

### 3. Run Local Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test

# All checks
npm run test && npm run type-check && npm run lint
```

All checks must pass before submitting PR.

### 4. Commit Changes

```bash
git add src/
git commit -m "feat: add project filters to dashboard"
```

See [Commit Messages](#commit-messages) for format.

### 5. Push and Create PR

```bash
git push origin feature/feature-name
```

Go to GitHub and create Pull Request.

### 6. Address Review Feedback

- Read reviewer comments carefully
- Make requested changes
- Commit with "Address review feedback" message
- Don't force-push (keep review history)

### 7. Merge

Once approved and tests pass:
- Squash or rebase per team preference
- Delete feature branch
- Celebrate!

---

## Code Standards

### File Structure

```
feature-folder/
├── Component.jsx           # Main component
├── Component.module.css    # Styles
├── Component.test.jsx      # Tests
├── useFeature.js           # Custom hook
├── Feature.constants.js    # Constants
└── index.js                # Barrel export
```

### Naming Conventions

| Item | Format | Example |
|------|--------|---------|
| Components | PascalCase | `ProjectForm.jsx` |
| Hooks | camelCase, prefix `use` | `useProjectForm.js` |
| Functions | camelCase | `formatDate()` |
| Constants | UPPER_SNAKE_CASE | `MAX_PROJECTS` |
| Types | PascalCase | `ProjectData` |
| Directories | kebab-case | `project-form/` |

### Component Guidelines

```javascript
// Good component structure
export function ProjectCard({ project, onEdit, onDelete }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDelete = async () => {
    if (!window.confirm('Delete project?')) return
    setIsLoading(true)
    try {
      await ProjectService.delete(project.id)
      onDelete(project.id)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      {user.id === project.created_by && (
        <button onClick={handleDelete} disabled={isLoading}>
          Delete
        </button>
      )}
    </div>
  )
}
```

### TypeScript Usage

```javascript
// Type function inputs and outputs
// (gradually migrating to TypeScript)
function calculateProjectSavings(capacity, rate) {
  return capacity * rate * 25
}

// Use JSDoc for non-TypeScript files
/**
 * Calculate annual savings for solar project
 * @param {number} capacity - Solar capacity in kW
 * @param {number} rate - Electricity rate per kWh
 * @returns {number} Annual savings in dollars
 */
function calculateProjectSavings(capacity, rate) {
  return capacity * rate * 25
}
```

### Error Handling

```javascript
// Always handle errors
async function loadProjects() {
  try {
    const projects = await ProjectService.list()
    setProjects(projects)
  } catch (error) {
    logger.error('Failed to load projects', { error })
    toast.error('Failed to load projects')
  }
}

// Never swallow errors silently
// Bad:
catch (error) { }

// Good:
catch (error) {
  console.error(error)
  handleError(error)
}
```

---

## Testing Requirements

### Test Coverage Goals

| Type | Coverage | Files |
|------|----------|-------|
| Utilities | 90%+ | `src/utils/` |
| Hooks | 80%+ | `src/hooks/` |
| Services | 70%+ | `src/lib/services/` |
| Components | 50%+ | `src/components/` |

### Writing Tests

```javascript
// Use Vitest and React Testing Library
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectForm } from './ProjectForm'

describe('ProjectForm', () => {
  it('submits valid data', async () => {
    const handleSubmit = vi.fn()
    render(<ProjectForm onSubmit={handleSubmit} />)
    
    await userEvent.type(screen.getByLabelText('Title'), 'New Project')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(handleSubmit).toHaveBeenCalled()
  })
  
  it('shows validation errors', async () => {
    render(<ProjectForm onSubmit={vi.fn()} />)
    
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(screen.getByText('Title is required')).toBeInTheDocument()
  })
})
```

### Run Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Specific file
npm run test src/utils/formatDate.test.js

# Coverage
npm run test:coverage
```

---

## Pull Request Process

### Before Creating PR

1. Update local repository:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Run all checks:
   ```bash
   npm run type-check && npm run lint && npm run test
   ```

3. If using new dependencies, update package.json and lock file

### PR Title Format

```
feat: add project status filters
fix: correct date format in invoices
docs: update API documentation
refactor: simplify ProjectService
style: format code
test: add ProjectService tests
chore: update dependencies
```

### PR Description Template

```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests added
- [ ] Manual testing completed
- [ ] No test coverage needed (explain)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Tests pass locally

## Related Issues
Fixes #123
```

### Review Checklist

Reviewers check:

- Code follows standards
- Tests are adequate
- No security issues
- Performance acceptable
- Documentation clear
- No unnecessary dependencies

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (no logic change)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Build, deps, tooling

### Examples

```bash
git commit -m "feat(projects): add status filter to list view"

git commit -m "fix(auth): correct token refresh on session timeout

Previously tokens would not refresh properly when session expired.
Now using automatic refresh token rotation from Supabase.

Fixes #456"

git commit -m "docs: update database schema documentation"
```

### Best Practices

- Use imperative mood ("add" not "added" or "adds")
- Keep subject under 50 characters
- Reference issues: "Fixes #123"
- One logical change per commit
- Can be read as: "This commit will <your message>"

---

## Review Guidelines

### For Authors

- Keep PRs focused on one feature
- Request review when ready
- Respond promptly to comments
- Thank reviewers for their time

### For Reviewers

- Review within 24 hours when possible
- Be constructive and specific
- Ask questions rather than demand changes
- Approve when satisfied
- Use "Request Changes" only for critical issues

### Review Levels

**Approval** - "Looks good, merging"
```
✓ Code is correct
✓ Tests cover changes
✓ No obvious issues
```

**Approve with suggestions** - "Good to merge, consider..."
```
✓ Code is correct
• Consider renaming variable for clarity
• Optional: extract helper function
```

**Request changes** - "Need modifications before merge"
```
✗ Security concern
✗ Test coverage insufficient
✗ Performance issue
```

---

## Common Tasks

### Add New Feature

1. Create feature branch
2. Create folder in appropriate feature directory
3. Add component/hook/service
4. Add tests
5. Update documentation
6. Submit PR

### Fix Bug

1. Create branch from `main`
2. Write failing test first (TDD)
3. Fix bug
4. Verify test passes
5. Submit PR

### Update Documentation

1. Edit relevant `.md` file
2. Check links still work
3. Run `npm run format` on markdown
4. Submit PR

### Add Dependency

1. Discuss with team first
2. Add with: `npm install package-name`
3. Update PR description with rationale
4. Be mindful of bundle size

---

## Performance Considerations

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Implement code splitting for large features
- Monitor bundle size in build

## Accessibility

- Use semantic HTML
- Add alt text to images
- Ensure keyboard navigation
- Use ARIA labels where needed
- Test with screen readers

## Security

- Never commit secrets or credentials
- Use environment variables for config
- Validate user input (Zod schemas)
- Escape user-generated content
- Report security issues privately

---

## Getting Help

- **Questions about workflow**: Ask in #dev channel
- **Code review feedback**: Reply in PR discussion
- **Setup/environment issues**: See ONBOARDING.md
- **Blocked or stuck**: Talk to tech lead

---

## Credits

Contributors who have helped:
- See CHANGELOG.md for major contributors

Thank you for contributing to SolarTrack Pro!
