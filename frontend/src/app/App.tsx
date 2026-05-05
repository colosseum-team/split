import { StoreProvider } from './providers/StoreProvider'
import { HomePage } from '../pages/home'

export function App() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  )
}
