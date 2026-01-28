
import { useState } from 'react';
import { Search, ChevronLeft, ChevronDown, ChevronUp, MessageCircle, Mail, Phone, FileText, Sparkles, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Customer-specific FAQs
const CUSTOMER_FAQS = [
    {
        category: 'Booking & Services',
        items: [
            { q: 'How do I book a cleaning?', a: 'You can book a cleaning instantly from the Home tab by clicking "Book a Cleaning". Follow the steps to select your property, service type, and preferred time.' },
            { q: 'What is included in a Regular Clean?', a: 'A Regular Clean includes dusting, vacuuming, mopping floors, cleaning bathrooms (toilets, sinks, showers), and kitchen surfaces. It is perfect for maintaining a tidy home.' },
            { q: 'What is a Deep Clean?', a: 'Deep Clean is thorough and covers everything in a Regular Clean plus baseboards, inside windows, inside cabinets (if empty), and detailed scrubbing of grime. Recommended for first-time cleanings.' },
            { q: 'Are cleaning supplies included?', a: 'Yes! Our cleaners bring all necessary professional-grade supplies and equipment. If you have specific products you want used, please mention it in the special notes.' },
            { q: 'Can I request the same cleaner?', a: 'Yes! After a cleaning is complete, you can "favorite" your cleaner. When booking future cleanings, you can select preferred cleaners from your favorites list.' },
            { q: 'How do I reschedule a booking?', a: 'Go to My Bookings, select the booking you want to change, and tap "Reschedule". You can reschedule for free up to 24 hours before the scheduled time.' },
        ]
    },
    {
        category: 'Payments & Pricing',
        items: [
            { q: 'When am I charged?', a: 'A hold is placed on your card when you book, but you are only charged after the cleaning is successfully completed.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) securely via Stripe.' },
            { q: 'Is there a cancellation fee?', a: 'You can cancel for free up to 24 hours before the scheduled time. Cancellations within 24 hours may incur a $50 fee.' },
            { q: 'How is the price calculated?', a: 'Pricing is based on your home\'s square footage and the type of service selected. Deep cleans and move-in/out cleans are priced higher due to the extra work involved.' },
            { q: 'Can I tip my cleaner?', a: 'Absolutely! After a cleaning is complete, you will be prompted to rate and tip your cleaner. Tips go 100% to the cleaner.' },
        ]
    },
    {
        category: 'My Properties',
        items: [
            { q: 'How do I add a new property?', a: 'Go to the Home tab and tap "My Properties" or the + button. Enter your property details including address, square footage, and any special instructions.' },
            { q: 'Can I have multiple properties?', a: 'Yes! You can add as many properties as you need. Set a default property for quick booking, and switch between properties when needed.' },
            { q: 'How do I update property details?', a: 'Go to My Properties, tap the property you want to update, and tap "Edit". You can update access instructions, square footage, and other details.' },
        ]
    },
    {
        category: 'Safety & Trust',
        items: [
            { q: 'Are the cleaners vetted?', a: 'Absolutely. Every cleaner passes a strict background check, in-person interview, and reference check before joining GoSwish.' },
            { q: 'Do I need to be home?', a: 'No, you do not need to be home as long as you provide entry instructions (e.g., hidden key, keypad code).' },
            { q: 'What if something is damaged?', a: 'GoSwish provides liability coverage for all bookings. If something is damaged, report it within 24 hours and we will work with you to resolve the issue.' },
            { q: 'How do I report an issue?', a: 'You can report issues through the app by going to your booking history, selecting the booking, and tapping "Report Issue". You can also contact support directly.' },
        ]
    }
];

// Cleaner-specific FAQs
const CLEANER_FAQS = [
    {
        category: 'Getting Jobs',
        items: [
            { q: 'How do I get cleaning jobs?', a: 'Jobs appear in your Jobs tab based on your location and availability. You can accept jobs that fit your schedule. The faster you accept, the more jobs you\'ll secure.' },
            { q: 'How does job matching work?', a: 'We match you with nearby jobs based on your service area, availability, ratings, and experience. Higher-rated cleaners often get priority for premium jobs.' },
            { q: 'Can I set my own schedule?', a: 'Yes! Update your availability in the Schedule tab. You can set working hours for each day and block out time for personal appointments.' },
            { q: 'What if I need to cancel a job?', a: 'You can cancel up to 24 hours before the scheduled time without penalty. Canceling within 24 hours may affect your reliability score and could result in a fee.' },
            { q: 'How do I expand my service area?', a: 'Go to Profile > Settings > Service Area to update the zip codes and neighborhoods you serve. A larger service area means more job opportunities!' },
        ]
    },
    {
        category: 'Earnings & Payouts',
        items: [
            { q: 'How much can I earn?', a: 'Earnings depend on job types and hours worked. Regular cleans pay $25-45/hour, while deep cleans can pay $40-60/hour. Top cleaners earn $1,500+ per week!' },
            { q: 'When do I get paid?', a: 'Payouts are processed weekly every Friday. Your earnings from completed jobs (Mon-Sun) will be deposited by the following Wednesday.' },
            { q: 'How do tips work?', a: 'Tips are 100% yours and are added to your weekly payout. Customers can tip after each cleaning through the app.' },
            { q: 'How do I update my bank info?', a: 'Go to Profile > Payout Settings to update your bank account or debit card for direct deposits. Changes take 1-2 business days to process.' },
            { q: 'Why is my payout on hold?', a: 'Payouts may be held if there\'s a customer dispute, incomplete verification, or a pending background check update. Contact support for specific details.' },
        ]
    },
    {
        category: 'During the Job',
        items: [
            { q: 'What supplies do I need?', a: 'You should bring professional-grade cleaning supplies, vacuum, mop, and microfiber cloths. GoSwish provides a supply checklist in your Cleaner Resources.' },
            { q: 'How do I check in/out of a job?', a: 'When you arrive, tap "Start Job" in the app. When finished, complete the checkout checklist and take optional after-photos. Then tap "Complete Job".' },
            { q: 'What if the customer isn\'t home?', a: 'Check the entry instructions in the job details. If you can\'t access the property, contact the customer through in-app messaging. If no response after 15 min, contact support.' },
            { q: 'What if the job is bigger than expected?', a: 'If the property is significantly larger or dirtier than described, you can request an adjustment through the app before starting. Take before-photos as documentation.' },
            { q: 'How do I handle special requests?', a: 'Customer notes are shown in the job details. If a request is beyond scope or requires extra time, communicate with the customer before starting.' },
        ]
    },
    {
        category: 'Ratings & Performance',
        items: [
            { q: 'How do ratings work?', a: 'Customers rate you 1-5 stars after each job. Your overall rating is an average of your last 50 ratings. Maintain 4.5+ to stay in good standing.' },
            { q: 'How can I improve my ratings?', a: 'Arrive on time, communicate proactively, pay attention to details, and follow the service checklist. Before-and-after photos also show customers your great work!' },
            { q: 'What if I get a bad review?', a: 'You can respond to reviews professionally. If you believe a review is unfair, contact support within 48 hours with your side of the story.' },
            { q: 'What happens if my rating drops?', a: 'If your rating falls below 4.0, you may receive fewer job offers. Complete quality training modules to improve. Ratings below 3.5 may result in account review.' },
        ]
    },
    {
        category: 'Account & Support',
        items: [
            { q: 'How do I update my profile?', a: 'Go to Profile to update your photo, bio, services offered, and experience. A complete profile with a professional photo attracts more customers!' },
            { q: 'What if I need time off?', a: 'Use the Schedule tab to block out dates. For extended breaks (1+ weeks), toggle "Pause Jobs" in settings so you won\'t receive new job offers.' },
            { q: 'How do I contact support?', a: 'Tap the Chat button below to message our cleaner support team. We respond within 2 hours during business hours (8am-8pm local time).' },
            { q: 'Is there cleaner insurance?', a: 'GoSwish provides liability coverage while you\'re working on jobs booked through the app. This covers accidental damage but not intentional harm or theft.' },
        ]
    }
];

export default function HelpCenter({ onBack, onRunTest }) {
    const { selectedRole } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const isCleaner = selectedRole === 'cleaner';
    const FAQS = isCleaner ? CLEANER_FAQS : CUSTOMER_FAQS;

    const filteredFaqs = searchQuery
        ? FAQS.map(cat => ({
            ...cat,
            items: cat.items.filter(item =>
                item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.items.length > 0)
        : FAQS;

    const accentColor = isCleaner ? 'secondary' : 'primary';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className={`bg-gradient-to-r ${isCleaner ? 'from-secondary-500 to-secondary-600' : 'from-primary-500 to-primary-600'} text-white`}>
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-lg -ml-2 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold">Help Center</h1>
                        <div className="w-10" />
                    </div>

                    {/* Role indicator */}
                    <div className="flex items-center justify-center gap-2 py-2">
                        {isCleaner ? (
                            <Sparkles className="w-5 h-5" />
                        ) : (
                            <Home className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium opacity-90">
                            {isCleaner ? 'Cleaner Support' : 'Customer Support'}
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative mt-2 pb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={isCleaner ? "Search cleaner help..." : "Search for help..."}
                            className="w-full bg-white rounded-xl py-3 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                {/* Quick Actions */}
                {!searchQuery && (
                    <div className="grid grid-cols-3 gap-3">
                        <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className={`w-10 h-10 ${isCleaner ? 'bg-secondary-50' : 'bg-blue-50'} rounded-full flex items-center justify-center`}>
                                <MessageCircle className={`w-5 h-5 ${isCleaner ? 'text-secondary-600' : 'text-blue-600'}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">Chat</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">Call</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                                <Mail className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">Email</span>
                        </button>
                    </div>
                )}

                {/* Cleaner-specific quick links */}
                {!searchQuery && isCleaner && (
                    <div className="bg-secondary-50 rounded-xl p-4 border border-secondary-100">
                        <h3 className="font-semibold text-secondary-800 mb-2">Quick Resources</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="text-left text-sm text-secondary-700 hover:text-secondary-900 py-1">
                                📋 Cleaning Checklist
                            </button>
                            <button className="text-left text-sm text-secondary-700 hover:text-secondary-900 py-1">
                                💰 Earnings Calculator
                            </button>
                            <button className="text-left text-sm text-secondary-700 hover:text-secondary-900 py-1">
                                📚 Training Videos
                            </button>
                            <button className="text-left text-sm text-secondary-700 hover:text-secondary-900 py-1">
                                🛡️ Safety Guidelines
                            </button>
                        </div>
                    </div>
                )}

                {/* FAQs */}
                <div className="space-y-6">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No results found for "{searchQuery}"
                        </div>
                    ) : (
                        filteredFaqs.map((category) => (
                            <div key={category.category} className="space-y-3">
                                {!searchQuery && (
                                    <h3 className="font-bold text-gray-900 px-1">{category.category}</h3>
                                )}
                                <div className="space-y-2">
                                    {category.items.map((item, idx) => {
                                        const isOpen = expandedQuestion === item.q;
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
                                            >
                                                <button
                                                    onClick={() => setExpandedQuestion(isOpen ? null : item.q)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                                                >
                                                    <span className="font-medium text-gray-800 text-sm">{item.q}</span>
                                                    {isOpen ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                </button>
                                                {isOpen && (
                                                    <div className={`px-4 pb-4 pt-0 text-sm text-gray-600 ${isCleaner ? 'bg-secondary-50/50' : 'bg-primary-50/50'} border-t border-gray-100 p-4`}>
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Links */}
                {!searchQuery && (
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                        <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 text-gray-600">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    {isCleaner ? 'Cleaner Agreement' : 'Terms of Service'}
                                </span>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 text-gray-600">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span className="text-sm font-medium">Privacy Policy</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                        </button>
                        {isCleaner && (
                            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 text-gray-600">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5" />
                                    <span className="text-sm font-medium">Tax Information (1099)</span>
                                </div>
                                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                            </button>
                        )}
                    </div>
                )}

                {onRunTest && (
                    <button
                        onClick={onRunTest}
                        className="w-full mt-2 p-3 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <span>🛠️</span>
                        Test Notification Flow
                    </button>
                )}
            </div>
        </div>
    );
}
