import ClientCoinPage from './ClientCoinPage'

export default function CoinPage({ params, searchParams }: { params: { token: string }, searchParams: Record<string, string | string[] | undefined> }) {
  // Route param is dynamic, but we expect a checksummed/0x address string.
  return <ClientCoinPage token={params.token as `0x${string}`} searchParams={searchParams} />
}
