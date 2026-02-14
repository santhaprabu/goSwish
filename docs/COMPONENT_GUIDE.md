# Component Guide

A comprehensive reference for all components in the GoSwish application.

## Table of Contents

- [Core Components](#core-components)
- [Authentication Components](#authentication-components)
- [Customer Components](#customer-components)
- [Cleaner Components](#cleaner-components)
- [Shared Components](#shared-components)
- [Admin Components](#admin-components)

## Core Components

### App.jsx

**Location**: `src/App.jsx`

**Purpose**: Root component handling navigation and initialization.

**Key Responsibilities**:
- Database initialization
- Screen routing (state machine)
- Tab navigation management
- Auth state monitoring

**Usage**: Wrapped by AppProvider, renders all screens.

---

### SplashScreen

**Location**: `src/components/SplashScreen.jsx`

**Purpose**: Initial branding screen shown on app launch.

**Props**: None

**Features**:
- Animated logo entry
- Rotating value propositions
- Auto-transitions to next screen

---

### Screens.jsx

**Location**: `src/components/Screens.jsx`

**Purpose**: Contains shared screen components used by both roles.

**Exports**:
- `BottomNavigation` - Tab bar for main screens
- `CustomerHome` - Home tab for customers
- `CleanerHome` - Home tab for cleaners
- `ProfileScreen` - Profile tab for both roles
- `BecomeCleanerScreen` - Customer-to-cleaner conversion

---

## Authentication Components

### WelcomeScreen

**Location**: `src/components/WelcomeScreen.jsx`

**Purpose**: Landing page with login/signup options.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onSuccess | Function | Called after successful auth |
| initialMode | string | 'welcome', 'login', or 'signup' |

---

### EmailVerification

**Location**: `src/components/EmailVerification.jsx`

**Purpose**: OTP verification screen.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onVerified | Function | Called when email is verified |

---

### ProfileSetup

**Location**: `src/components/ProfileSetup.jsx`

**Purpose**: User profile creation/editing.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| isEditing | boolean | Edit mode vs create mode |
| onBack | Function | Navigation callback |
| onComplete | Function | Called when profile saved |

---

## Customer Components

### BookingFlowNew

**Location**: `src/components/BookingFlowNew.jsx`

**Purpose**: Multi-step booking wizard.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| initialHouseId | string | Pre-selected house ID |
| onBack | Function | Navigation callback |
| onComplete | Function | Called after booking created |

**Steps**:
1. Select Property
2. Choose Service Type
3. Select Add-ons
4. Pick Date & Time
5. Review & Confirm
6. Payment

**Key State**:
```jsx
const [step, setStep] = useState(1);
const [selectedHouse, setSelectedHouse] = useState(null);
const [selectedService, setSelectedService] = useState(null);
const [selectedAddOns, setSelectedAddOns] = useState([]);
const [selectedDates, setSelectedDates] = useState([]);
```

---

### HouseManagement

**Location**: `src/components/HouseManagement.jsx`

**Purpose**: Add/edit/delete properties.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| navigateTo | Function | Screen navigation |

**Features**:
- Property list view
- Add new property form
- Edit existing properties
- Delete with confirmation

---

### MyBookings (BookingsList)

**Location**: `src/components/MyBookings.jsx`

**Purpose**: List of customer's bookings.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onTrackJob | Function | Open live tracking |
| onViewBooking | Function | Open booking details |
| onViewTopCleaners | Function | Navigate to top cleaners |
| onMessaging | Function | Open messaging |

---

### BookingDetails

**Location**: `src/components/BookingDetails.jsx`

**Purpose**: Detailed view of a single booking.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| booking | Object | Booking data |
| onBack | Function | Navigation callback |
| onMessage | Function | Open messaging |
| onTrack | Function | Open live tracking |

---

### CustomerMessaging

**Location**: `src/components/CustomerMessaging.jsx`

**Purpose**: Chat interface for customers.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| initialBookingId | string | Pre-selected conversation |
| onBack | Function | Navigation callback |

**Features**:
- Conversation list
- Real-time messaging
- Booking-scoped chats

---

### CustomerActiveJob

**Location**: `src/components/CustomerActiveJob.jsx`

**Purpose**: Live job tracking for customers.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| booking | Object | Active booking |
| onBack | Function | Navigation callback |
| onComplete | Function | Called when job approved |

---

### CustomerNotifications

**Location**: `src/components/CustomerNotifications.jsx`

**Purpose**: Notification center for customers.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| onViewBooking | Function | Navigate to booking |

---

## Cleaner Components

### JobOffers

**Location**: `src/components/JobOffers.jsx`

**Purpose**: Browse and accept available jobs.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onViewUpcomingJob | Function | View job details |

**Features**:
- Available jobs list
- Job details preview
- Accept/decline actions

---

### CleanerSchedule

**Location**: `src/components/CleanerSchedule.jsx`

**Purpose**: Weekly schedule view with jobs.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onViewJob | Function | Open job details |
| onStartJob | Function | Begin job execution |
| onManageAvailability | Function | Open shift management |
| onMessaging | Function | Open messaging |

---

### JobDetails

**Location**: `src/components/JobDetails.jsx`

**Purpose**: Detailed view of a job.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| job | Object | Job data |
| onBack | Function | Navigation callback |
| onMessaging | Function | Open messaging |
| onStartJob | Function | Begin job execution |

---

### JobExecution

**Location**: `src/components/JobExecution.jsx`

**Purpose**: Day-of-service workflow.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| job | Object | Job to execute |
| onBack | Function | Navigation callback |
| onComplete | Function | Called when job completed |

**Flow**:
1. On the way
2. Arrived (verification codes)
3. In progress (checklist)
4. Submit for approval

---

### UpcomingJobs

**Location**: `src/components/UpcomingJobs.jsx`

**Purpose**: List of upcoming scheduled jobs.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| onViewJob | Function | Open job details |

---

### ShiftManagement

**Location**: `src/components/ShiftManagement.jsx`

**Purpose**: Manage availability schedule.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

**Features**:
- Weekly availability grid
- Block/unblock time slots
- Default schedule setting

---

### EarningsDashboard

**Location**: `src/components/EarningsDashboard.jsx`

**Purpose**: Earnings overview and history.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| onViewPayouts | Function | Open payout management |

---

### PayoutManagement

**Location**: `src/components/PayoutManagement.jsx`

**Purpose**: Manage withdrawals and payouts.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| cleaner | Object | Cleaner profile |
| onBack | Function | Navigation callback |

---

### CleanerMessaging

**Location**: `src/components/CleanerMessaging.jsx`

**Purpose**: Chat interface for cleaners.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| initialBookingId | string | Pre-selected conversation |
| onBack | Function | Navigation callback |

---

### CleanerRatings

**Location**: `src/components/CleanerRatings.jsx`

**Purpose**: View received reviews and ratings.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

### CleanerNotifications

**Location**: `src/components/CleanerNotifications.jsx`

**Purpose**: Notification center for cleaners.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| onViewJob | Function | Navigate to job |
| onViewMessage | Function | Open messaging |
| onViewReview | Function | View review |

---

### BankInformation

**Location**: `src/components/BankInformation.jsx`

**Purpose**: Manage bank account for payouts.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

## Shared Components

### PaymentMethods

**Location**: `src/components/PaymentMethods.jsx`

**Purpose**: Manage payment cards.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

### HelpCenter

**Location**: `src/components/HelpCenter.jsx`

**Purpose**: FAQ and help resources.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |
| onRunTest | Function | Open notification test |

---

### TermsPrivacy

**Location**: `src/components/TermsPrivacy.jsx`

**Purpose**: Terms of service and privacy policy.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

### NotificationPreferences

**Location**: `src/components/NotificationPreferences.jsx`

**Purpose**: Manage notification settings.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

### TopCleaners

**Location**: `src/components/TopCleaners.jsx`

**Purpose**: Browse top-rated cleaners.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onBack | Function | Navigation callback |

---

## Admin Components

### AdminDashboard

**Location**: `src/admin/AdminDashboard.jsx`

**Purpose**: Main admin interface.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| onLogout | Function | Logout callback |

**Sections**:
- Overview (stats)
- User Management
- Booking Management
- Service Configuration
- Promo Codes
- Settings

---

### UserManagement

**Location**: `src/admin/UserManagement.jsx`

**Purpose**: Manage users and cleaners.

---

### BookingManagement

**Location**: `src/admin/BookingManagement.jsx`

**Purpose**: View and manage all bookings.

---

### ServiceConfig

**Location**: `src/admin/ServiceConfig.jsx`

**Purpose**: Configure service types and add-ons.

---

### PromoConfig

**Location**: `src/admin/PromoConfig.jsx`

**Purpose**: Create and manage promo codes.

---

### SettingsConfig

**Location**: `src/admin/SettingsConfig.jsx`

**Purpose**: Platform-wide settings.

---

## Component Patterns

### Standard Screen Template

```jsx
export default function ScreenName({ onBack, onComplete }) {
  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Context
  const { user } = useApp();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold ml-2">Screen Title</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Your content here */}
      </div>

      {/* Bottom Action (if needed) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleAction}
          className="w-full bg-teal-500 text-white p-4 rounded-xl font-semibold"
        >
          Action Button
        </button>
      </div>
    </div>
  );
}
```

### Props Documentation

Always document props at the top of components:

```jsx
/**
 * ComponentName
 *
 * Purpose: What this component does
 *
 * Props:
 * @param {Object} data - The data to display
 * @param {Function} onBack - Called when back button pressed
 * @param {Function} onComplete - Called when action completes
 */
```
