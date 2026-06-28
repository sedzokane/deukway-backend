const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ndXgxOiATeVyVRBZwoClMGhHJZamJFYX@trolley.proxy.rlwy.net:24998/railway' } }
});
async function main() {
  const user = await prisma.user.update({
    where: { phone: '+221781731339' },
    data: { role: 'ADMIN' },
  });
  console.log('Done:', user.firstName, user.role);
}
main().catch(console.error).finally(function(){ prisma.$disconnect(); });
