const fp = require('fastify-plugin');
const fastifyJwt = require('@fastify/jwt');
const { createRoleGuard } = require('../utils/roleGuard');

async function authPlugin(fastify, options = {}) {
  const { secret, expiresIn = '1h' } = options;

  if (!secret) {
    throw new Error('JWT secret must be provided');
  }

  await fastify.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn
    }
  });

  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (error) {
      request.log.debug({ err: error }, 'JWT verification failed');
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.decorate('authorizeRoles', function authorizeRoles(requiredRoles = []) {
    if (!Array.isArray(requiredRoles)) {
      throw new Error('authorizeRoles requires an array of roles');
    }

    return createRoleGuard(fastify, requiredRoles);
  });
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin'
});
