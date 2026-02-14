# GoSwish Architecture Documentation

This document describes the system architecture, design decisions, and data flow patterns used in GoSwish.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Navigation System](#navigation-system)
- [State Management](#state-management)
- [Data Layer](#data-layer)
- [Component Architecture](#component-architecture)
- [Security Considerations](#security-considerations)

## System Overview

GoSwish follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Screens   │  │  Components │  │    Admin    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               AppContext (Global State)              │   │
│  │  - Authentication    - User Data    - Role State    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Booking    │  │   Cleaner   │  │    Job      │         │
│  │  Helpers    │  │   Helpers   │  │   Helpers   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  IndexedDB (db.js)                   │   │
│  │  Collections: USERS, BOOKINGS, JOBS, HOUSES, etc.   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. Presentation Layer

**Purpose**: Render UI and handle user interactions

**Components**:
- `src/components/` - Feature screens
- `src/admin/` - Admin dashboard
- `src/App.jsx` - Root component and navigation

**Key Patterns**:
- Functional components with hooks
- Props for data passing
- Callbacks for actions

### 2. Application Layer

**Purpose**: Manage global application state

**Components**:
- `src/context/AppContext.jsx` - Global state provider

**Key Patterns**:
- React Context for state distribution
- useReducer for complex state updates
- Custom hooks (useApp) for consumption

### 3. Service Layer

**Purpose**: Business logic and data operations

**Components**:
- `src/storage/helpers/` - Domain-specific modules
  - `bookingHelpers.js` - Booking lifecycle
  - `cleanerHelpers.js` - Cleaner operations
  - `jobHelpers.js` - Job management
  - `matchingHelpers.js` - Cleaner-booking matching

**Key Patterns**:
- Async/await for all operations
- Error handling with try/catch
- Validation before database writes

### 4. Data Layer

**Purpose**: Persist and retrieve data

**Components**:
- `src/storage/db.js` - IndexedDB wrapper
- `src/storage/seedData.js` - Test data generation

**Key Patterns**:
- Document-based (NoSQL style)
- Indexed fields for queries
- Versioned schema migrations

## Navigation System

### State Machine Pattern

Instead of URL-based routing, we use a state machine approach:

```jsx
// Navigation state
const [currentScreen, setCurrentScreen] = useState('splash');
const [activeTab, setActiveTab] = useState('home');

// Navigate
const navigateTo = (screen, params = {}) => {
  setNavigationParams(params);
  setCurrentScreen(screen);
};

// Render
switch (currentScreen) {
  case 'splash':
    return <SplashScreen />;
  case 'main':
    return renderMainContent();
  case 'booking':
    return <BookingFlow />;
}
```

### Screen Flow Diagram

```
                        ┌──────────────┐
                        │    Splash    │
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │   Check Auth State   │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     ┌──────────┐       ┌──────────┐       ┌──────────┐
     │ Welcome  │       │   Main   │       │  Admin   │
     │  Screen  │       │ Dashboard│       │Dashboard │
     └────┬─────┘       └────┬─────┘       └──────────┘
          │                  │
          ▼                  ▼
     ┌──────────┐    ┌───────────────┐
     │  Auth    │    │  Tab Content  │
     │  Flow    │    │ (Home/Jobs/   │
     └──────────┘    │  Profile)     │
                     └───────────────┘
```

### Tab-Based Navigation (Main Dashboard)

```
┌─────────────────────────────────────┐
│                                     │
│         TAB CONTENT AREA            │
│   (CustomerHome / CleanerHome /     │
│    Bookings / Schedule / Profile)   │
│                                     │
├─────────────────────────────────────┤
│ [Home] [Bookings] [Jobs] [Profile]  │
│          Bottom Navigation          │
└─────────────────────────────────────┘
```

## State Management

### AppContext Structure

```jsx
const initialState = {
  user: null,           // Current logged-in user
  isAuthenticated: false,
  selectedRole: null,   // 'homeowner' or 'cleaner'
  houses: [],           // User's properties
  loading: false,
  error: null
};
```

### Action Types

```jsx
const AppReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_ROLE':
      return { ...state, selectedRole: action.payload };
    case 'LOGOUT':
      return initialState;
    // ... more actions
  }
};
```

### Using Context

```jsx
// In components
import { useApp } from './context/AppContext';

function MyComponent() {
  const {
    user,
    isAuthenticated,
    selectedRole,
    login,
    logout,
    setRole
  } = useApp();

  // Use state and actions...
}
```

## Data Layer

### Database Schema

```
GoSwishDB (IndexedDB)
│
├── USERS
│   ├── id (primary key)
│   ├── email (indexed, unique)
│   ├── firstName, lastName
│   ├── role: 'homeowner' | 'cleaner' | 'admin'
│   └── createdAt, updatedAt
│
├── BOOKINGS
│   ├── id (primary key)
│   ├── bookingId (formatted number, indexed)
│   ├── customerId (indexed)
│   ├── cleanerId (indexed)
│   ├── houseId
│   ├── status (indexed)
│   ├── dates[], timeSlots{}
│   └── pricingBreakdown, totalAmount
│
├── JOBS
│   ├── id (primary key)
│   ├── bookingId (indexed)
│   ├── cleanerId (indexed)
│   ├── status (indexed)
│   └── scheduledDate, earnings
│
├── HOUSES
│   ├── id (primary key)
│   ├── userId (indexed)
│   ├── address{}
│   └── sqft, bedrooms, bathrooms
│
├── CLEANERS
│   ├── id (primary key)
│   ├── userId (indexed)
│   ├── serviceTypes[]
│   ├── availability{}
│   └── stats{}, rating
│
├── REVIEWS
│   ├── id (primary key)
│   ├── cleanerId (indexed)
│   ├── customerId (indexed)
│   └── rating, comment, tags[]
│
├── MESSAGES
│   ├── id (primary key)
│   ├── conversationId | participantIds
│   ├── bookingId (for conversations)
│   └── content, status
│
└── NOTIFICATIONS
    ├── id (primary key)
    ├── userId (indexed)
    ├── type (indexed)
    └── title, message, read
```

### CRUD Operations

```jsx
// Create
await setDoc(COLLECTIONS.BOOKINGS, booking.id, booking);

// Read
const booking = await getDoc(COLLECTIONS.BOOKINGS, bookingId);

// Query
const bookings = await queryDocs(COLLECTIONS.BOOKINGS, 'customerId', id);

// Update
await updateDoc(COLLECTIONS.BOOKINGS, bookingId, { status: 'confirmed' });

// Delete
await deleteDoc(COLLECTIONS.BOOKINGS, bookingId);
```

### Relationships

```
USERS 1 ──── N HOUSES
USERS 1 ──── N BOOKINGS (as customer)
USERS 1 ──── 1 CLEANERS (profile)
BOOKINGS 1 ──── 1 JOBS
BOOKINGS 1 ──── N MESSAGES (via conversation)
CLEANERS 1 ──── N REVIEWS
```

## Component Architecture

### Component Categories

1. **Screen Components** - Full-page views
   - Have navigation callbacks (onBack, onComplete)
   - Manage their own local state
   - Call service layer for data

2. **Feature Components** - Complex UI features
   - Self-contained functionality
   - May have sub-components
   - Examples: BookingFlow, JobExecution

3. **Shared Components** - Reusable UI elements
   - Stateless or controlled
   - Styled with Tailwind
   - Examples: BottomNavigation, LoadingSpinner

### Component Template

```jsx
/**
 * ComponentName
 *
 * Purpose: Brief description
 *
 * Props:
 * - propName: Type - Description
 * - onBack: Function - Navigation callback
 */
export default function ComponentName({ prop1, onBack }) {
  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Context
  const { user } = useApp();

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleAction = async () => {
    // ...
  };

  // Render
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 border-b">
        <button onClick={onBack}>Back</button>
        <h1>Title</h1>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* ... */}
      </main>
    </div>
  );
}
```

## Security Considerations

### Input Validation

All user inputs are validated before database writes:

```jsx
// In createBooking
if (!customerId) throw new Error('Customer ID is required');
if (!bookingData.houseId) throw new Error('House ID is required');
if (dates.some(d => d < today)) throw new Error('Cannot book past dates');
```

### Optimistic Locking

Race conditions are prevented with version checking:

```jsx
const claimResult = await conditionalUpdate(
  COLLECTIONS.BOOKINGS,
  bookingId,
  { cleanerId, version: currentVersion + 1 },
  { cleanerId: null, version: currentVersion }  // Condition
);
```

### Data Isolation

- Users can only access their own data
- Booking status determines action permissions
- Messaging locked when booking completes

### Sensitive Data

- Passwords hashed before storage
- Payment tokens handled by Stripe
- Verification codes time-limited

## Performance Optimizations

### Code Splitting

Components are lazy-loaded:

```jsx
const BookingFlow = lazy(() => import('./components/BookingFlowNew'));

<Suspense fallback={<LoadingFallback />}>
  {renderScreen()}
</Suspense>
```

### Efficient Queries

- Indexed fields for frequent lookups
- Query by index, not full scan
- Batch operations where possible

### Caching

- Context caches user data
- Components cache fetched data locally
- IndexedDB provides persistence

## Future Architecture Considerations

1. **Backend Migration**: Replace IndexedDB with REST API
2. **TypeScript**: Add type safety
3. **React Router**: Consider for deep linking
4. **State Library**: Zustand if Context becomes unwieldy
5. **Testing**: Add Jest + React Testing Library
