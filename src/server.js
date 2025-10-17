const Fastify = require('fastify');
const config = require('./config');
const authPlugin = require('./plugins/auth');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const { seedAdminUser } = require('./services/userService');

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: 'info'
    }
  });

  try {
    await seedAdminUser();
    fastify.log.info('Admin user seeded');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to seed admin user');
    throw error;
  }

  await fastify.register(authPlugin, {
    secret: config.jwtSecret,
    expiresIn: config.jwtExpiresIn
  });

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.register(authRoutes);
  fastify.register(protectedRoutes);

  return fastify;
}

async function start() {
  const fastify = await buildServer();

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = {
  buildServer
};
