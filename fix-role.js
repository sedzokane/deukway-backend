const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ndXgxOiATeVyVRBZwoClMGhHJZamJFYX@trolley.proxy.rlwy.net:24998/railway' } }
});
async function main() {
  const user = await prisma.user.update({
    where: { id: 'a554b6ed-3335-463d-ae4f-a346361ff7d4' },
    data: { role: 'TENANT' },
  });
  console.log('Done:', user.firstName, user.role);
}
main().catch(console.error).finally(function(){ prisma.$disconnect(); });
