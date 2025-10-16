const prisma = require('./src/utils/db');

async function testDonation() {
  try {
    console.log('Testing database connection...');
    
    // First, get the actual user ID from the database
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const userId = users[0].id;
    console.log('Using user ID:', userId);
    
    // Try to create a donation with the correct user ID
    const donation = await prisma.donation.create({
      data: {
        userId: userId,
        type: 'food',
        title: 'Test Donation',
        description: 'Test donation description',
        quantity: '5 items',
        receiver: 'Test Receiver',
        credits: 100,
        date: '2025-10-15',
        time: '10:00:00',
        location: 'Test Location',
        donationPhoto: 'test-donation-photo.jpg',
        selfiePhoto: 'test-selfie-photo.jpg',
      },
    });
    
    console.log('Donation created successfully:', donation);
    
    // Clean up - delete the test donation
    await prisma.donation.delete({
      where: { id: donation.id },
    });
    
    console.log('Test donation cleaned up');
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDonation();