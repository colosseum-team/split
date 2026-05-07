import { type FC, type ReactNode, useMemo } from 'react'
import { computeContractTextHash, type Contract, type ContractParty } from '@/entities/contract'
import { findCountryByCode } from '@/shared/constants/countries'
import { findCurrencyByCode } from '@/shared/constants/currencies'

interface ContractDocumentProps {
  contract: Contract
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '____________'
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return '____________'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const datePart = formatDate(iso)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${datePart} ${hh}:${mm}`
}

const formatMoney = (amount: number | string, currencyCode: string): string => {
  const currency = findCurrencyByCode(currencyCode)
  const symbol = currency?.symbol || currency?.code || currencyCode
  return `${amount} ${symbol}`
}

const formatJurisdiction = (code: string): string => {
  const country = findCountryByCode(code)
  return country ? country.name : code
}

const truncateAddress = (address: string | undefined): string =>
  !address ? '—' : `${address.slice(0, 6)}…${address.slice(-6)}`

const Section: FC<{ number: string; title: string; children: ReactNode }> = ({
  number,
  title,
  children,
}) => (
  <section className="mt-8 first:mt-0">
    <h3 className="text-[15px] font-bold text-(--color-brand) tracking-tight mb-3">
      {number}. {title}
    </h3>
    <div className="flex flex-col gap-3 text-[13.5px] leading-[1.6] text-(--color-text-primary)">
      {children}
    </div>
  </section>
)

const PartyLine: FC<{ role: 'Customer' | 'Performer'; party: ContractParty }> = ({
  role,
  party,
}) => {
  const tone =
    role === 'Customer' ? 'text-(--color-role-customer-text)' : 'text-(--color-role-performer-text)'
  return (
    <div className="flex flex-col gap-0.5">
      <span>
        <span className="font-bold text-(--color-brand)">{role}</span>:{' '}
        <span className={`font-bold ${tone}`}>{party.fullName || '____________'}</span>
        {party.companyName && (
          <>
            {' '}
            (<span className={tone}>{party.companyName}</span>)
          </>
        )}
      </span>
      {party.email && (
        <span className="text-[12px] text-(--color-text-secondary)">Email: {party.email}</span>
      )}
      {party.walletAddress && (
        <span className="text-[12px] font-mono text-(--color-text-muted) wrap-anywhere">
          Wallet: {party.walletAddress}
        </span>
      )}
    </div>
  )
}

interface SignatureBlockProps {
  role: 'Customer' | 'Performer'
  party: ContractParty
  signature?: { walletAddress: string; signature: string; signedAt: string }
}

const SignatureBlock: FC<SignatureBlockProps> = ({ role, party, signature }) => {
  const isSigned = !!signature
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-4 flex flex-col gap-1.5 ${
        isSigned
          ? 'border-(--color-state-success) bg-(--color-state-success-soft)/40'
          : 'border-dashed border-(--color-border-strong) bg-(--color-surface-muted)'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.08em] font-bold text-(--color-text-muted)">
          {role}
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-wide ${
            isSigned ? 'text-(--color-state-success)' : 'text-(--color-text-muted)'
          }`}
        >
          {isSigned ? 'Signed' : 'Awaiting signature'}
        </span>
      </div>

      <div className="text-[14px] font-bold text-(--color-text-primary)">
        {party.fullName || '—'}
      </div>
      {party.companyName && (
        <div className="text-[12px] text-(--color-text-secondary)">{party.companyName}</div>
      )}

      <div className="text-[11.5px] font-mono text-(--color-text-secondary) wrap-anywhere">
        Wallet: {party.walletAddress || '—'}
      </div>

      {isSigned ? (
        <>
          <div className="text-[11.5px] text-(--color-text-secondary)">
            Signed at: <span className="font-bold">{formatDateTime(signature.signedAt)}</span>
          </div>
          <div className="text-[11.5px] font-mono text-(--color-text-muted) wrap-anywhere mt-1">
            <span className="text-(--color-text-secondary) font-sans">Signature: </span>
            {signature.signature}
          </div>
        </>
      ) : (
        <div className="text-[11.5px] italic text-(--color-text-muted)">
          Signature will appear here after the {role.toLowerCase()} signs the document.
        </div>
      )}
    </div>
  )
}

export const ContractDocument: FC<ContractDocumentProps> = ({ contract }) => {
  const customerSignature = contract.signatures.customer
  const performerSignature = contract.signatures.performer

  const textHash = useMemo(
    () => contract.textHash || computeContractTextHash(contract.text),
    [contract.text, contract.textHash],
  )

  const country = findCountryByCode(contract.jurisdictionCode)
  const jurisdictionLabel = country ? `${country.emoji} ${country.name}` : contract.jurisdictionCode

  return (
    <article
      className="contract-paper relative w-full max-w-[820px] mx-auto rounded-[var(--radius-lg)] bg-(--color-surface-raised) border border-(--color-border-subtle) shadow-[var(--shadow-md)] overflow-hidden"
      style={{ fontFamily: 'var(--font-overpass-mono)' }}
    >
      <header className="px-8 md:px-14 pt-10 md:pt-14 pb-6 border-b border-(--color-border-subtle) text-center flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-(--color-text-muted)">
          Service agreement
        </span>
        <h1 className="text-[22px] md:text-[26px] font-bold text-(--color-text-primary) tracking-tight">
          {contract.title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[12px] text-(--color-text-secondary) mt-2">
          <span>
            Number: <span className="font-bold text-(--color-text-primary)">{contract.number}</span>
          </span>
          <span>
            Issued:{' '}
            <span className="font-bold text-(--color-text-primary)">
              {formatDate(contract.createdAt)}
            </span>
          </span>
          <span>
            Jurisdiction:{' '}
            <span className="font-bold text-(--color-text-primary)">{jurisdictionLabel}</span>
          </span>
        </div>
      </header>

      <div className="px-8 md:px-14 py-10">
        <p className="text-[13.5px] leading-[1.7] text-(--color-text-primary)">
          This Service Agreement (the{' '}
          <span className="font-bold text-(--color-brand)">"Agreement"</span>) is made and entered
          into on{' '}
          <span className="font-bold text-(--color-text-link)">
            {formatDate(contract.createdAt)}
          </span>{' '}
          by and between{' '}
          <span className="font-bold text-(--color-role-customer-text)">
            {contract.customer.fullName || '____________'}
          </span>{' '}
          (the <span className="font-bold text-(--color-brand)">"Customer"</span>) and{' '}
          <span className="font-bold text-(--color-role-performer-text)">
            {contract.performer.fullName || '____________'}
          </span>{' '}
          (the <span className="font-bold text-(--color-brand)">"Performer"</span>).
        </p>

        <Section number="1" title="Parties">
          <PartyLine role="Customer" party={contract.customer} />
          <PartyLine role="Performer" party={contract.performer} />
        </Section>

        <Section number="2" title="Subject of agreement">
          <p>{contract.subject}</p>
        </Section>

        <Section number="3" title="Technical assignment">
          <pre
            className="whitespace-pre-wrap wrap-break-word leading-[1.6] text-[13px] text-(--color-text-primary) bg-(--color-surface-muted) rounded-[var(--radius-md)] p-4 border border-(--color-border-subtle)"
            style={{ fontFamily: 'inherit' }}
          >
            {contract.technicalAssignment}
          </pre>
        </Section>

        <Section number="4" title="Term">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              Start date:{' '}
              <span className="font-bold text-(--color-text-link)">
                {formatDate(contract.startDate)}
              </span>
            </div>
            <div>
              End date:{' '}
              <span className="font-bold text-(--color-text-link)">
                {formatDate(contract.endDate)}
              </span>
            </div>
          </div>
        </Section>

        <Section number="5" title="Price and payment">
          <p>
            Total cost:{' '}
            <span className="font-bold text-(--color-state-success)">
              {formatMoney(contract.amount, contract.currency)}
            </span>
            .
          </p>
          <p>
            Payment is released to the Performer upon the Customer's confirmation of work
            completion.
          </p>
        </Section>

        <Section number="6" title="Jurisdiction">
          <p>
            This agreement shall be governed by the laws of{' '}
            <span className="font-bold text-(--color-brand)">
              {formatJurisdiction(contract.jurisdictionCode)}
            </span>
            .
          </p>
        </Section>

        {contract.additionalTerms && (
          <Section number="7" title="Additional terms">
            <p className="whitespace-pre-wrap leading-[1.6]">{contract.additionalTerms}</p>
          </Section>
        )}

        <Section number={contract.additionalTerms ? '8' : '7'} title="Signatures">
          <p className="text-[12.5px] text-(--color-text-secondary)">
            By signing this agreement with their crypto wallet, both Parties confirm acceptance of
            all terms above. The signature is produced over the SHA-256 hash of the contract text
            shown at the bottom of this document.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <SignatureBlock
              role="Customer"
              party={contract.customer}
              signature={customerSignature}
            />
            <SignatureBlock
              role="Performer"
              party={contract.performer}
              signature={performerSignature}
            />
          </div>
        </Section>
      </div>

      <footer className="border-t border-(--color-border-subtle) bg-(--color-surface-muted) px-8 md:px-14 py-5 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-(--color-text-muted)">
          Document hash · SHA-256
        </span>
        <code
          className="text-[12px] font-mono text-(--color-text-primary) wrap-anywhere select-all"
          title="SHA-256 hash of the contract text — this is what wallets actually sign"
        >
          {textHash}
        </code>
        <span className="text-[11px] text-(--color-text-muted)">
          Wallet:{' '}
          <span className="font-mono">{truncateAddress(contract.customer.walletAddress)}</span> ·{' '}
          <span className="font-mono">{truncateAddress(contract.performer.walletAddress)}</span>
        </span>
      </footer>
    </article>
  )
}
