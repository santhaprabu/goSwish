import React from 'react';
import { ChevronLeft, Check, Play, Clock, User, MessageSquare, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function JobDetails({ job, onBack, onStartJob, onMessaging }) {
    const { startChat } = useApp();

    if (!job) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-success-100 text-success-700 border-success-200';
            case 'in_progress': return 'bg-secondary-100 text-secondary-700 border-secondary-200';
            case 'scheduled': return 'bg-primary-100 text-primary-700 border-primary-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleMessageCustomer = async () => {
        if (!job.customerId) return;
        try {
            await startChat(job.customerId);
            onMessaging?.();
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    // Helper to insure we have displayable values
    const earningsDisplay = job.displayEarnings || (typeof job.earnings === 'number' ? job.earnings.toFixed(2) : job.earnings);
    const dateDisplay = job.formattedDate || new Date(job.date || job.scheduledDate).toLocaleDateString();
    const timeDisplay = job.timeRange || `${job.startTime} - ${job.endTime}`;
    const serviceTypeDisplay = (job.serviceType || 'Cleaning').replace('-', ' ');

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 ml-2">Job Details</h1>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6 max-w-md mx-auto">
                {/* Booking Number */}
                {job.bookingId && (
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-900">{job.bookingId}</p>
                    </div>
                )}

                {/* Status Badge */}
                <div className={`card p-4 rounded-xl border ${getStatusColor(job.status)}`}>
                    <div className="flex items-center justify-center gap-2">
                        {job.status === 'completed' && <Check className="w-5 h-5" />}
                        {job.status === 'in_progress' && <Play className="w-5 h-5" />}
                        {job.status === 'scheduled' && <Clock className="w-5 h-5" />}
                        <span className="font-semibold capitalize">
                            {(job.status || 'scheduled').replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Time & Earnings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                            <p className="font-semibold text-gray-900">
                                {dateDisplay}
                            </p>
                            <p className="text-gray-600">
                                {timeDisplay}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Earnings</p>
                            <p className="text-2xl font-bold text-secondary-600">${earningsDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Service Type */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3 capitalize">{serviceTypeDisplay}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Estimated {job.duration || 2} hours</span>
                    </div>
                </div>

                {/* Customer */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{job.customerName || job.customer?.name || 'Customer'}</p>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <span className="text-yellow-500">★</span>
                                    <span>{job.customerRating || job.customer?.rating || '5.0'}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleMessageCustomer}
                            className="p-2 bg-secondary-50 text-secondary-600 rounded-full hover:bg-secondary-100 transition-colors"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Property */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-semibold text-gray-900">Property Details</h3>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">{job.address?.street || job.address || 'Address pending'}</p>
                            <p className="text-sm text-gray-500">
                                {job.address?.city ? `${job.address.city}, ${job.address.state} ${job.address.zip}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                        <div className="text-center">
                            <p className="font-semibold text-gray-900">{job.house?.sqft || job.house?.size || job.sqft || '-'}</p>
                            <p className="text-xs text-gray-500">sqft</p>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-900">{job.house?.bedrooms || job.bedrooms || '-'}</p>
                            <p className="text-xs text-gray-500">bed</p>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-900">{job.house?.bathrooms || job.bathrooms || '-'}</p>
                            <p className="text-xs text-gray-500">bath</p>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-900">{job.house?.hasPets || job.hasPets ? '🐾' : '—'}</p>
                            <p className="text-xs text-gray-500">pets</p>
                        </div>
                    </div>
                </div>

                {/* Additional Instructions / Special Requests */}
                {(job.specialRequests || job.specialNotes || job.notes) && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                        <p className="text-gray-600 text-sm">{job.specialRequests || job.specialNotes || job.notes}</p>
                    </div>
                )}

                {/* Action Button */}
                {job.status === 'scheduled' && (
                    <button
                        onClick={() => {
                            onStartJob?.(job);
                            onBack();
                        }}
                        className="w-full py-4 bg-secondary-600 text-white font-bold rounded-xl shadow-lg shadow-secondary-200 hover:bg-secondary-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        Start This Job
                    </button>
                )}

                {job.status === 'in_progress' && (
                    <button
                        onClick={() => {
                            // Navigate to active job execution
                            onStartJob?.(job);
                        }}
                        className="w-full py-4 bg-secondary-600 text-white font-bold rounded-xl shadow-lg shadow-secondary-200 hover:bg-secondary-700 transition-all"
                    >
                        Continue Job
                    </button>
                )}
            </div>
        </div>
    );
}
