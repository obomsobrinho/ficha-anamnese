import { Navigate, Outlet, ScrollRestoration } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'

/** Centered column: full screen on a phone, at most 430 px on wider screens. */
export function Frame() {
  return (
    <div className="mx-auto min-h-dvh max-w-[430px] bg-cream sm:shadow-[0_0_40px_rgba(60,40,30,.08)]">
      <Outlet />
      <ScrollRestoration />
    </div>
  )
}

/** Renders immediately; only redirects once we know there is no session. */
export function RequireAuth() {
  const { signedIn } = useAuth()
  if (!signedIn) return <Navigate to="/entrar" replace />
  return <Outlet />
}
