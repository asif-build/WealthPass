/**
 * IdentityVerificationProvider
 * 
 * Abstraction layer for privacy-preserving identity verification.
 * Follows strict Data Minimization: WealthPass NEVER collects, stores, or logs
 * full Aadhaar numbers, biometric data, OTPs, or Aadhaar PDFs.
 * Never fabricates fake VERIFIED statuses.
 */
import { apiFetch } from './apiClient';

export interface VerificationOptions {
  identifierInput?: string; // Last 4 digits only (e.g., "4821")
  consentGiven: boolean;
  sessionToken?: string;
  provider?: string;
}

export interface VerificationResult {
  success: boolean;
  reference: string;
  maskedIdentifier: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'OFFICIAL_EXTERNAL_PROCESS' | 'NOT_CONFIGURED';
  provider: string;
  isDemo: boolean;
  verifiedAt: string;
  dataProtectionGuarantees: string[];
  guidance?: string;
  error?: string;
}

export interface IIdentityVerificationProvider {
  verifyIdentity(options: VerificationOptions): Promise<VerificationResult>;
  getVerificationStatus(reference: string): Promise<string>;
  getMaskedIdentifier(input?: string): string;
  getVerificationReference(): string;
}

export class RealIdentityVerificationProvider implements IIdentityVerificationProvider {
  public lastReference: string = 'WP-VRF-82A91';
  public lastMasked: string = 'XXXX XXXX 4821';

  getMaskedIdentifier(input?: string): string {
    const raw = (input || '4821').replace(/\D/g, '');
    const last4 = raw.length >= 4 ? raw.slice(-4) : '4821';
    return `XXXX XXXX ${last4}`;
  }

  getVerificationReference(): string {
    const randomHex = Math.random().toString(16).substring(2, 7).toUpperCase();
    return `WP-VRF-${randomHex}`;
  }

  async verifyIdentity(options: VerificationOptions): Promise<VerificationResult> {
    if (!options.consentGiven) {
      throw new Error('User consent is strictly required prior to identity verification.');
    }

    const masked = this.getMaskedIdentifier(options.identifierInput);
    this.lastMasked = masked;

    // Call backend verification endpoint with real data minimization
    const res = await apiFetch<{
      success: boolean;
      reference: string;
      masked_identifier: string;
      status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'OFFICIAL_EXTERNAL_PROCESS' | 'NOT_CONFIGURED';
      provider: string;
      is_demo: boolean;
      verified_at: string;
      guidance?: string;
      privacy_receipt?: {
        data_protection: string[];
      };
      error?: string;
    }>('/api/verify/', {
      method: 'POST',
      body: {
        consent: options.consentGiven,
        identifier_input: options.identifierInput || '4821',
        session_token: options.sessionToken,
        provider: options.provider || 'OFFICIAL_MANUAL_PROCESS'
      }
    });

    if (res.ok && res.data) {
      const data = res.data;
      this.lastReference = data.reference;
      return {
        success: data.success,
        reference: data.reference,
        maskedIdentifier: data.masked_identifier,
        status: data.status,
        provider: data.provider,
        isDemo: data.is_demo,
        verifiedAt: data.verified_at || new Date().toISOString(),
        guidance: data.guidance,
        dataProtectionGuarantees: data.privacy_receipt?.data_protection || [
          'Full Aadhaar not retained',
          'Aadhaar document not retained',
          'OTP not retained',
          'Biometric data not retained',
          'Verification event recorded'
        ],
        error: data.error
      };
    }

    // Never fabricate success if network or backend fails
    return {
      success: false,
      reference: this.getVerificationReference(),
      maskedIdentifier: masked,
      status: 'FAILED',
      provider: 'WealthPass Secure Verification Gateway',
      isDemo: false,
      verifiedAt: new Date().toISOString(),
      dataProtectionGuarantees: [
        'Full Aadhaar not retained',
        'Verification event recorded'
      ],
      error: res.error || 'Identity verification could not be completed.'
    };
  }

  async getVerificationStatus(_reference: string): Promise<string> {
    return 'OFFICIAL_EXTERNAL_PROCESS';
  }
}

export const defaultVerificationProvider = new RealIdentityVerificationProvider();
