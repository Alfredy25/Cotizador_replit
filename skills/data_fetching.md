# SKILL: Data Fetching (TanStack Query)

GOAL:
Manage server state efficiently using TanStack Query for React Native.

RULES:
- **Keys**: Use clear and descriptive `queryKey` arrays (e.g., `['quotes', filter]`).
- **Functions**: Define `queryFn` as an async function that returns the desired data.
- **Loading/Error**: Handle `isLoading` and `isError` states in the UI to provide user feedback.
- **Mutations**: Use `useMutation` for creating, updating, or deleting data.
- **Invalidation**: Invalidate related queries on success (e.g., `queryClient.invalidateQueries({ queryKey: ['quotes'] })`).
- **Separation**: Keep query logic within custom hooks or services if it becomes complex.

STEPS:
1. Define the fetcher function (e.g., from `lib/api.ts`).
2. Use `useQuery` or `useMutation` in the component.
3. Show `ActivityIndicator` while `isLoading` is true.
4. Refresh data using `RefreshControl` in `FlatList` or `ScrollView`.
