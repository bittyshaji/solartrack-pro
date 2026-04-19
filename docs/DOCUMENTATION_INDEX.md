# SolarTrack Pro - Documentation Index

**Central hub for all SolarTrack Pro documentation**

---

## Quick Links

### Getting Started
- [Onboarding Guide](../ONBOARDING.md) - Set up your development environment
- [Project Structure](./PROJECT_STRUCTURE.md) - Navigate the codebase
- [Quick Start Guide](./GETTING_STARTED.md) - Get running in 5 minutes

### Architecture & Design
- [Architecture Overview](../ARCHITECTURE.md) - System overview and tech stack
- [System Design](../SYSTEM_DESIGN.md) - Detailed design and patterns

### Development Guidelines
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute code
- [Coding Standards](./CODING_STANDARDS.md) - Code style and patterns
- [Best Practices](./BEST_PRACTICES.md) - Do's and don'ts

### Architecture Decisions (ADRs)

All major architectural decisions are documented as Architecture Decision Records:

- [ADR-001: TypeScript Adoption](./adr/ADR-001-TypeScript-Adoption.md)
- [ADR-002: API Abstraction Layer](./adr/ADR-002-API-Abstraction-Layer.md)
- [ADR-003: React Context vs Redux](./adr/ADR-003-React-Context-vs-Redux.md)
- [ADR-004: Testing Strategy](./adr/ADR-004-Testing-Strategy.md)
- [ADR-005: Folder Organization](./adr/ADR-005-Folder-Organization.md)
- [ADR-006: Error Handling Strategy](./adr/ADR-006-Error-Handling-Strategy.md)
- [ADR-007: Logging Approach](./adr/ADR-007-Logging-Approach.md)
- [ADR-008: Form Validation](./adr/ADR-008-Form-Validation.md)
- [ADR-009: Bundle Optimization](./adr/ADR-009-Bundle-Optimization.md)
- [ADR-010: Security Considerations](./adr/ADR-010-Security-Considerations.md)

### API & Database
- [API Reference](./API_REFERENCE.md) - Services and functions
- [Database Schema](./DATABASE_SCHEMA.md) - Data models
- [Authentication Flow](./AUTH_FLOW.md) - How auth works
- [Error Codes](./ERROR_CODES.md) - Error reference

### Reference Guides
- [Commands Reference](./COMMANDS_REFERENCE.md) - npm scripts and git commands
- [Git Workflow](./GIT_WORKFLOW.md) - Branching and PR process
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

## Documentation Structure

```
docs/
├── DOCUMENTATION_INDEX.md          <- You are here
├── PROJECT_STRUCTURE.md            <- Folder organization
├── GETTING_STARTED.md              <- Quick start
├── CODING_STANDARDS.md             <- Code style
├── BEST_PRACTICES.md               <- Do's and don'ts
├── COMMANDS_REFERENCE.md           <- npm and git commands
├── GIT_WORKFLOW.md                 <- Git branching model
├── TROUBLESHOOTING.md              <- Common issues
├── API_REFERENCE.md                <- API documentation
├── DATABASE_SCHEMA.md              <- Database design
├── AUTH_FLOW.md                    <- Authentication details
├── ERROR_CODES.md                  <- Error reference
└── adr/                            <- Architecture decisions
    ├── ADR-001-TypeScript-Adoption.md
    ├── ADR-002-API-Abstraction-Layer.md
    ├── ADR-003-React-Context-vs-Redux.md
    ├── ADR-004-Testing-Strategy.md
    ├── ADR-005-Folder-Organization.md
    ├── ADR-006-Error-Handling-Strategy.md
    ├── ADR-007-Logging-Approach.md
    ├── ADR-008-Form-Validation.md
    ├── ADR-009-Bundle-Optimization.md
    └── ADR-010-Security-Considerations.md

Root level:
├── ARCHITECTURE.md                 <- System architecture
├── SYSTEM_DESIGN.md                <- Detailed design
├── ONBOARDING.md                   <- Setup guide
├── CONTRIBUTING.md                 <- How to contribute
└── README.md                       <- Project overview
```

---

## Reading Paths

### For New Developers

1. Read [ONBOARDING.md](../ONBOARDING.md) - Set up
2. Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Understand layout
3. Read [GETTING_STARTED.md](./GETTING_STARTED.md) - Run locally
4. Read [ARCHITECTURE.md](../ARCHITECTURE.md) - Understand system
5. Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Code guidelines
6. Read [CONTRIBUTING.md](../CONTRIBUTING.md) - How to work

### For Architects/Tech Leads

1. Start with [ARCHITECTURE.md](../ARCHITECTURE.md)
2. Review all [ADRs](./adr/) for decisions
3. Read [SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) for details
4. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### For Feature Development

1. Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for folder layout
2. Review [CODING_STANDARDS.md](./CODING_STANDARDS.md)
3. Check [API_REFERENCE.md](./API_REFERENCE.md) for available services
4. Read relevant [ADRs](./adr/) for patterns
5. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) workflow

### For Debugging/Troubleshooting

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check [ERROR_CODES.md](./ERROR_CODES.md)
3. Review [BEST_PRACTICES.md](./BEST_PRACTICES.md) for anti-patterns
4. Check logs and error messages

---

## Key Concepts

### Architecture
- **Layered Architecture**: Presentation -> Services -> API -> Database
- **Feature-Based Organization**: Grouped by feature, not type
- **API Abstraction**: All DB access through centralized client
- **Service Layer**: Business logic isolated from components

### State Management
- **React Context**: Global auth and project state
- **Local State**: Component-specific state with hooks
- **No Redux**: Chosen Context for simplicity

### Data Flow
- Components -> Hooks -> Services -> API Client -> Supabase

### Security
- **Row-Level Security**: Database enforces access control
- **JWT Tokens**: Authentication with Supabase
- **Validation**: Zod schemas for input validation
- **Error Handling**: Structured error types

---

## Technology Stack

**Frontend**
- React 18
- TypeScript (gradual adoption)
- React Router v6
- React Hook Form + Zod
- React Context API

**Styling**
- CSS Modules
- Tailwind CSS
- Lucide React (icons)

**Build & Dev Tools**
- Vite (build)
- Vitest (testing)
- ESLint (linting)
- Prettier (formatting)

**Backend Services**
- Supabase (auth, database, storage)
- PostgreSQL (database)

---

## Common Tasks

### Add New Feature
1. Check [ADR-005](./adr/ADR-005-Folder-Organization.md) for structure
2. Follow [CODING_STANDARDS.md](./CODING_STANDARDS.md)
3. Create in [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) location
4. Add tests alongside code
5. Update [API_REFERENCE.md](./API_REFERENCE.md) if needed

### Create Service
1. Check [ADR-002](./adr/ADR-002-API-Abstraction-Layer.md) for pattern
2. Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for data
3. Add to `/src/lib/services/{feature}/`
4. Export from `index.js`

### Add Validation
1. Check [ADR-008](./adr/ADR-008-Form-Validation.md)
2. Create Zod schema in `/src/lib/validation/`
3. Use in forms and components
4. Export type with `z.infer`

### Fix Bug
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check [ERROR_CODES.md](./ERROR_CODES.md)
3. Write failing test first
4. Fix and verify test passes
5. See [CONTRIBUTING.md](../CONTRIBUTING.md) for PR process

---

## Updates and Maintenance

### When Documentation Gets Outdated
- Check last updated date at top of file
- Update the file if information is stale
- Note in git commit message
- Request review from team

### Adding New Documentation
1. Create file in appropriate location
2. Add date and version
3. Link from this index
4. Link from related documents
5. Commit with clear message

---

## Questions?

- **Setup Issues**: Check [ONBOARDING.md](../ONBOARDING.md)
- **Code Questions**: Check [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- **Architecture**: Check [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Issues/Errors**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **How to Contribute**: Check [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Last Updated:** April 2026  
**Maintained By:** Development Team
