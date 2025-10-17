const { device, element, by, expect: detoxExpect } = require('detox');

describe('Donaro App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Onboarding Flow', () => {
    it('should display onboarding screens', async () => {
      // Check if onboarding screen is visible
      await detoxExpect(element(by.text('Welcome to Donaro'))).toBeVisible();
      
      // Navigate through onboarding screens
      await element(by.id('next-button')).tap();
      await detoxExpect(element(by.text('Verify Donations'))).toBeVisible();
      
      await element(by.id('next-button')).tap();
      await detoxExpect(element(by.text('Earn Rewards'))).toBeVisible();
      
      await element(by.id('get-started-button')).tap();
      await detoxExpect(element(by.text('Login'))).toBeVisible();
    });

    it('should allow skipping onboarding', async () => {
      await element(by.id('skip-button')).tap();
      await detoxExpect(element(by.text('Login'))).toBeVisible();
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      // Navigate to signup
      await element(by.text('Sign Up')).tap();
      await detoxExpect(element(by.text('Create Account'))).toBeVisible();
      
      // Fill registration form
      await element(by.id('name-input')).typeText('E2E Test User');
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('phone-input')).typeText('1234567890');
      await element(by.id('password-input')).typeText('password123');
      
      // Submit registration
      await element(by.id('register-button')).tap();
      
      // Should navigate to dashboard
      await detoxExpect(element(by.text('Welcome back,'))).toBeVisible();
      await detoxExpect(element(by.text('E2E Test User'))).toBeVisible();
    });

    it('should login existing user', async () => {
      // Fill login form
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      
      // Submit login
      await element(by.id('login-button')).tap();
      
      // Should navigate to dashboard
      await detoxExpect(element(by.text('Welcome back,'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@test.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      
      await element(by.id('login-button')).tap();
      
      await detoxExpect(element(by.text('Invalid credentials'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('login-button')).tap();
      
      await detoxExpect(element(by.text('Email is required'))).toBeVisible();
      await detoxExpect(element(by.text('Password is required'))).toBeVisible();
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(async () => {
      // Login before each test
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await detoxExpect(element(by.text('Welcome back,'))).toBeVisible();
    });

    it('should display user stats', async () => {
      await detoxExpect(element(by.text('Total Points'))).toBeVisible();
      await detoxExpect(element(by.text('Verifications'))).toBeVisible();
      await detoxExpect(element(by.text('Rewards'))).toBeVisible();
    });

    it('should navigate to donation screen', async () => {
      await element(by.text('Verify Donation')).tap();
      await detoxExpect(element(by.text('Donation Verification'))).toBeVisible();
    });

    it('should navigate to rewards screen', async () => {
      await element(by.text('Withdraw Points')).tap();
      await detoxExpect(element(by.text('Rewards & Withdrawals'))).toBeVisible();
    });

    it('should navigate to history screen', async () => {
      await element(by.id('history-tab')).tap();
      await detoxExpect(element(by.text('Verification History'))).toBeVisible();
    });

    it('should navigate to profile screen', async () => {
      await element(by.id('profile-tab')).tap();
      await detoxExpect(element(by.text('Profile'))).toBeVisible();
    });
  });

  describe('Donation Creation Flow', () => {
    beforeEach(async () => {
      // Login and navigate to donation screen
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await element(by.id('donate-tab')).tap();
    });

    it('should create a food donation', async () => {
      // Select donation type
      await element(by.text('Food')).tap();
      
      // Fill donation form
      await element(by.id('title-input')).typeText('E2E Food Donation');
      await element(by.id('description-input')).typeText('Fresh vegetables for testing');
      await element(by.id('quantity-input')).typeText('5 kg');
      await element(by.id('receiver-input')).typeText('Local Food Bank');
      
      // Add photos (mock)
      await element(by.id('donation-photo-button')).tap();
      await element(by.text('Camera')).tap();
      
      await element(by.id('selfie-photo-button')).tap();
      await element(by.text('Camera')).tap();
      
      // Submit donation
      await element(by.id('submit-donation-button')).tap();
      
      // Should show success message
      await detoxExpect(element(by.text('Donation submitted successfully!'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('submit-donation-button')).tap();
      
      await detoxExpect(element(by.text('Title is required'))).toBeVisible();
      await detoxExpect(element(by.text('Description is required'))).toBeVisible();
    });

    it('should create different types of donations', async () => {
      const donationTypes = ['Clothes', 'Books', 'Blood', 'Other'];
      
      for (const type of donationTypes) {
        await element(by.text(type)).tap();
        
        await element(by.id('title-input')).clearText();
        await element(by.id('title-input')).typeText(`E2E ${type} Donation`);
        await element(by.id('description-input')).clearText();
        await element(by.id('description-input')).typeText(`${type} donation for testing`);
        await element(by.id('quantity-input')).clearText();
        await element(by.id('quantity-input')).typeText('1 unit');
        await element(by.id('receiver-input')).clearText();
        await element(by.id('receiver-input')).typeText('Test Receiver');
        
        await element(by.id('submit-donation-button')).tap();
        await detoxExpect(element(by.text('Donation submitted successfully!'))).toBeVisible();
        
        // Reset form for next iteration
        await element(by.id('reset-form-button')).tap();
      }
    });
  });

  describe('History and Status Tracking', () => {
    beforeEach(async () => {
      // Login and navigate to history
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await element(by.id('history-tab')).tap();
    });

    it('should display donation history', async () => {
      await detoxExpect(element(by.text('Verification History'))).toBeVisible();
      
      // Should show created donations
      await detoxExpect(element(by.text('E2E Food Donation'))).toBeVisible();
    });

    it('should filter donations by status', async () => {
      // Test filter buttons
      await element(by.text('Pending')).tap();
      await detoxExpect(element(by.id('pending-donations-list'))).toBeVisible();
      
      await element(by.text('Approved')).tap();
      await detoxExpect(element(by.id('approved-donations-list'))).toBeVisible();
      
      await element(by.text('Rejected')).tap();
      await detoxExpect(element(by.id('rejected-donations-list'))).toBeVisible();
      
      await element(by.text('All')).tap();
      await detoxExpect(element(by.id('all-donations-list'))).toBeVisible();
    });

    it('should refresh donation list', async () => {
      await element(by.id('donations-list')).swipe('down');
      await detoxExpect(element(by.id('refresh-indicator'))).toBeVisible();
    });
  });

  describe('Rewards and Withdrawals', () => {
    beforeEach(async () => {
      // Login and navigate to rewards
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await element(by.id('rewards-tab')).tap();
    });

    it('should display current balance', async () => {
      await detoxExpect(element(by.text('Current Balance'))).toBeVisible();
      await detoxExpect(element(by.id('balance-amount'))).toBeVisible();
    });

    it('should create withdrawal request', async () => {
      // Check if user has withdrawable balance
      const balanceElement = element(by.id('withdrawable-balance'));
      
      // Fill withdrawal form
      await element(by.id('withdrawal-amount-input')).typeText('10');
      await element(by.id('payment-method-picker')).tap();
      await element(by.text('Bank Transfer')).tap();
      
      await element(by.id('submit-withdrawal-button')).tap();
      
      // Should show success or insufficient funds message
      await detoxExpect(element(by.text('Withdrawal request submitted'))).toBeVisible();
    });

    it('should validate withdrawal amount', async () => {
      await element(by.id('withdrawal-amount-input')).typeText('0');
      await element(by.id('submit-withdrawal-button')).tap();
      
      await detoxExpect(element(by.text('Amount must be greater than 0'))).toBeVisible();
    });

    it('should display withdrawal history', async () => {
      await element(by.text('Withdrawal History')).tap();
      await detoxExpect(element(by.id('withdrawal-history-list'))).toBeVisible();
    });
  });

  describe('Profile Management', () => {
    beforeEach(async () => {
      // Login and navigate to profile
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await element(by.id('profile-tab')).tap();
    });

    it('should display user information', async () => {
      await detoxExpect(element(by.text('E2E Test User'))).toBeVisible();
      await detoxExpect(element(by.text('e2e@test.com'))).toBeVisible();
    });

    it('should update profile information', async () => {
      await element(by.id('edit-profile-button')).tap();
      
      await element(by.id('name-input')).clearText();
      await element(by.id('name-input')).typeText('Updated E2E User');
      
      await element(by.id('save-profile-button')).tap();
      
      await detoxExpect(element(by.text('Profile updated successfully'))).toBeVisible();
      await detoxExpect(element(by.text('Updated E2E User'))).toBeVisible();
    });

    it('should navigate to settings', async () => {
      await element(by.text('Settings')).tap();
      await detoxExpect(element(by.text('App Settings'))).toBeVisible();
    });

    it('should logout user', async () => {
      await element(by.text('Logout')).tap();
      await element(by.text('Confirm')).tap();
      
      await detoxExpect(element(by.text('Login'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error by using invalid API endpoint
      await device.setURLBlacklist(['*']);
      
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await detoxExpect(element(by.text('Network error'))).toBeVisible();
      
      // Reset network
      await device.setURLBlacklist([]);
    });

    it('should handle app crashes gracefully', async () => {
      // This test would need to be implemented based on specific crash scenarios
      // For now, we'll test that the app can recover from background/foreground
      await device.sendToHome();
      await device.launchApp();
      
      // App should still be functional
      await detoxExpect(element(by.text('Login'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      await detoxExpect(element(by.id('email-input'))).toHaveAccessibilityLabel('Email input field');
      await detoxExpect(element(by.id('password-input'))).toHaveAccessibilityLabel('Password input field');
      await detoxExpect(element(by.id('login-button'))).toHaveAccessibilityLabel('Login button');
    });

    it('should support screen reader navigation', async () => {
      // Enable accessibility mode
      await device.enableSynchronization();
      
      // Test that elements are properly focusable
      await element(by.id('email-input')).tap();
      await detoxExpect(element(by.id('email-input'))).toBeFocused();
    });
  });

  describe('Performance', () => {
    it('should load screens within acceptable time', async () => {
      const startTime = Date.now();
      
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await detoxExpect(element(by.text('Welcome back,'))).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should handle rapid navigation', async () => {
      // Login first
      await element(by.id('email-input')).typeText('e2e@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // Rapidly navigate between tabs
      const tabs = ['donate-tab', 'history-tab', 'rewards-tab', 'profile-tab', 'dashboard-tab'];
      
      for (let i = 0; i < 3; i++) {
        for (const tab of tabs) {
          await element(by.id(tab)).tap();
          await device.waitForTimeout(100); // Brief pause
        }
      }
      
      // App should still be responsive
      await detoxExpect(element(by.id('dashboard-tab'))).toBeVisible();
    });
  });

  afterAll(async () => {
    // Cleanup: logout and reset app state
    try {
      await element(by.id('profile-tab')).tap();
      await element(by.text('Logout')).tap();
      await element(by.text('Confirm')).tap();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
});