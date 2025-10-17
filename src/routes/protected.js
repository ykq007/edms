async function protectedRoutes(fastify) {
  fastify.get(
    '/admin/protected',
    {
      preHandler: [fastify.authorizeRoles(['admin'])],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' }
                },
                required: ['id', 'email']
              }
            },
            required: ['message', 'user']
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            },
            required: ['message']
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            },
            required: ['message']
          }
        }
      }
    },
    async (request) => ({
      message: 'Access granted: admin role verified.',
      user: {
        id: request.user.sub,
        email: request.user.email
      }
    })
  );
}

module.exports = protectedRoutes;
