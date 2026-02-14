# GoSwish - Home Cleaning Service Platform

A modern, mobile-first React application for connecting homeowners with professional cleaners.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)

## Overview

GoSwish is a two-sided marketplace platform that connects:
- **Homeowners** who need cleaning services
- **Cleaners** who provide professional cleaning services

The app handles the complete lifecycle from booking to payment, including real-time tracking, messaging, and reviews.

### Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4 |
| State Management | React Context + useReducer |
| Database | IndexedDB (browser-based, offline-first) |
| Icons | Lucide React |
| Payments | Stripe |
| Build | Vite + ESBuild |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Workspace

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Homeowner | homeowner1@goswish.com | HomeOwner123! |
| Cleaner | cleaner1@goswish.com | Cleaner123! |
| Admin | admin@goswish.com | Admin123! |

## Project Structure

```
src/
├── admin/                 # Admin dashboard components
│   ├── AdminDashboard.jsx
│   ├── BookingManagement.jsx
│   ├── PromoConfig.jsx
│   ├── ServiceConfig.jsx
│   ├── SettingsConfig.jsx
│   └── UserManagement.jsx
│
├── components/            # Feature components
│   ├── AuthScreen.jsx     # Authentication
│   ├── BookingFlowNew.jsx # Multi-step booking wizard
│   ├── CleanerSchedule.jsx
│   ├── CustomerMessaging.jsx
│   ├── JobExecution.jsx   # Day-of-service flow
│   ├── MyBookings.jsx     # Booking list
│   ├── Screens.jsx        # Shared screen components
│   ├── SplashScreen.jsx
│   └── WelcomeScreen.jsx
│
├── context/
│   └── AppContext.jsx     # Global state management
│
├── storage/               # Data persistence layer
│   ├── db.js              # IndexedDB operations
│   ├── helpers/           # Domain-specific helpers (modular)
│   │   ├── bookingHelpers.js
│   │   ├── cleanerHelpers.js
│   │   ├── jobHelpers.js
│   │   ├── messageHelpers.js
│   │   └── index.js       # Re-exports all helpers
│   ├── helpers.js         # Backwards-compatible export
│   ├── seedData.js        # Test data generation
│   └── migration.js       # Data migrations
│
├── utils/
│   └── dateUtils.js       # Timezone-safe date handling
│
├── App.jsx                # Root component & navigation
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Architecture

### Navigation Pattern

We use a **State Machine** approach for navigation rather than URL-based routing:

```jsx
const [currentScreen, setCurrentScreen] = useState('splash');

// Navigate to a screen
setCurrentScreen('booking');
```

This mimics mobile app behavior where screens are stacked or replaced.

### State Management

```
┌─────────────────────────────────────────────┐
│              AppProvider                     │
│  ┌─────────────────────────────────────┐    │
│  │          AppContext                  │    │
│  │  - user (current user)               │    │
│  │  - isAuthenticated                   │    │
│  │  - selectedRole                      │    │
│  │  - dispatch (actions)                │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
              ▼
    Components use useApp() hook
```

### Data Layer

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Components  │ ──▶ │   Helpers    │ ──▶ │  IndexedDB   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     Domain modules:
                     - bookingHelpers
                     - cleanerHelpers
                     - jobHelpers
                     - messageHelpers
```

### Database Collections

| Collection | Purpose |
|------------|---------|
| USERS | User accounts |
| CLEANERS | Cleaner profiles |
| BOOKINGS | Customer booking requests |
| JOBS | Cleaner work assignments |
| HOUSES | Property information |
| REVIEWS | Customer/cleaner reviews |
| MESSAGES | Conversation messages |
| NOTIFICATIONS | User notifications |
| SERVICE_TYPES | Available services |
| PROMO_CODES | Discount codes |

## Key Features

### For Homeowners
- Property management
- Multi-step booking flow
- Real-time cleaner tracking
- In-app messaging
- Payment processing
- Rating & reviews

### For Cleaners
- Job offer browsing
- Schedule management
- Availability settings
- Earnings dashboard
- Customer communication
- Day-of-service checklist

### For Admins
- User management
- Booking oversight
- Service configuration
- Promo code management
- Platform settings

## Development Guide

### Adding a New Screen

1. Create component in `src/components/`:
```jsx
// src/components/NewScreen.jsx
export default function NewScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1>New Screen</h1>
    </div>
  );
}
```

2. Add lazy import in `App.jsx`:
```jsx
const NewScreen = lazy(() => import('./components/NewScreen'));
```

3. Add case in `renderScreen()`:
```jsx
case 'new-screen':
  return <NewScreen onBack={() => setCurrentScreen('main')} />;
```

### Working with Storage

```jsx
// Import helpers
import { createBooking, getCustomerBookings } from './storage/helpers';

// Create a booking
const booking = await createBooking(customerId, {
  houseId: 'house-123',
  serviceTypeId: 'standard-clean',
  dates: ['2026-02-15'],
  timeSlots: { '2026-02-15': ['morning'] }
});

// Query bookings
const bookings = await getCustomerBookings(customerId);
```

### Code Splitting

Components are lazy-loaded for performance:

```jsx
// Lazy load secondary screens
const BookingFlow = lazy(() => import('./components/BookingFlowNew'));

// Wrap with Suspense
<Suspense fallback={<LoadingFallback />}>
  {renderScreen()}
</Suspense>
```

### Styling Guidelines

We use Tailwind CSS with a mobile-first approach:

```jsx
// Good: Mobile-first responsive
<div className="p-4 md:p-6 lg:p-8">

// Color palette
// Primary: teal-500, teal-600
// Success: green-500
// Warning: yellow-500
// Error: red-500
// Text: gray-900, gray-600, gray-500
```

## Testing

### Manual Testing

1. Start the dev server: `npm run dev`
2. Login with test credentials
3. Follow test flows in `docs/BOOKING_FLOW_TESTING_GUIDE.md`

### Test Data

The app auto-seeds test data on first load:
- 30 test customers
- 30 test cleaners
- Service types and add-ons
- Promo codes

## Deployment

### Build for Production

```bash
npm run build
```

Output is in the `dist/` directory.

### Environment Variables

Create `.env` for environment-specific config:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=https://api.goswish.com
```

## Documentation

Additional documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture details |
| [COMPONENT_GUIDE.md](docs/COMPONENT_GUIDE.md) | Component reference |
| [GETTING_STARTED.md](docs/GETTING_STARTED.md) | New developer guide |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Database schema |
| [BOOKING_FLOW_TESTING_GUIDE.md](docs/BOOKING_FLOW_TESTING_GUIDE.md) | Testing procedures |

## Support

For issues or questions:
- Create an issue in the repository
- Contact: support@goswish.com

---

Built with React + Vite
