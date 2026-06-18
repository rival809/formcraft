import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@formcraft/api/src/trpc/trpc.router'

export const trpc = createTRPCReact<AppRouter>()
