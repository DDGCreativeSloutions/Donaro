const prisma = require('./db');

class FraudDetectionService {
  // Check if user is submitting too many donations in a short time period
  async checkDonationFrequency(userId) {
    try {
      // Get donations from the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentDonations = await prisma.donation.count({
        where: {
          userId: userId,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });
      
      // Flag as potential fraud if more than 10 donations in 24 hours
      return recentDonations > 10;
    } catch (error) {
      console.error('Error checking donation frequency:', error);
      return false;
    }
  }
  
  // Check if user is submitting donations with suspicious patterns
  async checkSuspiciousPatterns(donationData) {
    try {
      // Check for duplicate descriptions
      const duplicateDescriptionCount = await prisma.donation.count({
        where: {
          userId: donationData.userId,
          description: donationData.description,
        },
      });
      
      // Check for duplicate locations
      const duplicateLocationCount = await prisma.donation.count({
        where: {
          userId: donationData.userId,
          location: donationData.location,
        },
      });
      
      // Flag as potential fraud if same description or location used more than 5 times
      return duplicateDescriptionCount > 5 || duplicateLocationCount > 5;
    } catch (error) {
      console.error('Error checking suspicious patterns:', error);
      return false;
    }
  }
  
  // Check if user has been flagged for fraud before
  async checkFraudHistory(userId) {
    try {
      // In a real implementation, you would check a fraud history table
      // For now, we'll check if user has had rejected donations
      const rejectedDonations = await prisma.donation.count({
        where: {
          userId: userId,
          status: 'rejected',
        },
      });
      
      // Flag as potential fraud if user has more than 3 rejected donations
      return rejectedDonations > 3;
    } catch (error) {
      console.error('Error checking fraud history:', error);
      return false;
    }
  }
  
  // Main fraud detection function
  async detectFraud(donationData) {
    try {
      const checks = await Promise.all([
        this.checkDonationFrequency(donationData.userId),
        this.checkSuspiciousPatterns(donationData),
        this.checkFraudHistory(donationData.userId),
      ]);
      
      // Return true if any check flags the donation as potentially fraudulent
      return checks.some(check => check === true);
    } catch (error) {
      console.error('Error detecting fraud:', error);
      return false;
    }
  }
  
  // Flag a donation as potentially fraudulent
  async flagFraudulentDonation(donationId, reason) {
    try {
      // In a real implementation, you would store this in a fraud log table
      console.log(`Flagged donation ${donationId} as potentially fraudulent. Reason: ${reason}`);
      
      // For now, we'll just log it
      // In a production system, you might want to:
      // 1. Notify admins
      // 2. Automatically reject the donation
      // 3. Temporarily suspend the user's account
      // 4. Add the user to a watchlist
    } catch (error) {
      console.error('Error flagging fraudulent donation:', error);
    }
  }
}

module.exports = new FraudDetectionService();