# ADR-004: Testing Strategy

**Status:** Accepted  
**Date:** March 2024

## Context

Need to ensure code quality, prevent regressions, and enable confident refactoring. Testing approach must balance coverage with development velocity.

## Decision

Implement a three-tier testing strategy:
1. Unit tests for utilities and hooks
2. Integration tests for services
3. End-to-end tests for critical user flows

## Rationale

### Test Pyramid

```
      E2E Tests (Critical paths)
       /            \
      /  Integration  \
     /   (Services)     \
    /___________________\
   Unit Tests (Utils/Hooks)
```

### Testing Framework

**Vitest** for unit and integration tests:
- Fast (Vite-native)
- Jest-compatible syntax
- ESM support
- Excellent DX

**Playwright** for E2E tests:
- Cross-browser testing
- Real browser environment
- Screenshots/videos
- Network interception

### Coverage Goals

- **Utilities**: 90%+ coverage
- **Hooks**: 80%+ coverage
- **Services**: 70%+ coverage
- **Components**: 50%+ coverage (test behavior, not implementation)
- **Pages**: Critical flows only

### Unit Testing

```javascript
// hooks.test.js
describe('useProjectForm', () => {
  it('initializes with default data', () => {
    const { result } = renderHook(() => useProjectForm({ title: 'Test' }))
    expect(result.current.formData.title).toBe('Test')
  })
  
  it('validates form data', () => {
    const { result } = renderHook(() => useProjectForm({}))
    act(() => {
      result.current.handleChange('title', '')
    })
    expect(result.current.validate()).toBe(false)
  })
})
```

### Integration Testing

```javascript
// ProjectService.test.js
describe('ProjectService', () => {
  it('fetches projects with filters', async () => {
    const projects = await ProjectService.list({ status: 'active' })
    expect(projects).toHaveLength(3)
    expect(projects[0].status).toBe('active')
  })
  
  it('creates project with auto-increment ID', async () => {
    const project = await ProjectService.create({
      title: 'Test Project',
      customer_id: 'cust-1'
    })
    expect(project.id).toBeDefined()
    expect(project.created_at).toBeDefined()
  })
})
```

### E2E Testing

```javascript
// auth.spec.js
describe('Authentication Flow', () => {
  test('user can sign up and login', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Sign Up")')
    
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button:has-text("Create Account")')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })
})
```

## Consequences

### Positive

- Catch bugs before production
- Enable confident refactoring
- Faster debugging
- Document expected behavior
- Reduce manual QA time

### Negative

- Test maintenance overhead
- Longer development time initially
- False positives if tests are brittle
- Skills training needed

## Alternatives Considered

### No automated testing
- Rejected: Too much manual QA, slow feedback loop

### Only E2E testing
- Rejected: Slow, expensive, poor debugging

### 100% coverage target
- Rejected: Diminishing returns, false confidence

## Test Organization

```
src/
├── __tests__/
│   ├── utils/
│   ├── services/
│   ├── hooks/
│   └── e2e/
├── components/
├── hooks/
├── lib/
└── services/
```

## Running Tests

```bash
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## CI/CD Integration

```yaml
# GitHub Actions / CI Pipeline
- Run unit tests
- Run integration tests
- Run linter and type checker
- Generate coverage report
- Run E2E tests on main branch
```

## Related ADRs

- ADR-002: API Abstraction Layer (enables mocking)
- ADR-001: TypeScript (better test types)

## Future Enhancements

- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Accessibility testing (axe)
