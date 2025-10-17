function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.map((role) => String(role));
}

function hasRequiredRoles(userRoles = [], requiredRoles = []) {
  if (!requiredRoles.length) {
    return true;
  }

  const normalizedUserRoles = new Set(normalizeRoles(userRoles));
  return normalizeRoles(requiredRoles).every((role) => normalizedUserRoles.has(role));
}

function createRoleGuard(fastify, requiredRoles = []) {
  if (!Array.isArray(requiredRoles)) {
    throw new Error('createRoleGuard expects an array of required roles');
  }

  return async function roleGuard(request, reply) {
    await fastify.authenticate(request, reply);

    if (reply.sent) {
      return;
    }

    if (!hasRequiredRoles(request.user?.roles, requiredRoles)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}

module.exports = {
  hasRequiredRoles,
  createRoleGuard
};
