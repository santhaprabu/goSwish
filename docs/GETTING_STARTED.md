# Getting Started Guide for New Developers

Welcome to GoSwish! This guide will help you get up and running with the codebase quickly.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Recommended VS Code Extensions

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Workspace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Login with Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | homeowner1@goswish.com | HomeOwner123! |
| Cleaner | cleaner1@goswish.com | Cleaner123! |
| Admin | admin@goswish.com | Admin123! |

## Understanding the Codebase

### Project Structure Overview

```
src/
├── App.jsx           # Main app component - START HERE
├── main.jsx          # Entry point
├── components/       # UI components
├── context/          # Global state (AppContext)
├── storage/          # Database layer
├── admin/            # Admin dashboard
└── utils/            # Helper functions
```

### Key Files to Read First

1. **`src/App.jsx`** - Understand the navigation pattern
2. **`src/context/AppContext.jsx`** - Global state management
3. **`src/storage/db.js`** - How data is stored
4. **`src/components/Screens.jsx`** - Shared components

## Core Concepts

### 1. Navigation Pattern

We use a "state machine" navigation instead of URL routing:

```jsx
// In App.jsx
const [currentScreen, setCurrentScreen] = useState('splash');

// Navigate to a screen
setCurrentScreen('booking');

// Render based on current screen
switch (currentScreen) {
  case 'booking':
    return <BookingFlow />;
  case 'main':
    return renderMainContent();
}
```

### 2. Global State

Access global state with the `useApp()` hook:

```jsx
import { useApp } from './context/AppContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useApp();

  return (
    <div>
      {isAuthenticated ? `Hello ${user.firstName}` : 'Please login'}
    </div>
  );
}
```

### 3. Data Storage

We use IndexedDB for offline-first storage:

```jsx
// Import helper functions
import { createBooking, getBookingById } from './storage/helpers';

// Create a record
const booking = await createBooking(userId, bookingData);

// Read a record
const booking = await getBookingById(bookingId);

// Update a record
await updateBooking(bookingId, { status: 'confirmed' });
```

### 4. Styling with Tailwind

We use Tailwind CSS for all styling:

```jsx
// Mobile-first responsive design
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600 mt-2">Description</p>
</div>
```

Common patterns:
- `bg-teal-500` - Primary color
- `text-gray-900` - Primary text
- `text-gray-600` - Secondary text
- `rounded-xl` - Rounded corners
- `shadow-lg` - Drop shadows

## Common Tasks

### Adding a New Component

1. Create file in `src/components/`:

```jsx
// src/components/MyComponent.jsx
import { useState } from 'react';

export default function MyComponent({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center border-b">
        <button onClick={onBack}>Back</button>
        <h1 className="text-lg font-bold ml-4">My Component</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <p>Your content here</p>
      </div>
    </div>
  );
}
```

2. Add to App.jsx if it's a screen:

```jsx
// Add lazy import
const MyComponent = lazy(() => import('./components/MyComponent'));

// Add to renderScreen switch
case 'my-component':
  return <MyComponent onBack={() => setCurrentScreen('main')} />;
```

### Working with the Database

```jsx
import {
  createBooking,
  getCustomerBookings,
  updateBooking
} from './storage/helpers';

// Create
const newBooking = await createBooking(customerId, {
  houseId: 'house-123',
  serviceTypeId: 'standard-clean',
  dates: ['2026-02-15']
});

// Read
const bookings = await getCustomerBookings(customerId);

// Update
await updateBooking(bookingId, { status: 'confirmed' });
```

### Handling Forms

```jsx
function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Process form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg"
        placeholder="Name"
      />
      <button
        type="submit"
        className="w-full bg-teal-500 text-white p-3 rounded-lg mt-4"
      >
        Submit
      </button>
    </form>
  );
}
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

- Write code
- Test in browser
- Check console for errors

### 3. Commit Changes

```bash
git add .
git commit -m "Add my feature"
```

### 4. Push and Create PR

```bash
git push origin feature/my-feature
```

## Debugging Tips

### Console Logging

```jsx
console.log('Debug:', variable);
```

### React DevTools

Install the React DevTools browser extension to inspect:
- Component hierarchy
- Props and state
- Context values

### Network Tab

Use browser DevTools Network tab to inspect:
- API calls (when backend is connected)
- IndexedDB operations

### Common Issues

**1. Component not rendering?**
- Check if it's added to the switch statement in App.jsx
- Verify the currentScreen value

**2. Data not loading?**
- Check IndexedDB in DevTools > Application > IndexedDB
- Verify the collection name

**3. Styles not applying?**
- Ensure Tailwind classes are correct
- Check for typos in class names

## Getting Help

1. Check existing documentation in `/docs`
2. Read component comments and JSDoc
3. Search codebase for similar patterns
4. Ask team members

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Read [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) for component reference
3. Explore the codebase by following user flows
4. Try making small changes to understand the patterns

Good luck! Welcome to the team!
