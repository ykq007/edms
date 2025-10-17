const config = require('../config');
const { verifyUserCredentials } = require('../services/userService');

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        expiresIn: { type: 'number' }
      },
      required: ['token', 'expiresIn']
    },
    401: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    500: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
};

function toSeconds(expiry) {
  if (typeof expiry === 'number' && Number.isFinite(expiry)) {
    return expiry;
  }

  if (typeof expiry === 'string') {
    const trimmed = expiry.trim();
    const directNumber = Number(trimmed);
    if (Number.isFinite(directNumber) && directNumber > 0) {
      return directNumber;
    }

    const match = trimmed.match(/^(\d+)([smhd])$/i);
    if (match) {
      const value = Number(match[1]);
      const unit = match[2].toLowerCase();

      const multipliers = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60
      };

      return value * multipliers[unit];
    }
  }

  return 60 * 60; // default 1 hour
}

async function authRoutes(fastify) {
  fastify.post('/auth/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body;

    try {
      const user = await verifyUserCredentials(email, password);

      if (!user) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      const expiresInConfig = config.jwtExpiresIn || '1h';
      const expiresInSeconds = toSeconds(expiresInConfig);
      const token = fastify.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          roles: user.roles
        },
        { expiresIn: expiresInConfig }
      );

      return { token, expiresIn: expiresInSeconds };
    } catch (error) {
      request.log.error({ err: error }, 'Login attempt failed');
      return reply.code(500).send({ message: 'Unable to process request' });
    }
  });
}

module.exports = authRoutes;
