# SolarTrack Pro - Testing Infrastructure

Welcome to the SolarTrack Pro testing infrastructure! This README will guide you through everything that's been set up.

## Quick Start (30 seconds)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## What's Been Set Up

### Testing Framework
- **Vitest 4.1.4** - Fast unit test runner
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - DOM assertion matchers
- **jsdom** - DOM implementation for testing
- **@vitest/ui** - Visual test dashboard

### Configuration
- **vitest.config.js** - Complete Vitest configuration with React support
- **src/test/setup.js** - Test environment with mocks and matchers
- **package.json scripts** - npm test, npm run test:watch, npm run test:coverage

### Test Files Created

**Service Tests (650+ lines of test code)**
- `src/lib/__tests__/customerService.test.js` - 383 lines
- `src/lib/__tests__/projectService.test.js` - 312 lines

**Hook Tests (213 lines)**
- `src/hooks/__tests__/useMobileDetect.test.js` - 213 lines

**Coverage Requirements**
- Lines: 70% minimum
- Functions: 70% minimum
- Branches: 70% minimum
- Statements: 70% minimum

## Documentation Guide

Choose your path based on your needs:

### For Getting Started (5 minutes)
**→ Read: [TESTING_QUICK_START.md](./TESTING_QUICK_START.md)**
- Commands to run tests
- File structure overview
- Template for writing first test
- Common assertions and patterns

### For Complete Understanding (30 minutes)
**→ Read: [TESTING_SETUP.md](./TESTING_SETUP.md)**
- Comprehensive testing guide
- All testing patterns and best practices
- Debugging techniques
- Coverage configuration
- CI/CD integration examples

### For Real Examples (20 minutes)
**→ Read: [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md)**
- Real-world testing patterns from SolarTrack Pro
- Mocking Supabase examples
- Service testing patterns
- Hook testing patterns
- Advanced testing scenarios

### For Overview
**→ Read: [TESTING_INFRASTRUCTURE_SUMMARY.md](./TESTING_INFRASTRUCTURE_SUMMARY.md)**
- What was installed and created
- File structure
- Best practices for developers
- Next steps for the team

## Common Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/customerService.test.js

# Run tests matching a name pattern
npm test -- --grep "should create customer"

# Run with verbose output
npm test -- --reporter=verbose

# Run single test only
npm test -- --grep "^myService should create"
```

## Test File Structure

Tests are organized alongside source code in `__tests__` directories:

```
src/
├── lib/
│   ├── customerService.js          ← Implementation
│   ├── projectService.js
│   └── __tests__/                  ← Test directory
│       ├── customerService.test.js ← Tests
│       └── projectService.test.js
├── hooks/
│   ├── useMobileDetect.js
│   └── __tests__/
│       └── useMobileDetect.test.js
└── test/
    └── setup.js                    ← Global test setup
```

**Naming Convention**
- Test files: `{name}.test.js` or `{name}.test.jsx`
- Test directories: `__tests__`
- Location: Same directory as source file

## Writing Your First Test

Create `src/lib/__tests__/myService.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as myService from '../myService'
import * as supabaseModule from '../supabase'

// Mock external dependencies
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should perform expected operation', async () => {
    // Arrange - Set up test data
    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: 'Test' },
        error: null,
      }),
    }
    vi.spyOn(supabaseModule.supabase, 'from')
      .mockReturnValue(mockResponse)

    // Act - Execute the operation
    const result = await myService.getSomething()

    // Assert - Verify the result
    expect(result.id).toBe(1)
    expect(result.name).toBe('Test')
  })

  it('should handle errors gracefully', async () => {
    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      }),
    }
    vi.spyOn(supabaseModule.supabase, 'from')
      .mockReturnValue(mockResponse)

    const result = await myService.getSomething()

    expect(result).toBeNull()
  })
})
```

## Test Patterns Used

### Service Testing Pattern
```javascript
// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

// Set up response
const mockResponse = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockData,
    error: null,
  }),
}
vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)
```

### Hook Testing Pattern
```javascript
import { renderHook, act } from '@testing-library/react'

const { result } = renderHook(() => useMyHook())

expect(result.current.value).toBeDefined()

act(() => {
  result.current.setValue(newValue)
})

expect(result.current.value).toBe(newValue)
```

## Coverage Reports

Check test coverage:

```bash
npm run test:coverage
```

This generates an HTML report at `coverage/index.html`. Open in browser to see:
- Which lines are covered
- Which functions are tested
- Branch coverage statistics
- Detailed coverage per file

**Coverage Goals**
- Minimum: 70% across all metrics
- Target: 80%+ for critical business logic
- Focus on meaningful coverage, not just percentages

## Existing Tests

The project already has some test files:
- `__tests__/unit/services/` - Service tests
- `__tests__/integration/` - Integration tests
- `src/components/projects/ProjectForm/__tests__/` - Component tests
- `src/lib/api/__tests__/` - API tests
- `src/lib/logger.test.js` - Utility tests

These tests follow the same patterns and can be used as references.

## Best Practices

### Naming Tests
```javascript
// ✓ Good - Clear intent
it('should create customer with valid name and email')
it('should return null when customer not found')
it('should handle database connection error')

// ✗ Avoid - Unclear
it('should work')
it('test customer creation')
it('error handling')
```

### Organize Tests
```javascript
describe('customerService', () => {
  describe('createCustomer', () => {
    it('should create with valid data', ...)
    it('should fail without name', ...)
    it('should handle database errors', ...)
  })

  describe('getCustomerById', () => {
    it('should return customer', ...)
    it('should return null if not found', ...)
  })
})
```

### Mocking Strategy
```javascript
beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

// Only mock what you need
vi.mock('../supabase')

// Spy on specific calls
vi.spyOn(console, 'error').mockImplementation()
```

### Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after each test
- Reset mocks in beforeEach()

## Troubleshooting

### Tests won't run
```bash
# Ensure dependencies are installed
npm install

# Check Node.js version (14+ required)
node --version

# Verify Vitest is accessible
npx vitest --version
```

### Mock not working
```javascript
// ✗ Wrong - Mock after import
import * as service from '../service'
vi.mock('../service')

// ✓ Correct - Mock before import
vi.mock('../service')
import * as service from '../service'
```

### Coverage below threshold
```bash
# View coverage report
npm run test:coverage

# Open report in browser
open coverage/index.html

# Add tests for uncovered lines
# See TESTING_EXAMPLES.md for patterns
```

### Test timeouts
```javascript
// Increase timeout for slow operations
it('should fetch large dataset', async () => {
  // ... test code
}, { timeout: 10000 }) // 10 seconds
```

## Next Steps

1. **Today**: Run existing tests
   ```bash
   npm test
   ```

2. **This week**: Write tests for new features
   - Use patterns from TESTING_EXAMPLES.md
   - Keep coverage above 70%

3. **Going forward**: TDD approach
   - Write tests first
   - Implement code to pass tests
   - Refactor as needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- **Local**: See TESTING_*.md files in project root

## Quick Reference

| Task | Command |
|------|---------|
| Run tests | `npm test` |
| Watch mode | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| Specific file | `npm test -- src/lib/__tests__/customerService.test.js` |
| Match pattern | `npm test -- --grep "customerService"` |
| Verbose output | `npm test -- --reporter=verbose` |

## Team Guidelines

### When Creating a New Service
1. Create service file (e.g., `newService.js`)
2. Create test file (e.g., `__tests__/newService.test.js`)
3. Follow patterns from TESTING_EXAMPLES.md
4. Ensure 70%+ coverage for the service
5. Run `npm run test:coverage` to verify

### Code Review Checklist
- [ ] Tests written for new functions
- [ ] Tests cover success and error paths
- [ ] Mocks are properly set up
- [ ] Coverage is above 70%
- [ ] Tests are descriptive and maintainable
- [ ] No console errors from tests

### CI/CD Integration
Tests run automatically on:
- Pull requests
- Before merge to main
- Pre-deployment checks

Command used:
```bash
npm test -- --run
npm run test:coverage
```

## Questions?

1. **How do I write a test?** → TESTING_QUICK_START.md
2. **What patterns should I use?** → TESTING_EXAMPLES.md
3. **Full reference?** → TESTING_SETUP.md
4. **Setup details?** → TESTING_INFRASTRUCTURE_SUMMARY.md

---

**Happy Testing!** 🧪

The testing infrastructure is ready to go. Start writing tests, keep coverage high, and ship with confidence.
