/**
 * ============================================================================
 * GOSWISH TYPE DEFINITIONS
 * ============================================================================
 *
 * This file contains TypeScript type definitions for key data structures
 * used throughout the GoSwish application.
 *
 * These types serve as documentation even if the project uses JavaScript.
 * They can be used for:
 * - Understanding data structures
 * - IDE intellisense (with JSDoc @type annotations)
 * - Future TypeScript migration
 */

// ============================================
// USER TYPES
// ============================================

/**
 * User account stored in USERS collection
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'homeowner' | 'cleaner' | 'admin';
  primaryRole?: 'homeowner' | 'cleaner';
  emailVerified: boolean;
  profileComplete: boolean;
  avatarUrl?: string;
  createdAt: string; // ISO date string
  updatedAt: string;
}

// ============================================
// BOOKING TYPES
// ============================================

/**
 * Booking status lifecycle
 */
export type BookingStatus =
  | 'booking-placed'
  | 'pending'
  | 'confirmed'
  | 'matched'
  | 'scheduled'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed_pending_approval'
  | 'completed'
  | 'approved'
  | 'cancelled';

/**
 * Time slots available for booking
 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/**
 * Pricing breakdown for a booking
 */
export interface PricingBreakdown {
  basePrice: number;
  sqftPrice: number;
  addOnsTotal: number;
  subtotal: number;
  discount: number;
  taxes: number;
  serviceFee: number;
  total: number;
}

/**
 * Booking record stored in BOOKINGS collection
 */
export interface Booking {
  id: string;
  bookingId: string; // Formatted: TX-2026-0215-12345
  customerId: string;
  cleanerId: string | null;
  houseId: string;
  serviceTypeId: string;
  addOnIds: string[];
  addOnDetails?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  dates: string[]; // YYYY-MM-DD format
  timeSlots: Record<string, TimeSlot[]>;
  specialNotes: string;
  paymentMethod: 'card' | 'cash';
  totalAmount: number;
  pricingBreakdown: PricingBreakdown | null;
  discount: DiscountInfo | null;
  status: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  version: number; // For optimistic locking
  verificationCodes?: VerificationCodes;
  tracking?: TrackingInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * Verification codes for job start
 */
export interface VerificationCodes {
  cleanerCode: string; // 6-digit code
  customerCode: string; // 6-digit code
  generatedAt: string;
  cleanerVerified: boolean;
  customerVerified: boolean;
}

/**
 * Real-time tracking information
 */
export interface TrackingInfo {
  location?: {
    lat: number;
    lng: number;
  };
  eta?: number; // minutes
  status: string;
  updatedAt: string;
}

/**
 * Discount information applied to booking
 */
export interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
}

// ============================================
// JOB TYPES
// ============================================

/**
 * Job status lifecycle
 */
export type JobStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Job record stored in JOBS collection
 */
export interface Job {
  id: string;
  bookingId: string;
  customerId: string;
  cleanerId: string;
  houseId: string;
  serviceType: string;
  amount: number;
  earnings: number; // Cleaner's share
  status: JobStatus;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // ISO or HH:MM
  endTime: string | null;
  duration: number; // hours
  customerName: string;
  address: string;
  checklistItems: ChecklistItem[];
  photos?: {
    before: string[];
    during: string[];
    after: string[];
  };
  notes: string;
  tip?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Checklist item for job execution
 */
export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

// ============================================
// HOUSE TYPES
// ============================================

/**
 * Address structure
 */
export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

/**
 * House/property record stored in HOUSES collection
 */
export interface House {
  id: string;
  userId: string;
  name: string; // e.g., "Main House", "Vacation Home"
  address: Address;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  hasPets: boolean;
  petInfo?: string;
  specialInstructions?: string;
  accessInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CLEANER TYPES
// ============================================

/**
 * Cleaner profile stored in CLEANERS collection
 */
export interface Cleaner {
  id: string;
  userId: string;
  bio?: string;
  serviceTypes: string[];
  serviceRadius: number; // miles
  baseLocation: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  yearsExperience: number;
  certifications: string[];
  languages: string[];
  petFriendly: boolean;
  availability: Record<string, Record<TimeSlot, 'available' | 'unavailable' | 'blocked'>>;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  stats: CleanerStats;
  bankInfo?: BankInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cleaner performance statistics
 */
export interface CleanerStats {
  completedJobs: number;
  rating: number;
  totalReviews: number;
  acceptanceRate: number;
  cancellationRate: number;
  reliabilityScore: number;
}

/**
 * Bank account information for payouts
 */
export interface BankInfo {
  accountHolderName: string;
  bankName: string;
  accountLast4: string;
  routingLast4: string;
  accountType: 'checking' | 'savings';
}

// ============================================
// SERVICE TYPES
// ============================================

/**
 * Service type definition
 */
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  pricePerSqft: number;
  estimatedDuration: number; // hours
  icon: string;
  active: boolean;
  createdAt: string;
}

/**
 * Add-on service definition
 */
export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDuration: number; // minutes
  icon: string;
  active: boolean;
  createdAt: string;
}

// ============================================
// REVIEW TYPES
// ============================================

/**
 * Review record stored in REVIEWS collection
 */
export interface Review {
  id: string;
  bookingId: string;
  cleanerId: string;
  customerId: string;
  reviewerRole: 'homeowner' | 'cleaner';
  rating: number; // 1-5
  comment: string;
  tags: string[];
  response?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MESSAGE TYPES
// ============================================

/**
 * Conversation record
 */
export interface Conversation {
  id: string;
  participantIds: string[];
  bookingId: string;
  serviceType: string;
  customerName: string;
  cleanerName: string;
  status: 'active' | 'closed';
  lastMessage: string | null;
  lastMessageTime: string | null;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Message record
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Notification types
 */
export type NotificationType =
  | 'job_offer'
  | 'booking_accepted'
  | 'booking_cancelled'
  | 'job_started'
  | 'job_completed'
  | 'new_message'
  | 'new_review'
  | 'payout_processed';

/**
 * Notification record
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

// ============================================
// PROMO CODE TYPES
// ============================================

/**
 * Promo code record
 */
export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  usageByUser: Record<string, {
    count: number;
    totalDiscount: number;
    lastUsed: string;
    bookings: string[];
  }>;
  serviceTypes?: string[];
  firstTimeOnly: boolean;
  newUsersOnly: boolean;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// APP SETTINGS TYPES
// ============================================

/**
 * Platform settings
 */
export interface AppSettings {
  id: 'app';
  platformFee: number; // percentage
  cleanerEarningsRate: number; // e.g., 0.90 for 90%
  taxRate: number;
  serviceFee: number;
  minBookingAmount: number;
  maxBookingDaysAhead: number;
  autoApproveTimeout: number; // hours
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HELPER FUNCTION TYPES
// ============================================

/**
 * Match score result from calculateMatchScore
 */
export interface MatchScoreResult {
  score: number;
  matchDescription: string;
  distance: number;
  isEligible: boolean;
  error?: string;
}

/**
 * Promo validation result
 */
export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promo?: PromoCode;
  discount?: number;
}

/**
 * Earnings summary
 */
export interface EarningsSummary {
  earnings: number;
  tips: number;
  jobs: number;
  hours: number;
  transactions: Job[];
}

// ============================================
// CONTEXT TYPES
// ============================================

/**
 * AppContext state
 */
export interface AppContextState {
  user: User | null;
  isAuthenticated: boolean;
  selectedRole: 'homeowner' | 'cleaner' | null;
  houses: House[];
  loading: boolean;
  error: string | null;
}

/**
 * AppContext value (state + actions)
 */
export interface AppContextValue extends AppContextState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setRole: (role: 'homeowner' | 'cleaner') => void;
  getUserHouses: () => Promise<House[]>;
  refreshUser: () => Promise<void>;
}
