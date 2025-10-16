import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface DonationData {
  userId: string;
  donationType: string;
  location: Location.LocationObject | null;
  timestamp: Date;
  description: string;
}

export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export class FraudDetector {
  private static instance: FraudDetector;
  private userDonationHistory: Map<string, DonationData[]> = new Map();

  private constructor() {}

  public static getInstance(): FraudDetector {
    if (!FraudDetector.instance) {
      FraudDetector.instance = new FraudDetector();
    }
    return FraudDetector.instance;
  }

  /**
   * Add a donation to user history for tracking
   */
  public addDonationToHistory(userId: string, donation: DonationData): void {
    if (!this.userDonationHistory.has(userId)) {
      this.userDonationHistory.set(userId, []);
    }
    
    const history = this.userDonationHistory.get(userId) || [];
    history.push(donation);
    this.userDonationHistory.set(userId, history);
  }

  /**
   * Analyze a donation for potential fraud
   */
  public analyzeDonation(userId: string, donation: DonationData): FraudDetectionResult {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskLevel: 'low',
      reasons: []
    };

    try {
      // Check 1: Location validation
      const locationCheck = this.checkLocationValidity(donation);
      if (locationCheck.isFraudulent) {
        result.isFraudulent = true;
        result.riskLevel = this.getHigherRiskLevel(result.riskLevel, locationCheck.riskLevel);
        result.reasons.push(...locationCheck.reasons);
      }

      // Check 2: Time-based analysis
      const timeCheck = this.checkTimePatterns(userId, donation);
      if (timeCheck.isFraudulent) {
        result.isFraudulent = true;
        result.riskLevel = this.getHigherRiskLevel(result.riskLevel, timeCheck.riskLevel);
        result.reasons.push(...timeCheck.reasons);
      }

      // Check 3: Frequency analysis
      const frequencyCheck = this.checkDonationFrequency(userId, donation);
      if (frequencyCheck.isFraudulent) {
        result.isFraudulent = true;
        result.riskLevel = this.getHigherRiskLevel(result.riskLevel, frequencyCheck.riskLevel);
        result.reasons.push(...frequencyCheck.reasons);
      }

      // Check 4: Content analysis
      const contentCheck = this.checkContentValidity(donation);
      if (contentCheck.isFraudulent) {
        result.isFraudulent = true;
        result.riskLevel = this.getHigherRiskLevel(result.riskLevel, contentCheck.riskLevel);
        result.reasons.push(...contentCheck.reasons);
      }
    } catch (error) {
      console.error('Error in fraud detection:', error);
      // Don't block submission if fraud detection fails
    }

    return result;
  }

  /**
   * Check if location data is valid
   */
  private checkLocationValidity(donation: DonationData): FraudDetectionResult {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskLevel: 'low',
      reasons: []
    };

    if (!donation.location) {
      result.isFraudulent = true;
      result.riskLevel = 'high';
      result.reasons.push('Missing location data - please ensure location services are enabled');
      return result;
    }

    // Check if location seems realistic (not 0,0)
    if (donation.location.coords.latitude === 0 && donation.location.coords.longitude === 0) {
      result.isFraudulent = true;
      result.riskLevel = 'high';
      result.reasons.push('Suspicious location coordinates detected - please try again in a different location');
    }
    
    // Check if accuracy is reasonable
    // Be more lenient on web platform where accuracy is typically lower
    const maxAccuracy = Platform.OS === 'web' ? 5000 : 1000;
    if (donation.location.coords.accuracy && donation.location.coords.accuracy > maxAccuracy) {
      result.isFraudulent = true;
      result.riskLevel = Platform.OS === 'web' ? 'low' : 'medium';
      result.reasons.push(`Low location accuracy detected (${donation.location.coords.accuracy}m) - please ensure you're in an open area`);
    }
    
    // Check if location is mocked (Android)
    if ((donation.location as any).mocked) {
      result.isFraudulent = true;
      result.riskLevel = 'high';
      result.reasons.push('Mocked location detected - please disable location spoofing apps');
    }

    return result;
  }

  /**
   * Check for suspicious time patterns
   */
  private checkTimePatterns(userId: string, donation: DonationData): FraudDetectionResult {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskLevel: 'low',
      reasons: []
    };

    const userHistory = this.userDonationHistory.get(userId) || [];
    if (userHistory.length === 0) return result;

    // Check if donations are happening too frequently
    const recentDonations = userHistory.filter(d => {
      const timeDiff = Math.abs(donation.timestamp.getTime() - d.timestamp.getTime());
      return timeDiff < 30 * 60 * 1000; // Within 30 minutes
    });

    if (recentDonations.length > 3) {
      result.isFraudulent = true;
      result.riskLevel = 'medium';
      result.reasons.push('Multiple donations detected in a short time period - please wait before submitting another donation');
    }

    // Check for identical time patterns
    const sameTimeDonations = userHistory.filter(d => {
      const timeDiff = Math.abs(donation.timestamp.getTime() - d.timestamp.getTime());
      return timeDiff < 60 * 1000; // Within 1 minute
    });

    if (sameTimeDonations.length > 1) {
      result.isFraudulent = true;
      result.riskLevel = 'medium';
      result.reasons.push('Donations detected at identical times - please wait before submitting another donation');
    }

    return result;
  }

  /**
   * Check donation frequency
   */
  private checkDonationFrequency(userId: string, donation: DonationData): FraudDetectionResult {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskLevel: 'low',
      reasons: []
    };

    const userHistory = this.userDonationHistory.get(userId) || [];
    if (userHistory.length === 0) return result;

    // Check if same location used repeatedly
    const sameLocationDonations = userHistory.filter(d => {
      if (!d.location || !donation.location) return false;
      
      const distance = this.calculateDistance(
        d.location.coords.latitude,
        d.location.coords.longitude,
        donation.location.coords.latitude,
        donation.location.coords.longitude
      );
      
      return distance < 100; // Within 100 meters
    });

    if (sameLocationDonations.length > 5) {
      result.isFraudulent = true;
      result.riskLevel = 'medium';
      result.reasons.push('Multiple donations detected at the same location - please try a different location');
    }

    return result;
  }

  /**
   * Check content validity
   */
  private checkContentValidity(donation: DonationData): FraudDetectionResult {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskLevel: 'low',
      reasons: []
    };

    // Check for suspicious keywords
    const suspiciousKeywords = ['fake', 'test', 'demo', 'sample', 'trial'];
    const description = donation.description.toLowerCase();
    
    for (const keyword of suspiciousKeywords) {
      if (description.includes(keyword)) {
        result.isFraudulent = true;
        result.riskLevel = 'medium';
        result.reasons.push(`Suspicious keyword detected in description: "${keyword}" - please provide a genuine description`);
        break;
      }
    }

    // Check for minimum description length
    if (donation.description.length < 10) {
      result.isFraudulent = true;
      result.riskLevel = 'low';
      result.reasons.push('Description is too short - please provide more details about your donation (minimum 10 characters)');
    }

    return result;
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Get the higher risk level between two
   */
  private getHigherRiskLevel(level1: 'low' | 'medium' | 'high', level2: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const levels = ['low', 'medium', 'high'];
    return levels[Math.max(levels.indexOf(level1), levels.indexOf(level2))] as 'low' | 'medium' | 'high';
  }
}

// Export a singleton instance
export const fraudDetector = FraudDetector.getInstance();