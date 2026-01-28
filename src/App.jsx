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
import CustomerActiveJob from './components/CustomerActiveJob';
import CleanerRatings from './components/CleanerRatings';
import CleanerMessaging from './components/CleanerMessaging';
import RoleSelection from './components/RoleSelection';
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
import AdminDashboard from './admin/AdminDashboard';
import NotificationTest from './components/NotificationTest';
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
  const [activeJobBooking, setActiveJobBooking] = useState(null);
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

  // Render screens
  const renderScreen = () => {
    // Splash screen
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }

    switch (currentScreen) {
      case 'role-selection':
        return (
          <RoleSelection
            onRoleSelect={(role) => {
              // We need to update role in context maybe? 
              // Or usually RoleSelection navigates to AuthScreen
              // Let's assume RoleSelection passes the role to a callback
              // that sets role and goes to auth.
              handleRoleSelected(role);
            }}
            onLogin={() => setCurrentScreen('auth')}
          />
        );

      case 'welcome':
        return <WelcomeScreen onSuccess={handleAuthSuccess} />;

      case 'auth':
        return (
          <AuthScreen
            onSuccess={handleAuthSuccess}
            onBack={() => setCurrentScreen('welcome')}
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
    // Admin Check
    if (user?.role === 'admin') {
      return <AdminDashboard />;
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
              <HouseManagement onBack={() => setActiveTab('home')} navigateTo={navigateTo} />
            )}
            {activeTab === 'bookings' && (
              <BookingsList onTrackJob={setActiveJobBooking} />
            )}
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
                onViewEarnings={() => setActiveTab('earnings')}
                onViewHistory={() => setActiveTab('earnings')}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {renderScreen()}
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
