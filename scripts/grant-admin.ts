import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantAdmin() {
  const email = 'anthony.robinson@robbgroupe.com';
  
  try {
    const result = await prisma.tenant.update({
      where: { email },
      data: { isAdmin: true },
    });
    
    console.log(`✅ Admin access granted to: ${result.email}`);
    console.log(`   Company: ${result.companyName}`);
    console.log(`   ID: ${result.id}`);
  } catch (error) {
    console.error('❌ Failed to grant admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

grantAdmin();
