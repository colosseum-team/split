import { findCountryByCode } from '@/shared/constants/countries'
import { findCurrencyByCode } from '@/shared/constants/currencies'

export type ContractTemplateKey = 'landing-development' | 'logo-design' | 'custom'

export interface ContractTemplate {
  key: ContractTemplateKey
  title: string
  shortTitle: string
  description: string
  defaultSubject: string
  defaultTechnicalAssignment: string
  defaultJurisdictionCode: string
  defaultCurrencyCode: string
  defaultAmount: number
  defaultDurationDays: number
}

export interface PartyInfo {
  fullName: string
  email: string
  companyName?: string
  walletAddress?: string
}

export interface ContractTextData {
  template: ContractTemplate
  customer: PartyInfo
  performer: PartyInfo
  subject: string
  technicalAssignment: string
  amount: number | string
  currency: string
  jurisdictionCode: string
  startDate?: string | Date | null
  endDate?: string | Date | null
  additionalTerms?: string
  contractNumber?: string
}

export const CONTRACT_TEMPLATES: ReadonlyArray<ContractTemplate> = [
  {
    key: 'custom',
    title: 'Custom contract',
    shortTitle: 'Custom',
    description:
      'Start from scratch and write your own terms, scope, and conditions without preset wording.',
    defaultSubject: '',
    defaultTechnicalAssignment: '',
    defaultJurisdictionCode: 'US',
    defaultCurrencyCode: 'SOL',
    defaultAmount: 0,
    defaultDurationDays: 14,
  },
  {
    key: 'landing-development',
    title: 'Landing page development',
    shortTitle: 'Landing development',
    description:
      'Standalone landing page development: design, layout, and interactive logic ready for deployment.',
    defaultSubject:
      'Development of a single-page promotional website (landing page) including UI/UX design, semantic HTML markup, responsive CSS layout, and front-end interactive logic.',
    defaultTechnicalAssignment: `1. Project goal
The Performer shall design, develop, and deliver a fully functional single-page promotional website (landing page) for the Customer's product or service. The landing page must convert visitors into qualified leads through a clear value proposition, social proof, and a primary call to action.

2. Scope of work
2.1. Discovery and analysis
- One discovery call (up to 60 minutes) to clarify the product, target audience, tone of voice, and conversion goals.
- Analysis of up to three competitor landing pages provided by the Customer.
- Written content brief approved by the Customer before design starts.

2.2. UI/UX design
- One desktop and one mobile concept in Figma based on the approved content brief.
- Up to two rounds of design revisions.
- Final design system: typography pair, color palette (primary / secondary / accent / neutrals), spacing scale, button states, form states.

2.3. Front-end implementation
- Semantic HTML5 markup with accessible landmarks and ARIA attributes where appropriate.
- Responsive CSS layout (mobile-first, tested at 360 / 768 / 1024 / 1440 px breakpoints).
- Vanilla JavaScript (or a framework agreed in writing) for the following interactions:
  • Sticky navigation with smooth-scroll anchors.
  • Hero section CTA opening a contact form modal.
  • Two-step contact form with client-side validation and an HTTPS POST submission to the endpoint provided by the Customer.
  • FAQ accordion.
  • Lazy-loading for non-critical images and assets below the fold.
- Cross-browser support: latest two versions of Chrome, Safari, Firefox, and Edge.
- Lighthouse Performance score of at least 85 on a throttled 4G profile (mobile).
- On-page SEO: unique <title>, meta description, Open Graph and Twitter cards, sitemap.xml and robots.txt.
- Basic analytics integration (one Google Analytics 4 or Plausible property) and a single Facebook/Meta Pixel event for the primary CTA.

2.4. Content
- The Customer provides all final texts, images, and brand assets in editable formats no later than three (3) business days after the contract start date. Stock photography, if any, is licensed by the Customer.

2.5. Out of scope (unless agreed separately)
- Backend services, CMS integration, custom CRM connectors.
- Multi-language localization beyond the primary language.
- Ongoing maintenance, A/B testing, or paid traffic management.

3. Deliverables
- Source code in a private Git repository (provider chosen by the Customer).
- Production build deployed to the hosting environment provided by the Customer.
- Figma file with final design and exportable assets.
- One-page handover document with deployment, analytics, and form-endpoint configuration notes.

4. Acceptance criteria
- All scope items in section 2 are demonstrably implemented in the production build.
- No critical (P0/P1) bugs reported by the Customer's QA during a five (5) business-day acceptance window.
- Lighthouse and accessibility (WCAG 2.1 AA color contrast, keyboard navigation) checks pass with the thresholds defined above.

5. Timeline (indicative, can be adjusted in writing)
- Discovery and content brief: up to 3 business days from the start date.
- UI/UX design + revisions: up to 7 business days.
- Front-end implementation: up to 10 business days.
- QA and acceptance: up to 5 business days.

6. Customer obligations
- Provide final texts, images, brand guidelines, and analytics access within the deadlines above.
- Appoint a single point of contact authorized to approve scope, design, and acceptance.
- Provide hosting, domain, and form-handler endpoint by the start of the implementation phase.

7. Performer obligations
- Use industry best practices for code quality, accessibility, performance, and security.
- Communicate progress at least twice per week and flag any risks or scope changes in writing.
- Deliver source code with a clear commit history and a brief README.

8. Acceptance and warranty
- The Customer has five (5) business days from the deployment notification to test the deliverables and submit a written list of defects.
- The Performer fixes any defects directly attributable to deviations from this technical assignment within a reasonable time at no additional cost.
- After the acceptance window, deliverables are considered accepted.`,
    defaultJurisdictionCode: 'US',
    defaultCurrencyCode: 'SOL',
    defaultAmount: 1500,
    defaultDurationDays: 21,
  },
  {
    key: 'logo-design',
    title: 'Logo design',
    shortTitle: 'Logo design',
    description:
      'Brand identity essentials: research, logo concepts, finals, and brand guidelines.',
    defaultSubject:
      'Design and delivery of a primary logo, secondary logo mark, color palette, typography pair, and a basic brand guidelines document.',
    defaultTechnicalAssignment: `1. Project goal
The Performer shall design and deliver a complete logo package and basic brand identity guidelines that visually communicate the Customer's brand values and remain legible across digital and print media.

2. Scope of work
2.1. Discovery
- One brand discovery questionnaire completed in writing by the Customer.
- One alignment call (up to 45 minutes) covering brand values, audience, tone, competitor landscape, and "look-and-feel" references.
- Written creative brief approved by the Customer before any visual exploration begins.

2.2. Concept exploration
- Three (3) distinct logo concepts presented in black-and-white on a neutral background and in context (one digital and one print mockup per concept).
- Short rationale for each concept: typographic choices, symbolism, intended emotional response.

2.3. Refinement
- Up to two (2) rounds of revisions on the chosen concept.
- Final selection of:
  • Primary logo (horizontal lockup).
  • Secondary logo (stacked or alternative lockup).
  • Logo mark / icon for favicons and avatars.
- Manual optical adjustments (kerning, balance, alignment) on all final lockups.

2.4. Brand essentials
- Color palette: 1 primary, 1 secondary, 2 neutrals, with HEX, RGB, and CMYK values.
- Typography pair (one display / heading typeface, one body typeface) with usage notes.
- Minimum size, clear-space rules, allowed and disallowed usages.

2.5. Deliverables
- Vector source files (.ai or .fig) for all logo lockups.
- Exported PNG (transparent), SVG, and PDF for all logo lockups in light and dark variants.
- Color palette and typography reference card (PDF, 1–2 pages).
- Brand guidelines mini-document (PDF, 6–10 pages) covering logo usage, color, typography, do's and don'ts.

2.6. Out of scope (unless agreed separately)
- Full brand identity systems (illustration style, photography direction, motion).
- Marketing collateral (business cards, packaging, social templates).
- Trademark search, registration, or legal advice.

3. Acceptance criteria
- All deliverables in section 2.5 are provided in the agreed file formats.
- No critical visual defects (broken paths, misaligned anchors, low-resolution exports).
- The final logo passes a basic legibility test at 16 px (favicon size) and at print size 5 cm wide.

4. Timeline (indicative, can be adjusted in writing)
- Discovery and creative brief: up to 3 business days from the start date.
- Concept presentation: up to 5 business days after brief approval.
- Refinement and finalization: up to 5 business days after concept selection.
- Brand essentials and packaging: up to 3 business days after final logo approval.

5. Customer obligations
- Provide brand information, references, and any existing assets within the agreed deadlines.
- Appoint a single decision-maker authorized to approve concepts and final deliverables.
- Provide written feedback consolidated from all stakeholders within three (3) business days of each presentation.

6. Performer obligations
- Conduct preliminary visual research to ensure the chosen direction is reasonably distinctive within the Customer's stated competitive set.
- Deliver editable source files and a brief usage guideline.
- Communicate progress at the start and end of each project phase.

7. Intellectual property
- Upon full payment, all rights, title, and interest in the final approved deliverables transfer from the Performer to the Customer.
- Concepts that were not selected remain the property of the Performer and may be reused at the Performer's discretion, provided they are not associated with the Customer's brand.

8. Acceptance and warranty
- The Customer has three (3) business days from the delivery of the final files to submit a written list of defects directly attributable to deviations from this technical assignment.
- The Performer fixes such defects within a reasonable time at no additional cost.
- After the acceptance window, deliverables are considered accepted.`,
    defaultJurisdictionCode: 'US',
    defaultCurrencyCode: 'SOL',
    defaultAmount: 600,
    defaultDurationDays: 14,
  },
]

export const findTemplate = (key?: string | null): ContractTemplate | undefined =>
  CONTRACT_TEMPLATES.find((t) => t.key === key)

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '____________'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '____________'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const formatParty = (party: PartyInfo, role: 'Customer' | 'Performer'): string => {
  const lines: string[] = []
  lines.push(`${role}: ${party.fullName || '____________'}`)
  if (party.companyName) lines.push(`Company: ${party.companyName}`)
  if (party.email) lines.push(`Email: ${party.email}`)
  if (party.walletAddress) lines.push(`Wallet: ${party.walletAddress}`)
  return lines.join('\n')
}

const formatMoney = (amount: number | string, currencyCode: string): string => {
  const currency = findCurrencyByCode(currencyCode)
  const symbol = currency?.symbol || currency?.code || currencyCode
  return `${amount} ${symbol}`
}

const formatJurisdiction = (code: string): string => {
  const country = findCountryByCode(code)
  return country ? `${country.name}` : code
}

export const renderContractText = (data: ContractTextData): string => {
  const {
    template,
    customer,
    performer,
    subject,
    technicalAssignment,
    amount,
    currency,
    jurisdictionCode,
    startDate,
    endDate,
    additionalTerms,
    contractNumber,
  } = data

  const number =
    contractNumber || `№ ${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`

  return [
    `SERVICE AGREEMENT ${number}`,
    `Type: ${template.title}`,
    `Date: ${formatDate(new Date())}`,
    '',
    'PARTIES',
    formatParty(customer, 'Customer'),
    '',
    formatParty(performer, 'Performer'),
    '',
    '1. SUBJECT',
    subject,
    '',
    '2. TECHNICAL ASSIGNMENT',
    technicalAssignment,
    '',
    '3. TERM',
    `Start date: ${formatDate(startDate)}`,
    `End date:   ${formatDate(endDate)}`,
    '',
    '4. PRICE AND PAYMENT',
    `Total cost: ${formatMoney(amount, currency)}.`,
    "Payment is released to the Performer upon the Customer's confirmation of work completion.",
    '',
    '5. JURISDICTION',
    `This agreement shall be governed by the laws of ${formatJurisdiction(jurisdictionCode)}.`,
    additionalTerms ? `\n6. ADDITIONAL TERMS\n${additionalTerms}` : '',
    '',
    '7. SIGNATURES',
    'By signing this agreement with their crypto wallet, both Parties confirm acceptance of all terms above.',
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n')
}
