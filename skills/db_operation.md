# SKILL: DB Operation (Drizzle ORM)

GOAL:
Perform safe and efficient database operations using Drizzle ORM and PostgreSQL.

RULES:
- **Schemas**: Define schemas in `lib/db/src/schema/` with correct data types and constraints.
- **Queries**: Use `db.select()`, `db.insert()`, `db.update()`, and `db.delete()`.
- **Relations**: Define proper relations (one-to-many, many-to-one) if needed.
- **Migrations**: Always generate migrations for schema changes (`pnpm drizzle-kit generate:pg`).
- **Safety**: Avoid raw SQL queries unless necessary; use Drizzle's typed query builder.
- **Atomic Ops**: Use RPC functions in Supabase (if using Supabase directly) or DB transactions for sensitive data like folios.

STEPS:
1. Identify the table or relation to modify.
2. Define or update the Drizzle schema.
3. Use `db` instance from `@workspace/db` to perform the operation.
4. Export the function from `lib/db/src/index.ts` or a related service.
5. Handle potential DB errors (`409 Conflict`, `404 Not Found`).
