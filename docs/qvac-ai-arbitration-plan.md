# QVAC local AI arbitration and copilot plan

## Goal

Deliver a hackathon-ready, meaningful integration of local AI into escrow-critical flows:

- Contract creation: AI clarifies terms, proposes acceptance criteria, and assigns a risk score.
- Dispute flow: AI produces a structured dispute brief from contract terms, submission, and messages.
- Offline-first requirement: all inference runs on-device with no external AI API calls.

## Why this fits judging criteria

### Technical depth (40%)

- Product-integrated local inference, not a standalone chatbot.
- Dual-module use:
  - `@qvac/llm-llamacpp` for contract and dispute analysis.
  - `@qvac/embed-llamacpp` for semantic matching of requirements and evidence.
- Measurable AI outputs: risk score, similarity score, structured brief.

### Product value (30%)

- Better contract quality before funding reduces ambiguity-driven disputes.
- Faster dispute review with evidence mapping and AI-generated case brief.

### Innovation (20%)

- Privacy-preserving on-device AI for legal and payment-sensitive workflows.
- Optional on-chain hash of AI brief for tamper-evident arbitration support.

### Demo quality (10%)

- Simple and clear end-to-end storyline in 2-3 minutes.
- Public video + repo + repeatable script.

## MVP scope (must-have)

Implement exactly two user-facing AI actions:

1. `Improve with local AI` in contract creation.
2. `Generate dispute summary (local)` in dispute screen.

This is the minimum meaningful integration that touches core escrow lifecycle decisions.

## Integration architecture

### Frontend

- Contract creation screen:
  - Trigger local copilot analysis.
  - Show ambiguity list, rewrite suggestions, acceptance criteria, and risk score.
  - Allow selective apply of suggestions.
- Dispute screen:
  - Trigger local dispute analysis.
  - Show similarity score and structured dispute brief.

### Backend

As implemented in this repository (dev/prod stacks):

- QVAC runs **inside the API process** via `@qvac/sdk` (Bare subprocess for native crates). Inference is triggered by **`POST /ai/copilot-preview`** (no persistence) and **`POST /contracts/:id/copilot-run`** / **`dispute-run`** (persisted `AiOutput`). There is **no** separate HTTP `qvac-worker` service.
- Contract copilot request bodies support **`input.technicalAssignment`** (single textarea) **or** the four section strings (`scope`, `deliverables`, `timeline`, `paymentTerms`); see `backend/docs/qvac-backend.md`.

Earlier plan sketch (stores-only / optional fields):

- Inference still runs locally (same host/container as split); no cloud LLM API.
- Suggested fields:
  - `ai_result_json`
  - `model_id`
  - `model_version`
  - `input_hash`
  - `output_hash`
  - `created_at`

### Contracts (on-chain)

- Keep program logic independent from QVAC.
- Optional innovation touch:
  - Store `ai_summary_hash` in contract/dispute-related state or event log.

## AI pipeline design

### 1) Contract Copilot (`@qvac/llm-llamacpp`)

Input:

- **Backend API shape:** `technicalAssignment` (single draft) **or** `scope` + `deliverables` + `timeline` + `paymentTerms` (see `backend/docs/qvac-backend.md`).
- **Conceptual checklist** when authoring drafts:
  - scope
  - milestones
  - deliverables
  - timeline
  - payment terms

Output schema (strict JSON):

- `ambiguities`: unclear statements requiring clarification.
- `rewrite_suggestions`: concrete replacements.
- `acceptance_criteria`: testable acceptance checks.
- `risk_score`: integer 0-100.
- `risk_factors`: short explanation bullets.

### 2) Dispute Brief (`@qvac/llm-llamacpp` + `@qvac/embed-llamacpp`)

Input:

- Accepted contract terms.
- Submitted work summary or extracted text.
- Dispute conversation thread.

Pipeline:

1. Create embeddings for requirements, evidence, and messages.
2. Compute semantic matches and mismatch highlights.
3. Pass matched context into LLM for structured brief generation.

Output schema (strict JSON):

- `case_summary`
- `timeline`
- `agreed_requirements`
- `submitted_evidence`
- `matches_and_gaps`
- `similarity_score`
- `risk_assessment`
- `recommended_resolution`

## Implementation plan

### Phase A - Local runtime foundation

- Integrate QVAC packages and local model bootstrapping.
- Build a shared local AI service abstraction for both screens.
- Add telemetry for latency and model load time.

Done when:

- Both AI actions run without internet.
- App exposes a visible local/offline status indicator.

### Phase B - Contract Copilot UX and logic

- Add UI entrypoint in contract form.
- Implement schema-validated result parsing and rendering.
- Add apply-selected-suggestions action that mutates draft fields.

Done when:

- User can improve contract before publish/fund.
- Acceptance criteria are inserted into final contract content.

### Phase C - Dispute summary UX and logic

- Add dispute action button and result panel.
- Implement semantic score + requirement-to-evidence mapping.
- Export brief as JSON/Markdown for arbitration handoff.

Done when:

- One click generates a readable and structured dispute brief.
- Similarity score and top gaps are visible in UI.

## Demo script (2-3 minutes)

1. Create contract and click `Improve with local AI`.
2. Show ambiguities found, acceptance criteria, and risk score.
3. Apply suggestions and save contract.
4. Open dispute scenario with prepared submission and messages.
5. Click `Generate dispute summary (local)`.
6. Show brief structure + similarity score + optional hash evidence.

## Offline-first proof checklist

- No network call to external AI providers during inference.
- Inference logs indicate local runtime only.
- Demo is reproducible with internet disabled (except wallet/RPC if needed for non-AI actions).

## Delivery artifacts for submission

- Public repository with run steps.
- Demo video showing complete AI-enhanced flow.
- This architecture plan linked from README.
- Example JSON outputs for copilot and dispute brief.

## Risks and mitigations

- Slow inference on weaker laptops:
  - Use smaller model variant and prewarm model at app start.
- Non-deterministic JSON outputs:
  - Enforce strict schema and retry with constrained prompt.
- Overly long dispute context:
  - Chunk and retrieve top-k relevant evidence before generation.

## Demo-ready scenarios: design order and logo order

Use these two scenarios for product walkthrough, QA checks, and the final demo. Each one includes multiple development paths to prove both value and arbitration readiness.

### Scenario 1: Customer orders landing page design

Contract draft (before AI):

- Scope: "Design a modern landing page for our startup."
- Deliverables: "Figma file and assets."
- Timeline: "5 days."
- Budget: fixed amount in escrow.

AI copilot expected improvements:

- Clarifies ambiguity:
  - Number of sections, breakpoints, style direction.
  - Required states (hover, form error, loading).
- Proposes acceptance criteria:
  - Desktop 1440px and mobile 390px layouts included.
  - Design system tokens (color, typography, spacing) documented.
  - Editable Figma components grouped and named.
- Risk score:
  - Medium if branding/style references are missing.

Possible development paths:

1. Happy path:
   - Freelancer submits full Figma pack matching requirements.
   - High semantic similarity score.
   - Customer approves, payout released.
2. Revision path:
   - Submission misses mobile breakpoint and component naming.
   - AI flags requirement gaps and generates structured revision request.
   - Freelancer resubmits, score improves, contract closes successfully.
3. Dispute path:
   - Customer claims "design does not follow brand tone."
   - Freelancer claims "no brand guide was provided."
   - AI dispute brief highlights missing brand constraints in original contract, supporting partial responsibility and mediated resolution.

### Scenario 2: Customer orders logo package

Contract draft (before AI):

- Scope: "Create a logo for our product."
- Deliverables: "Logo files."
- Timeline: "3 days."
- Budget: fixed amount in escrow.

AI copilot expected improvements:

- Clarifies ambiguity:
  - Number of concepts and revision rounds.
  - Required formats (SVG, PNG, PDF), transparent background, monochrome variant.
  - Ownership and transfer terms.
- Proposes acceptance criteria:
  - At least 3 initial concepts.
  - Final package includes vector source and usage preview.
  - Color and black-and-white versions pass minimum legibility checks.
- Risk score:
  - High if IP transfer clause and revision limits are missing.

Possible development paths:

1. Happy path:
   - Freelancer delivers 3 concepts and final brand-safe package.
   - Similarity score indicates strong alignment with deliverables.
   - Fast approval and payout release.
2. Scope creep path:
   - Customer requests "one more style direction" outside agreed revision rounds.
   - AI maps new ask outside original requirements.
   - Parties add milestone/change request; dispute avoided.
3. IP dispute path:
   - Customer requests full exclusive rights, freelancer disputes scope of transfer.
   - AI brief highlights contract clause coverage and missing legal precision.
   - Resolution recommends addendum plus conditional final payment.

### How to use these scenarios in product demo

- Start with the same baseline problem: vague contract language.
- Run `Improve with local AI` and show concrete acceptance criteria and risk score changes.
- For one scenario show "revision without dispute," for the other show "formal dispute summary."
- End by showing structured brief + similarity score + optional summary hash evidence.

## Hackathon UX with hardcoded scenarios

For the hackathon demo, use deterministic local outputs for two predefined scenarios. This removes runtime uncertainty while preserving meaningful product behavior.

### UX goal

- Make scenario switching explicit and easy.
- Keep user flow real (create contract -> improve -> submit/dispute -> summary).
- Ensure every click produces a stable, demo-safe result.

### Entry point

Add a "Demo scenario mode" switch in frontend (visible badge in header):

- `Off`: normal flow.
- `Design Landing Page`: prefilled contract, messages, and submission.
- `Logo Package`: prefilled contract, messages, and submission.

### Contract creation UX (hardcoded mode)

- Show a small banner: "Using local demo scenario data."
- Prefill fields based on selected scenario.
- On `Improve with local AI`:
  - Return scenario-specific hardcoded JSON matching the final LLM schema.
  - Render:
    - ambiguities
    - rewrite suggestions
    - acceptance criteria
    - risk score with factor chips
- On `Apply selected suggestions`:
  - Update editable draft fields in-place.

### Dispute UX (hardcoded mode)

- Prefill:
  - conversation thread
  - submission summary
  - requirements snapshot
- On `Generate dispute summary (local)`:
  - Return scenario-specific hardcoded brief and similarity score.
  - Render:
    - requirement-to-evidence matches
    - mismatch/gap list
    - recommended resolution
    - export action (`Copy JSON` or `Download .md`)

### UX states required

- `idle`: no AI result yet.
- `loading`: local processing state (1-2 sec simulated delay is acceptable).
- `success`: structured cards/tables rendered.
- `error`: deterministic fallback with retry action.

### Visual proof for judges

- Show `Local AI only` badge near action buttons.
- Show tiny metadata line under results:
  - `source: local-qvac-demo`
  - `scenario: design|logo`
  - `model: demo-stub` (or actual local model id if available)

## Clear frontend task definition

Use this as implementation-ready scope for frontend.

### Task 1: scenario framework

- Add `demoScenario` state (`off | design | logo`) in app store/context.
- Add header switcher and persistent badge.
- Add typed scenario data source file:
  - `frontend/src/features/ai/demoScenarios.ts`

Definition of done:

- User can switch scenarios without reload.
- Forms and dispute screens read active scenario data when mode is enabled.

### Task 2: AI service abstraction with hardcoded adapter

- Create interface:
  - `improveContract(input) -> ContractCopilotResult`
  - `generateDisputeSummary(input) -> DisputeBriefResult`
- Implement `DemoLocalAiAdapter` returning deterministic JSON for design/logo.
- Keep interface compatible with future real QVAC adapter.

Definition of done:

- Both AI actions use the same service abstraction.
- No UI code depends directly on mock JSON shape outside typed models.

### Task 3: contract copilot UI

- Add `Improve with local AI` action on create contract screen.
- Build result blocks:
  - ambiguities list
  - rewrites list with selectable apply
  - acceptance criteria checklist
  - risk score widget
- Add `Apply selected suggestions`.

Definition of done:

- In both scenarios, output renders correctly and updates draft content.
- Empty/loading/error states are handled.

### Task 4: dispute summary UI

- Add `Generate dispute summary (local)` action on dispute screen.
- Build result blocks:
  - similarity score bar
  - matches and gaps table
  - dispute brief sections (summary/timeline/recommendation)
- Add export button (`Copy JSON` minimum).

Definition of done:

- In both scenarios, summary is generated and readable in one click.
- Score and evidence mapping are visually clear.

### Task 5: demo polish and reliability

- Add deterministic loading duration for stable narration pacing.
- Add toasts for "AI analysis ready."
- Prevent double-click race conditions on AI actions.
- Add lightweight event logs in console for demo debugging.

Definition of done:

- Demo run is repeatable three times in a row without UI inconsistencies.

## Suggested frontend file structure

- `frontend/src/features/ai/types.ts`
- `frontend/src/features/ai/service.ts`
- `frontend/src/features/ai/adapters/demoLocalAiAdapter.ts`
- `frontend/src/features/ai/demoScenarios.ts`
- `frontend/src/features/contracts/components/ContractCopilotPanel.tsx`
- `frontend/src/features/disputes/components/DisputeSummaryPanel.tsx`
- `frontend/src/features/demo/DemoScenarioSwitcher.tsx`

## Acceptance checklist for frontend handoff

- Two scenarios (`design`, `logo`) are fully hardcoded and selectable.
- Both AI buttons work end-to-end in UI without backend changes.
- Output format matches planned production schema.
- UX clearly communicates local/offline AI behavior.
- Demo script can be executed exactly as written without manual fixes.
