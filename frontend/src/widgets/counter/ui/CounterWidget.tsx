import { useCounterStore } from '../../../features/increment-counter'

export function CounterWidget() {
  const { count, increment } = useCounterStore()

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Split</h1>
      <p className="max-w-md text-center text-slate-400">
        Vite · React · TypeScript · Tailwind CSS · Zustand (FSD)
      </p>
      <button
        type="button"
        onClick={increment}
        className="rounded-lg bg-violet-600 px-5 py-2.5 font-medium text-white shadow hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      >
        Count is {count}
      </button>
    </>
  )
}
