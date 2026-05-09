/**
 * Hand-maintained OpenAPI 3 description of registered Fastify routes.
 * Served at `/docs/openapi.json` and `/docs` (Swagger UI).
 */

const contractStatuses = [
  "draft",
  "open",
  "funded",
  "in_progress",
  "review",
  "completed",
  "disputed",
  "cancelled",
] as const;

const disputesOutcomes = [
  "PERFORMER_WON",
  "CLIENT_WON",
  "INCONCLUSIVE",
] as const;

const scenario = ["design", "logo"] as const;

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Split Backend API",
    description:
      "Wallet SIWS auth, profiles, escrow contract lifecycle (customer / performer), persisted AI outputs, and optional backend QVAC runs.",
    version: "0.1.0",
  },
  servers: [
    { url: "http://localhost:4000", description: "Local (default)" },
    { url: "/", description: "Same origin (use when browsing /docs)" },
  ],
  tags: [
    { name: "Health", description: "Liveness / config snapshot" },
    { name: "Auth", description: "Sign-in with Solana (SIWS nonce + verify)" },
    { name: "Profile", description: "Current JWT user (`/me`)" },
    {
      name: "Contracts",
      description:
        "Create, list, read, patch escrow contracts; lifecycle actions",
    },
    {
      name: "AI",
      description:
        "QVAC copilot/dispute endpoints and persisted `AiOutput` rows",
    },
  ],
  components: {
    parameters: {
      ContractId: {
        name: "id",
        in: "path",
        required: true,
        description: "Contract id (UUID)",
        schema: { type: "string", format: "uuid" },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "NOT_FOUND" },
          message: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", enum: ["VALIDATION_ERROR"] },
          message: { type: "string", example: "invalid input" },
          details: { type: "object", additionalProperties: true },
        },
      },
      Scenario: {
        type: "string",
        enum: [...scenario],
        description: "Demo scenario discriminator (validated on AI routes)",
      },
      User: {
        type: "object",
        required: ["id", "walletAddress", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          walletAddress: { type: "string", minLength: 32, maxLength: 64 },
          role: { type: "string", nullable: true, enum: ["customer", "user"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      NonceBody: {
        type: "object",
        required: ["walletAddress"],
        properties: {
          walletAddress: { type: "string", minLength: 32, maxLength: 64 },
        },
      },
      NonceResponse: {
        type: "object",
        required: ["nonce", "message", "expiresAt"],
        properties: {
          nonce: { type: "string" },
          message: {
            type: "string",
            description: "Canonical SIWS message to sign",
          },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      VerifyBody: {
        type: "object",
        required: ["walletAddress", "signature"],
        properties: {
          walletAddress: { type: "string", minLength: 32, maxLength: 64 },
          signature: { type: "string", minLength: 1 },
        },
      },
      VerifyResponse: {
        type: "object",
        required: ["token", "user"],
        properties: {
          token: { type: "string", description: "JWT, 24h" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      RoleBody: {
        type: "object",
        required: ["role"],
        properties: { role: { type: "string", enum: ["customer", "user"] } },
      },
      SetRoleResponse: {
        type: "object",
        required: ["user", "token"],
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string" },
        },
      },
      CreateContractBody: {
        type: "object",
        required: ["title", "description", "amount"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", minLength: 1, maxLength: 20_000 },
          amount: {
            description: "USDC smallest units etc.",
            oneOf: [{ type: "integer" }, { type: "string", pattern: "^\\d+$" }],
          },
          currency: {
            type: "string",
            minLength: 2,
            maxLength: 10,
            default: "USDC",
          },
          deadline: { type: "string", format: "date-time", nullable: true },
          assigneeAddress: {
            type: "string",
            minLength: 32,
            maxLength: 64,
            nullable: true,
          },
          disputeResolutionDays: {
            type: "integer",
            minimum: 1,
            maximum: 30,
            description: "Calendar days for the dispute exchange window (default 7)",
          },
        },
      },
      PatchContractBody: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", minLength: 1, maxLength: 20_000 },
          amount: {
            oneOf: [{ type: "integer" }, { type: "string", pattern: "^\\d+$" }],
          },
          currency: { type: "string", minLength: 2, maxLength: 10 },
          deadline: { type: "string", format: "date-time" },
          assigneeAddress: {
            type: "string",
            minLength: 32,
            maxLength: 64,
            nullable: true,
          },
          disputeResolutionDays: {
            type: "integer",
            minimum: 1,
            maximum: 30,
          },
        },
      },
      Contract: {
        type: "object",
        description:
          "Persisted row; bigint `amount` is serialized as decimal string.",
        required: [
          "id",
          "title",
          "description",
          "amount",
          "currency",
          "status",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          amount: { type: "string", pattern: "^\\d+$" },
          currency: { type: "string" },
          status: { type: "string", enum: [...contractStatuses] },
          deadline: { type: "string", format: "date-time", nullable: true },
          customerAddress: { type: "string" },
          assigneeAddress: { type: "string", nullable: true },
          contractHash: { type: "string", nullable: true },
          onchainAddress: { type: "string", nullable: true },
          fundTxSignature: { type: "string", nullable: true },
          approveTxSignature: { type: "string", nullable: true },
          resolveTxSignature: { type: "string", nullable: true },
          submissionPayload: { type: "string", nullable: true },
          submissionAt: { type: "string", format: "date-time", nullable: true },
          disputeOpenedBy: {
            type: "string",
            nullable: true,
            enum: ["customer", "user"],
          },
          disputeOpenedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          disputeResolutionDays: { type: "integer", minimum: 1, maximum: 30 },
          disputeDueAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "End of dispute exchange window (UTC)",
          },
          disputeOutcome: {
            type: "string",
            nullable: true,
            enum: [...disputesOutcomes],
          },
          disputeResolvedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ContractCreateResponse: {
        description:
          "Contract row plus unsigned Solana tx for escrow initialization",
        allOf: [
          { $ref: "#/components/schemas/Contract" },
          {
            type: "object",
            required: ["unsignedTx"],
            properties: {
              unsignedTx: {
                type: "string",
                description:
                  "Unsigned transaction (encoding matches `chain.buildCreateEscrowTx`)",
              },
            },
          },
        ],
      },
      TxSignatureBody: {
        type: "object",
        required: ["txSignature"],
        properties: { txSignature: { type: "string", minLength: 1 } },
      },
      SubmitBody: {
        type: "object",
        required: ["payload"],
        properties: {
          payload: { type: "string", minLength: 1, maxLength: 20_000 },
        },
      },
      OpenDisputeBody: {
        type: "object",
        properties: { reason: { type: "string", maxLength: 2000 } },
      },
      DisputeAttachment: {
        type: "object",
        required: ["id", "fileName", "mimeType", "size", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          fileName: { type: "string" },
          mimeType: { type: "string" },
          size: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      DisputeMessage: {
        type: "object",
        required: ["id", "authorWallet", "body", "createdAt", "attachments"],
        properties: {
          id: { type: "string", format: "uuid" },
          authorWallet: { type: "string" },
          body: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          attachments: {
            type: "array",
            items: { $ref: "#/components/schemas/DisputeAttachment" },
          },
        },
      },
      DisputeAggregateResponse: {
        type: "object",
        required: ["contract", "messages"],
        properties: {
          contract: { $ref: "#/components/schemas/Contract" },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/DisputeMessage" },
          },
        },
      },
      DisputeMessageCreateBody: {
        type: "object",
        required: ["body"],
        properties: {
          body: { type: "string", minLength: 1, maxLength: 10_000 },
          attachmentIds: {
            type: "array",
            maxItems: 10,
            items: { type: "string", format: "uuid" },
          },
        },
      },
      DisputeAttachmentUploadBody: {
        type: "object",
        required: ["fileName", "mimeType", "dataBase64"],
        properties: {
          fileName: { type: "string", minLength: 1, maxLength: 255 },
          mimeType: { type: "string", minLength: 1, maxLength: 128 },
          dataBase64: { type: "string", minLength: 1 },
        },
      },
      ResolveDisputeBody: {
        type: "object",
        required: ["outcome"],
        properties: {
          outcome: { type: "string", enum: [...disputesOutcomes] },
        },
      },
      ResolveDisputeResponse: {
        allOf: [
          { $ref: "#/components/schemas/Contract" },
          {
            type: "object",
            required: ["onchain"],
            properties: {
              onchain: {
                type: "object",
                required: ["executed", "txSignature", "reason"],
                properties: {
                  executed: { type: "boolean" },
                  txSignature: { type: "string", nullable: true },
                  reason: { type: "string", nullable: true },
                },
              },
            },
          },
        ],
      },
      CopilotCamelResult: {
        type: "object",
        description: "JSON from backend QVAC (camelCase)",
        properties: {
          ambiguities: { type: "array", items: { type: "string" } },
          rewriteSuggestions: { type: "array", items: { type: "string" } },
          acceptanceCriteria: { type: "array", items: { type: "string" } },
          riskScore: { type: "integer", minimum: 0, maximum: 100 },
          riskFactors: { type: "array", items: { type: "string" } },
        },
      },
      CopilotSnippetInput: {
        type: "object",
        required: ["scope", "deliverables", "timeline", "paymentTerms"],
        additionalProperties: false,
        properties: {
          scope: { type: "string", minLength: 1, maxLength: 10_000 },
          deliverables: { type: "string", minLength: 1, maxLength: 10_000 },
          timeline: { type: "string", minLength: 1, maxLength: 10_000 },
          paymentTerms: { type: "string", minLength: 1, maxLength: 10_000 },
        },
      },
      CopilotTechnicalAssignmentInput: {
        type: "object",
        required: ["technicalAssignment"],
        additionalProperties: false,
        description:
          "Single draft from wizard; preferred over repeating the same body in four section fields.",
        properties: {
          technicalAssignment: {
            type: "string",
            minLength: 1,
            maxLength: 10_000,
          },
        },
      },
      CopilotInputUnion: {
        oneOf: [
          { $ref: "#/components/schemas/CopilotTechnicalAssignmentInput" },
          { $ref: "#/components/schemas/CopilotSnippetInput" },
        ],
      },
      PreviewCopilotRequest: {
        type: "object",
        required: ["scenario", "input"],
        properties: {
          scenario: { $ref: "#/components/schemas/Scenario" },
          input: { $ref: "#/components/schemas/CopilotInputUnion" },
        },
      },
      CopilotPreviewResponse: {
        type: "object",
        required: ["result", "scenario", "modelId", "modelVersion"],
        properties: {
          result: { $ref: "#/components/schemas/CopilotCamelResult" },
          scenario: { $ref: "#/components/schemas/Scenario" },
          modelId: { type: "string" },
          modelVersion: { type: "string" },
        },
      },
      RunCopilotPersistRequest: {
        type: "object",
        required: ["scenario", "input"],
        properties: {
          scenario: { $ref: "#/components/schemas/Scenario" },
          input: { $ref: "#/components/schemas/CopilotInputUnion" },
        },
      },
      RunDisputeRequest: {
        type: "object",
        required: ["scenario", "input"],
        properties: {
          scenario: { $ref: "#/components/schemas/Scenario" },
          input: {
            type: "object",
            required: [
              "requirementSnapshot",
              "submissionSummary",
              "conversation",
            ],
            properties: {
              requirementSnapshot: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 200,
              },
              submissionSummary: {
                type: "string",
                minLength: 1,
                maxLength: 20_000,
              },
              conversation: {
                type: "array",
                items: { type: "string" },
                maxItems: 500,
              },
            },
          },
        },
      },
      DisputeBriefCamelResult: {
        type: "object",
        properties: {
          caseSummary: { type: "string" },
          timeline: { type: "array", items: { type: "string" } },
          agreedRequirements: { type: "array", items: { type: "string" } },
          submittedEvidence: { type: "array", items: { type: "string" } },
          matchesAndGaps: { type: "array", items: { type: "string" } },
          similarityScore: { type: "number", minimum: 0, maximum: 100 },
          riskAssessment: { type: "string" },
          recommendedResolution: { type: "string" },
        },
      },
      AiOutputRow: {
        type: "object",
        required: [
          "id",
          "contractId",
          "kind",
          "modelId",
          "modelVersion",
          "inputHash",
          "outputHash",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          contractId: { type: "string", format: "uuid" },
          kind: { type: "string", enum: ["contract_copilot", "dispute_brief"] },
          modelId: { type: "string" },
          modelVersion: { type: "string" },
          inputHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
          outputHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
          resultJson: { type: "object", additionalProperties: true },
          similarityScore: { type: "number", nullable: true },
          riskScore: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CopilotRunPersistResponse: {
        allOf: [
          { $ref: "#/components/schemas/AiOutputRow" },
          {
            type: "object",
            required: ["result", "scenario", "modelId", "modelVersion"],
            properties: {
              result: { $ref: "#/components/schemas/CopilotCamelResult" },
              scenario: { $ref: "#/components/schemas/Scenario" },
              modelId: { type: "string" },
              modelVersion: { type: "string" },
            },
          },
        ],
      },
      DisputeRunPersistResponse: {
        allOf: [
          { $ref: "#/components/schemas/AiOutputRow" },
          {
            type: "object",
            required: ["result", "scenario", "modelId", "modelVersion"],
            properties: {
              result: { $ref: "#/components/schemas/DisputeBriefCamelResult" },
              scenario: { $ref: "#/components/schemas/Scenario" },
              modelId: { type: "string" },
              modelVersion: { type: "string" },
            },
          },
        ],
      },
      PostCopilotOutputBody: {
        type: "object",
        required: ["modelId", "modelVersion", "result"],
        properties: {
          modelId: { type: "string", maxLength: 200 },
          modelVersion: { type: "string", maxLength: 100 },
          inputHash: {
            type: "string",
            pattern: "^[0-9a-f]{64}$",
            nullable: true,
          },
          outputHash: {
            type: "string",
            pattern: "^[0-9a-f]{64}$",
            nullable: true,
          },
          result: {
            type: "object",
            properties: {
              ambiguities: { type: "array", items: { type: "string" } },
              rewrite_suggestions: {
                type: "array",
                items: {
                  type: "object",
                  required: ["target", "replacement"],
                  properties: {
                    target: { type: "string" },
                    replacement: { type: "string" },
                  },
                },
              },
              acceptance_criteria: { type: "array", items: { type: "string" } },
              risk_score: { type: "integer", minimum: 0, maximum: 100 },
              risk_factors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      PostDisputeOutputBody: {
        type: "object",
        required: ["modelId", "modelVersion", "result"],
        properties: {
          modelId: { type: "string", maxLength: 200 },
          modelVersion: { type: "string", maxLength: 100 },
          inputHash: {
            type: "string",
            pattern: "^[0-9a-f]{64}$",
            nullable: true,
          },
          outputHash: {
            type: "string",
            pattern: "^[0-9a-f]{64}$",
            nullable: true,
          },
          result: { type: "object", additionalProperties: true },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing/expired Bearer JWT",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                code: { type: "string", example: "UNAUTHORIZED" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      BadRequest: {
        description: "Validation or nonce/tx rejection",
        content: {
          "application/json": {
            schema: {
              oneOf: [
                { $ref: "#/components/schemas/ApiError" },
                { $ref: "#/components/schemas/ValidationError" },
              ],
            },
          },
        },
      },
      Forbidden: {
        description: "Business rule forbidden",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      Conflict: {
        description: "Invalid state transition",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      QvacUnavailable: {
        description: "Backend QVAC / Bare worker unavailable",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string", enum: ["QVAC_UNAVAILABLE"] },
                message: { type: "string" },
                hint: {
                  type: "string",
                  description: "Present when failure was RPC init timeout",
                },
              },
            },
          },
        },
      },
    },
  },
  security: [],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "chain", "rpcUrl"],
                  properties: {
                    status: { type: "string", enum: ["ok"] },
                    chain: { type: "string", enum: ["mock", "solana"] },
                    rpcUrl: { type: "string" },
                    qvac: {
                      description:
                        "Present when `QVAC_ENABLED=true`: warm-up state for the Bare-backed inference worker",
                      oneOf: [
                        {
                          type: "object",
                          required: ["state"],
                          properties: {
                            state: { type: "string", enum: ["disabled"] },
                          },
                        },
                        {
                          type: "object",
                          required: ["state"],
                          properties: {
                            state: { type: "string", enum: ["idle"] },
                          },
                        },
                        {
                          type: "object",
                          required: ["state"],
                          properties: {
                            state: { type: "string", enum: ["warming"] },
                            detail: { type: "string" },
                          },
                        },
                        {
                          type: "object",
                          required: ["state"],
                          properties: {
                            state: { type: "string", enum: ["ready"] },
                          },
                        },
                        {
                          type: "object",
                          required: ["state", "detail"],
                          properties: {
                            state: { type: "string", enum: ["error"] },
                            detail: { type: "string" },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/nonce": {
      post: {
        tags: ["Auth"],
        summary: "Issue SIWS nonce",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NonceBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Nonce payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NonceResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/auth/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify SIWS signature; returns JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VerifyResponse" },
              },
            },
          },
          "400": {
            description: "NONCE_INVALID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "401": {
            description: "SIGNATURE_INVALID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/me": {
      get: {
        tags: ["Profile"],
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "USER_NOT_FOUND",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/me/role": {
      post: {
        tags: ["Profile"],
        summary: "Set role first time",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "New JWT with role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SetRoleResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": {
            description: "ROLE_ALREADY_SET — use PATCH",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Change role",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "New JWT",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SetRoleResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts": {
      post: {
        tags: ["Contracts"],
        summary: "Create contract (customer)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateContractBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Stored contract + escrow unsigned tx",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContractCreateResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": {
            description: "customer role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
      get: {
        tags: ["Contracts"],
        summary: "List contracts (role-aware)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "role",
            in: "query",
            schema: { type: "string", enum: ["customer", "user"] },
            description: "Override JWT role for filtering",
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [...contractStatuses, "available", "mine"],
            },
            description: "`available`: open gigs; `mine`: assignee=all",
          },
        ],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Contract" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}": {
      get: {
        tags: ["Contracts"],
        summary: "Get contract",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Contracts"],
        summary: "Patch draft (customer)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchContractBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/fund": {
      post: {
        tags: ["Contracts"],
        summary: "Record funding tx",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TxSignatureBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": {
            description: "TX_INVALID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/contracts/{id}/accept": {
      post: {
        tags: ["Contracts"],
        summary: "Performer accepts open contract",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/contracts/{id}/submit": {
      post: {
        tags: ["Contracts"],
        summary: "Assignee submits work",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SubmitBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/approve": {
      post: {
        tags: ["Contracts"],
        summary: "Customer approves delivery",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TxSignatureBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": {
            description: "TX_INVALID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/contracts/{id}/dispute": {
      post: {
        tags: ["Contracts"],
        summary: "Either party opens dispute",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OpenDisputeBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contract" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
      get: {
        tags: ["Contracts"],
        summary: "Dispute aggregate (contract + message thread)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DisputeAggregateResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/contracts/{id}/dispute/attachments": {
      post: {
        tags: ["Contracts"],
        summary: "Upload dispute attachment (base64 JSON)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DisputeAttachmentUploadBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created attachment metadata",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DisputeAttachment" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/dispute/messages": {
      post: {
        tags: ["Contracts"],
        summary: "Post dispute message (optional attachment ids)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DisputeMessageCreateBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created message",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DisputeMessage" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/dispute/attachments/{attachmentId}/file": {
      get: {
        tags: ["Contracts"],
        summary: "Download dispute attachment bytes",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/ContractId" },
          {
            name: "attachmentId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "File stream",
            content: {
              "application/octet-stream": { schema: { type: "string", format: "binary" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/contracts/{id}/resolve-dispute": {
      post: {
        tags: ["Contracts"],
        summary: "Record dispute outcome (+ optional arbiter auto-tx)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResolveDisputeBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated contract",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResolveDisputeResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/ai/copilot-preview": {
      post: {
        tags: ["AI"],
        summary: "Run QVAC contract copilot (no DB row)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PreviewCopilotRequest" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CopilotPreviewResponse" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "503": { $ref: "#/components/responses/QvacUnavailable" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/copilot-run": {
      post: {
        tags: ["AI"],
        summary: "Run backend QVAC copilot; persist AiOutput",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RunCopilotPersistRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Row + echoes",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CopilotRunPersistResponse",
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "503": { $ref: "#/components/responses/QvacUnavailable" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/dispute-run": {
      post: {
        tags: ["AI"],
        summary: "Run backend QVAC dispute brief; persist AiOutput",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RunDisputeRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Stored brief",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DisputeRunPersistResponse",
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "503": { $ref: "#/components/responses/QvacUnavailable" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/copilot-output": {
      post: {
        tags: ["AI"],
        summary: "Client-posted copilot JSON (offline QVAC)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostCopilotOutputBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created row",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiOutputRow" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/dispute-output": {
      post: {
        tags: ["AI"],
        summary: "Client-posted dispute brief JSON (offline QVAC)",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ContractId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostDisputeOutputBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiOutputRow" },
              },
            },
            description: "OK",
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/contracts/{id}/ai-outputs": {
      get: {
        tags: ["AI"],
        summary: "List AiOutput rows",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/ContractId" },
          {
            name: "kind",
            in: "query",
            schema: {
              type: "string",
              enum: ["contract_copilot", "dispute_brief"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Array",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AiOutputRow" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};
