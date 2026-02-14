/**
 * Mopt Booking Page JavaScript
 * Handles form interactions, pricing calculations, and form submission
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        services: {
            regular: { rate: 0.10, name: 'Regular Clean' },
            deep: { rate: 0.15, name: 'Deep Clean' },
            moveinout: { rate: 0.18, name: 'Move In/Out Clean' },
            windows: { rate: 0.08, name: 'Windows Only' }
        },
        addons: {
            oven: { price: 25, type: 'flat', name: 'Inside Oven Deep Clean' },
            fridge: { price: 20, type: 'flat', name: 'Inside Refrigerator' },
            'interior-windows': { price: 0.02, type: 'sqft', name: 'Interior Windows' },
            laundry: { price: 15, type: 'flat', name: 'Laundry Wash & Fold' },
            baseboards: { price: 0.01, type: 'sqft', name: 'Baseboards Wiping' },
            organize: { price: 30, type: 'flat', name: 'Light Organizing' }
        },
        petFee: 10,
        taxRate: 0.0825,
        metroMultipliers: {
            'Dallas': 1.0,
            'Fort Worth': 1.0,
            'Plano': 1.0,
            'Arlington': 1.0,
            'Irving': 1.0,
            'Frisco': 1.05,
            'McKinney': 1.05,
            'Denton': 1.0,
            'Other': 1.0
        },
        timeSlots: {
            morning: '9 AM - 12 PM',
            afternoon: '12 PM - 3 PM',
            evening: '3 PM - 6 PM'
        }
    };

    // ============================================
    // State
    // ============================================
    let state = {
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        selectedDate: null
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        form: document.getElementById('booking-form'),
        sqft: document.getElementById('sqft'),
        bedrooms: document.getElementById('bedrooms'),
        bathrooms: document.getElementById('bathrooms'),
        city: document.getElementById('city'),
        hasPets: document.getElementById('hasPets'),
        petsDetails: document.getElementById('petsDetails'),
        specialNotes: document.getElementById('specialNotes'),
        charCount: document.getElementById('charCount'),
        calendarDays: document.getElementById('calendarDays'),
        currentMonth: document.getElementById('currentMonth'),
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),
        selectedDateInput: document.getElementById('selectedDate'),
        pricingSummary: document.getElementById('pricingSummary'),
        priceBase: document.getElementById('priceBase'),
        pricePetFee: document.getElementById('pricePetFee'),
        petFeeRow: document.getElementById('petFeeRow'),
        priceAddons: document.getElementById('priceAddons'),
        addonsRow: document.getElementById('addonsRow'),
        priceSubtotal: document.getElementById('priceSubtotal'),
        priceTax: document.getElementById('priceTax'),
        priceTotal: document.getElementById('priceTotal'),
        submitBtn: document.getElementById('submitBtn'),
        successSection: document.getElementById('success-section')
    };

    // ============================================
    // Utility Functions
    // ============================================
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }

    function roundUpToNearest(value, nearest) {
        return Math.ceil(value / nearest) * nearest;
    }

    function formatDate(dateStr) {
        const lang = (window.mopt_i18n && window.mopt_i18n.getCurrentLang()) || 'en';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ============================================
    // Counter Inputs
    // ============================================
    function initCounterInputs() {
        document.querySelectorAll('.counter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const target = this.dataset.target;
                const input = document.getElementById(target);
                const currentValue = parseInt(input.value);
                const min = parseInt(input.min);
                const max = parseInt(input.max);

                if (this.classList.contains('minus') && currentValue > min) {
                    input.value = currentValue - 1;
                } else if (this.classList.contains('plus') && currentValue < max) {
                    input.value = currentValue + 1;
                }

                updatePricing();
            });
        });
    }

    // ============================================
    // Pets Toggle
    // ============================================
    function initPetsToggle() {
        elements.hasPets.addEventListener('change', function () {
            if (this.checked) {
                elements.petsDetails.classList.remove('hidden');
            } else {
                elements.petsDetails.classList.add('hidden');
            }
            updatePricing();
        });
    }

    // ============================================
    // Character Count
    // ============================================
    function initCharCount() {
        elements.specialNotes.addEventListener('input', function () {
            elements.charCount.textContent = this.value.length;
        });
    }

    // ============================================
    // Quick Tags
    // ============================================
    function initQuickTags() {
        document.querySelectorAll('.quick-tag').forEach(tag => {
            tag.addEventListener('click', function () {
                const text = this.dataset.text;
                const currentText = elements.specialNotes.value;

                if (currentText && !currentText.endsWith('\n') && !currentText.endsWith(' ')) {
                    elements.specialNotes.value += '\n';
                }

                elements.specialNotes.value += text;
                elements.charCount.textContent = elements.specialNotes.value.length;
            });
        });
    }

    // ============================================
    // Calendar
    // ============================================
    function initCalendar() {
        renderCalendar();

        elements.prevMonth.addEventListener('click', function () {
            state.currentMonth--;
            if (state.currentMonth < 0) {
                state.currentMonth = 11;
                state.currentYear--;
            }
            renderCalendar();
        });

        elements.nextMonth.addEventListener('click', function () {
            state.currentMonth++;
            if (state.currentMonth > 11) {
                state.currentMonth = 0;
                state.currentYear++;
            }
            renderCalendar();
        });
    }

    function renderCalendar() {
        const lang = (window.mopt_i18n && window.mopt_i18n.getCurrentLang()) || 'en';
        const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const monthNames = lang === 'es' ? monthNamesEs : monthNamesEn;

        elements.currentMonth.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;

        const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
        const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(state.currentYear, state.currentMonth, day);
            const dateStr = formatDateForInput(date);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSelected = state.selectedDate === dateStr;

            let classes = 'calendar-day';
            if (isPast) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            html += `<div class="${classes}" data-date="${dateStr}" ${isPast ? '' : 'role="button" tabindex="0"'}>${day}</div>`;
        }

        elements.calendarDays.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', function () {
                selectDate(this.dataset.date);
            });
            dayEl.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectDate(this.dataset.date);
                }
            });
        });
    }

    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function selectDate(dateStr) {
        state.selectedDate = dateStr;
        elements.selectedDateInput.value = dateStr;

        // Update visual selection
        document.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelector(`.calendar-day[data-date="${dateStr}"]`)?.classList.add('selected');
    }

    // ============================================
    // Pricing Calculation
    // ============================================
    function initPricingUpdates() {
        // Listen for changes on all relevant inputs
        elements.sqft.addEventListener('input', updatePricing);
        elements.city.addEventListener('input', updatePricing);

        document.querySelectorAll('input[name="serviceType"]').forEach(radio => {
            radio.addEventListener('change', updatePricing);
        });

        document.querySelectorAll('input[name="addons"]').forEach(checkbox => {
            checkbox.addEventListener('change', updatePricing);
        });
    }

    function updatePricing() {
        const sqft = parseInt(elements.sqft.value) || 0;
        const city = elements.city.value || 'Dallas';
        const hasPets = elements.hasPets.checked;
        const selectedService = document.querySelector('input[name="serviceType"]:checked');
        const selectedAddons = Array.from(document.querySelectorAll('input[name="addons"]:checked')).map(cb => cb.value);

        if (!sqft || !selectedService) {
            resetPricing();
            return;
        }

        const serviceType = selectedService.value;
        const serviceConfig = CONFIG.services[serviceType];
        const metroMultiplier = CONFIG.metroMultipliers[city] || 1.0;

        // Calculate base price
        let basePrice = sqft * serviceConfig.rate * metroMultiplier;
        basePrice = roundUpToNearest(basePrice, 10);

        // Calculate add-ons
        let addonsTotal = 0;
        selectedAddons.forEach(addon => {
            const addonConfig = CONFIG.addons[addon];
            if (addonConfig.type === 'flat') {
                addonsTotal += addonConfig.price;
            } else if (addonConfig.type === 'sqft') {
                addonsTotal += roundUpToNearest(sqft * addonConfig.price, 10);
            }
        });

        // Calculate pet fee
        const petFee = hasPets ? CONFIG.petFee : 0;

        // Calculate totals
        const subtotal = basePrice + addonsTotal + petFee;
        const tax = subtotal * CONFIG.taxRate;
        const total = subtotal + tax;

        // Update UI
        elements.priceBase.textContent = formatCurrency(basePrice);

        if (petFee > 0) {
            elements.petFeeRow.style.display = 'flex';
            elements.pricePetFee.textContent = formatCurrency(petFee);
        } else {
            elements.petFeeRow.style.display = 'none';
        }

        if (addonsTotal > 0) {
            elements.addonsRow.style.display = 'flex';
            elements.priceAddons.textContent = formatCurrency(addonsTotal);
        } else {
            elements.addonsRow.style.display = 'none';
        }

        elements.priceSubtotal.textContent = formatCurrency(subtotal);
        elements.priceTax.textContent = formatCurrency(tax);
        elements.priceTotal.textContent = formatCurrency(total);

        // Update service card prices
        updateServicePrices(sqft, metroMultiplier);
    }

    function resetPricing() {
        elements.priceBase.textContent = '$0.00';
        elements.petFeeRow.style.display = 'none';
        elements.addonsRow.style.display = 'none';
        elements.priceSubtotal.textContent = '$0.00';
        elements.priceTax.textContent = '$0.00';
        elements.priceTotal.textContent = '$0.00';
    }

    function updateServicePrices(sqft, multiplier) {
        if (!sqft) return;

        document.querySelectorAll('.service-price').forEach(priceEl => {
            const rate = parseFloat(priceEl.dataset.rate);
            if (rate) {
                const price = roundUpToNearest(sqft * rate * multiplier, 10);
                priceEl.textContent = formatCurrency(price);
            }
        });
    }

    // ============================================
    // Form Validation & Submission
    // ============================================
    function initFormSubmission() {
        elements.form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validate date selection
            if (!state.selectedDate) {
                alert('Please select a date for your cleaning.');
                return;
            }

            // Validate time slot
            const timeSlot = document.querySelector('input[name="timeSlot"]:checked');
            if (!timeSlot) {
                alert('Please select a time slot.');
                return;
            }

            // Collect form data
            const formData = collectFormData();

            // Show success
            showSuccess(formData);
        });
    }

    function collectFormData() {
        const selectedService = document.querySelector('input[name="serviceType"]:checked');
        const selectedAddons = Array.from(document.querySelectorAll('input[name="addons"]:checked')).map(cb => cb.value);
        const timeSlot = document.querySelector('input[name="timeSlot"]:checked');

        return {
            property: {
                type: document.getElementById('propertyType').value,
                sqft: document.getElementById('sqft').value,
                bedrooms: document.getElementById('bedrooms').value,
                bathrooms: document.getElementById('bathrooms').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipcode: document.getElementById('zipcode').value,
                hasPets: elements.hasPets.checked,
                petNotes: document.getElementById('petNotes').value
            },
            service: {
                type: selectedService.value,
                name: CONFIG.services[selectedService.value].name,
                addons: selectedAddons
            },
            schedule: {
                date: state.selectedDate,
                timeSlot: timeSlot.value,
                timeRange: CONFIG.timeSlots[timeSlot.value]
            },
            contact: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                accessInstructions: document.getElementById('accessInstructions').value
            },
            notes: elements.specialNotes.value,
            pricing: {
                total: elements.priceTotal.textContent
            }
        };
    }

    // Listen for language changes to update localized UI parts
    document.addEventListener('languageChanged', (e) => {
        renderCalendar();
        updatePricing();
    });

    function showSuccess(formData) {
        // Generate booking ID
        const bookingId = 'MOPT-' + Date.now().toString(36).toUpperCase();
        formData.bookingId = bookingId;
        formData.status = 'pending';
        formData.createdAt = new Date().toISOString();

        // Save booking to localStorage
        saveBooking(formData);

        // Hide form
        elements.form.classList.add('hidden');

        // Update success summary
        document.getElementById('summaryService').textContent = formData.service.name;
        document.getElementById('summaryDate').textContent = formatDate(formData.schedule.date);
        document.getElementById('summaryTime').textContent = formData.schedule.timeRange;
        document.getElementById('summaryAddress').textContent = `${formData.property.address}, ${formData.property.city}, ${formData.property.state}`;
        document.getElementById('summaryTotal').textContent = formData.pricing.total;

        // Show success section
        elements.successSection.classList.remove('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Log booking data (in production, send to backend)
        console.log('Booking submitted:', formData);

        // Track analytics if available
        if (typeof gtag === 'function') {
            gtag('event', 'booking_submitted', {
                'service_type': formData.service.type,
                'city': formData.property.city,
                'sqft': formData.property.sqft
            });
        }
    }

    // ============================================
    // Save Booking to localStorage
    // ============================================
    function saveBooking(bookingData) {
        const BOOKINGS_KEY = 'mopt_bookings';
        try {
            const existingBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
            existingBookings.push(bookingData);
            localStorage.setItem(BOOKINGS_KEY, JSON.stringify(existingBookings));
            console.log('Booking saved:', bookingData.bookingId);
        } catch (e) {
            console.error('Failed to save booking:', e);
        }
    }

    // ============================================
    // Phone Formatting
    // ============================================
    function initPhoneFormatting() {
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            if (value.length >= 6) {
                value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
            } else if (value.length >= 3) {
                value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }

            e.target.value = value;
        });
    }

    // ============================================
    // Zip Code Validation
    // ============================================
    function initZipValidation() {
        const zipInput = document.getElementById('zipcode');
        zipInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 5);
        });
    }

    // ============================================
    // Initialize
    // ============================================
    function init() {
        initCounterInputs();
        initPetsToggle();
        initCharCount();
        initQuickTags();
        initCalendar();
        initPricingUpdates();
        initFormSubmission();
        initPhoneFormatting();
        initZipValidation();

        // Initial pricing update
        updatePricing();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
