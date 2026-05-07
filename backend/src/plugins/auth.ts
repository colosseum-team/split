import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export type Role = "customer" | "user";

export interface AuthClaims {
  sub: string;
  role: Role | null;
  iat: number;
  exp: number;
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthClaims;
  }
  interface FastifyInstance {
    requireAuth(req: FastifyRequest): AuthClaims;
    requireRole(roles: Role[]): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return;
    const token = header.slice(7).trim();
    if (!token) return;
    try {
      const claims = (await app.jwt.verify(token)) as AuthClaims;
      req.auth = claims;
    } catch {
      // invalid/expired token — leave req.auth undefined
    }
  });

  app.decorate("requireAuth", function requireAuth(req: FastifyRequest): AuthClaims {
    if (!req.auth) {
      throw Object.assign(new Error("authentication required"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }
    return req.auth;
  });

  app.decorate(
    "requireRole",
    function requireRole(roles: Role[]) {
      return async function (req: FastifyRequest, _reply: FastifyReply) {
        const claims = app.requireAuth(req);
        if (!claims.role || !roles.includes(claims.role)) {
          throw Object.assign(new Error("role not allowed"), {
            statusCode: 403,
            code: "FORBIDDEN",
          });
        }
      };
    },
  );
};

export default fp(plugin, { name: "auth", dependencies: [] });
