# SolarTrack Pro Documentation Index

Welcome to the SolarTrack Pro developer documentation. This is your entry point to understanding and working with the application.

## Quick Navigation

### Getting Started
- **[DEVELOPER_QUICK_START.md](./DEVELOPER_QUICK_START.md)** - Start here! Contains setup instructions, project overview, and key npm scripts
- **[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** - System architecture, technology stack, and design patterns
- **[SERVICE_REFERENCE.md](./SERVICE_REFERENCE.md)** - Complete reference for all services and utilities
- **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)** - Common issues, debugging techniques, and performance optimization

## Project Information

**Project:** SolarTrack Pro  
**Version:** 0.1.0  
**Status:** Production-Ready  
**Last Updated:** April 2026

## Key Features

- **Solar Project Management** - Create, track, and manage solar installations
- **Customer Relationship Management** - Organize customer information and communications
- **Project Workflows** - Three-state workflow (Estimation → Negotiation → Execution)
- **Financial Tracking** - Invoices, proposals, and payment management
- **Team Collaboration** - Role-based access control for teams
- **Reporting & Analytics** - Comprehensive project and financial reports
- **Offline Support** - Critical features work without internet connection

## Technology Stack

### Frontend
- React 18.2.0 with Vite build tool
- TypeScript for type safety
- React Router for navigation
- Tailwind CSS for styling
- Recharts for data visualization

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Vercel for deployment
- Row Level Security (RLS) for data access control

## Project Structure

```
src/
├── api/                    # API endpoints configuration
├── components/             # React UI components (feature-based)
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Business logic services
│   └── api/                # API abstraction layer
├── pages/                  # Route-mapped pages
├── utils/                  # Utility functions
└── types/                  # TypeScript type definitions
```

## Common Development Tasks

### Development Workflow
1. Clone repository: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Open browser to `http://localhost:5173`

### Running Tests
```bash
npm test                    # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Code Quality
```bash
npm run lint               # Fix linting issues
npm run format            # Format code
npm run type-check        # TypeScript type checking
```

### Building for Production
```bash
npm run build             # Create optimized build
npm run preview           # Preview build locally
```

## Documentation Files

| File | Purpose |
|------|---------|
| **DEVELOPER_QUICK_START.md** | Setup and basic commands |
| **ARCHITECTURE_GUIDE.md** | System design and patterns |
| **SERVICE_REFERENCE.md** | Service documentation |
| **TROUBLESHOOTING_GUIDE.md** | Common issues and solutions |
| **ARCHITECTURE.md** | Detailed architectural overview |
| **COMPONENT_STRUCTURE.md** | Component refactoring and organization |
| **API_LAYER_SUMMARY.md** | API abstraction implementation |

## Key Directories & Their Purpose

### `/src/components`
Feature-based component organization:
- `dashboard/` - Dashboard components
- `projects/` - Project management components
- `customers/` - Customer management
- `reports/` - Report generation
- `batch/` - Batch operations and CSV import
- `teams/` - Team management

### `/src/lib`
Business logic and services:
- `projectService.js` - Project operations
- `customerService.js` - Customer operations
- `invoiceService.js` - Invoice management
- `emailService.js` - Email notifications
- `api/` - API abstraction layer
- `exportService.js` - PDF/Excel export
- `batchExportService.js` - Batch export operations

### `/src/hooks`
Custom React hooks:
- `useAuth()` - Authentication state
- `useProjects()` - Project data management
- `useProject()` - Single project with related data
- `useImportWizard()` - CSV import workflow
- `useOfflineStatus()` - Offline detection

### `/src/contexts`
Global state management:
- `AuthContext` - User authentication and authorization
- `ProjectContext` - Project data sharing

## API & Integration

### Supabase Integration
The application uses Supabase for:
- **Database**: PostgreSQL relational database
- **Authentication**: User login and session management
- **Storage**: File uploads and document storage
- **Real-time**: Live data subscriptions

### API Layer
See [SERVICE_REFERENCE.md](./SERVICE_REFERENCE.md) for:
- Available services and methods
- Error handling patterns
- Request/response structures
- Retry logic

## Security & Access Control

- **Authentication**: JWT token-based via Supabase Auth
- **Authorization**: Role-based access control (Admin, Contractor, Customer)
- **Data Protection**: Row Level Security (RLS) policies enforce tenant isolation
- **HTTPS**: All communication encrypted
- **Input Validation**: Client-side and server-side validation

## Performance Targets

- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3.5 seconds
- **API Response Time**: < 500ms
- **Offline Functionality**: Critical features available without internet

## Getting Help

1. **Setup Issues**: See [DEVELOPER_QUICK_START.md](./DEVELOPER_QUICK_START.md) - Prerequisites section
2. **Architecture Questions**: See [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)
3. **Service Usage**: See [SERVICE_REFERENCE.md](./SERVICE_REFERENCE.md)
4. **Common Problems**: See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
5. **Error Codes**: See API documentation in `/src/lib/api/README.md`

## Related Documentation

- **Original Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive system design
- **Component Refactoring**: See [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) for refactoring improvements
- **API Layer**: See [API_LAYER_SUMMARY.md](./API_LAYER_SUMMARY.md) for implementation details

## Contributing

When contributing to SolarTrack Pro:
1. Follow the project structure conventions
2. Use feature-based component organization
3. Write tests for new features
4. Update documentation as needed
5. Run `npm run lint` and `npm run format` before committing
6. Test thoroughly in both online and offline modes

## License & Support

For questions or issues:
- Check documentation in this folder
- Review error messages in browser console
- Check Supabase error logs for backend issues
- Reference API documentation in `/src/lib/api/README.md`

---

**Last Updated:** April 19, 2026  
**Maintained By:** Development Team  
**Version:** 0.1.0
