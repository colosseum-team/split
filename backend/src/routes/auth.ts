import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../services/prisma.js";
import { assertWallet } from "../services/wallet.js";
import {
  consumeNonce,
  issueNonce,
  nonceMessage,
  verifySignature,
} from "../services/siws.js";

const NonceRequest = z.object({
  walletAddress: z.string().min(32).max(64),
});

const VerifyRequest = z.object({
  walletAddress: z.string().min(32).max(64),
  signature: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/nonce",
    {
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req) => {
      const { walletAddress } = NonceRequest.parse(req.body);
      assertWallet(walletAddress);
      const issued = await issueNonce(walletAddress);
      return {
        nonce: issued.nonce,
        message: issued.message,
        expiresAt: issued.expiresAt.toISOString(),
      };
    },
  );

  app.post(
    "/auth/verify",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      const { walletAddress, signature } = VerifyRequest.parse(req.body);
      assertWallet(walletAddress);
      const nonce = await consumeNonce(walletAddress);
      if (!nonce) {
        return reply
          .status(400)
          .send({ code: "NONCE_INVALID", message: "nonce missing or expired" });
      }
      const ok = verifySignature(walletAddress, nonceMessage(nonce), signature);
      if (!ok) {
        return reply
          .status(401)
          .send({ code: "SIGNATURE_INVALID", message: "signature did not verify" });
      }

      const user = await prisma.user.upsert({
        where: { walletAddress },
        create: { walletAddress },
        update: {},
      });

      const token = app.jwt.sign(
        { sub: user.walletAddress, role: user.role ?? null },
        { expiresIn: "24h" },
      );

      return {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      };
    },
  );
};
