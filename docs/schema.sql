-- ============================================================================
-- GOSWISH DATABASE SCHEMA
-- PostgreSQL Compatible
-- Version: 1.0
-- Created: 2026-02-05
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP EXISTING (for clean reinstall)
-- ============================================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS booking_add_ons CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cleaner_availability CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS houses CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS cleaner_verification_status CASCADE;
DROP TYPE IF EXISTS cleaner_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS promo_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS conversation_status CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS time_slot CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('homeowner', 'cleaner', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE cleaner_verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE cleaner_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE booking_status AS ENUM (
    'booking_placed', 'pending', 'confirmed', 'matched', 'scheduled',
    'on_the_way', 'arrived', 'in_progress', 'completed_pending_approval',
    'completed', 'approved', 'cancelled'
);
CREATE TYPE job_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'digital_wallet');
CREATE TYPE promo_type AS ENUM ('percent', 'fixed');
CREATE TYPE notification_type AS ENUM (
    'job_offer', 'booking_accepted', 'booking_completed',
    'payment', 'review', 'message', 'reminder'
);
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE conversation_status AS ENUM ('active', 'closed');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'condo', 'townhouse');
CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE availability_status AS ENUM ('available', 'booked', 'blocked');

-- ============================================================================
-- TABLE: users
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    password_salt VARCHAR(64),
    role user_role NOT NULL DEFAULT 'homeowner',
    status user_status NOT NULL DEFAULT 'active',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    photo_url TEXT,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    email_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(6),
    otp_expiry TIMESTAMP WITH TIME ZONE,
    notification_preferences JSONB DEFAULT '{
        "bookingUpdates": true, "jobOffers": true, "earnings": true,
        "messages": true, "reviews": true, "promotions": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- TABLE: cleaners
-- ============================================================================

CREATE TABLE cleaners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200),
    bio TEXT,
    years_experience INTEGER DEFAULT 0 CHECK (years_experience >= 0 AND years_experience <= 50),
    specialties TEXT[],
    languages TEXT[] DEFAULT ARRAY['English'],
    pet_friendly BOOLEAN DEFAULT FALSE,
    service_types TEXT[] DEFAULT ARRAY['regular'],
    service_radius INTEGER DEFAULT 25 CHECK (service_radius >= 5 AND service_radius <= 100),
    hourly_rate DECIMAL(10, 2) DEFAULT 30.00 CHECK (hourly_rate >= 15.00 AND hourly_rate <= 200.00),
    base_street VARCHAR(255),
    base_city VARCHAR(100),
    base_state VARCHAR(50),
    base_zip VARCHAR(20),
    base_latitude DECIMAL(10, 8),
    base_longitude DECIMAL(11, 8),
    verification_status cleaner_verification_status DEFAULT 'pending',
    status cleaner_status DEFAULT 'active',
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    total_reviews INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    acceptance_rate DECIMAL(5, 2) DEFAULT 100.00,
    cancellation_rate DECIMAL(5, 2) DEFAULT 0.00,
    reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: cleaner_availability
-- ============================================================================

CREATE TABLE cleaner_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot time_slot NOT NULL,
    status availability_status DEFAULT 'available',
    booking_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cleaner_slot UNIQUE (cleaner_id, date, time_slot)
);

-- ============================================================================
-- TABLE: houses
-- ============================================================================

CREATE TABLE houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100) DEFAULT 'My Home',
    is_default BOOLEAN DEFAULT FALSE,
    property_type property_type DEFAULT 'house',
    sqft INTEGER NOT NULL CHECK (sqft >= 100 AND sqft <= 50000),
    bedrooms INTEGER DEFAULT 1 CHECK (bedrooms >= 0 AND bedrooms <= 20),
    bathrooms DECIMAL(3, 1) DEFAULT 1.0 CHECK (bathrooms >= 0.5 AND bathrooms <= 20),
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    access_instructions TEXT,
    parking_info TEXT,
    has_pets BOOLEAN DEFAULT FALSE,
    pet_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: service_types
-- ============================================================================

CREATE TABLE service_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_sqft DECIMAL(6, 4) NOT NULL CHECK (price_per_sqft >= 0),
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    duration_minutes INTEGER DEFAULT 120 CHECK (duration_minutes > 0),
    icon VARCHAR(50),
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: add_ons
-- ============================================================================

CREATE TABLE add_ons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    flat_price DECIMAL(10, 2),
    price_per_sqft DECIMAL(6, 4),
    duration_minutes INTEGER DEFAULT 15 CHECK (duration_minutes >= 0),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pricing_required CHECK (flat_price IS NOT NULL OR price_per_sqft IS NOT NULL)
);

-- ============================================================================
-- TABLE: promo_codes
-- ============================================================================

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    promo_type promo_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
    description TEXT,
    min_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    first_time_only BOOLEAN DEFAULT FALSE,
    service_types TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: bookings
-- ============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
    house_id UUID NOT NULL REFERENCES houses(id) ON DELETE RESTRICT,
    service_type_id VARCHAR(50) NOT NULL REFERENCES service_types(id),
    promo_code_id UUID REFERENCES promo_codes(id),
    scheduled_date DATE NOT NULL,
    time_slot time_slot NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    add_ons_amount DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) DEFAULT 0.0825,
    tax_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    pricing_breakdown JSONB,
    payment_method payment_method_type DEFAULT 'card',
    payment_status payment_status DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    status booking_status DEFAULT 'booking_placed',
    special_notes TEXT,
    cleaner_verification_code VARCHAR(6),
    customer_verification_code VARCHAR(6),
    verification_generated_at TIMESTAMP WITH TIME ZONE,
    cleaner_verified BOOLEAN DEFAULT FALSE,
    customer_verified BOOLEAN DEFAULT FALSE,
    tracking_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cleaner_notes TEXT,
    final_photos TEXT[],
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_rating_comment TEXT,
    customer_rating_tags TEXT[],
    cleaner_rating INTEGER CHECK (cleaner_rating >= 1 AND cleaner_rating <= 5),
    cleaner_rating_comment TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_total CHECK (total_amount >= 0)
);

-- ============================================================================
-- TABLE: booking_add_ons
-- ============================================================================

CREATE TABLE booking_add_ons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    add_on_id VARCHAR(50) NOT NULL REFERENCES add_ons(id),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking_addon UNIQUE (booking_id, add_on_id)
);

-- ============================================================================
-- TABLE: jobs
-- ============================================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE RESTRICT,
    customer_name VARCHAR(200),
    address TEXT,
    service_type VARCHAR(50),
    scheduled_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_hours DECIMAL(4, 2),
    amount DECIMAL(10, 2) NOT NULL,
    earnings DECIMAL(10, 2) NOT NULL,
    tip DECIMAL(10, 2) DEFAULT 0.00,
    status job_status DEFAULT 'scheduled',
    checklist_items JSONB,
    photos JSONB DEFAULT '{"before": [], "during": [], "after": []}'::jsonb,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: reviews
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_role user_role NOT NULL,
    cleaner_name VARCHAR(200),
    customer_name VARCHAR(200),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tags TEXT[],
    response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_review UNIQUE (booking_id, reviewer_role)
);

-- ============================================================================
-- TABLE: conversations
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id),
    customer_name VARCHAR(200),
    cleaner_name VARCHAR(200),
    service_type VARCHAR(50),
    status conversation_status DEFAULT 'active',
    closed_at TIMESTAMP WITH TIME ZONE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_message_sender_id UUID,
    customer_unread_count INTEGER DEFAULT 0,
    cleaner_unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking_conversation UNIQUE (booking_id)
);

-- ============================================================================
-- TABLE: messages
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    status message_status DEFAULT 'sent',
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: payment_methods
-- ============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type payment_method_type NOT NULL,
    card_brand VARCHAR(20),
    card_last_four VARCHAR(4),
    card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
    card_exp_year INTEGER,
    bank_name VARCHAR(100),
    account_last_four VARCHAR(4),
    routing_last_four VARCHAR(4),
    stripe_payment_method_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    nickname VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    push_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: settings
-- ============================================================================

CREATE TABLE settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'app',
    tax_rate DECIMAL(5, 4) DEFAULT 0.0825,
    platform_fee DECIMAL(5, 4) DEFAULT 0.10,
    cleaner_earnings_rate DECIMAL(5, 4) DEFAULT 0.90,
    min_booking_amount DECIMAL(10, 2) DEFAULT 50.00,
    max_booking_amount DECIMAL(10, 2) DEFAULT 2000.00,
    cancellation_fee DECIMAL(10, 2) DEFAULT 25.00,
    cancellation_window_hours INTEGER DEFAULT 24,
    default_service_radius INTEGER DEFAULT 25,
    currency VARCHAR(3) DEFAULT 'USD',
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    features JSONB DEFAULT '{
        "instantBooking": true, "chatMessaging": true, "photoUpload": true,
        "reviews": true, "promoCode": true, "referrals": false
    }'::jsonb,
    metro_multipliers JSONB DEFAULT '{
        "Dallas": 1.0, "Fort Worth": 1.0, "Austin": 1.1,
        "San Antonio": 1.05, "Houston": 1.05
    }'::jsonb,
    maintenance_enabled BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
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

-- Cleaner Availability
CREATE INDEX idx_availability_cleaner ON cleaner_availability(cleaner_id);
CREATE INDEX idx_availability_date ON cleaner_availability(date);
CREATE INDEX idx_availability_lookup ON cleaner_availability(cleaner_id, date, status);

-- Houses
CREATE INDEX idx_houses_user_id ON houses(user_id);
CREATE INDEX idx_houses_city ON houses(city, state);

-- Bookings
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_cleaner ON bookings(cleaner_id);
CREATE INDEX idx_bookings_house ON bookings(house_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_bookings_cleaner_status ON bookings(cleaner_id, status);

-- Booking Add-ons
CREATE INDEX idx_booking_addons_booking ON booking_add_ons(booking_id);

-- Jobs
CREATE INDEX idx_jobs_booking ON jobs(booking_id);
CREATE INDEX idx_jobs_cleaner ON jobs(cleaner_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_cleaner_status ON jobs(cleaner_id, status);

-- Reviews
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_cleaner ON reviews(cleaner_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

-- Conversations
CREATE INDEX idx_conversations_booking ON conversations(booking_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_cleaner ON conversations(cleaner_id);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

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
        rating = (SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2) FROM reviews WHERE cleaner_id = NEW.cleaner_id),
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

-- Generate human-readable booking ID
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
DECLARE
    state_code VARCHAR(2);
    date_part VARCHAR(8);
    random_part VARCHAR(5);
BEGIN
    SELECT COALESCE(UPPER(LEFT(h.state, 2)), 'TX') INTO state_code
    FROM houses h WHERE h.id = NEW.house_id;
    date_part := TO_CHAR(NEW.scheduled_date, 'YYYY-MMDD');
    random_part := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    NEW.booking_id := state_code || '-' || date_part || '-' || random_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_booking_id BEFORE INSERT ON bookings
    FOR EACH ROW WHEN (NEW.booking_id IS NULL)
    EXECUTE FUNCTION generate_booking_id();

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

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Service Types
INSERT INTO service_types (id, name, description, price_per_sqft, features, sort_order) VALUES
('regular', 'Regular Clean', 'Standard cleaning for maintained homes', 0.10,
    ARRAY['Dusting', 'Vacuuming', 'Mopping', 'Bathroom cleaning', 'Kitchen cleaning', 'Trash removal'], 1),
('deep', 'Deep Clean', 'Thorough cleaning including hard-to-reach areas', 0.15,
    ARRAY['Everything in Regular', 'Baseboards', 'Inside cabinets', 'Appliance cleaning', 'Light fixtures'], 2),
('move', 'Move-in/Move-out', 'Complete transition cleaning for moves', 0.18,
    ARRAY['Everything in Deep Clean', 'Inside closets', 'Inside oven', 'Inside refrigerator', 'Garage sweeping'], 3),
('windows', 'Windows Only', 'Professional window cleaning inside & out', 0.08,
    ARRAY['Interior windows', 'Exterior windows', 'Window sills', 'Window tracks', 'Screen cleaning'], 4);

-- Add-ons
INSERT INTO add_ons (id, name, flat_price, price_per_sqft, duration_minutes, sort_order) VALUES
('inside-oven', 'Inside Oven Deep Clean', 25.00, NULL, 30, 1),
('inside-fridge', 'Inside Refrigerator', 20.00, NULL, 20, 2),
('interior-windows', 'Interior Windows', NULL, 0.02, 45, 3),
('laundry', 'Laundry Wash & Fold', 15.00, NULL, 30, 4),
('baseboards', 'Baseboards Wiping', NULL, 0.01, 20, 5);

-- Promo Codes
INSERT INTO promo_codes (code, promo_type, value, description, min_amount, max_discount, first_time_only) VALUES
('WELCOME20', 'percent', 20.00, '20% off your first booking', 50.00, 50.00, TRUE),
('SAVE10', 'percent', 10.00, '10% off any booking', 75.00, 30.00, FALSE),
('FLAT25', 'fixed', 25.00, '$25 off orders over $100', 100.00, NULL, FALSE);

-- Settings
INSERT INTO settings (id, tax_rate, platform_fee, cleaner_earnings_rate, min_booking_amount, max_booking_amount,
    support_email, support_phone) VALUES
('app', 0.0825, 0.10, 0.90, 50.00, 2000.00, 'support@goswish.com', '+1-800-GOSWISH');

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO goswish_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO goswish_app;
