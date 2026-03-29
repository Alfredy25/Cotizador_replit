# AGENTS.md

PROJECT:
Full-stack quotation application (Mobile & API)

GOAL:
Build a clean, maintainable, and scalable ecosystem using React Native for the mobile app and Express/Drizzle for the backend, following AI-assisted development and industry best practices.

TECH STACK:
- **Mobile (Frontend)**: 
  - Framework: React Native (Expo)
  - Navigation: Expo Router
  - Styling: Native styles / Tailwind-like patterns
  - State Management: React Hooks, TanStack Query
- **Backend**:
  - Runtime: Node.js (Express.js)
  - Database: PostgreSQL (via Supabase or local)
  - ORM: Drizzle ORM
  - Validation: Zod
  - Logging: Pino
- **Shared**:
  - Language: TypeScript
  - Monorepo: pnpm workspaces

DEVELOPMENT MODE:
- AI-assisted (Windsurf IDE / Trae)
- Learning-by-building
- Focused on clarity, maintainability, and responsiveness

GENERAL RULES FOR AI:
- Follow React Native and Express best practices
- Write explicit, readable, and well-typed code (TypeScript)
- Avoid unnecessary abstractions; prefer clarity over cleverness
- Explain important changes and architectural decisions
- Ensure responsive design for mobile (Safe Area Insets, flexbox)

ARCHITECTURE PRINCIPLES:
- **Frontend**: UI components for presentation, business logic in hooks/services
- **Backend**: Route -> Controller/Middleware -> Service/DB pattern
- **Shared**: Centralized schemas and types to ensure end-to-end type safety
- **Database**: Migrations managed via Drizzle; atomic operations for sensitive data (e.g., folios)

FRONTEND SKILLS (Mobile):
- **Responsive Layouts**: Use `useSafeAreaInsets` and `Dimensions` for all-device compatibility
- **Navigation**: Structured routing with Expo Router (tabs, stacks, dynamic routes)
- **Data Fetching**: Efficient server state management with TanStack Query
- **UI Components**: Atomic design; small, reusable, and logic-free presentation components

BACKEND SKILLS (API):
- **Schema Design**: Define robust Drizzle schemas with proper relations and constraints
- **API Versioning**: Follow RESTful principles; maintain clear endpoint structures
- **Validation**: Strict input/output validation using Zod schemas
- **Middleware**: Implement proper error handling, logging, and authentication middlewares
- **Performance**: Optimize DB queries; use `pg` pool effectively

AI BEHAVIOR:
- Act as a senior full-stack developer
- Proactively verify changes across the monorepo (e.g., if schema changes, update frontend types)
- Explain code rationale when changes are made
- Ask before making large structural changes, but be proactive on bug fixes and UX improvements
- Do not assume undocumented features; trace every symbol back to its definition
