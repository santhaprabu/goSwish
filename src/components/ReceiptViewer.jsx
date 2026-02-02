import { useState } from 'react';
/*
 * ============================================================================
 * DIGITAL RECEIPT VIEWER
 * ============================================================================
 * 
 * Purpose:
 * Displays a formatted receipt for a completed booking.
 * 
 * Technical:
 * - Generates HTML on the fly for PDF conversion/download.
 * - Breaks down Base Price, Add-ons, Discounts, Tax, and Tips.
 */
import {
    Download, Mail, Share2, ChevronLeft, Check,
    Calendar, MapPin, User, CreditCard
} from 'lucide-react';

// Receipt Viewer - View and download booking receipts
export default function ReceiptViewer({ booking, onBack }) {
    const [emailSent, setEmailSent] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadPDF = () => {
        setDownloading(true);

        // Simulate PDF generation
        setTimeout(() => {
            // In production, this would generate actual PDF
            const receiptData = generateReceiptHTML();
            const blob = new Blob([receiptData], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `GoSwish_Receipt_${booking.bookingId}.html`;
            a.click();
            URL.revokeObjectURL(url);
            setDownloading(false);
        }, 1000);
    };

    const handleEmailReceipt = () => {
        // Simulate email sending
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `GoSwish Receipt - ${booking.bookingId}`,
                text: `Receipt for ${booking.serviceType} cleaning service`,
                url: window.location.href
            });
        }
    };

    const generateReceiptHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GoSwish Receipt - ${booking.bookingId}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: 700; color: #000; }
    .receipt-title { font-size: 24px; font-weight: 600; margin: 20px 0; }
    .receipt-number { color: #666; font-size: 14px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 16px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .label { color: #666; }
    .value { font-weight: 500; }
    .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .pricing-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .pricing-table .label-col { color: #666; }
    .pricing-table .amount-col { text-align: right; font-weight: 500; }
    .total-row { font-size: 18px; font-weight: 700; border-top: 2px solid #000; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GoSwish</div>
    <div class="receipt-title">RECEIPT</div>
    <div class="receipt-number">Receipt #${booking.bookingId}</div>
  </div>

  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="info-row">
      <span class="label">Date of Service</span>
      <span class="value">${new Date(booking.selectedDate?.date || booking.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="info-row">
      <span class="label">Service Type</span>
      <span class="value">${booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1)} Clean</span>
    </div>
    <div class="info-row">
      <span class="label">Property</span>
      <span class="value">${booking.house?.address?.street}, ${booking.house?.address?.city}</span>
    </div>
  </div>

  ${booking.cleaner ? `
  <div class="section">
    <div class="section-title">Cleaner Information</div>
    <div class="info-row">
      <span class="label">Cleaner Name</span>
      <span class="value">${booking.cleaner.name}</span>
    </div>
    <div class="info-row">
      <span class="label">Rating</span>
      <span class="value">${booking.cleaner.rating || 'N/A'} ★</span>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Pricing Breakdown</div>
    <table class="pricing-table">
      <tr>
        <td class="label-col">Base Price (${booking.serviceType || (typeof booking.serviceTypeId === 'string' ? booking.serviceTypeId.replace('-', ' ') : 'cleaning')}, ${booking.house?.sqft} sqft)</td>
        <td class="amount-col">$${(booking.pricingBreakdown?.base || booking.pricingBreakdown?.basePrice || 0).toFixed(2)}</td>
      </tr>
      ${(booking.pricingBreakdown?.addOnDetails || booking.addOns || []).map(addon => {
            const addonPrice = typeof addon === 'object' ? addon.price : 15.00;
            const addonName = typeof addon === 'object' ? addon.name : addon.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `
        <tr>
          <td class="label-col">${addonName}</td>
          <td class="amount-col">$${addonPrice.toFixed(2)}</td>
        </tr>
      `;
        }).join('') || ''}
      <tr>
        <td class="label-col">Subtotal</td>
        <td class="amount-col">$${(booking.pricingBreakdown?.subtotal || 0).toFixed(2)}</td>
      </tr>
      ${(booking.pricingBreakdown?.promoDiscount || booking.pricingBreakdown?.discount) ? `
      <tr>
        <td class="label-col">Promo Code Discount</td>
        <td class="amount-col">-$${(booking.pricingBreakdown?.promoDiscount || booking.pricingBreakdown?.discount).toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr>
        <td class="label-col">Tax (${((booking.pricingBreakdown?.taxRate || 0.0825) * 100).toFixed(1)}%)</td>
        <td class="amount-col">$${(booking.pricingBreakdown?.taxes || booking.pricingBreakdown?.tax || 0).toFixed(2)}</td>
      </tr>
      ${booking.tipAmount ? `
      <tr>
        <td class="label-col">Tip</td>
        <td class="amount-col">$${booking.tipAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr class="total-row">
        <td class="label-col">TOTAL PAID</td>
        <td class="amount-col">$${(booking.pricingBreakdown?.total || booking.totalAmount || 0).toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Payment Information</div>
    <div class="info-row">
      <span class="label">Payment Method</span>
      <span class="value">Visa •••• ${booking.paymentMethod?.last4 || '1234'}</span>
    </div>
    <div class="info-row">
      <span class="label">Transaction ID</span>
      <span class="value">${booking.paymentId || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">Date Charged</span>
      <span class="value">${new Date(booking.createdAt).toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    <p><strong>GoSwish</strong></p>
    <p>support@goswish.com | (555) 123-4567</p>
    <p>www.goswish.com</p>
    <p style="margin-top: 20px;">Thank you for choosing GoSwish!</p>
  </div>
</body>
</html>
    `;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="app-bar bg-white">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="p-2 -ml-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Receipt</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Receipt Content */}
            <div className="px-6 py-6">
                <div className="card p-8 max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">GoSwish</h1>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">RECEIPT</h2>
                        <p className="text-sm text-gray-500">Receipt #{booking.bookingId}</p>
                    </div>

                    {/* Booking Info */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-black">
                            Booking Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date of Service</span>
                                <span className="font-medium">{formatDate(booking.selectedDate?.date || booking.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service Type</span>
                                <span className="font-medium capitalize">{booking.serviceType} Clean</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Property</span>
                                <span className="font-medium text-right">
                                    {booking.house?.address?.street}<br />
                                    {booking.house?.address?.city}, {booking.house?.address?.state}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cleaner Info */}
                    {booking.cleaner && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-black">
                                Cleaner Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cleaner Name</span>
                                    <span className="font-medium">{booking.cleaner.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rating</span>
                                    <span className="font-medium">{booking.cleaner.rating || 'N/A'} ★</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-black">
                            Pricing Breakdown
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Base Price ({(booking.serviceType || booking.serviceTypeId || 'cleaning').replace('-', ' ')} clean, {booking.house?.sqft} sqft)
                                </span>
                                <span className="font-medium">${(booking.pricingBreakdown?.base || booking.pricingBreakdown?.basePrice || 0).toFixed(2)}</span>
                            </div>

                            {(booking.pricingBreakdown?.addOnDetails || booking.addOns || []).map((addon, index) => {
                                const addonPrice = typeof addon === 'object' ? addon.price : 15.00;
                                const addonName = typeof addon === 'object' ? addon.name : addon.replace('-', ' ');
                                return (
                                    <div key={index} className="flex justify-between">
                                        <span className="text-gray-600 capitalize">{addonName}</span>
                                        <span className="font-medium">${addonPrice.toFixed(2)}</span>
                                    </div>
                                );
                            })}

                            <div className="flex justify-between pt-3 border-t border-gray-200">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">${(booking.pricingBreakdown?.subtotal || 0).toFixed(2)}</span>
                            </div>

                            {(booking.pricingBreakdown?.promoDiscount || booking.pricingBreakdown?.discount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Promo Code Discount</span>
                                    <span className="font-medium text-green-600">
                                        -${(booking.pricingBreakdown?.promoDiscount || booking.pricingBreakdown?.discount).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span className="font-medium">${(booking.pricingBreakdown?.taxes || booking.pricingBreakdown?.tax || 0).toFixed(2)}</span>
                            </div>

                            {booking.tipAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tip</span>
                                    <span className="font-medium">${booking.tipAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 border-t-2 border-black text-xl font-bold">
                                <span>TOTAL PAID</span>
                                <span>${(booking.pricingBreakdown?.total || booking.totalAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-black">
                            Payment Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-medium">Visa •••• {booking.paymentMethod?.last4 || '1234'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Transaction ID</span>
                                <span className="font-medium font-mono text-sm">{booking.paymentId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date Charged</span>
                                <span className="font-medium">{new Date(booking.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
                        <p className="font-semibold text-gray-900 mb-2">GoSwish</p>
                        <p>support@goswish.com | (555) 123-4567</p>
                        <p>www.goswish.com</p>
                        <p className="mt-4">Thank you for choosing GoSwish!</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="max-w-2xl mx-auto mt-6 space-y-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="btn btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Download PDF
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleEmailReceipt}
                        className="btn btn-outline w-full py-4 flex items-center justify-center gap-2"
                    >
                        {emailSent ? (
                            <>
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-green-600">Receipt Sent!</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-5 h-5" />
                                Email Receipt
                            </>
                        )}
                    </button>

                    {navigator.share && (
                        <button
                            onClick={handleShare}
                            className="btn btn-ghost w-full py-4 flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
