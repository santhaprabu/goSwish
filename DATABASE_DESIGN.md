# GoSwish Database Design & Schema

## Overview

GoSwish uses an **offline-first, document-based NoSQL architecture** built on top of the browser's **IndexedDB**. This mimics a remote backend (like Firebase Firestore) but runs entirely on the client for rapid prototyping and zero-latency interactions.

-   **Database Name**: `GoSwishDB`
-   **Architecture**: Collection-Document Pattern
-   **ID Strategy**: UUID strings (e.g., `user_123`, `job_456`)

---

## Collections Diagram

```mermaid
erDiagram
    USERS ||--o{ HOUSES : owns
    USERS ||--o{ BOOKINGS : places
    USERS ||--|| CLEANERS : "has profile"
    
    BOOKINGS ||--|| JOBS : "generates"
    CLEANERS ||--o{ JOBS : "performs"
    
    JOBS ||--o{ REVIEWS : "receives"
    CLEANERS ||--o{ REVIEWS : "rated in"
    
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ MESSAGES : sends/receives
```

---

## Detailed Schema Definitions

### 1. `users`
**Purpose**: The central identity record for all actors (Homeowners, Cleaners, Admins).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Unique User ID (e.g., `user_xyz`) |
| `email` | string | Unique login credential |
| `role` | enum | `'homeowner'`, `'cleaner'`, `'admin'` |
| `name` | string | Full display name |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `phone` | string | Contact number |
| `photoURL` | string (url) | Avatar image |
| `location` | object | `{ city, neighborhood, ... }` - primary location |
| `createdAt` | ISO Date | Account creation timestamp |

### 2. `cleaners`
**Purpose**: Extended professional profile for users with role `'cleaner'`.
**Link**: 1:1 relationship with `users` via `id` (often shares the same ID or linked by `userId`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Unique Cleaner Profile ID |
| `userId` | string (FK) | Link to the core `users` record |
| `headline` | string | Marketing tagline |
| `bio` | string | Detailed biography |
| `yearsExperience`| number | Years in industry |
| `specialties` | array<string>| e.g., `['Deep Clean', 'Move Out']` |
| `languages` | array<string>| e.g., `['English', 'Spanish']` |
| `serviceRadius` | number | Max travel distance in miles |
| `baseLocation` | object | Lat/Lng center point for service area |
| `availability` | object | Map of Day -> Time Slots |
| `rating` | number | Aggregate star rating (0-5) |
| `totalReviews` | number | Count of total reviews received |
| `completedJobs` | number | Count of successfully finished jobs |
| `hourlyRate` | number | Base rate (internal calculation metric) |
| `petFriendly` | boolean | Willingness to work with pets |

### 3. `houses`
**Purpose**: Properties owned by homeowners where services are performed.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Unique House ID |
| `userId` | string (FK) | Owner (Homeowner) ID |
| `nickname` | string | User-friendly name (e.g., "Home", "Rental") |
| `address` | object | `{ street, city, state, zip, neighborhood, lat, lng }` |
| `sqft` | number | Square footage (pricing factor) |
| `bedrooms` | number | Room count |
| `bathrooms` | number | Room count |
| `propertyType` | enum | `'house'`, `'apartment'`, `'condo'`, `'townhouse'` |
| `accessInstructions`| string | Gate codes, key locations, etc. |
| `parkingInfo` | string | Where the cleaner should park |
| `pets` | object | `{ hasPets: boolean, notes: string }` |

### 4. `bookings`
**Purpose**: Represents the **Demand**. A request from a homeowner for service.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Unique Booking ID |
| `customerId` | string (FK) | The Homeowner who placed the order |
| `houseId` | string (FK) | Where the service happens |
| `serviceType` | string | e.g., `'regular'`, `'deep'`, `'move-in-out'` |
| `status` | enum | `'booking-placed'`, `'matched'`, `'completed'`, `'cancelled'` |
| `scheduledDate` | ISO Date | Requested date of service |
| `timeSlot` | string | e.g., `'morning'`, `'afternoon'` |
| `pricing` | object | `{ base, addOns, taxes, total }` |
| `addOns` | array<object>| List of extra services requested |
| `notes` | string | Special instructions for this specific job |
| `cleanerId` | string (FK) | ID of the assigned cleaner (if separate from job) |

### 5. `jobs`
**Purpose**: Represents the **Supply**. The unit of work assigned to a cleaner.
**Note**: Often mirrors `bookings` but focuses on execution details (timestamps, tracking).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Unique Job ID |
| `bookingId` | string (FK) | Link to the original customer request |
| `cleanerId` | string (FK) | The Cleaner performing the work |
| `status` | enum | `'scheduled'`, `'in_progress'`, `'completed'` |
| `startTime` | ISO Date | Actual clock-in time |
| `endTime` | ISO Date | Actual clock-out time |
| `earnings` | number | Cleaner's payout for this job |
| `tip` | number | Extra amount added by customer |
| `gpsTracking` | array | Live location points during 'Trip' phase |
| `verificationCode`| string | 6-digit code for security |

### 6. `reviews`
**Purpose**: Quality assurance feedback loop.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Review ID |
| `jobId` | string (FK) | The completed job being reviewed |
| `cleanerId` | string (FK) | Who is being rated |
| `customerId` | string (FK) | Who wrote the review |
| `rating` | number | 1-5 Stars |
| `comment` | string | Text feedback |
| `tags` | array<string>| e.g., `['Punctual'`, `'Meticulous']` |
| `createdAt` | ISO Date | Date of review |

### 7. `promoCodes`
**Purpose**: Discounts and marketing logic.

| Field | Type | Description |
| :--- | :--- | :--- |
| `code` | string (PK) | The code typed by user (e.g., `SAVE10`) |
| `type` | enum | `'percent'`, `'fixed'` |
| `value` | number | Amount (e.g., `10` for 10% or $10) |
| `minAmount` | number | Minimum cart total required |
| `maxUses` | number | Total global redemption limit |
| `usedCount` | number | Times currently used |
| `validUntil` | ISO Date | Expiration date |

### 8. `notifications`
**Purpose**: System alerts for users.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Notification ID |
| `userId` | string (FK) | Recipient |
| `title` | string | Alert header |
| `message` | string | Body text |
| `type` | enum | `'job_offer'`, `'payment'`, `'reminder'` |
| `read` | boolean | Unread status indicator |

### 9. `transactions`
**Purpose**: Financial ledger for Cleaner payouts (Ledger).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string (PK) | Transaction ID |
| `cleanerId` | string (FK) | Payee |
| `amount` | number | Currency value |
| `type` | enum | `'payout'`, `'adjustment'`, `'bonus'` |
| `status` | enum | `'processing'`, `'paid'`, `'failed'` |
| `createdAt` | ISO Date | Transaction time |

---

## Key Indexes
To ensure performance, the following indexes are maintained in IndexedDB:

- **Users**: `email` (Unique), `role`
- **Bookings**: `customerId`, `cleanerId`, `status`, `scheduledDate`
- **Jobs**: `cleanerId`, `status`
- **Houses**: `userId`
