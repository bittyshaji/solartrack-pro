# ESLint & Prettier Setup Guide

This document describes the linting and code formatting configuration for SolarTrack Pro.

## Overview

The project uses ESLint for static code analysis and Prettier for consistent code formatting. This ensures code quality, catches potential bugs early, and maintains consistent code style across the team.

## Configuration Files

### .eslintrc.cjs

The main ESLint configuration file. Key settings:

- **Environment**: Browser, ES2021, Node.js
- **Parser Options**: Latest ES version with JSX support
- **Plugins**: 
  - `react` - React-specific rules
  - `react-hooks` - Enforces hooks rules of use
  - `import` - Manages import/export syntax
- **Extends**: 
  - `eslint:recommended` - Core ESLint recommended rules
  - `plugin:react/recommended` - React best practices
  - `plugin:react-hooks/recommended` - Hooks best practices
  - `prettier` - Disables conflicting ESLint rules

### .prettierrc

Prettier formatting configuration:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

**Key Settings Explained:**

- `semi: true` - Always add semicolons at the end of statements
- `trailingComma: "es5"` - Add trailing commas where valid in ES5
- `singleQuote: true` - Use single quotes instead of double quotes
- `printWidth: 100` - Line length limit of 100 characters
- `tabWidth: 2` - Indent using 2 spaces
- `useTabs: false` - Use spaces instead of tabs
- `bracketSpacing: true` - Add spaces inside curly braces
- `arrowParens: "always"` - Always include parentheses around arrow function parameters

### .eslintignore

Files and directories to exclude from linting:

- `node_modules/` - Dependencies
- `dist/` - Built production files
- `build/` - Build output
- `.vscode/` - Editor configuration
- `.idea/` - IDE configuration
- `*.min.js` - Minified files
- `*.config.js` - Configuration files
- `coverage/` - Test coverage reports
- `.git/` - Git directory
- `.env*` - Environment files

## Available Commands

### Linting Commands

```bash
# Lint and auto-fix issues
npm run lint

# Check linting without fixing
npm run lint:check

# Watch mode (requires eslint plugin)
npm run lint:watch
```

### Formatting Commands

```bash
# Format all source files
npm run format

# Check formatting without modifying files
npm run format:check
```

## ESLint Rules

### Recommended Rules

The configuration enforces these key rules:

| Rule | Setting | Purpose |
|------|---------|---------|
| `react/react-in-jsx-scope` | off | Not needed in React 17+ |
| `react/prop-types` | off | Using TypeScript for type safety |
| `react/display-name` | off | Forwardref and memo handle this |
| `no-console` | warn | Allow console.warn and console.error |
| `no-unused-vars` | error | Prevent unused variables (except underscore-prefixed) |
| `no-var` | error | Enforce const/let over var |
| `prefer-const` | error | Use const when variable isn't reassigned |
| `prefer-arrow-callback` | warn | Use arrow functions in callbacks |
| `semi` | error | Always require semicolons |
| `quotes` | error | Use single quotes (except when escaping needed) |
| `comma-dangle` | error | Add trailing commas in multiline |
| `no-duplicate-imports` | error | Prevent duplicate import statements |
| `import/order` | error | Alphabetize and organize imports by type |

### Import Order Groups

Imports are organized in this order:

1. **builtin** - Node.js built-in modules (fs, path, etc.)
2. **external** - npm packages and dependencies
3. **internal** - Project internal modules (src/)
4. **parent** - Parent directory imports (../)
5. **sibling** - Same directory imports (./)
6. **index** - Index files (./index)

Each group should be separated by a blank line.

## Integration with Development Workflow

### Pre-commit Hook (Recommended)

Consider using `husky` and `lint-staged` to automatically lint and format staged files:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

Add to `.husky/pre-commit`:
```bash
npx lint-staged
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{js,jsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### IDE Integration

#### VS Code

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue"
  ]
}
```

Required Extensions:
- `esbenp.prettier-vscode` - Prettier formatter
- `dbaeumer.vscode-eslint` - ESLint integration

#### Other IDEs

- **WebStorm/IntelliJ**: Built-in ESLint and Prettier support
- **Vim/Neovim**: Use vim-eslint or vim-ale
- **Sublime**: Install ESLint and Prettier packages

## Common Issues & Solutions

### Prettier vs ESLint Conflicts

If you see conflicting rules:
1. The `prettier` config in `.eslintrc.cjs` disables conflicting rules
2. Prettier is the source of truth for formatting
3. ESLint focuses on code quality

**Solution**: Always run `npm run format` before `npm run lint`

### Import Sorting

If imports aren't sorting correctly:
- Ensure blank lines separate import groups
- Use absolute paths for internal imports
- Internal imports should use `src/` alias (if configured)

### Line Length Violations

Code exceeds 100-character limit:
- Printer tries to fit code but Prettier may split long lines
- Review if the code can be refactored for clarity
- Consider extracting variables or methods

## Extending Rules

To modify rules:

1. Edit `.eslintrc.cjs` or `.prettierrc`
2. Restart your editor/IDE
3. Run `npm run lint:check` to validate
4. Commit changes with team agreement

**Example - Add new ESLint rule:**

```javascript
// In .eslintrc.cjs rules section
'object-shorthand': ['warn', 'always'], // Prefer object shorthand syntax
'prefer-template': 'warn', // Prefer template literals over string concatenation
```

## GitHub Actions Integration

Example GitHub Actions workflow for CI:

```yaml
name: Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run lint:check
      - run: npm run format:check
```

## Best Practices

1. **Run formatter before linter**: `npm run format && npm run lint`
2. **Enable editor formatting**: Automatically format on save
3. **Review linting errors**: Understand why rules exist
4. **Keep consistent**: Don't disable rules unnecessarily
5. **Update regularly**: Keep ESLint and Prettier updated
6. **Document custom rules**: Explain non-standard configurations

## Troubleshooting

### ESLint not finding files

```bash
npm run lint src/
```

### Prettier formatting conflicts

```bash
npm run format
npm run lint -- --fix
```

### Dependencies missing

```bash
npm install
npm audit fix
```

### Cache issues

```bash
rm -rf node_modules/.cache
npm run lint -- --no-cache
```

## References

- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [ESLint Import Plugin](https://github.com/import-js/eslint-plugin-import)
