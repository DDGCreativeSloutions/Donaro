const prisma = require('./src/utils/db');
const { hashPassword } = require('./src/utils/auth');

async function createDummyUsers() {
  try {
    console.log('Creating dummy users...');

    const dummyUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        totalCredits: 150,
        lifetimeCredits: 200,
        withdrawableCredits: 50,
        totalDonations: 3
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        password: 'password123',
        totalCredits: 75,
        lifetimeCredits: 100,
        withdrawableCredits: 25,
        totalDonations: 2
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '5555555555',
        password: 'password123',
        totalCredits: 300,
        lifetimeCredits: 350,
        withdrawableCredits: 150,
        totalDonations: 5
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '7777777777',
        password: 'password123',
        totalCredits: 0,
        lifetimeCredits: 25,
        withdrawableCredits: 0,
        totalDonations: 1
      }
    ];

    for (const userData of dummyUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          totalCredits: userData.totalCredits,
          lifetimeCredits: userData.lifetimeCredits,
          withdrawableCredits: userData.withdrawableCredits,
          totalDonations: userData.totalDonations,
        },
      });

      console.log(`Created user: ${newUser.email} with ${newUser.totalCredits} credits`);
    }

    console.log('Dummy users created successfully!');

  } catch (error) {
    console.error('Error creating dummy users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyUsers();