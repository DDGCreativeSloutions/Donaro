const prisma = require('./src/utils/db');

async function listUsers() {
  try {
    console.log('Listing users...');
    
    const users = await prisma.user.findMany();
    
    console.log('Users found:', users);
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();