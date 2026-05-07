export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Split Backend API',
    description: 'Wallet auth, roles, contracts lifecycle, and QVAC AI endpoints.',
    version: '0.1.0',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local backend' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Profile' },
    { name: 'Contracts' },
    { name: 'AI' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
      },
    },
    '/auth/nonce': {
      post: {
        tags: ['Auth'],
        summary: 'Issue SIWS nonce',
      },
    },
    '/auth/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify SIWS signature and issue JWT',
      },
    },
    '/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    '/me/role': {
      post: {
        tags: ['Profile'],
        summary: 'Set role first time',
        security: [{ bearerAuth: [] }],
      },
      patch: {
        tags: ['Profile'],
        summary: 'Change role',
        security: [{ bearerAuth: [] }],
      },
    },
    '/contracts': {
      post: {
        tags: ['Contracts'],
        summary: 'Create contract',
        security: [{ bearerAuth: [] }],
      },
      get: {
        tags: ['Contracts'],
        summary: 'List contracts',
        security: [{ bearerAuth: [] }],
      },
    },
    '/ai/copilot-preview': {
      post: {
        tags: ['AI'],
        summary: 'Run QVAC contract copilot without persistence',
        security: [{ bearerAuth: [] }],
      },
    },
    '/contracts/{id}/copilot-run': {
      post: {
        tags: ['AI'],
        summary: 'Run QVAC contract copilot and store output',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/contracts/{id}/dispute-run': {
      post: {
        tags: ['AI'],
        summary: 'Run QVAC dispute brief and store output',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/contracts/{id}/ai-outputs': {
      get: {
        tags: ['AI'],
        summary: 'List AI outputs for contract',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'kind', in: 'query', required: false, schema: { type: 'string' } },
        ],
      },
    },
  },
} as const
