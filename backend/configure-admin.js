const prisma = require('./src/utils/db');
const { hashPassword } = require('./src/utils/auth');

async function configureAdmin() {
  try {
    console.log('Configuring admin user...');
    
    // Use environment variables or default values
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const adminPhone = process.env.ADMIN_PHONE || '0000000000';
    
    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (existingUser) {
      // Update existing admin user
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: adminName,
          phone: adminPhone,
          password: hashedPassword,
        },
      });
      console.log('Admin user updated successfully:', updatedUser.email);
    } else {
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: hashedPassword,
        },
      });
      console.log('Admin user created successfully:', newUser.email);
    }
  } catch (error) {
    console.error('Error configuring admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

configureAdmin();