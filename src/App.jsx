import { useState, useEffect, lazy, Suspense } from 'react';
/**
 * ============================================================================
 * ROOT APPLICATION COMPONENT
 * ============================================================================
 *
 * Purpose:
 * This is the root of the React application. It handles:
 * 1. Global Providers (AppProvider)
 * 2. Initialization (Database seeding, migration)
 * 3. Top-Level Navigation
 *
 * NAVIGATIONAL PATTERN:
 * We use a "State Machine" approach for navigation (`currentScreen`) rather
 * than a URL-based router (like react-router). This mimics a Mobile App structure
 * where screens are stacked or replaced.
 *
 * Flow:
 * Splash -> (Check Auth) -> Welcome/Auth OR Main Dashboard
 *
 * PERFORMANCE:
 * Secondary screens are lazy-loaded using React.lazy() for code splitting.
 * This improves initial load time by only loading critical path components upfront.
 */
import { AppProvider, useApp } from './context/AppContext';

// Critical path components - loaded immediately
import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';
import {
  BottomNavigation,
  CustomerHome,
  CleanerHome,
  ProfileScreen,
  BecomeCleanerScreen
} from './components/Screens';
import { initDB, initializeDatabase, updatePlatformFee } from './storage';
import { seedAllData, getSeedingStats, createAdminUser } from './storage/seedData';
import { migrateUserData } from './storage/migration';
import './index.css';

// Lazy-loaded components for code splitting
// These are loaded on-demand when the user navigates to the respective screen
const EmailVerification = lazy(() => import('./components/EmailVerification'));
const ProfileSetup = lazy(() => import('./components/ProfileSetup'));
const HouseManagement = lazy(() => import('./components/HouseManagement'));
const BookingFlow = lazy(() => import('./components/BookingFlowNew'));
const CleanerOnboarding = lazy(() => import('./components/CleanerOnboarding'));
const JobOffers = lazy(() => import('./components/JobOffers'));
const JobExecution = lazy(() => import('./components/JobExecution'));
const PayoutManagement = lazy(() => import('./components/PayoutManagement'));
const BookingsList = lazy(() => import('./components/MyBookings'));
const BookingDetails = lazy(() => import('./components/BookingDetails'));
const PaymentMethods = lazy(() => import('./components/PaymentMethods'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const TermsPrivacy = lazy(() => import('./components/TermsPrivacy'));
const CleanerSchedule = lazy(() => import('./components/CleanerSchedule'));
const CleanerNotifications = lazy(() => import('./components/CleanerNotifications'));
const CustomerNotifications = lazy(() => import('./components/CustomerNotifications'));
const CustomerMessaging = lazy(() => import('./components/CustomerMessaging'));
const CustomerActiveJob = lazy(() => import('./components/CustomerActiveJob'));
const CleanerRatings = lazy(() => import('./components/CleanerRatings'));
const CleanerMessaging = lazy(() => import('./components/CleanerMessaging'));
const EarningsDashboard = lazy(() => import('./components/EarningsDashboard'));
const ShiftManagement = lazy(() => import('./components/ShiftManagement'));
const CleanerProfileEnhanced = lazy(() => import('./components/CleanerProfileEnhanced'));
const BankInformation = lazy(() => import('./components/BankInformation'));
const NotificationPreferences = lazy(() => import('./components/NotificationPreferences'));
const UpcomingJobs = lazy(() => import('./components/UpcomingJobs'));
const JobDetails = lazy(() => import('./components/JobDetails'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const NotificationTest = lazy(() => import('./components/NotificationTest'));
const TopCleaners = lazy(() => import('./components/TopCleaners'));

/**
 * Loading fallback component for Suspense
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Main app component with all navigation logic
function AppContent() {
  const {
    user,
    isAuthenticated,
    selectedRole,
    setRole, // Needed to sync role on login
    logout,
    getUserHouses
  } = useApp();

  // App state
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [jobDetailsBackScreen, setJobDetailsBackScreen] = useState(null);
  const [executingJob, setExecutingJob] = useState(null); // { screen: 'string', tab?: 'string' }
  const [activeJobBooking, setActiveJobBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [navigationParams, setNavigationParams] = useState({});

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

        // Ensure Admin User exists
        await createAdminUser();

        // Ensure platform fee is set to 10% (cleaner earns 90%)
        await updatePlatformFee(10);

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
            console.log('   homeowner1@goswish.com / HomeOwner123!');
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
      } else {
        if (user?.email === 'admin@goswish.com' || user?.role === 'admin') {
          setCurrentScreen('admin-dashboard');
        } else {
          setCurrentScreen('main');
          setActiveTab('home');
        }
      }
    }
  }, [showSplash, isAuthenticated, selectedRole]);

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen, activeTab, activeJobBooking]);

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
    if (user.email === 'admin@goswish.com' || user.role === 'admin') {
      setCurrentScreen('admin-dashboard');
    } else {
      setRole(user.role); // Ensure context role matches user role
      setCurrentScreen('main');
      setActiveTab('home'); // Everyone goes to home by default
    }
  };

  // Handle email verification
  const handleEmailVerified = () => {
    setCurrentScreen('main');
    setActiveTab('home');
  };

  // Handle profile setup complete
  const handleProfileComplete = async () => {
    const houses = await getUserHouses();
    if (selectedRole === 'homeowner' && houses.length === 0) {
      setCurrentScreen('add-first-house');
    } else {
      setCurrentScreen('main');
      setActiveTab(selectedRole === 'homeowner' ? 'home' : 'jobs');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentScreen('welcome');
    setActiveTab('home');
  };

  // Navigation helpers
  const navigateTo = (screen, params = {}) => {
    console.log(`NavigateTo: ${screen}`, params);
    setNavigationParams(params);
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

  // Render main content based on active tab
  const renderMainContent = () => {
    // If we're supposedly authenticated but user object isn't there yet, wait for it
    if (isAuthenticated && !user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium tracking-wide">Syncing account...</p>
          </div>
        </div>
      );
    }

    // Admin Check
    if (user?.role === 'admin' || user?.email === 'admin@goswish.com') {
      return <AdminDashboard onLogout={handleLogout} />;
    }

    // Customer Active Job
    if (activeJobBooking) {
      return (
        <CustomerActiveJob
          booking={activeJobBooking}
          onBack={() => setActiveJobBooking(null)}
          onComplete={() => {
            setActiveJobBooking(null);
            setActiveTab('bookings');
          }}
        />
      );
    }

    const currentRole = selectedRole || user?.primaryRole || user?.role;
    const isCustomer = currentRole === 'homeowner';

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
                onViewBooking={(booking) => {
                  setSelectedBooking(booking);
                  setCurrentScreen('booking-details');
                }}
                navigateTo={navigateTo}
              />
            )}
            {activeTab === 'houses' && (
              <HouseManagement onBack={() => setActiveTab('home')} navigateTo={navigateTo} />
            )}
            {activeTab === 'bookings' && (
              <BookingsList
                onTrackJob={setActiveJobBooking}
                onViewTopCleaners={() => setCurrentScreen('top-cleaners')}
                onMessaging={() => setCurrentScreen('customer-messaging')}
                onViewBooking={(booking) => {
                  setSelectedBooking(booking);
                  setCurrentScreen('booking-details');
                }}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                onLogout={handleLogout}
                onBecomeCleanerClick={() => navigateTo('become-cleaner')}
                onEditProfile={() => setCurrentScreen('edit-profile')}
                onPaymentMethods={() => setCurrentScreen('payment-methods')}
                onHelpCenter={() => setCurrentScreen('help-center')}
                onTermsPrivacy={() => setCurrentScreen('terms-privacy')}
                onNotifications={() => setCurrentScreen('notification-preferences')}
                onMessaging={() => setCurrentScreen('customer-messaging')}
                onViewBookings={() => setActiveTab('bookings')}
                onViewHouses={() => setActiveTab('houses')}
              />
            )}
          </>
        ) : (
          // Cleaner tabs
          <>
            {activeTab === 'home' && (
              <CleanerHome
                onNotifications={() => setCurrentScreen('cleaner-notifications')}
                onMessaging={(params) => navigateTo('cleaner-messaging', params || {})}
                onRatings={() => setCurrentScreen('cleaner-ratings')}
                onViewJobs={() => setActiveTab('jobs')}
                onViewUpcoming={() => setCurrentScreen('upcoming-jobs')} // Navigate to new Upcoming Jobs list
                onViewEarnings={() => setActiveTab('earnings')}
                onViewHistory={() => setActiveTab('earnings')}
                onViewJob={(job) => {
                  setSelectedJobDetail(job);
                  setJobDetailsBackScreen({ screen: 'main', tab: 'home' });
                  setCurrentScreen('job-details');
                }}
              />
            )}
            {activeTab === 'jobs' && <JobOffers onViewUpcomingJob={(job) => {
              console.log('View upcoming job:', job);
              setSelectedJobDetail(job);
              setJobDetailsBackScreen({ screen: 'main', tab: 'jobs' });
              setCurrentScreen('job-details');
            }} />}
            {activeTab === 'schedule' && (
              <CleanerSchedule
                onViewJob={(job) => {
                  console.log('View job:', job);
                  setSelectedJobDetail(job);
                  setJobDetailsBackScreen({ screen: 'main', tab: 'schedule' });
                  setCurrentScreen('job-details');
                }}
                onStartJob={(job) => {
                  console.log('Start job:', job);
                  setExecutingJob(job);
                  setCurrentScreen('job-execution');
                }}
                onManageAvailability={() => setCurrentScreen('shift-management')}
                onMessaging={(params) => navigateTo('cleaner-messaging', params || {})}
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
                onBankInfo={() => setCurrentScreen('bank-information')}
                onHelpCenter={() => setCurrentScreen('help-center')}
                onTermsPrivacy={() => setCurrentScreen('terms-privacy')}
                onNotifications={() => setCurrentScreen('notification-preferences')}
                onMessaging={() => setCurrentScreen('cleaner-messaging')}
                onViewRatings={() => setCurrentScreen('cleaner-ratings')}
                onViewEarnings={() => setActiveTab('earnings')}
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

  // Render screens
  const renderScreen = () => {
    // Splash screen
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }

    switch (currentScreen) {
      case 'admin-dashboard':
        return <AdminDashboard onLogout={handleLogout} />;

      case 'role-selection':
        return (
          <WelcomeScreen
            onSuccess={handleAuthSuccess}
            initialMode="welcome"
          />
        );

      case 'welcome':
        return <WelcomeScreen onSuccess={handleAuthSuccess} />;

      case 'auth':
        return (
          <WelcomeScreen
            onSuccess={handleAuthSuccess}
            initialMode="login"
          />
        );



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

      case 'notification-test':
        return (
          <NotificationTest />
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
            onRunTest={() => setCurrentScreen('notification-test')}
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
            navigateTo={navigateTo}
          />
        );

      case 'booking':
        return (
          <BookingFlow
            initialHouseId={navigationParams?.houseId}
            onBack={goBack}
            onComplete={() => {
              setCurrentScreen('main');
              setActiveTab('bookings');
              setNavigationParams({});
            }}
          />
        );

      case 'houses':
        return (
          <HouseManagement
            onBack={goBack}
            navigateTo={navigateTo}
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

      case 'upcoming-jobs':
        return (
          <UpcomingJobs
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home');
            }}
            onViewJob={(job) => {
              console.log('View job', job);
              setSelectedJobDetail(job);
              setJobDetailsBackScreen({ screen: 'upcoming-jobs' });
              setCurrentScreen('job-details');
            }}
          />
        );

      case 'job-details':
        return (
          <JobDetails
            job={selectedJobDetail}
            onBack={() => {
              // Navigate back to origin
              if (jobDetailsBackScreen) {
                if (jobDetailsBackScreen.tab) {
                  setActiveTab(jobDetailsBackScreen.tab);
                }
                setCurrentScreen(jobDetailsBackScreen.screen);
              } else {
                // Default fallback
                setCurrentScreen('upcoming-jobs');
              }
            }}
            onMessaging={() => setCurrentScreen('cleaner-messaging')}
            onStartJob={(job) => {
              // Handle starting job (navigate to active job flow)
              console.log('Start job', job);
              setExecutingJob(job);
              setCurrentScreen('job-execution');
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
            initialBookingId={navigationParams?.bookingId}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home');
              setNavigationParams({});
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
            initialBookingId={navigationParams?.bookingId}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('jobs');
              setNavigationParams({});
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

      case 'bank-information':
        return (
          <BankInformation
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );
      case 'notification-preferences':
        return (
          <NotificationPreferences
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('profile');
            }}
          />
        );

      case 'top-cleaners':
        return (
          <TopCleaners
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('bookings');
            }}
          />
        );

      case 'booking-details':
        return (
          <BookingDetails
            booking={selectedBooking}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('home');
            }}
            onMessage={(booking) => {
              setCurrentScreen('customer-messaging');
            }}
            onTrack={(booking) => {
              setActiveJobBooking(booking);
              setCurrentScreen('main');
            }}
          />
        );

      case 'job-execution':
        return (
          <JobExecution
            job={executingJob}
            onBack={() => {
              setCurrentScreen('main');
              setActiveTab('schedule');
            }}
            onComplete={() => {
              setExecutingJob(null);
              setCurrentScreen('main');
              setActiveTab('schedule');
            }}
          />
        );

      case 'main':
      default:
        return renderMainContent();
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingFallback />}>
        {renderScreen()}
      </Suspense>
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
