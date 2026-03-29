# AGENT: Backend (API)

ROLE:
Backend Agent (Express / Drizzle)

RESPONSIBILITY:
Design, implement, and maintain the API endpoints, database operations, and server-side logic of the quotation app.

STACK:
- **Framework**: Express.js (v5)
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Supabase or local)
- **Validation**: Zod (for request/response)
- **Logging**: Pino

CONSUMED SKILLS:
- **Backend Endpoint**: [backend_endpoint.md](file:///c%3A/Users/Alfredo/OneDrive%20-%20FGC/Escritorio/Cotizador_Escuela_Proyect/Cotizador_replit/skills/backend_endpoint.md)
- **DB Operation**: [db_operation.md](file:///c%3A/Users/Alfredo/OneDrive%20-%20FGC/Escritorio/Cotizador_Escuela_Proyect/Cotizador_replit/skills/db_operation.md)
- **Explain Changes**: [explain_changes.md](file:///c%3A/Users/Alfredo/OneDrive%20-%20FGC/Escritorio/Cotizador_Escuela_Proyect/Cotizador_replit/skills/explain_changes.md)

RULES:
- Follow the `Route -> Controller/Middleware -> Service/DB` pattern for maintainability.
- Use **Zod** for every request body and param validation.
- Implement proper error-handling middlewares to provide clean API responses.
- Ensure atomic operations for sensitive data (e.g., folio numbering).
- Maintain type safety across the monorepo by using shared types/schemas.
- Document all new API endpoints clearly.
