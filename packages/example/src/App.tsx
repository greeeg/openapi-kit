import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { APIClientProvider } from '../generated/reactQuery'
import PetsList from './PetsList'

const queryClient = new QueryClient()

const App = () => {
  return (
    <APIClientProvider
      config={{
        baseUrl: 'https://petstore.swagger.io/v2',
        headers: {
          Accept: 'application/json',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PetsList />
      </QueryClientProvider>
    </APIClientProvider>
  )
}

export default App
