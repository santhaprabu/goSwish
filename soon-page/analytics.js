/**
 * Mopt Landing Page Analytics
 * Captures visitor data and stores in localStorage
 */

(function() {
    const STORAGE_KEY = 'mopt_analytics';
    const SESSION_KEY = 'mopt_session';

    // Get or create session
    function getSession() {
        let session = sessionStorage.getItem(SESSION_KEY);
        if (!session) {
            session = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(SESSION_KEY, session);
        }
        return session;
    }

    // Get stored analytics data
    function getAnalytics() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
                visits: [],
                submissions: [],
                clicks: [],
                summary: {
                    totalVisits: 0,
                    uniqueVisitors: 0,
                    totalSubmissions: 0,
                    homeownerSubmissions: 0,
                    cleanerSubmissions: 0,
                    stateBreakdown: {},
                    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
                    referrerBreakdown: {},
                    dailyVisits: {}
                }
            };
        } catch (e) {
            return { visits: [], submissions: [], clicks: [], summary: {} };
        }
    }

    // Save analytics data
    function saveAnalytics(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Analytics storage failed:', e);
        }
    }

    // Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Get browser name
    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
        if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        return 'Other';
    }

    // Get OS
    function getOS() {
        const ua = navigator.userAgent;
        if (ua.includes('Win')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        return 'Other';
    }

    // Parse UTM parameters
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source') || null,
            utm_medium: params.get('utm_medium') || null,
            utm_campaign: params.get('utm_campaign') || null,
            utm_term: params.get('utm_term') || null,
            utm_content: params.get('utm_content') || null
        };
    }

    // Get referrer category
    function getReferrerCategory(referrer) {
        if (!referrer) return 'Direct';
        if (referrer.includes('google')) return 'Google';
        if (referrer.includes('facebook') || referrer.includes('fb.')) return 'Facebook';
        if (referrer.includes('instagram')) return 'Instagram';
        if (referrer.includes('twitter') || referrer.includes('x.com')) return 'Twitter/X';
        if (referrer.includes('linkedin')) return 'LinkedIn';
        if (referrer.includes('tiktok')) return 'TikTok';
        return 'Other';
    }

    // Track page visit
    function trackVisit() {
        const analytics = getAnalytics();
        const session = getSession();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const visitData = {
            id: 'visit_' + Date.now(),
            session: session,
            timestamp: now.toISOString(),
            date: today,
            time: now.toLocaleTimeString(),

            // Page info
            page: window.location.pathname,
            referrer: document.referrer || 'Direct',
            referrerCategory: getReferrerCategory(document.referrer),

            // UTM
            utm: getUTMParams(),

            // Device info
            device: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,

            // User preferences
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Engagement (will be updated)
            maxScrollDepth: 0,
            timeOnPage: 0,
            interactions: []
        };

        analytics.visits.push(visitData);

        // Update summary
        analytics.summary.totalVisits++;
        analytics.summary.dailyVisits[today] = (analytics.summary.dailyVisits[today] || 0) + 1;
        analytics.summary.deviceBreakdown[visitData.device]++;
        analytics.summary.referrerBreakdown[visitData.referrerCategory] =
            (analytics.summary.referrerBreakdown[visitData.referrerCategory] || 0) + 1;

        saveAnalytics(analytics);

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                updateVisitData(visitData.id, { maxScrollDepth: maxScroll });
            }
        }, { passive: true });

        // Track time on page
        const startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            updateVisitData(visitData.id, { timeOnPage: timeOnPage });
        });

        return visitData.id;
    }

    // Update visit data
    function updateVisitData(visitId, updates) {
        const analytics = getAnalytics();
        const visit = analytics.visits.find(v => v.id === visitId);
        if (visit) {
            Object.assign(visit, updates);
            saveAnalytics(analytics);
        }
    }

    // Track click event
    function trackClick(element, action) {
        const analytics = getAnalytics();
        const clickData = {
            id: 'click_' + Date.now(),
            session: getSession(),
            timestamp: new Date().toISOString(),
            action: action,
            element: element
        };
        analytics.clicks.push(clickData);
        saveAnalytics(analytics);
    }

    // Track form submission
    function trackSubmission(formData) {
        const analytics = getAnalytics();
        const submissionData = {
            id: 'sub_' + Date.now(),
            session: getSession(),
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            role: formData.role,
            state: formData.state,
            email: formData.email,
            emailDomain: formData.email.split('@')[1] || 'unknown'
        };

        analytics.submissions.push(submissionData);

        // Update summary
        analytics.summary.totalSubmissions++;
        if (formData.role === 'homeowner') {
            analytics.summary.homeownerSubmissions++;
        } else if (formData.role === 'cleaner') {
            analytics.summary.cleanerSubmissions++;
        }
        analytics.summary.stateBreakdown[formData.state] =
            (analytics.summary.stateBreakdown[formData.state] || 0) + 1;

        saveAnalytics(analytics);
    }

    // Initialize tracking
    const currentVisitId = trackVisit();

    // Track CTA button clicks
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button, .btn, .audience-card-compact');
        if (!target) return;

        if (target.id === 'ctaHomeowner') {
            trackClick('ctaHomeowner', 'Homeowner CTA Click');
        } else if (target.id === 'ctaCleaner') {
            trackClick('ctaCleaner', 'Cleaner CTA Click');
        } else if (target.id === 'submit-btn') {
            trackClick('submit-btn', 'Form Submit Click');
        } else if (target.closest('#homeowners')) {
            trackClick('homeowners-card', 'Homeowners Card Click');
        } else if (target.closest('#cleaners')) {
            trackClick('cleaners-card', 'Cleaners Card Click');
        }
    });

    // Track role selection
    document.querySelectorAll('input[name="role"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            trackClick('role-' + this.value, 'Role Selected: ' + this.value);
        });
    });

    // Hook into form submission
    const form = document.getElementById('waitlist-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const role = document.querySelector('input[name="role"]:checked');
            const state = document.getElementById('state');
            const email = document.getElementById('email');

            if (role && state && email) {
                trackSubmission({
                    role: role.value,
                    state: state.value,
                    email: email.value
                });
            }
        });
    }

    // Expose for admin page
    window.MoptAnalytics = {
        getData: getAnalytics,
        clearData: function() {
            localStorage.removeItem(STORAGE_KEY);
        },
        exportData: function() {
            return JSON.stringify(getAnalytics(), null, 2);
        }
    };

})();
