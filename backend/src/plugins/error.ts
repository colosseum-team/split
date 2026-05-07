import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'

const plugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply
        .status(400)
        .send({ code: 'VALIDATION_ERROR', message: 'invalid input', details: err.flatten() })
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500
    if (status >= 500) {
      app.log.error({ err }, 'unhandled error')
    }
    return reply.status(status).send({
      code: (err as { code?: string }).code ?? 'INTERNAL_ERROR',
      message: err.message ?? 'internal error',
    })
  })
}

export default fp(plugin, { name: 'error' })
