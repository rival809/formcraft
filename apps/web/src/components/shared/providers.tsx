'use client'

import { TrpcProvider } from '@/lib/trpc/provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
