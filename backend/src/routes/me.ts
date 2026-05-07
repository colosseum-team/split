import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../services/prisma.js'

const SetRoleRequest = z.object({
  role: z.enum(['customer', 'user']),
})

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', async (req, reply) => {
    const claims = app.requireAuth(req)
    const user = await prisma.user.findUnique({
      where: { walletAddress: claims.sub },
    })
    if (!user) return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'user not found' })
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  })

  app.post('/me/role', async (req, reply) => {
    const claims = app.requireAuth(req)
    const { role } = SetRoleRequest.parse(req.body)

    const existing = await prisma.user.findUnique({
      where: { walletAddress: claims.sub },
    })
    if (!existing) {
      return reply.status(404).send({ code: 'USER_NOT_FOUND', message: 'user not found' })
    }
    if (existing.role && existing.role !== role) {
      return reply.status(409).send({
        code: 'ROLE_ALREADY_SET',
        message: `role already set to '${existing.role}'; use PATCH /me/role to change`,
      })
    }

    const updated = await prisma.user.update({
      where: { walletAddress: claims.sub },
      data: { role },
    })
    const newToken = app.jwt.sign(
      { sub: updated.walletAddress, role: updated.role ?? null },
      { expiresIn: '24h' },
    )
    return {
      user: {
        id: updated.id,
        walletAddress: updated.walletAddress,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
      },
      token: newToken,
    }
  })

  app.patch('/me/role', async (req) => {
    const claims = app.requireAuth(req)
    const { role } = SetRoleRequest.parse(req.body)
    const updated = await prisma.user.update({
      where: { walletAddress: claims.sub },
      data: { role },
    })
    const newToken = app.jwt.sign(
      { sub: updated.walletAddress, role: updated.role ?? null },
      { expiresIn: '24h' },
    )
    return {
      user: {
        id: updated.id,
        walletAddress: updated.walletAddress,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
      },
      token: newToken,
    }
  })
}
