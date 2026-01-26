import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import EmailVerification from './components/EmailVerification';
import ProfileSetup from './components/ProfileSetup';
import HouseManagement from './components/HouseManagement';
import BookingFlow from './components/BookingFlowNew';
import CleanerOnboarding from './components/CleanerOnboarding';
import JobOffers from './components/JobOffers';
import JobExecution from './components/JobExecution';
import PayoutManagement from './components/PayoutManagement';
import TippingScreen from './components/TippingScreen';
import LiveTracking from './components/LiveTracking';
import BookingsList from './components/MyBookings';
import PaymentMethods from './components/PaymentMethods';
import HelpCenter from './components/HelpCenter';
import TermsPrivacy from './components/TermsPrivacy';
// New cleaner enhancement components
import CleanerSchedule from './components/CleanerSchedule';
import CleanerNotifications from './components/CleanerNotifications';
import CustomerNotifications from './components/CustomerNotifications';
import CustomerMessaging from './components/CustomerMessaging';
import CleanerRatings from './components/CleanerRatings';
import CleanerMessaging from './components/CleanerMessaging';
import EarningsDashboard from './components/EarningsDashboard';
import ShiftManagement from './components/ShiftManagement';
import CleanerProfileEnhanced from './components/CleanerProfileEnhanced';
import {
  BottomNavigation,
  CustomerHome,
  CleanerHome,
  ProfileScreen,
  BecomeCleanerScreen
} from './components/Screens';
import { initDB, initializeDatabase } from './storage';
import { seedAllData, getSeedingStats } from './storage/seedData';
import { migrateUserData } from './storage/migration';
import './index.css';

// Main app component with all navigation logic
function AppContent() {
  const {
    user,
    isAuthenticated,
    selectedRole,
    logout,
    getUserHouses
  } = useApp();

  // App state
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');

  // Auto-initialize database and seed data on first load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing GoSwish app...');

        // Initialize database
        await initDB();
        await initializeDatabase();
        await migrateUserData();
        console.log('✅ Database initialized');

        // Check if we need to seed data
        const stats = await getSeedingStats();

        if (stats.total.users === 0) {
          console.log('🌱 No users found, seeding test data...');
          console.log('⏳ Creating 30 customers and 30 cleaners...');

          const result = await seedAllData();

          if (result.success) {
            console.log('✅ Test data created successfully!');
            console.log(`   Customers: ${result.customers.length}`);
            console.log(`   Cleaners: ${result.cleaners.length}`);
            console.log('');
            console.log('🔑 You can now login with:');
            console.log('   customer1@goswish.com / Customer123!');
            console.log('   cleaner1@goswish.com / Cleaner123!');
          }
        } else {
          console.log(`✅ Database ready with ${stats.total.users} users`);
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Determine initial screen after splash
  useEffect(() => {
    if (!showSplash) {
      if (!isAuthenticated) {
        setCurrentScreen('welcome');
      } else if (!user?.emailVerified) {
        setCurrentScreen('email-verification');
      } else if (!user?.name) {
        setCurrentScreen('profile-setup');
      } else {
        setCurrentScreen('main');
        setActiveTab('home');
      }
    }
  }, [showSplash, isAuthenticated, user, selectedRole]);

  // Handle splash complete
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Handle role selection
  const handleRoleSelected = (role) => {
    setCurrentScreen('auth');
  };

  // Handle auth success
  const handleAuthSuccess = (user) => {
    if (!user.emailVerified) {
      setCurrentScreen('email-verification');
    } else if (!user.name) {
      setCurrentScreen('profile-setup');
    } else {
      setCurrentScreen('main');
      setActiveTab('home');
    }
  };

  // Handle email verification
  const handleEmailVerified = () => {
    if (!user?.name) {
      setCurrentScreen('profile-setup');
    } else {
      setCurrentScreen('main');
      setActiveTab(selectedRole === 'customer' ? 'home' : 'jobs');
    }
  };

  // Handle profile setup complete
  const handleProfileComplete = async () => {
    const houses = await getUserHouses();
    if (selectedRole === 'customer' && houses.length === 0) {
      setCurrentScreen('add-first-house');
    } else {
      setCurrentScreen('main');
      setActiveTab(selectedRole === 'customer' ? 'home' : 'jobs');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentScreen('role-selection');
    setActiveTab('home');
  };

  // Navigation helpers
  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (currentScreen === 'add-first-house') {
      // Allow skipping property addition - go to main home
      setCurrentScreen('main');
      setActiveTab('home');
    } else if (currentScreen === 'booking') {
      setCurrentScreen('main');
      setActiveTab('home');
    } else if (currentScreen === 'houses') {
      setCurrentScreen('main');
      setActiveTab('home');
    } else if (currentScreen === 'become-cleaner') {
      setCurrentScreen('main');
      setActiveTab('home');
    } else {
      setCurrentScreen('main');
      setActiveTab('home');
    }
  };

  // Render screens
  const renderScreen = () => {
    // Splash screen
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }

    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onSuccess={handleAuthSuccess} />;



      case 'email-verification':
        return (
          <EmailVerification
            onVerified={handleEmailVerified}
          />
        );

      case 'profile-setup':
        return (
          <ProfileSetup
            onComplete={handleProfileComplete}
          />
        );

      case 'edit-profile':
        return (
          <ProfileSetup
            isEditing={true}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
            onComplete={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'payment-methods':
        return (
          <PaymentMethods
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'help-center':
        return (
          <HelpCenter
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'terms-privacy':
        return (
          <TermsPrivacy
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'add-first-house':
        return (
          <HouseManagement
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home');
            }}
          />
        );

      case 'booking':
        return (
          <BookingFlow
            onBack={goBack}
            onComplete={() => {
              setCurrentScreen('main');
              setActiveTab('bookings');
            }}
          />
        );

      case 'houses':
        return (
          <HouseManagement
            onBack={goBack}
          />
        );

      case 'become-cleaner':
        return (
          <BecomeCleanerScreen
            onBack={goBack}
            onSubmit={() => {
              setCurrentScreen('main');
              setActiveTab('home');
            }}
          />
        );

      case 'cleaner-onboarding':
        return (
          <CleanerOnboarding
            onComplete={() => {
              setCurrentScreen('main');
              setActiveTab('jobs');
            }}
          />
        );

      // Cleaner enhancement screens
      case 'payout-management':
        return (
          <PayoutManagement
            cleaner={user}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('earnings');
            }}
          />
        );

      case 'customer-messaging':
        return (
          <CustomerMessaging
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home'); // or profile?
            }}
          />
        );

      case 'customer-notifications':
        return (
          <CustomerNotifications
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home');
            }}
            onViewBooking={(bookingId) => {
              // We could navigate to specific booking details if we had a screen for it
              // For now, go to bookings list
              setActiveTab('bookings');
              setCurrentScreen('main');
            }}
          />
        );

      case 'cleaner-notifications':
        return (
          <CleanerNotifications
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('jobs');
            }}
            onViewJob={(data) => {
              console.log('View job from notification:', data);
            }}
            onViewMessage={(data) => {
              setCurrentScreen('cleaner-messaging');
            }}
            onViewReview={(data) => {
              setCurrentScreen('cleaner-ratings');
            }}
          />
        );

      case 'cleaner-messaging':
        return (
          <CleanerMessaging
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('jobs');
            }}
          />
        );

      case 'cleaner-ratings':
        return (
          <CleanerRatings
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'cleaner-profile-enhanced':
        return (
          <CleanerProfileEnhanced
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
            onEdit={() => {
              setCurrentScreen('edit-profile');
            }}
          />
        );

      case 'shift-management':
        return (
          <ShiftManagement
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('schedule'); // Note: 'schedule' is the correct tab for cleaner schedule
            }}
          />
        );

      case 'main':
      default:
        return renderMainContent();
    }
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    const isCustomer = selectedRole === 'customer';

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Tab content */}
        {isCustomer ? (
          // Customer tabs
          <>
            {activeTab === 'home' && (
              <CustomerHome
                onNewBooking={() => navigateTo('booking')}
                onViewHouses={() => navigateTo('houses')}
                onViewBookings={() => setActiveTab('bookings')}
                onNotifications={() => setCurrentScreen('customer-notifications')}
              />
            )}
            {activeTab === 'houses' && (
              <div className="h-[calc(100vh-80px)] bg-gray-50 flex flex-col">
                <div className="app-bar flex-none z-10 sticky top-0">
                  <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">My Properties</h1>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                  <HouseListInline
                    onAddHouse={() => navigateTo('houses')}
                    onEditHouse={() => navigateTo('houses')}
                  />
                </div>
              </div>
            )}
            {activeTab === 'bookings' && <BookingsList />}
            {activeTab === 'profile' && (
              <ProfileScreen
                onLogout={handleLogout}
                onBecomeCleanerClick={() => navigateTo('become-cleaner')}
                onEditProfile={() => setCurrentScreen('edit-profile')}
                onPaymentMethods={() => setCurrentScreen('payment-methods')}
                onHelpCenter={() => setCurrentScreen('help-center')}
                onTermsPrivacy={() => setCurrentScreen('terms-privacy')}
                onNotifications={() => setCurrentScreen('customer-notifications')}
                onMessaging={() => setCurrentScreen('customer-messaging')}
              />
            )}
          </>
        ) : (
          // Cleaner tabs
          <>
            {activeTab === 'home' && (
              <CleanerHome
                onNotifications={() => setCurrentScreen('cleaner-notifications')}
                onMessaging={() => setCurrentScreen('cleaner-messaging')}
                onRatings={() => setCurrentScreen('cleaner-ratings')}
                onViewJobs={() => setActiveTab('jobs')}
              />
            )}
            {activeTab === 'jobs' && <JobOffers />}
            {activeTab === 'schedule' && (
              <CleanerSchedule
                onViewJob={(job) => {
                  console.log('View job:', job);
                }}
                onStartJob={(job) => {
                  console.log('Start job:', job);
                }}
                onManageAvailability={() => setCurrentScreen('shift-management')}
                onMessaging={() => setCurrentScreen('cleaner-messaging')}
              />
            )}
            {activeTab === 'earnings' && (
              <EarningsDashboard
                onBack={() => setActiveTab('jobs')}
                onViewPayouts={() => setCurrentScreen('payout-management')}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                onLogout={handleLogout}
                onEditProfile={() => setCurrentScreen('edit-profile')}
                onPaymentMethods={() => setCurrentScreen('payment-methods')}
                onHelpCenter={() => setCurrentScreen('help-center')}
                onTermsPrivacy={() => setCurrentScreen('terms-privacy')}
                onNotifications={() => setCurrentScreen('cleaner-notifications')}
                onMessaging={() => setCurrentScreen('cleaner-messaging')}
              />
            )}
          </>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role={selectedRole}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderScreen()}
    </div>
  );
}

// Inline house list for tab
function HouseListInline({ onAddHouse, onEditHouse }) {
  const { getUserHouses, setDefaultHouse, deleteHouse } = useApp();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    async function loadHouses() {
      try {
        const housesData = await getUserHouses();
        setHouses(housesData || []);
      } catch (error) {
        console.error('Error loading houses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHouses();
  }, [getUserHouses]);

  const handleSetDefault = async (houseId, e) => {
    e.stopPropagation();
    await setDefaultHouse(houseId);
    // Reload houses to reflect the change
    const housesData = await getUserHouses();
    setHouses(housesData || []);
  };

  const handleDelete = async (houseId) => {
    await deleteHouse(houseId);
    setConfirmDelete(null);
    // Reload houses after deletion
    const housesData = await getUserHouses();
    setHouses(housesData || []);
  };

  if (houses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">No Properties Yet</h3>
        <p className="text-gray-500 text-sm mb-4">Add your first property to get started</p>
        <button onClick={onAddHouse} className="btn btn-primary">
          Add Property
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {houses.map((house) => (
        <div
          key={house.id}
          className="card relative"
        >
          {/* Default star */}
          <button
            onClick={(e) => handleSetDefault(house.id, e)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors
              ${house.isDefault ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <svg
              className={`w-5 h-5 ${house.isDefault ? 'fill-current' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏠</span>
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{house.name}</h3>
                {house.isDefault && (
                  <span className="badge badge-primary text-xs">Default</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{house.address.street}</p>
              <p className="text-sm text-gray-400">
                {house.address.city}, {house.address.state} {house.address.zip}
              </p>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{house.sqft.toLocaleString()} sqft</span>
                <span>{house.bedrooms} bed</span>
                <span>{house.bathrooms} bath</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onEditHouse(house)}
              className="btn btn-ghost flex-1 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(house.id)}
              className="btn btn-ghost flex-1 text-sm text-error-500 hover:bg-error-50"
            >
              Delete
            </button>
          </div>

          {/* Delete confirmation overlay */}
          {confirmDelete === house.id && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl 
                            flex flex-col items-center justify-center p-6 animate-fade-in z-10">
              <p className="text-center font-medium text-gray-900 mb-4">
                Delete "{house.name}"?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn btn-ghost px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(house.id)}
                  className="btn bg-error-500 text-white hover:bg-error-600 px-6"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {houses.length < 20 && (
        <button
          onClick={onAddHouse}
          className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl
                     flex items-center justify-center gap-2 text-gray-500
                     hover:border-primary-300 hover:text-primary-500 transition-colors"
        >
          <span className="text-xl">+</span>
          Add Another Property
        </button>
      )}
    </div>
  );
}

// Root App with Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
