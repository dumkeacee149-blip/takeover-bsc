'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'

const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 97)

function hexChainId(id: number) {
  return '0x' + id.toString(16)
}

export default function NetworkBanner() {
  const { chainId, isConnected } = useAccount()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const wrong = useMemo(() => isConnected && chainId && chainId !== TARGET_CHAIN_ID, [isConnected, chainId])

  useEffect(() => {
    if (!wrong) setErr(null)
  }, [wrong])

  if (!wrong) return null

  async function switchChain() {
    setBusy(true)
    setErr(null)
    try {
      const eth = (window as any).ethereum
      if (!eth?.request) throw new Error('No injected wallet found')

      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId(TARGET_CHAIN_ID) }],
        })
      } catch (e: any) {
        // 4902 = unknown chain; add then switch
        if (e?.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId(TARGET_CHAIN_ID),
                chainName: 'BNB Chain Testnet',
                nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                blockExplorerUrls: ['https://testnet.bscscan.com'],
              },
            ],
          })
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId(TARGET_CHAIN_ID) }],
          })
        } else {
          throw e
        }
      }
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="banner">
      <div className="bannerInner">
        <div>
          <div className="bannerTitle">Wrong network</div>
          <div className="bannerText">Please switch to chain {TARGET_CHAIN_ID} (BNB Testnet) to play.</div>
          {err ? <div className="bannerErr mono">{err}</div> : null}
        </div>
        <button className="btn btnPrimary" type="button" onClick={switchChain} disabled={busy}>
          {busy ? 'Switching…' : 'Switch to BSC Testnet'}
        </button>
      </div>
    </div>
  )
}
