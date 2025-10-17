'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const coreRoles = [
  {
    name: 'admin',
    description: 'Full administrative access to all resources and configuration.'
  },
  {
    name: 'editor',
    description: 'Can create and manage documents and document versions.'
  },
  {
    name: 'viewer',
    description: 'Read-only access to published documents and analytics.'
  }
];

async function main() {
  for (const role of coreRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description
      },
      create: role
    });
  }
}

main()
  .then(() => {
    console.log('Seeded core roles successfully.');
  })
  .catch((error) => {
    console.error('Failed to seed roles:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
