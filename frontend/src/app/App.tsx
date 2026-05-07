import { SolanaProvider } from './providers/SolanaProvider'
import { StoreProvider } from './providers/StoreProvider'
import { AppRouter } from './router/AppRouter'

export function App() {
  return (
    <SolanaProvider>
      <StoreProvider>
        <AppRouter />
      </StoreProvider>
    </SolanaProvider>
  )
}
