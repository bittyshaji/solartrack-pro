# Developer Quick Start Guide - SolarTrack Pro

Get up and running with SolarTrack Pro in minutes. This guide covers essential setup and common development tasks.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 16.0 or later (check with `node --version`)
- **npm** 7.0 or later (check with `npm --version`)
- **Git** (for version control)
- **A text editor** (VSCode recommended)
- **A Supabase account** (for database access)
- **Environment configuration** (.env file with Supabase credentials)

## Quick Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd solar_backup
```

### 2. Install Dependencies
```bash
npm install
```
This installs all required packages from `package.json`.

### 3. Configure Environment
Create a `.env.local` file in the project root with Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`

### 5. Open in Browser
Navigate to `http://localhost:5173` and log in with your test credentials.

## Project Structure Overview

```
solar_backup/
├── src/
│   ├── api/                    # API endpoints config
│   ├── components/             # React components (feature-based)
│   │   ├── dashboard/          # Dashboard UI
│   │   ├── projects/           # Project management
│   │   ├── customers/          # Customer management
│   │   ├── reports/            # Report generation
│   │   ├── batch/              # CSV import wizard
│   │   └── teams/              # Team management
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.jsx     # Authentication state
│   │   └── ProjectContext.jsx  # Project data state
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js          # Auth state hook
│   │   ├── useProjects.js      # Projects data hook
│   │   ├── useProject.js       # Single project hook
│   │   └── useImportWizard.js  # CSV import hook
│   ├── lib/                    # Business logic services
│   │   ├── api/                # API abstraction layer
│   │   ├── projectService.js   # Project operations
│   │   ├── customerService.js  # Customer operations
│   │   ├── invoiceService.js   # Invoice management
│   │   ├── emailService.js     # Email notifications
│   │   └── exportService.js    # PDF/Excel export
│   ├── pages/                  # Route pages
│   ├── utils/                  # Utility functions
│   ├── types/                  # Type definitions
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static files
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── .env.local                  # Environment variables (create this)
```

## Key npm Scripts

### Development
```bash
npm run dev                # Start dev server (http://localhost:5173)
npm run preview           # Preview production build locally
```

### Building & Deployment
```bash
npm run build             # Create optimized production build
```

### Testing
```bash
npm test                  # Run test suite once
npm run test:watch       # Watch mode (re-runs on file changes)
npm run test:coverage    # Generate coverage report
```

### Code Quality
```bash
npm run lint             # Fix linting issues automatically
npm run lint:check       # Check linting without fixing
npm run format          # Format code with Prettier
npm run format:check    # Check formatting without changes
npm run type-check      # TypeScript type checking
npm run type-check:watch # Type checking in watch mode
```

## Common Development Tasks

### Adding a New Page

1. Create component in `/src/pages/YourPage.jsx`
2. Add route in `App.jsx` router configuration
3. Add navigation link if needed in header/sidebar
4. Test the route works

### Adding a New Component

1. Create folder in `/src/components/feature/`
2. Create `index.jsx` and optional `styles.css`
3. Import and use in parent components
4. Add PropTypes or TypeScript types
5. Write tests in `__tests__/` folder

### Using Services (Business Logic)

Services in `/src/lib/` handle business operations:

```javascript
// Import service
import { projectService } from '../lib/projectService'

// Use in component
useEffect(() => {
  const loadProjects = async () => {
    try {
      const projects = await projectService.getProjects()
      setProjects(projects)
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    }
  }
  loadProjects()
}, [])
```

### Working with Forms

Use React Hook Form with validation:

```javascript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Define validation schema
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
})

// Use in component
const { register, handleSubmit, errors } = useForm({
  resolver: zodResolver(schema)
})

const onSubmit = async (data) => {
  try {
    await projectService.createProject(data)
    toast.success('Project created')
  } catch (error) {
    toast.error(error.message)
  }
}

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('name')} />
    {errors.name && <span>{errors.name.message}</span>}
  </form>
)
```

### Handling Authentication

Use the `useAuth()` hook for authentication state:

```javascript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <div>Welcome, {user.email}</div>
}
```

### Making API Calls

Use the centralized API abstraction layer:

```javascript
import { select, insert, update, delete } from '../lib/api/client'

// Fetch data
const projects = await select('projects', {
  filters: { status__eq: 'active' }
})

// Create data
const newProject = await insert('projects', {
  name: 'My Project',
  status: 'Planning'
})

// Update data
await update('projects', { status: 'In Progress' }, { id__eq: projectId })

// Delete data
await delete('projects', { id__eq: projectId })
```

## Debugging

### Browser DevTools
1. Press `F12` or `Ctrl+Shift+I` to open DevTools
2. Check **Console** tab for errors
3. Check **Network** tab for API calls
4. Check **Application** tab for localStorage/session data

### React DevTools Browser Extension
1. Install [React DevTools](https://react-devtools-tutorial.vercel.app/)
2. Inspect component props and state
3. Track component renders

### VS Code Debugging
Add breakpoints in code and debug directly in editor (VSCode configuration included).

### Console Logging
```javascript
// Log data for inspection
console.log('Project data:', projectData)

// Log warnings for potential issues
console.warn('Unexpected value:', value)

// Log errors
console.error('Failed to load:', error)
```

## Testing Your Changes

### Manual Testing Checklist
- [ ] Component renders without errors
- [ ] Form submission works
- [ ] API calls complete successfully
- [ ] Error messages display properly
- [ ] Loading states work
- [ ] Navigation between pages works
- [ ] Authentication flows work
- [ ] Data persists after refresh

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test src/components/projects/ProjectForm.test.js

# Watch mode - re-runs on file changes
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectForm from './ProjectForm'

test('submits form with valid data', async () => {
  render(<ProjectForm onSubmit={mockSubmit} />)
  
  const input = screen.getByPlaceholderText('Project name')
  fireEvent.change(input, { target: { value: 'Test Project' } })
  
  const button = screen.getByText('Create')
  fireEvent.click(button)
  
  expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test Project'
  }))
})
```

## Performance Optimization

### Code Splitting
Routes are automatically code-split for better performance:

```javascript
const Dashboard = lazy(() => import('../pages/Dashboard'))

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Image Optimization
Use lazy loading for images:

```html
<img src="image.jpg" loading="lazy" alt="description" />
```

### Data Fetching
Use pagination for large datasets:

```javascript
// Fetch projects with pagination
const projects = await select('projects', {
  pagination: { page: 1, limit: 20 }
})
```

## Offline Support

The application supports offline mode for critical features:

```javascript
import { useOfflineStatus } from '../hooks/useOfflineStatus'

function MyComponent() {
  const { isOnline } = useOfflineStatus()
  
  return (
    <div>
      {!isOnline && <OfflineBanner />}
    </div>
  )
}
```

## Environment Variables

The `.env.local` file controls configuration:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: API Configuration
VITE_API_TIMEOUT=30000
VITE_ENABLE_LOGGING=true
```

## Building for Production

```bash
# Create optimized build
npm run build

# Build output goes to ./dist/

# Preview production build
npm run preview
```

The build is optimized for performance:
- Code is minified and tree-shaken
- Assets are compressed
- Code splitting enabled
- Service Worker for offline support

## Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues
1. Check `.env.local` has correct credentials
2. Verify Supabase project is running
3. Check network connection
4. Review browser console for detailed errors

### Hot Module Reload Not Working
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

## Next Steps

1. **Read full documentation**: Check [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) for system design
2. **Explore services**: See [SERVICE_REFERENCE.md](./SERVICE_REFERENCE.md) for available operations
3. **Check troubleshooting**: Review [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common issues
4. **Review API docs**: Check `/src/lib/api/README.md` for detailed API reference

## Getting Help

If you encounter issues:
1. Check this Quick Start guide
2. Review [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
3. Check error messages in browser console
4. Review API documentation in `/src/lib/api/`

---

**Quick Reference:**
- **Dev server**: `npm run dev`
- **Run tests**: `npm test`
- **Build**: `npm run build`
- **Format code**: `npm run format`
- **Check types**: `npm run type-check`

Happy developing! 🚀
