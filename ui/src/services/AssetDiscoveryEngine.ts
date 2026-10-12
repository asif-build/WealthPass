/**
 * AssetDiscoveryEngine
 * 
 * Central discovery orchestration service with modular source adapters.
 * Connects directly to backend statutory discovery registry.
 * NEVER fabricates fake bank records, mock accounts, or fabricated balances.
 * Employs supported discovery channels and guides institutional recovery.
 */
import { apiFetch } from './apiClient';

export type AssetCategoryType = 
  | 'BANK_DEPOSITS' 
  | 'INSURANCE' 
  | 'MUTUAL_FUNDS' 
  | 'SHARES_DIVIDENDS' 
  | 'PENSION_EPFO' 
  | 'OTHER_INVESTMENTS' 
  | 'ACCOUNT_AGGREGATOR';

export type IntegrationStatusType =
  | 'LIVE'
  | 'SANDBOX'
  | 'OFFICIAL_EXTERNAL_PROCESS'
  | 'ACCESS_PENDING'
  | 'NOT_CONFIGURED'
  | 'FAILED'
  | 'PLANNED';

export interface SourceMetadata {
  id: string;
  name: string;
  category: string;
  officialUrl: string;
  integrationStatus: IntegrationStatusType;
  description: string;
  permittedIdentifiers: string[];
  whatWeReceive: string;
  whatWeDoNotReceive: string;
  guide?: any;
}

export interface DiscoveredAssetItem {
  id: string;
  session_id?: string;
  deceased_name?: string;
  assetType: string;
  institution: string;
  sourceId: string;
  sourceName: string;
  asset_category?: string;
  potentialValue: string;
  numericValue: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  verification_status?: string;
  claim_status?: string;
  source_reference?: string;
  masked_reference?: string;
  isPotentialMatch?: boolean;
  institutionVerified?: boolean;
  isDemo?: boolean;
  demoLabel?: string;
  matchSignals?: string[];
  disclaimer: string;
  whatHappensNext: string;
  howFound: {
    source: string;
    steps: Array<{ step: string; title: string; desc: string }>;
    dataUsed?: string[];
    dataNotStored?: string[];
    external_reference?: string;
  };
  unverifiedItems?: string[];
  documents_needed?: string[];
  next_steps?: string[];
  time_estimate?: string;
  official_portal_url?: string;
}

export interface SourceScannedItem {
  id: string;
  name: string;
  category: string;
  status: string;
  integration_status: string;
  is_live_api?: boolean;
  official_url?: string;
  external_reference_number?: string;
  external_search_completed?: boolean;
  last_checked_at?: string | null;
  description?: string;
  guide?: any;
  capabilities?: string[];
  required_fields?: string[];
}

export interface DiscoveryScanResponse {
  success: boolean;
  case_id?: string | null;
  summary: {
    total_potential_value: string;
    potential_assets_count: number;
    sources_scanned_count: number;
    disclaimer: string;
  };
  sources_scanned: SourceScannedItem[];
  results: DiscoveredAssetItem[];
}

export class AssetDiscoveryEngine {
  /**
   * Fetches real statutory discovery sources and genuine potential matches from backend.
   */
  async searchAllSources(params?: {
    caseId?: string;
    claimantName?: string;
    deceasedName?: string;
    relationship?: string;
  }): Promise<DiscoveryScanResponse> {
    const query = params?.caseId ? `?case_id=${encodeURIComponent(params.caseId)}` : '';
    const res = await apiFetch<DiscoveryScanResponse>(`/api/discover/${query}`);
    if (res.ok && res.data) {
      return res.data;
    }

    // Default statutory sources if network offline
    return {
      success: true,
      summary: {
        total_potential_value: 'Pending Institutional Search',
        potential_assets_count: 0,
        sources_scanned_count: 6,
        disclaimer: 'WealthPass is a recovery assistance platform. Potential matches require institutional verification.'
      },
      sources_scanned: [
        {
          id: 'RBI_UDGAM',
          name: 'RBI UDGAM (Central Bank Portal)',
          category: 'BANK DEPOSITS',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://udgam.rbi.org.in/',
          description: 'Centralized portal by RBI for searching unclaimed bank deposits across participating banks.'
        },
        {
          id: 'IRDAI_BIMA_BHAROSA',
          name: 'IRDAI Bima Bharosa & Insurers',
          category: 'INSURANCE',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://bimabharosa.irdai.gov.in/Home/UnclaimedAmountsQuery',
          description: 'Insurance regulatory search for tracing unclaimed maturity and policy amounts.'
        },
        {
          id: 'SEBI_MITRA',
          name: 'SEBI MITRA & MF Central',
          category: 'MUTUAL FUNDS',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://app.mfcentral.com/links/inactive-folios',
          description: 'Mutual fund platform to trace inactive and unclaimed investment folios via PAN.'
        },
        {
          id: 'IEPF',
          name: 'IEPF Authority (Ministry of Corporate Affairs)',
          category: 'SHARES_DIVIDENDS',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://www.iepf.gov.in/',
          description: 'Ministry of Corporate Affairs portal for unclaimed dividends, shares, and matured debentures.'
        },
        {
          id: 'EPFO_SERVICES',
          name: 'EPFO Services (Provident Fund & EDLI)',
          category: 'PENSION_EPFO',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://www.epfindia.gov.in/',
          description: 'EPF retirement accumulations, EPS survivor pensions, and EDLI life assurance benefit.'
        },
        {
          id: 'OTHER_INVESTMENTS',
          name: 'Post Office Small Savings & NPS',
          category: 'OTHER_INVESTMENTS',
          status: 'OFFICIAL_EXTERNAL_ACTION_REQUIRED',
          integration_status: 'OFFICIAL_EXTERNAL_PROCESS',
          official_url: 'https://www.indiapost.gov.in/',
          description: 'India Post Small Savings (PPF, SCSS, NSC) & National Pension System death claims.'
        }
      ],
      results: []
    };
  }

  /**
   * Queries a specific source adapter on the backend.
   */
  async querySource(sourceId: string, queryParams: Record<string, any>): Promise<any> {
    const res = await apiFetch<{
      success: boolean;
      source_id: string;
      provider_name: string;
      integration_status: string;
      result: any;
    }>('/api/discover/query/', {
      method: 'POST',
      body: {
        source_id: sourceId,
        ...queryParams
      }
    });

    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.error || `Failed to query source ${sourceId}`);
  }

  /**
   * Records official external search completion with user-submitted reference number.
   */
  async recordExternalReference(data: {
    caseId: string;
    sourceId: string;
    externalReferenceNumber: string;
    institutionName?: string;
    assetCategory?: string;
    notes?: string;
    evidenceDocumentId?: string;
  }): Promise<any> {
    const res = await apiFetch<any>('/api/discover/record-external-reference/', {
      method: 'POST',
      body: {
        case_id: data.caseId,
        source_id: data.sourceId,
        external_reference_number: data.externalReferenceNumber,
        institution_name: data.institutionName,
        asset_category: data.assetCategory,
        notes: data.notes,
        evidence_document_id: data.evidenceDocumentId
      }
    });

    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.error || 'Failed to record official search reference');
  }

  /**
   * Submits application for emergency bridge liquidity with regulated lending partner.
   */
  async applyBridgeLiquidity(data: {
    caseId: string;
    consentPartnership: boolean;
    consentUnderwriting: boolean;
  }): Promise<any> {
    const res = await apiFetch<any>('/api/claims/bridge-loan/apply/', {
      method: 'POST',
      body: {
        case_id: data.caseId,
        consent_partnership: data.consentPartnership,
        consent_underwriting: data.consentUnderwriting
      }
    });

    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.error || 'Failed to submit bridge financing application');
  }
}

export const assetDiscoveryEngine = new AssetDiscoveryEngine();

