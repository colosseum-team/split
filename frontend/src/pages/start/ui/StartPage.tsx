import { type FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useUserStore, type UserRole } from '@/entities/user'
import { WalletConnectButton, useWalletAuth } from '@/features/wallet'
import { RoleSelector } from '@/features/role'
import { AuroraBackdrop, Card } from '@/shared/ui'

const benefits = [
  'Self-custodial signing — your wallet, your contract',
  'Transparent terms agreed by both parties',
  'Confirm completion only when work is delivered',
]

export const StartPage: FC = () => {
  const navigate = useNavigate()
  const { walletAddress, connected } = useWalletAuth()
  const role = useUserStore((s) => s.role)
  const setRole = useUserStore((s) => s.setRole)

  const step: 1 | 2 = walletAddress ? 2 : 1

  useEffect(() => {
    if (walletAddress && role) {
      navigate('/home', { replace: true })
    }
  }, [walletAddress, role, navigate])

  const handleSelectRole = (next: UserRole) => {
    setRole(next)
    navigate('/home', { replace: true })
  }

  return (
    <div className="relative min-h-screen w-full bg-(--color-surface-base) flex flex-col items-center justify-center overflow-y-auto">
      <AuroraBackdrop />
      <Card
        padding="lg"
        className="relative z-10 w-full max-w-[400px] md:max-w-[620px] mx-auto flex flex-col flex-1 md:flex-initial"
      >
        <div className="flex-1 md:flex-initial flex flex-col items-center justify-center gap-10 md:gap-6 relative w-full">
          <div className="flex flex-col justify-center items-center gap-4 md:gap-6 w-full">
            {/* place for logo */}
            <div className="md:max-w-[360px] flex flex-col justify-center items-center gap-2 leading-tight">
              <h1 className="text-display md:text-display text-(--color-text-primary) text-center">
                {step === 1 ? 'Welcome to Split' : 'Choose your role'}
              </h1>
              <p className="text-body md:text-[16px] text-(--color-text-secondary) text-center">
                {step === 1
                  ? 'Create and sign service agreements directly from your Solana wallet.'
                  : 'Pick a role to continue. You can change it later by disconnecting your wallet.'}
              </p>
            </div>
          </div>

          <div className="w-full max-w-[400px] md:max-w-full">
            {step === 1 ? (
              <WalletConnectButton hideDisconnect />
            ) : (
              <RoleSelector value={role} onChange={handleSelectRole} />
            )}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-3 items-start w-full max-w-[400px] md:max-w-full">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex flex-row gap-4 items-center">
                  <div className="w-6 h-6 rounded-full bg-(--color-decor-mint) flex items-center justify-center shrink-0">
                    <CheckIcon className="w-[14px] h-[14px] text-(--color-role-performer-text)" />
                  </div>
                  <span className="text-body md:text-[16px] text-(--color-text-secondary)">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && connected && walletAddress && (
            <div className="w-full max-w-[400px] md:max-w-full">
              <div className="text-mono text-(--color-text-muted) text-center">
                Connected as {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
