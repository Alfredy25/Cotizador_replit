# SKILL: Backend Endpoint (Express)

GOAL:
Create a new API endpoint following RESTful principles and project architecture.

RULES:
- **Routes**: Define routes in `routes/` using `express.Router()`.
- **Validation**: Use **Zod** for request body (`req.body`) and params (`req.params`) validation.
- **Middleware**: Apply proper middlewares (e.g., `auth`, `logger`) to the route.
- **Async/Await**: Use `async` handlers and wrap them in error-handling middleware or `try/catch`.
- **Response**: Use consistent response status codes (`200 OK`, `201 Created`, `400 Bad Request`, `500 Error`).
- **Logic**: Separate business logic from route handlers; use services or models for DB operations.

STEPS:
1. Define a Zod schema for the input.
2. Create the route in `src/routes/`.
3. Implement the handler function.
4. Export and register the route in `src/routes/index.ts`.
5. Verify response format matches `@workspace/api-zod` types if applicable.
