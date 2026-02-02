import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * SPLASH SCREEN
 * ============================================================================
 * 
 * Purpose:
 * The initial branding screen shown on app launch.
 * 
 * Features:
 * - Animated Logo entry.
 * - Rotating value propositions (Trusted, Secure, etc).
 * - Seamless transition to Welcome Screen.
 */

export default function SplashScreen({ onComplete }) {
    const [fadeOut, setFadeOut] = useState(false);
    const [logoVisible, setLogoVisible] = useState(false);
    const [featureIndex, setFeatureIndex] = useState(0);

    const features = [
        "Trusted Professionals",
        "Instant Booking",
        "Secure Payments",
        "100% Satisfaction"
    ];

    useEffect(() => {
        // Trigger logo entry animation
        setTimeout(() => setLogoVisible(true), 100);

        // Feature carousel
        const featureTimer = setInterval(() => {
            setFeatureIndex(prev => (prev + 1) % features.length);
        }, 800);

        // Sequence:
        // 0s: Start
        // 0.1s: Logo fades in/scales up
        // 4s: Begin exit (extended to show features)
        const fadeTimer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 800); // Wait for transition
        }, 4000);

        return () => {
            clearTimeout(fadeTimer);
            clearInterval(featureTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-50 overflow-hidden
            ${fadeOut ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
            style={{ backgroundColor: '#d9d9d9' }}
        >
            {/* Subtle Textured Background - Removed for seamless blend */}
            {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-black/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            </div> */}

            {/* Main Content Container */}
            <div className={`flex flex-col items-center transition-all duration-1000 ease-out transform relative z-10
                ${logoVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            >
                {/* Logo Image */}
                <div className="relative mb-8">
                    <img
                        src="/logo-light.jpg"
                        alt="GoSwish"
                        className="h-32 object-contain"
                    />
                    {/* Glow ring removed for seamless blend */}
                </div>

                {/* Tagline */}
                <p className="text-xl text-gray-800 font-bold tracking-wide animate-fade-in delay-200 mb-6">
                    Clean homes, happy lives
                </p>

                {/* Dynamic Feature Carousel */}
                <div className="h-8 overflow-hidden relative w-64">
                    {features.map((feature, index) => (
                        <p
                            key={index}
                            className={`text-sm font-medium text-gray-500 uppercase tracking-widest transition-all duration-500 absolute w-full text-center top-0
                            ${index === featureIndex
                                    ? 'opacity-100 translate-y-0 transform'
                                    : 'opacity-0 translate-y-4 transform'}`}
                        >
                            • {feature} •
                        </p>
                    ))}
                </div>
            </div>

            {/* Premium Loading Bar */}
            <div className="absolute bottom-20 w-48 h-1 bg-gray-400/30 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full animate-progress-indeterminate" />
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                .animate-progress-indeterminate {
                    animation: progress 1.5s infinite ease-in-out;
                    transform-origin: 0% 50%;
                }
                @keyframes progress {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0%) scaleX(0.5); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
            `}</style>
        </div>
    );
}
