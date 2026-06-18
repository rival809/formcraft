import type { Metadata } from 'next'
import { RegisterForm } from '@/components/shared/register-form'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Register' }

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">FormCraft</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
