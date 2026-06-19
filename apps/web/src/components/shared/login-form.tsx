'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@formcraft/ui'
import { signIn } from '@/lib/auth/client'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    const res = await signIn.email({ email: values.email, password: values.password })
    if (res.error) return alert(res.error.message)
    router.push(params.get('callbackUrl') ?? '/dashboard')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
