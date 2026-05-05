import { CounterWidget } from '../../../widgets/counter'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-8 text-slate-100">
      <CounterWidget />
    </main>
  )
}
