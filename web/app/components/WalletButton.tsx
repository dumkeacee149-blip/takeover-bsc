'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button className="connectBtn" type="button" onClick={() => disconnect()} title={address}>
        {shortAddr(address)}
      </button>
    )
  }

  return (
    <button
      className="connectBtn"
      type="button"
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending || connectors.length === 0}
    >
      {isPending ? 'Connecting…' : 'Connect'}
    </button>
  )
}
