import { type FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useUserStore, type UserRole } from '@/entities/user'
import { WalletConnectButton, useWalletAuth } from '@/features/wallet'
import { RoleSelector } from '@/features/role'

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
    <div className="min-h-screen w-full bg-(--color-bg) flex flex-col items-center justify-center md:justify-start overflow-y-auto">
      <div className="w-full rounded-[20px] max-w-[400px] md:max-w-[620px] mx-auto p-4 md:p-8 md:mt-10 bg-(--color-bg) md:bg-(--color-wrapper-container-bg) md:border border-(--color-border-contract-card) flex flex-col flex-1 md:flex-initial">
        <div className="flex justify-end items-center h-[40px] w-full">
          <div className="flex flex-row gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                step >= 1 ? 'bg-(--color-step-passed)' : 'bg-(--color-step-inactive)'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                step >= 2 ? 'bg-(--color-step-passed)' : 'bg-(--color-step-inactive)'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 md:flex-initial flex flex-col items-center justify-center md:justify-start gap-10 md:gap-6 relative w-full">
          <div className="flex flex-col justify-center items-center gap-4 md:gap-6 w-full">
            {/* place for logo */}
            <div className="md:max-w-[360px] flex flex-col justify-center items-center gap-2 leading-tight">
              <h1 className="text-[26px] md:text-[28px] font-bold text-(--color-text-dark-blue) text-center">
                {step === 1 ? 'Welcome to Split' : 'Choose your role'}
              </h1>
              <p className="text-[16px] md:text-[18px] font-medium text-(--color-text-start-page) text-center">
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
                  <div className="w-6 h-6 rounded-full bg-(--color-check-benefits-icon-bg) flex items-center justify-center shrink-0">
                    <CheckIcon className="w-[14px] h-[14px] text-(--color-check-benefits-icon)" />
                  </div>
                  <span className="md:text-[16px] text-[14px] font-medium text-(--color-text-benefits)">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && connected && walletAddress && (
            <div className="w-full max-w-[400px] md:max-w-full">
              <div className="text-[12px] font-medium text-(--color-text-light-gray) text-center">
                Connected as {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
