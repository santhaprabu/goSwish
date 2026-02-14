# GoSwish Relational Database Design

## Document Information
- **Version**: 1.0
- **Created**: February 5, 2026
- **Application**: GoSwish - Professional Cleaning Services Platform
- **Database Type**: PostgreSQL (Recommended) / MySQL Compatible

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Database Schema](#3-database-schema)
4. [Table Definitions](#4-table-definitions)
5. [Relationships & Foreign Keys](#5-relationships--foreign-keys)
6. [Indexes](#6-indexes)
7. [Enumerations](#7-enumerations)
8. [Business Rules & Constraints](#8-business-rules--constraints)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Migration from IndexedDB](#10-migration-from-indexeddb)

---

## 1. Executive Summary

GoSwish is a two-sided marketplace connecting homeowners with professional cleaners. The database supports:

- **User Management**: Authentication, roles, profiles
- **Property Management**: Houses with detailed specifications
- **Booking System**: Service requests with pricing and scheduling
- **Job Management**: Cleaner assignments and work tracking
- **Messaging**: Booking-scoped conversations
- **Reviews & Ratings**: Two-way feedback system
- **Payments**: Payment methods and transaction tracking
- **Notifications**: User alerts and reminders

### Key Statistics
| Metric | Value |
|--------|-------|
| Total Tables | 14 |
| Primary Keys | 14 |
| Foreign Keys | 23 |
| Unique Constraints | 5 |
| Check Constraints | 15+ |

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GOSWISH DATABASE ERD                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   SETTINGS   │
                                    │──────────────│
                                    │ PK: id       │
                                    └──────────────┘

┌──────────────┐                    ┌──────────────┐                    ┌──────────────┐
│SERVICE_TYPES │                    │   ADD_ONS    │                    │ PROMO_CODES  │
│──────────────│                    │──────────────│                    │──────────────│
│ PK: id       │                    │ PK: id       │                    │ PK: id       │
└──────┬───────┘                    └──────┬───────┘                    └──────┬───────┘
       │                                   │                                   │
       │ 1:N                               │ M:N                               │ 1:N
       │                                   │                                   │
       │         ┌─────────────────────────┼───────────────────────────────────┤
       │         │                         │                                   │
       │         ▼                         ▼                                   ▼
       │    ┌─────────────────────────────────────────────────────────────────────┐
       └───►│                           BOOKINGS                                   │
            │─────────────────────────────────────────────────────────────────────│
            │ PK: id                                                               │
            │ FK: customer_id → USERS.id                                          │
            │ FK: cleaner_id → CLEANERS.id (nullable)                             │
            │ FK: house_id → HOUSES.id                                            │
            │ FK: service_type_id → SERVICE_TYPES.id                              │
            │ FK: promo_code_id → PROMO_CODES.id (nullable)                       │
            │ UNIQUE: booking_id (human-readable)                                  │
            └────────────────────────────┬────────────────────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              │ 1:1                      │ 1:N                      │ 1:N
              ▼                          ▼                          ▼
       ┌──────────────┐          ┌──────────────┐          ┌──────────────────┐
       │    JOBS      │          │   MESSAGES   │          │BOOKING_ADD_ONS   │
       │──────────────│          │──────────────│          │──────────────────│
       │ PK: id       │          │ PK: id       │          │ PK: id           │
       │ FK: booking_id│         │ FK: booking_id│         │ FK: booking_id   │
       │ FK: cleaner_id│         │ FK: sender_id │         │ FK: add_on_id    │
       └──────────────┘          └──────────────┘          └──────────────────┘


       ┌──────────────────────────────────────────────────────────────────────┐
       │                              USERS                                    │
       │──────────────────────────────────────────────────────────────────────│
       │ PK: id                                                                │
       │ UNIQUE: email                                                         │
       └────────────────────────────┬─────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         │ 1:1                      │ 1:N                      │ 1:N
         ▼                          ▼                          ▼
  ┌──────────────┐          ┌──────────────┐          ┌──────────────────┐
  │   CLEANERS   │          │    HOUSES    │          │ PAYMENT_METHODS  │
  │──────────────│          │──────────────│          │──────────────────│
  │ PK: id       │          │ PK: id       │          │ PK: id           │
  │ FK: user_id  │          │ FK: user_id  │          │ FK: user_id      │
  └──────┬───────┘          └──────────────┘          └──────────────────┘
         │
         │ 1:N
         ▼
  ┌──────────────┐          ┌──────────────┐
  │   REVIEWS    │          │NOTIFICATIONS │
  │──────────────│          │──────────────│
  │ PK: id       │          │ PK: id       │
  │ FK: cleaner_id          │ FK: user_id  │
  │ FK: customer_id         └──────────────┘
  │ FK: booking_id │
  └──────────────┘
```

---

## 3. Database Schema

### 3.1 Complete SQL Schema

```sql
-- ============================================================================
-- GOSWISH DATABASE SCHEMA
-- PostgreSQL Compatible
-- ============================================================================

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('homeowner', 'cleaner', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE cleaner_verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE cleaner_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE booking_status AS ENUM (
    'booking_placed',
    'pending',
    'confirmed',
    'matched',
    'scheduled',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed_pending_approval',
    'completed',
    'approved',
    'cancelled'
);
CREATE TYPE job_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'digital_wallet');
CREATE TYPE promo_type AS ENUM ('percent', 'fixed');
CREATE TYPE notification_type AS ENUM (
    'job_offer',
    'booking_accepted',
    'booking_completed',
    'payment',
    'review',
    'message',
    'reminder'
);
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE conversation_status AS ENUM ('active', 'closed');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'condo', 'townhouse');
CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE availability_status AS ENUM ('available', 'booked', 'blocked');

-- ============================================================================
-- TABLE: users
-- Core user accounts for all roles
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    password_salt VARCHAR(64),
    role user_role NOT NULL DEFAULT 'homeowner',
    status user_status NOT NULL DEFAULT 'active',

    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    photo_url TEXT,

    -- Location
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(6),
    otp_expiry TIMESTAMP WITH TIME ZONE,

    -- Notification Preferences (JSONB for flexibility)
    notification_preferences JSONB DEFAULT '{
        "bookingUpdates": true,
        "jobOffers": true,
        "earnings": true,
        "messages": true,
        "reviews": true,
        "promotions": true
    }'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]+$')
);

-- ============================================================================
-- TABLE: cleaners
-- Professional profile for cleaner users
-- ============================================================================

CREATE TABLE cleaners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Professional Profile
    headline VARCHAR(200),
    bio TEXT,
    years_experience INTEGER DEFAULT 0 CHECK (years_experience >= 0 AND years_experience <= 50),
    specialties TEXT[], -- Array of specialties
    languages TEXT[] DEFAULT ARRAY['English'],
    pet_friendly BOOLEAN DEFAULT FALSE,

    -- Service Configuration
    service_types TEXT[] DEFAULT ARRAY['regular'], -- Array of service type IDs
    service_radius INTEGER DEFAULT 25 CHECK (service_radius >= 5 AND service_radius <= 100),
    hourly_rate DECIMAL(10, 2) DEFAULT 30.00 CHECK (hourly_rate >= 15.00 AND hourly_rate <= 200.00),

    -- Base Location (for radius calculations)
    base_street VARCHAR(255),
    base_city VARCHAR(100),
    base_state VARCHAR(50),
    base_zip VARCHAR(20),
    base_latitude DECIMAL(10, 8),
    base_longitude DECIMAL(11, 8),

    -- Verification & Status
    verification_status cleaner_verification_status DEFAULT 'pending',
    status cleaner_status DEFAULT 'active',

    -- Statistics (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    completed_jobs INTEGER DEFAULT 0 CHECK (completed_jobs >= 0),
    acceptance_rate DECIMAL(5, 2) DEFAULT 100.00 CHECK (acceptance_rate >= 0.00 AND acceptance_rate <= 100.00),
    cancellation_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (cancellation_rate >= 0.00 AND cancellation_rate <= 100.00),
    reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: cleaner_availability
-- Cleaner schedule/availability slots
-- ============================================================================

CREATE TABLE cleaner_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot time_slot NOT NULL,
    status availability_status DEFAULT 'available',
    booking_id UUID, -- Reference to booking if booked

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one slot per cleaner per date/time
    CONSTRAINT unique_cleaner_slot UNIQUE (cleaner_id, date, time_slot)
);

-- ============================================================================
-- TABLE: houses
-- Customer properties
-- ============================================================================

CREATE TABLE houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Property Details
    nickname VARCHAR(100) DEFAULT 'My Home',
    is_default BOOLEAN DEFAULT FALSE,
    property_type property_type DEFAULT 'house',
    sqft INTEGER NOT NULL CHECK (sqft >= 100 AND sqft <= 50000),
    bedrooms INTEGER DEFAULT 1 CHECK (bedrooms >= 0 AND bedrooms <= 20),
    bathrooms DECIMAL(3, 1) DEFAULT 1.0 CHECK (bathrooms >= 0.5 AND bathrooms <= 20),

    -- Address
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Access Information
    access_instructions TEXT,
    parking_info TEXT,

    -- Pets
    has_pets BOOLEAN DEFAULT FALSE,
    pet_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: service_types
-- Available cleaning service categories
-- ============================================================================

CREATE TABLE service_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_sqft DECIMAL(6, 4) NOT NULL CHECK (price_per_sqft >= 0),
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    duration_minutes INTEGER DEFAULT 120 CHECK (duration_minutes > 0),
    icon VARCHAR(50),
    features TEXT[], -- Array of included features
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: add_ons
-- Optional service extras
-- ============================================================================

CREATE TABLE add_ons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Pricing (one or the other)
    flat_price DECIMAL(10, 2), -- Fixed price add-on
    price_per_sqft DECIMAL(6, 4), -- Sqft-based add-on

    duration_minutes INTEGER DEFAULT 15 CHECK (duration_minutes >= 0),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: must have either flat_price or price_per_sqft
    CONSTRAINT pricing_required CHECK (flat_price IS NOT NULL OR price_per_sqft IS NOT NULL)
);

-- ============================================================================
-- TABLE: promo_codes
-- Discount codes
-- ============================================================================

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    promo_type promo_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
    description TEXT,

    -- Limits
    min_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),

    -- Validity Period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,

    -- Restrictions
    first_time_only BOOLEAN DEFAULT FALSE,
    service_types TEXT[], -- Optional: specific services only
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: bookings
-- Customer cleaning service requests
-- ============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(50) NOT NULL UNIQUE, -- Human-readable: TX-2026-0205-38547

    -- Relationships
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE RESTRICT,
    service_type_id VARCHAR(50) NOT NULL REFERENCES service_types(id),
    promo_code_id UUID REFERENCES promo_codes(id),

    -- Schedule
    scheduled_date DATE NOT NULL,
    time_slot time_slot NOT NULL,

    -- Pricing
    base_amount DECIMAL(10, 2) NOT NULL,
    add_ons_amount DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) DEFAULT 0.0825,
    tax_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Pricing Breakdown (JSONB for detailed breakdown)
    pricing_breakdown JSONB,

    -- Payment
    payment_method payment_method_type DEFAULT 'card',
    payment_status payment_status DEFAULT 'pending',
    payment_intent_id VARCHAR(255), -- Stripe payment intent

    -- Status & Workflow
    status booking_status DEFAULT 'booking_placed',
    special_notes TEXT,

    -- Verification Codes (for day-of safety)
    cleaner_verification_code VARCHAR(6),
    customer_verification_code VARCHAR(6),
    verification_generated_at TIMESTAMP WITH TIME ZONE,
    cleaner_verified BOOLEAN DEFAULT FALSE,
    customer_verified BOOLEAN DEFAULT FALSE,

    -- Tracking (JSONB for flexibility)
    tracking_data JSONB,

    -- Completion Data
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cleaner_notes TEXT,
    final_photos TEXT[], -- Array of photo URLs

    -- Ratings (embedded for convenience)
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_rating_comment TEXT,
    customer_rating_tags TEXT[],
    cleaner_rating INTEGER CHECK (cleaner_rating >= 1 AND cleaner_rating <= 5),
    cleaner_rating_comment TEXT,

    -- Cancellation
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),

    -- Optimistic Locking
    version INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_total CHECK (total_amount >= 0),
    CONSTRAINT valid_dates CHECK (scheduled_date >= CURRENT_DATE - INTERVAL '1 day')
);

-- ============================================================================
-- TABLE: booking_add_ons
-- Junction table for booking ↔ add-ons (M:N)
-- ============================================================================

CREATE TABLE booking_add_ons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    add_on_id VARCHAR(50) NOT NULL REFERENCES add_ons(id),

    -- Price snapshot at time of booking
    price DECIMAL(10, 2) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one add-on per booking
    CONSTRAINT unique_booking_addon UNIQUE (booking_id, add_on_id)
);

-- ============================================================================
-- TABLE: jobs
-- Cleaner work assignments (supply-side mirror of bookings)
-- ============================================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE RESTRICT,

    -- Snapshots (at time of acceptance)
    customer_name VARCHAR(200),
    address TEXT,
    service_type VARCHAR(50),

    -- Schedule
    scheduled_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_hours DECIMAL(4, 2),

    -- Earnings
    amount DECIMAL(10, 2) NOT NULL, -- Total charged
    earnings DECIMAL(10, 2) NOT NULL, -- Cleaner's share (typically 90%)
    tip DECIMAL(10, 2) DEFAULT 0.00,

    -- Status
    status job_status DEFAULT 'scheduled',

    -- Work Progress (JSONB for checklist flexibility)
    checklist_items JSONB,
    photos JSONB DEFAULT '{"before": [], "during": [], "after": []}'::jsonb,
    notes TEXT,

    -- Completion
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_late BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: reviews
-- Ratings and feedback (both directions)
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Reviewer
    reviewer_role user_role NOT NULL,

    -- Snapshots
    cleaner_name VARCHAR(200),
    customer_name VARCHAR(200),

    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tags TEXT[],

    -- Response (cleaner can respond to customer reviews)
    response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one review per booking per reviewer role
    CONSTRAINT unique_review UNIQUE (booking_id, reviewer_role)
);

-- ============================================================================
-- TABLE: conversations
-- Message threads (booking-scoped)
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Participants
    customer_id UUID NOT NULL REFERENCES users(id),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id),

    -- Snapshots
    customer_name VARCHAR(200),
    cleaner_name VARCHAR(200),
    service_type VARCHAR(50),

    -- Status
    status conversation_status DEFAULT 'active',
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Last Message (denormalized for list view)
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_message_sender_id UUID,

    -- Unread counts (denormalized)
    customer_unread_count INTEGER DEFAULT 0,
    cleaner_unread_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one conversation per booking
    CONSTRAINT unique_booking_conversation UNIQUE (booking_id)
);

-- ============================================================================
-- TABLE: messages
-- Individual messages within conversations
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    -- Content
    content TEXT NOT NULL,

    -- Status
    status message_status DEFAULT 'sent',
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: payment_methods
-- Stored payment information
-- ============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Type
    method_type payment_method_type NOT NULL,

    -- Card Details (masked)
    card_brand VARCHAR(20), -- visa, mastercard, amex, etc.
    card_last_four VARCHAR(4),
    card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
    card_exp_year INTEGER,

    -- Bank Account Details (masked)
    bank_name VARCHAR(100),
    account_last_four VARCHAR(4),
    routing_last_four VARCHAR(4),

    -- Stripe
    stripe_payment_method_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Preferences
    is_default BOOLEAN DEFAULT FALSE,
    nickname VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: notifications
-- User alerts and notifications
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    notification_type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Related Entity
    related_id UUID, -- Can reference booking, job, review, etc.
    related_type VARCHAR(50), -- 'booking', 'job', 'review', etc.

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Delivery
    push_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: settings
-- Application configuration
-- ============================================================================

CREATE TABLE settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'app',

    -- Pricing
    tax_rate DECIMAL(5, 4) DEFAULT 0.0825,
    platform_fee DECIMAL(5, 4) DEFAULT 0.10, -- 10% to platform
    cleaner_earnings_rate DECIMAL(5, 4) DEFAULT 0.90, -- 90% to cleaner
    min_booking_amount DECIMAL(10, 2) DEFAULT 50.00,
    max_booking_amount DECIMAL(10, 2) DEFAULT 2000.00,

    -- Cancellation
    cancellation_fee DECIMAL(10, 2) DEFAULT 25.00,
    cancellation_window_hours INTEGER DEFAULT 24,

    -- Service
    default_service_radius INTEGER DEFAULT 25,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Support
    support_email VARCHAR(255),
    support_phone VARCHAR(20),

    -- Features (JSONB for flexibility)
    features JSONB DEFAULT '{
        "instantBooking": true,
        "chatMessaging": true,
        "photoUpload": true,
        "reviews": true,
        "promoCode": true,
        "referrals": false
    }'::jsonb,

    -- Metro Multipliers (JSONB)
    metro_multipliers JSONB DEFAULT '{
        "Dallas": 1.0,
        "Fort Worth": 1.0,
        "Austin": 1.1,
        "San Antonio": 1.05,
        "Houston": 1.05
    }'::jsonb,

    -- Maintenance Mode
    maintenance_enabled BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,

    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Table Definitions

### 4.1 Table Summary

| Table | Description | Row Estimate | Growth Rate |
|-------|-------------|--------------|-------------|
| `users` | All user accounts | 10K-100K | Medium |
| `cleaners` | Cleaner professional profiles | 1K-10K | Low |
| `cleaner_availability` | Schedule slots | 100K-1M | High |
| `houses` | Customer properties | 10K-100K | Medium |
| `service_types` | Service categories | 4-10 | Static |
| `add_ons` | Optional extras | 5-20 | Static |
| `promo_codes` | Discount codes | 10-100 | Low |
| `bookings` | Service requests | 100K-1M | High |
| `booking_add_ons` | Booking ↔ Add-on junction | 100K-1M | High |
| `jobs` | Cleaner assignments | 100K-1M | High |
| `reviews` | Ratings & feedback | 50K-500K | Medium |
| `conversations` | Message threads | 50K-500K | Medium |
| `messages` | Individual messages | 500K-5M | Very High |
| `payment_methods` | Stored payments | 10K-100K | Medium |
| `notifications` | User alerts | 1M-10M | Very High |
| `settings` | App configuration | 1 | Static |

### 4.2 Column Details by Table

#### users
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | auto | Primary key |
| email | VARCHAR(255) | NO | - | Unique email address |
| password_hash | VARCHAR(512) | NO | - | PBKDF2 hashed password |
| password_salt | VARCHAR(64) | YES | - | Salt for password |
| role | ENUM | NO | 'homeowner' | User type |
| status | ENUM | NO | 'active' | Account status |
| first_name | VARCHAR(100) | YES | - | First name |
| last_name | VARCHAR(100) | YES | - | Last name |
| phone | VARCHAR(20) | YES | - | Phone number |
| photo_url | TEXT | YES | - | Profile photo URL |
| street | VARCHAR(255) | YES | - | Street address |
| city | VARCHAR(100) | YES | - | City |
| state | VARCHAR(50) | YES | - | State |
| zip | VARCHAR(20) | YES | - | ZIP code |
| latitude | DECIMAL(10,8) | YES | - | Latitude |
| longitude | DECIMAL(11,8) | YES | - | Longitude |
| email_verified | BOOLEAN | YES | FALSE | Email verification status |
| otp | VARCHAR(6) | YES | - | One-time password |
| otp_expiry | TIMESTAMP | YES | - | OTP expiration |
| notification_preferences | JSONB | YES | {...} | Notification settings |
| created_at | TIMESTAMP | YES | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | YES | NOW() | Last update timestamp |
| deleted_at | TIMESTAMP | YES | - | Soft delete timestamp |

---

## 5. Relationships & Foreign Keys

### 5.1 Foreign Key Constraints

```sql
-- ============================================================================
-- FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- cleaners → users (1:1)
ALTER TABLE cleaners
    ADD CONSTRAINT fk_cleaners_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- cleaner_availability → cleaners (N:1)
ALTER TABLE cleaner_availability
    ADD CONSTRAINT fk_availability_cleaner
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
    ON DELETE CASCADE;

-- houses → users (N:1)
ALTER TABLE houses
    ADD CONSTRAINT fk_houses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- bookings → users (N:1, customer)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE RESTRICT;

-- bookings → cleaners (N:1, assigned cleaner)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_cleaner
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
    ON DELETE SET NULL;

-- bookings → houses (N:1)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_house
    FOREIGN KEY (house_id) REFERENCES houses(id)
    ON DELETE RESTRICT;

-- bookings → service_types (N:1)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_service_type
    FOREIGN KEY (service_type_id) REFERENCES service_types(id)
    ON DELETE RESTRICT;

-- bookings → promo_codes (N:1, optional)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_promo
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
    ON DELETE SET NULL;

-- bookings → users (N:1, cancelled_by)
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_cancelled_by
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
    ON DELETE SET NULL;

-- booking_add_ons → bookings (N:1)
ALTER TABLE booking_add_ons
    ADD CONSTRAINT fk_booking_addons_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE;

-- booking_add_ons → add_ons (N:1)
ALTER TABLE booking_add_ons
    ADD CONSTRAINT fk_booking_addons_addon
    FOREIGN KEY (add_on_id) REFERENCES add_ons(id)
    ON DELETE RESTRICT;

-- jobs → bookings (1:1)
ALTER TABLE jobs
    ADD CONSTRAINT fk_jobs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE;

-- jobs → cleaners (N:1)
ALTER TABLE jobs
    ADD CONSTRAINT fk_jobs_cleaner
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
    ON DELETE RESTRICT;

-- reviews → bookings (N:1)
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE;

-- reviews → cleaners (N:1)
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_cleaner
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
    ON DELETE CASCADE;

-- reviews → users (N:1, customer)
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- conversations → bookings (1:1)
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE;

-- conversations → users (N:1, customer)
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- conversations → cleaners (N:1)
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_cleaner
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
    ON DELETE CASCADE;

-- messages → conversations (N:1)
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE;

-- messages → users (N:1, sender)
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- payment_methods → users (N:1)
ALTER TABLE payment_methods
    ADD CONSTRAINT fk_payment_methods_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- notifications → users (N:1)
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;
```

### 5.2 Relationship Matrix

| Parent Table | Child Table | Relationship | FK Column | On Delete |
|--------------|-------------|--------------|-----------|-----------|
| users | cleaners | 1:1 | user_id | CASCADE |
| users | houses | 1:N | user_id | CASCADE |
| users | bookings | 1:N | customer_id | RESTRICT |
| users | reviews | 1:N | customer_id | CASCADE |
| users | conversations | 1:N | customer_id | CASCADE |
| users | messages | 1:N | sender_id | CASCADE |
| users | payment_methods | 1:N | user_id | CASCADE |
| users | notifications | 1:N | user_id | CASCADE |
| cleaners | bookings | 1:N | cleaner_id | SET NULL |
| cleaners | cleaner_availability | 1:N | cleaner_id | CASCADE |
| cleaners | jobs | 1:N | cleaner_id | RESTRICT |
| cleaners | reviews | 1:N | cleaner_id | CASCADE |
| cleaners | conversations | 1:N | cleaner_id | CASCADE |
| houses | bookings | 1:N | house_id | RESTRICT |
| service_types | bookings | 1:N | service_type_id | RESTRICT |
| promo_codes | bookings | 1:N | promo_code_id | SET NULL |
| bookings | booking_add_ons | 1:N | booking_id | CASCADE |
| bookings | jobs | 1:1 | booking_id | CASCADE |
| bookings | reviews | 1:N | booking_id | CASCADE |
| bookings | conversations | 1:1 | booking_id | CASCADE |
| add_ons | booking_add_ons | 1:N | add_on_id | RESTRICT |
| conversations | messages | 1:N | conversation_id | CASCADE |

---

## 6. Indexes

### 6.1 Index Definitions

```sql
-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Cleaners
CREATE INDEX idx_cleaners_user_id ON cleaners(user_id);
CREATE INDEX idx_cleaners_status ON cleaners(status);
CREATE INDEX idx_cleaners_verification ON cleaners(verification_status);
CREATE INDEX idx_cleaners_rating ON cleaners(rating DESC);
CREATE INDEX idx_cleaners_location ON cleaners(base_city, base_state);
CREATE INDEX idx_cleaners_geo ON cleaners(base_latitude, base_longitude);

-- Cleaner Availability
CREATE INDEX idx_availability_cleaner ON cleaner_availability(cleaner_id);
CREATE INDEX idx_availability_date ON cleaner_availability(date);
CREATE INDEX idx_availability_status ON cleaner_availability(status);
CREATE INDEX idx_availability_lookup ON cleaner_availability(cleaner_id, date, status);

-- Houses
CREATE INDEX idx_houses_user_id ON houses(user_id);
CREATE INDEX idx_houses_city ON houses(city, state);
CREATE INDEX idx_houses_default ON houses(user_id, is_default) WHERE is_default = TRUE;

-- Bookings
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_cleaner ON bookings(cleaner_id);
CREATE INDEX idx_bookings_house ON bookings(house_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_bookings_cleaner_status ON bookings(cleaner_id, status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Booking Add-ons
CREATE INDEX idx_booking_addons_booking ON booking_add_ons(booking_id);
CREATE INDEX idx_booking_addons_addon ON booking_add_ons(add_on_id);

-- Jobs
CREATE INDEX idx_jobs_booking ON jobs(booking_id);
CREATE INDEX idx_jobs_cleaner ON jobs(cleaner_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_cleaner_status ON jobs(cleaner_id, status);
CREATE INDEX idx_jobs_cleaner_date ON jobs(cleaner_id, scheduled_date);

-- Reviews
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_cleaner ON reviews(cleaner_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(cleaner_id, rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Conversations
CREATE INDEX idx_conversations_booking ON conversations(booking_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_cleaner ON conversations(cleaner_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, status) WHERE status != 'read';

-- Payment Methods
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_related ON notifications(related_id, related_type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Promo Codes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, valid_until);
```

### 6.2 Index Strategy Summary

| Table | Primary Access Pattern | Key Indexes |
|-------|----------------------|-------------|
| users | Email lookup, Role filter | email (unique), role, status |
| cleaners | Status filter, Location search | status, location, rating |
| cleaner_availability | Date + Cleaner lookup | (cleaner_id, date, status) |
| houses | User's properties | user_id |
| bookings | Customer view, Cleaner view, Status filter | customer_id, cleaner_id, status, date |
| jobs | Cleaner's jobs, Date view | cleaner_id, status, date |
| reviews | Cleaner's reviews | cleaner_id, rating |
| conversations | User's conversations | customer_id, cleaner_id, booking_id |
| messages | Conversation thread | conversation_id, created_at |
| notifications | User's notifications | user_id, is_read |

---

## 7. Enumerations

### 7.1 Enum Definitions

```sql
-- User Roles
CREATE TYPE user_role AS ENUM ('homeowner', 'cleaner', 'admin');

-- User Status
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

-- Cleaner Verification Status
CREATE TYPE cleaner_verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Cleaner Status
CREATE TYPE cleaner_status AS ENUM ('active', 'inactive', 'suspended');

-- Booking Status (Full Lifecycle)
CREATE TYPE booking_status AS ENUM (
    'booking_placed',      -- Initial state when customer submits
    'pending',             -- Awaiting cleaner assignment
    'confirmed',           -- Cleaner assigned, awaiting schedule
    'matched',             -- Cleaner matched via broadcast
    'scheduled',           -- Confirmed for specific date/time
    'on_the_way',          -- Cleaner traveling to location
    'arrived',             -- Cleaner at location
    'in_progress',         -- Cleaning underway
    'completed_pending_approval', -- Done, awaiting customer approval
    'completed',           -- Fully completed
    'approved',            -- Customer approved completion
    'cancelled'            -- Booking cancelled
);

-- Job Status
CREATE TYPE job_status AS ENUM (
    'scheduled',           -- Job scheduled
    'confirmed',           -- Cleaner confirmed
    'in_progress',         -- Cleaning underway
    'completed',           -- Job finished
    'cancelled'            -- Job cancelled
);

-- Payment Status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');

-- Payment Method Types
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'digital_wallet');

-- Promo Code Types
CREATE TYPE promo_type AS ENUM ('percent', 'fixed');

-- Notification Types
CREATE TYPE notification_type AS ENUM (
    'job_offer',           -- New job available
    'booking_accepted',    -- Cleaner accepted booking
    'booking_completed',   -- Job completed
    'payment',             -- Payment processed
    'review',              -- New review received
    'message',             -- New message
    'reminder'             -- Scheduled reminder
);

-- Message Status
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Conversation Status
CREATE TYPE conversation_status AS ENUM ('active', 'closed');

-- Property Types
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'condo', 'townhouse');

-- Time Slots
CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');

-- Availability Status
CREATE TYPE availability_status AS ENUM ('available', 'booked', 'blocked');
```

### 7.2 Status Transitions

#### Booking Status Flow
```
booking_placed
      ↓
   pending
      ↓
 confirmed ←→ matched
      ↓
  scheduled
      ↓
 on_the_way
      ↓
   arrived
      ↓
 in_progress
      ↓
completed_pending_approval
      ↓
  approved ← completed

(Any state can → cancelled)
```

#### Job Status Flow
```
scheduled → confirmed → in_progress → completed
                ↓
           cancelled
```

---

## 8. Business Rules & Constraints

### 8.1 Data Integrity Rules

```sql
-- ============================================================================
-- BUSINESS RULE CONSTRAINTS
-- ============================================================================

-- 1. Email format validation
ALTER TABLE users ADD CONSTRAINT chk_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2. Phone format validation
ALTER TABLE users ADD CONSTRAINT chk_phone_format
    CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]+$');

-- 3. Rating range
ALTER TABLE cleaners ADD CONSTRAINT chk_rating_range
    CHECK (rating >= 0.00 AND rating <= 5.00);

-- 4. Square footage range
ALTER TABLE houses ADD CONSTRAINT chk_sqft_range
    CHECK (sqft >= 100 AND sqft <= 50000);

-- 5. Booking total must be positive
ALTER TABLE bookings ADD CONSTRAINT chk_total_positive
    CHECK (total_amount >= 0);

-- 6. Review rating range
ALTER TABLE reviews ADD CONSTRAINT chk_review_rating
    CHECK (rating >= 1 AND rating <= 5);

-- 7. Promo code value must be positive
ALTER TABLE promo_codes ADD CONSTRAINT chk_promo_value
    CHECK (value > 0);

-- 8. Used count cannot exceed max uses
ALTER TABLE promo_codes ADD CONSTRAINT chk_promo_usage
    CHECK (max_uses IS NULL OR used_count <= max_uses);

-- 9. Cleaner experience range
ALTER TABLE cleaners ADD CONSTRAINT chk_experience_range
    CHECK (years_experience >= 0 AND years_experience <= 50);

-- 10. Service radius range
ALTER TABLE cleaners ADD CONSTRAINT chk_radius_range
    CHECK (service_radius >= 5 AND service_radius <= 100);
```

### 8.2 Trigger Functions

```sql
-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cleaners_updated_at BEFORE UPDATE ON cleaners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_houses_updated_at BEFORE UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update cleaner stats after review
CREATE OR REPLACE FUNCTION update_cleaner_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cleaners SET
        rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE cleaner_id = NEW.cleaner_id),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE cleaner_id = NEW.cleaner_id)
    WHERE id = NEW.cleaner_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_update_stats AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_cleaner_stats();

-- Update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET
        last_message = NEW.content,
        last_message_time = NEW.created_at,
        last_message_sender_id = NEW.sender_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_message_update_conversation AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promo_code_id IS NOT NULL AND OLD.promo_code_id IS NULL THEN
        UPDATE promo_codes SET
            used_count = used_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.promo_code_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_promo_usage AFTER UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION increment_promo_usage();

-- Generate human-readable booking ID
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
DECLARE
    state_code VARCHAR(2);
    date_part VARCHAR(8);
    random_part VARCHAR(5);
BEGIN
    -- Get state code (default to TX)
    SELECT COALESCE(UPPER(LEFT(h.state, 2)), 'TX') INTO state_code
    FROM houses h WHERE h.id = NEW.house_id;

    -- Date part: YYYY-MMDD
    date_part := TO_CHAR(NEW.scheduled_date, 'YYYY-MMDD');

    -- Random 5-digit number
    random_part := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    NEW.booking_id := state_code || '-' || date_part || '-' || random_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_booking_id BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_id();

-- Ensure only one default house per user
CREATE OR REPLACE FUNCTION ensure_single_default_house()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE houses SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_house BEFORE INSERT OR UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_house();

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE payment_methods SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_payment BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment();
```

---

## 9. Data Flow Diagrams

### 9.1 Booking Flow

```
Customer                    System                      Cleaner
   │                          │                            │
   │  1. Create Booking       │                            │
   │ ─────────────────────────►                            │
   │                          │                            │
   │                          │  2. Calculate Price        │
   │                          │  (service + addons + tax)  │
   │                          │                            │
   │                          │  3. Broadcast to Cleaners  │
   │                          │ ───────────────────────────►
   │                          │                            │
   │                          │  4. Cleaner Accepts        │
   │                          │ ◄───────────────────────────
   │                          │                            │
   │  5. Booking Confirmed    │                            │
   │ ◄─────────────────────────                            │
   │                          │                            │
   │                          │  6. Day of Service         │
   │                          │                            │
   │                          │  7. Cleaner On The Way     │
   │ ◄─────────────────────────────────────────────────────
   │                          │                            │
   │                          │  8. Cleaner Arrived        │
   │ ◄─────────────────────────────────────────────────────
   │                          │                            │
   │                          │  9. Job In Progress        │
   │                          │                            │
   │                          │ 10. Job Completed          │
   │ ◄─────────────────────────────────────────────────────
   │                          │                            │
   │ 11. Customer Approves    │                            │
   │ ─────────────────────────►                            │
   │                          │                            │
   │                          │ 12. Process Payment        │
   │                          │ ───────────────────────────►
   │                          │     (90% to cleaner)       │
   │                          │                            │
   │ 13. Leave Review         │                            │
   │ ─────────────────────────►                            │
   │                          │                            │
   │                          │ 14. Update Cleaner Stats   │
   │                          │                            │
```

### 9.2 Messaging Flow

```
Customer                    System                      Cleaner
   │                          │                            │
   │  1. Booking Created      │                            │
   │ ─────────────────────────►                            │
   │                          │                            │
   │                          │  2. Create Conversation    │
   │                          │     (tied to booking)      │
   │                          │                            │
   │  3. Send Message         │                            │
   │ ─────────────────────────►                            │
   │                          │                            │
   │                          │  4. Store Message          │
   │                          │  5. Update Conversation    │
   │                          │  6. Create Notification    │
   │                          │ ───────────────────────────►
   │                          │                            │
   │                          │  7. Reply Message          │
   │ ◄─────────────────────────────────────────────────────
   │                          │                            │
   │                          │  8. Booking Completed      │
   │                          │                            │
   │                          │  9. Lock Conversation      │
   │                          │     (status = 'closed')    │
   │                          │                            │
   │ 10. Cannot Send (locked) │                            │
   │ ◄─────────────────────────                            │
   │                          │                            │
```

### 9.3 Pricing Calculation

```
Input:
  - House: sqft = 2500, has_pets = true
  - Service: Regular Clean (rate = 0.10)
  - Add-ons: Inside Fridge ($20), Baseboards (0.01/sqft)
  - Metro: Dallas (multiplier = 1.0)
  - Promo: SAVE10 (10% off, max $50)
  - Tax Rate: 8.25%

Calculation:
  1. Base Price = ceil(2500 × 0.10 × 1.0 / 10) × 10 = $250
  2. Pet Surcharge = $10
  3. Add-ons:
     - Inside Fridge = $20
     - Baseboards = ceil(2500 × 0.01 / 10) × 10 = $30
  4. Subtotal = $250 + $10 + $20 + $30 = $310
  5. Tax = $310 × 0.0825 = $25.58
  6. Before Discount = $310 + $25.58 = $335.58
  7. Discount = min($310 × 0.10, $50) = $31
  8. Total = $335.58 - $31 = $304.58

Cleaner Earnings:
  - Based on subtotal only: $310 × 0.90 = $279
```

---

## 10. Migration from IndexedDB

### 10.1 Migration Strategy

```javascript
// Migration script pseudocode
async function migrateToPostgres() {
    // 1. Export from IndexedDB
    const users = await getAllDocs('users');
    const cleaners = await getAllDocs('cleaners');
    const houses = await getAllDocs('houses');
    const bookings = await getAllDocs('bookings');
    const jobs = await getAllDocs('jobs');
    const reviews = await getAllDocs('reviews');
    const messages = await getAllDocs('messages');

    // 2. Transform data (field name changes)
    const transformedUsers = users.map(u => ({
        id: u.id || u.uid,
        email: u.email,
        password_hash: u.password,
        first_name: u.firstName || u.profile?.firstName,
        last_name: u.lastName || u.profile?.lastName,
        // ... map all fields
    }));

    // 3. Insert into PostgreSQL
    await pg.query('BEGIN');
    try {
        await insertBatch('users', transformedUsers);
        await insertBatch('cleaners', transformedCleaners);
        await insertBatch('houses', transformedHouses);
        await insertBatch('bookings', transformedBookings);
        await insertBatch('jobs', transformedJobs);
        await insertBatch('reviews', transformedReviews);
        await insertBatch('messages', transformedMessages);
        await pg.query('COMMIT');
    } catch (error) {
        await pg.query('ROLLBACK');
        throw error;
    }
}
```

### 10.2 Field Mapping

| IndexedDB Field | PostgreSQL Column | Notes |
|-----------------|-------------------|-------|
| uid | id | Standardized to UUID |
| firstName | first_name | Snake case |
| lastName | last_name | Snake case |
| photoURL | photo_url | Snake case |
| createdAt | created_at | ISO string → TIMESTAMP |
| updatedAt | updated_at | ISO string → TIMESTAMP |
| location.lat | latitude | Flattened |
| location.lng | longitude | Flattened |
| pricingBreakdown | pricing_breakdown | Object → JSONB |
| addOnIds | booking_add_ons | Array → Junction table |

---

## Appendix A: Sample Data

### A.1 Default Service Types

```sql
INSERT INTO service_types (id, name, description, price_per_sqft, features, sort_order) VALUES
('regular', 'Regular Clean', 'Standard cleaning for maintained homes', 0.10,
    ARRAY['Dusting', 'Vacuuming', 'Mopping', 'Bathroom cleaning', 'Kitchen cleaning', 'Trash removal'], 1),
('deep', 'Deep Clean', 'Thorough cleaning including hard-to-reach areas', 0.15,
    ARRAY['Everything in Regular', 'Baseboards', 'Inside cabinets', 'Appliance cleaning', 'Light fixtures', 'Window sills'], 2),
('move', 'Move-in/Move-out', 'Complete transition cleaning for moves', 0.18,
    ARRAY['Everything in Deep Clean', 'Inside closets', 'Inside oven', 'Inside refrigerator', 'Garage sweeping'], 3),
('windows', 'Windows Only', 'Professional window cleaning inside & out', 0.08,
    ARRAY['Interior windows', 'Exterior windows', 'Window sills', 'Window tracks', 'Screen cleaning'], 4);
```

### A.2 Default Add-ons

```sql
INSERT INTO add_ons (id, name, flat_price, price_per_sqft, duration_minutes, sort_order) VALUES
('inside-oven', 'Inside Oven Deep Clean', 25.00, NULL, 30, 1),
('inside-fridge', 'Inside Refrigerator', 20.00, NULL, 20, 2),
('interior-windows', 'Interior Windows', NULL, 0.02, 45, 3),
('laundry', 'Laundry Wash & Fold', 15.00, NULL, 30, 4),
('baseboards', 'Baseboards Wiping', NULL, 0.01, 20, 5);
```

### A.3 Default Settings

```sql
INSERT INTO settings (id, tax_rate, platform_fee, cleaner_earnings_rate, min_booking_amount, max_booking_amount) VALUES
('app', 0.0825, 0.10, 0.90, 50.00, 2000.00);
```

---

## Appendix B: Common Queries

### B.1 Get Customer's Bookings

```sql
SELECT b.*,
       h.nickname as house_name,
       h.street as address,
       c.rating as cleaner_rating,
       u.first_name || ' ' || u.last_name as cleaner_name
FROM bookings b
JOIN houses h ON b.house_id = h.id
LEFT JOIN cleaners c ON b.cleaner_id = c.id
LEFT JOIN users u ON c.user_id = u.id
WHERE b.customer_id = $1
ORDER BY b.scheduled_date DESC, b.created_at DESC;
```

### B.2 Get Available Cleaners for Booking

```sql
SELECT c.*,
       u.first_name, u.last_name, u.photo_url,
       ST_Distance(
           ST_MakePoint(c.base_longitude, c.base_latitude),
           ST_MakePoint($2, $1)
       ) / 1609.34 as distance_miles
FROM cleaners c
JOIN users u ON c.user_id = u.id
WHERE c.status = 'active'
  AND c.verification_status = 'approved'
  AND $3 = ANY(c.service_types)
  AND NOT EXISTS (
      SELECT 1 FROM cleaner_availability ca
      WHERE ca.cleaner_id = c.id
        AND ca.date = $4
        AND ca.time_slot = $5
        AND ca.status = 'booked'
  )
ORDER BY c.rating DESC, distance_miles ASC
LIMIT 15;
```

### B.3 Calculate Cleaner Earnings

```sql
SELECT
    DATE_TRUNC('day', j.completed_at) as date,
    COUNT(*) as jobs_count,
    SUM(j.earnings) as total_earnings,
    SUM(j.tip) as total_tips,
    SUM(j.earnings + COALESCE(j.tip, 0)) as grand_total
FROM jobs j
WHERE j.cleaner_id = $1
  AND j.status = 'completed'
  AND j.completed_at >= $2
  AND j.completed_at <= $3
GROUP BY DATE_TRUNC('day', j.completed_at)
ORDER BY date DESC;
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | System | Initial comprehensive design |

---

*This document is auto-generated and should be kept in sync with the actual database schema.*
