// Translations
const translations = {
    en: {
        title: "Home Cleaning, Reimagined",
        subtitle: "No more phone tag. No more no-shows. No more mystery pricing. Just reliable, professional cleaning at your fingertips.",

        // Homeowner Card
        "homeowner.eyebrow": "For Homeowners",
        "homeowner.title": "Stop wasting weekends on chores.",
        "homeowner.subtitle": "Tired of unreliable cleaners and surprise bills? Book vetted professionals in 60 seconds flat.",
        "homeowner.feature1": "<strong>Instant pricing</strong> - know the cost before you book, always.",
        "homeowner.feature2": "<strong>Flexible scheduling</strong> - book days or weeks ahead, on your timeline.",
        "homeowner.feature3": "<strong>Vetted cleaners</strong> - verified identity, real reviews, full coverage.",
        "homeowner.feature4": "<strong>Safe & connected</strong> - dual code verification and in-app messaging for peace of mind.",
        "homeowner.cta": '<i class="fas fa-gift"></i> Claim $50 Off - First 500 Only',
        "homeowner.note": '<i class="fas fa-map-marker-alt"></i> Launching July 2026 in Dallas-Fort Worth, TX',

        // Cleaner Card
        "cleaner.eyebrow": "For Cleaning Professionals",
        "cleaner.title": "Your skills deserve better pay.",
        "cleaner.subtitle": "Potential to earn $50 - $100/hr on your terms. No more chasing payments, negotiating rates, or dealing with unreliable clients.",
        "cleaner.feature1": "<strong>You're the boss</strong> - set your hours, pick your jobs, work your way.",
        "cleaner.feature2": "<strong>Flexible payouts</strong> - get paid daily, weekly, or monthly - your choice.",
        "cleaner.feature3": "<strong>Zero payment hassle</strong> - we handle billing, you focus on cleaning.",
        "cleaner.feature4": "<strong>Respect built-in</strong> - ratings protect you too, not just clients.",
        "cleaner.cta": '<i class="fas fa-rocket"></i> Apply Now - Limited Spots',
        "cleaner.note": '<i class="fas fa-clock"></i> Hiring now in Dallas-Fort Worth - Early pros get priority jobs',

        // Trust Badges
        "trust.insured": "Fully Insured",
        "trust.background": "Verified Pros",
        "trust.satisfaction": "Satisfaction Guaranteed",

        // Form
        "form.title": "Reserve Your Spot",
        "form.subtitle": 'Join <span class="counter">2,847</span> others already on the waitlist',
        "form.label": "I want to join as a:",
        "form.homeowner": "Homeowner",
        "form.homeownerBonus": "Get $50 off first clean",
        "form.cleaner": "Cleaning Pro",
        "form.cleanerBonus": "Priority job access",
        "form.statePlaceholder": "Your State",
        "form.stateOther": "Other (Notify me when you expand)",
        "form.emailPlaceholder": "Your best email",
        "form.consent": "I agree to receive updates about Mopt via email. You can unsubscribe anytime.",
        "form.submit": "Join the Waitlist",
        "form.privacy": '<i class="fas fa-lock"></i> Your information is secure and never shared.',
        "form.error": "Please select a role to continue.",

        // Success
        "success.title": "You're in!",
        "success.message": "Welcome to the Mopt family. We'll email you the moment we launch in your area.",
        "success.share": "Share with friends and move up the waitlist:",
        "success.addAnother": "Add Another Email",

        // Footer
        "footer.texas": 'Born in Texas <img src="https://flagcdn.com/w20/us-tx.png" alt="Texas flag" class="texas-flag">',
        "footer.powered": 'Powered by <a href="https://trivinetech.com" target="_blank" rel="noopener">Trivine</a>',

        // Scroll
        "scroll": "Scroll for more",

        // Book Now Button
        "bookNow": "Book Cleaning Now",
        "bookYourCleaning": "Book Your Cleaning",

        // Booking Page
        "book.title": "Schedule Your Clean",
        "book.subtitle": "Get an instant quote and book your professional cleaning in minutes",

        // Property Details
        "book.propertyTitle": "Property Details",
        "book.propertyDesc": "Tell us about your home",
        "book.propertyType": "Property Type",
        "book.selectType": "Select type",
        "book.house": "House",
        "book.apartment": "Apartment",
        "book.condo": "Condo",
        "book.townhouse": "Townhouse",
        "book.sqft": "Square Footage",
        "book.bedrooms": "Bedrooms",
        "book.bathrooms": "Bathrooms",
        "book.address": "Address",
        "book.addressPlaceholder": "Enter your full address",
        "book.city": "City",
        "book.selectCity": "Select city",
        "book.zipCode": "Zip Code",
        "book.hasPets": "Do you have pets?",
        "book.petNotesPlaceholder": "e.g., One friendly dog, two cats",

        // Service Type
        "book.serviceTitle": "Choose Your Service",
        "book.serviceDesc": "What type of cleaning do you need?",
        "book.regularClean": "Regular Clean",
        "book.regularDesc": "Dusting, vacuuming, mopping, bathroom & kitchen cleaning",
        "book.deepClean": "Deep Clean",
        "book.deepDesc": "Everything in Regular + baseboards, inside cabinets, appliances",
        "book.moveInOut": "Move In/Out",
        "book.moveDesc": "Deep clean + inside closets, oven, refrigerator, garage",
        "book.windowsOnly": "Windows Only",
        "book.windowsDesc": "Interior & exterior windows, sills, tracks, screens",

        // Add-ons
        "book.addonsTitle": "Add-on Services",
        "book.addonsDesc": "Customize your cleaning (optional)",
        "book.addonOven": "Inside Oven Deep Clean",
        "book.addonFridge": "Inside Refrigerator",
        "book.addonWindows": "Interior Windows",
        "book.addonLaundry": "Laundry Wash & Fold",
        "book.addonBaseboards": "Baseboards Wiping",
        "book.addonOrganize": "Light Organizing",

        // Schedule
        "book.scheduleTitle": "Pick Your Date & Time",
        "book.scheduleDesc": "When would you like us to come?",
        "book.selectTime": "Select Time Window",
        "book.morning": "Morning",
        "book.afternoon": "Afternoon",
        "book.evening": "Evening",

        // Special Instructions
        "book.instructionsTitle": "Special Instructions",
        "book.instructionsDesc": "Any specific requests or areas to focus on?",
        "book.tagBathrooms": "Focus on bathrooms",
        "book.tagPetFriendly": "Pet-friendly products",
        "book.tagEco": "Eco-friendly only",
        "book.tagFolding": "Light folding",
        "book.notesPlaceholder": "Any additional instructions for our cleaner...",

        // Contact Info
        "book.contactTitle": "Your Information",
        "book.contactDesc": "How can we reach you?",
        "book.firstName": "First Name",
        "book.lastName": "Last Name",
        "book.email": "Email",
        "book.phone": "Phone",
        "book.accessLabel": "Access Instructions (Optional)",
        "book.accessPlaceholder": "e.g., Ring doorbell, key under mat, gate code 1234",

        // Pricing
        "book.yourQuote": "Your Quote",
        "book.baseService": "Base Service",
        "book.petFee": "Pet Fee",
        "book.addons": "Add-ons",
        "book.subtotal": "Subtotal",
        "book.tax": "Tax (8.25%)",
        "book.total": "Total",
        "book.pricingNote": "No payment required now. Pay after your cleaning.",

        // Submit
        "book.submitBtn": "Book My Cleaning",
        "book.termsNote": "By booking, you agree to our",
        "book.termsOfService": "Terms of Service",
        "book.and": "and",
        "book.privacyPolicy": "Privacy Policy",

        // Success
        "book.successTitle": "Booking Request Submitted!",
        "book.successMessage": "Thank you for choosing Mopt. We'll match you with a trusted cleaner and send confirmation to your email shortly.",
        "book.bookingDetails": "Booking Details",
        "book.service": "Service:",
        "book.date": "Date:",
        "book.time": "Time:",
        "book.addressLabel": "Address:",
        "book.estimatedTotal": "Estimated Total:",
        "book.whatsNext": "What's Next?",
        "book.step1": "We'll confirm your booking via email within 1 hour",
        "book.step2": "You'll receive your cleaner's profile and arrival ETA",
        "book.step3": "On cleaning day, your cleaner will arrive at the scheduled time",
        "book.step4": "Pay securely after the job is complete",
        "book.backHome": "Back to Home"
    },
    es: {
        title: "Limpieza del Hogar, Reinventada",
        subtitle: "Sin más llamadas sin respuesta. Sin más cancelaciones. Sin precios sorpresa. Limpieza profesional y confiable al alcance de tu mano.",

        // Homeowner Card
        "homeowner.eyebrow": "Para Propietarios",
        "homeowner.title": "Deja de perder fines de semana limpiando.",
        "homeowner.subtitle": "¿Cansado de limpiadores poco confiables y facturas sorpresa? Reserva profesionales verificados en 60 segundos.",
        "homeowner.feature1": "<strong>Precios instantáneos</strong> - conoce el costo antes de reservar, siempre.",
        "homeowner.feature2": "<strong>Horarios flexibles</strong> - reserva días o semanas antes, a tu ritmo.",
        "homeowner.feature3": "<strong>Limpiadores verificados</strong> - identidad verificada, reseñas reales, cobertura total.",
        "homeowner.feature4": "<strong>Seguro y conectado</strong> - verificación con código dual y mensajería en la app para tu tranquilidad.",
        "homeowner.cta": '<i class="fas fa-gift"></i> Obtén $50 de Descuento - Solo los Primeros 500',
        "homeowner.note": '<i class="fas fa-map-marker-alt"></i> Lanzamiento Julio 2026 en Dallas-Fort Worth, TX',

        // Cleaner Card
        "cleaner.eyebrow": "Para Profesionales de Limpieza",
        "cleaner.title": "Tus habilidades merecen mejor pago.",
        "cleaner.subtitle": "Potencial de ganar $50 - $100/hr en tus términos. Sin perseguir pagos, negociar tarifas, ni lidiar con clientes poco confiables.",
        "cleaner.feature1": "<strong>Tú eres el jefe</strong> - establece tus horarios, elige tus trabajos, trabaja a tu manera.",
        "cleaner.feature2": "<strong>Pagos flexibles</strong> - cobra diario, semanal o mensual - tú decides.",
        "cleaner.feature3": "<strong>Cero complicaciones de pago</strong> - nosotros manejamos la facturación, tú te enfocas en limpiar.",
        "cleaner.feature4": "<strong>Respeto integrado</strong> - las calificaciones te protegen a ti también, no solo a los clientes.",
        "cleaner.cta": '<i class="fas fa-rocket"></i> Aplica Ahora - Cupos Limitados',
        "cleaner.note": '<i class="fas fa-clock"></i> Contratando ahora en Dallas-Fort Worth - Los primeros obtienen prioridad',

        // Trust Badges
        "trust.insured": "Totalmente Asegurado",
        "trust.background": "Profesionales Verificados",
        "trust.satisfaction": "Satisfacción Garantizada",

        // Form
        "form.title": "Reserva Tu Lugar",
        "form.subtitle": 'Únete a <span class="counter">2,847</span> personas en la lista de espera',
        "form.label": "Quiero unirme como:",
        "form.homeowner": "Propietario",
        "form.homeownerBonus": "Obtén $50 de descuento",
        "form.cleaner": "Profesional de Limpieza",
        "form.cleanerBonus": "Acceso prioritario a trabajos",
        "form.statePlaceholder": "Tu Estado",
        "form.stateOther": "Otro (Notifícame cuando expandan)",
        "form.emailPlaceholder": "Tu mejor correo electrónico",
        "form.consent": "Acepto recibir actualizaciones de Mopt por correo electrónico. Puedes cancelar en cualquier momento.",
        "form.submit": "Únete a la Lista de Espera",
        "form.privacy": '<i class="fas fa-lock"></i> Tu información está segura y nunca se comparte.',
        "form.error": "Por favor selecciona un rol para continuar.",

        // Success
        "success.title": "¡Estás dentro!",
        "success.message": "Bienvenido a la familia Mopt. Te enviaremos un correo en cuanto lancemos en tu área.",
        "success.share": "Comparte con amigos y sube en la lista de espera:",
        "success.addAnother": "Agregar Otro Correo",

        // Footer
        "footer.texas": 'Nacido en Texas <img src="https://flagcdn.com/w20/us-tx.png" alt="Bandera de Texas" class="texas-flag">',
        "footer.powered": 'Desarrollado por <a href="https://trivinetech.com" target="_blank" rel="noopener">Trivine</a>',

        // Scroll
        "scroll": "Desplázate para ver más",

        // Book Now Button
        "bookNow": "Reservar Limpieza",
        "bookYourCleaning": "Reserva Tu Limpieza",

        // Booking Page
        "book.title": "Programa Tu Limpieza",
        "book.subtitle": "Obtén una cotización instantánea y reserva tu limpieza profesional en minutos",

        // Property Details
        "book.propertyTitle": "Detalles de la Propiedad",
        "book.propertyDesc": "Cuéntanos sobre tu hogar",
        "book.propertyType": "Tipo de Propiedad",
        "book.selectType": "Seleccionar tipo",
        "book.house": "Casa",
        "book.apartment": "Apartamento",
        "book.condo": "Condominio",
        "book.townhouse": "Casa Adosada",
        "book.sqft": "Pies Cuadrados",
        "book.bedrooms": "Habitaciones",
        "book.bathrooms": "Baños",
        "book.address": "Dirección",
        "book.addressPlaceholder": "Ingresa tu dirección completa",
        "book.city": "Ciudad",
        "book.selectCity": "Seleccionar ciudad",
        "book.zipCode": "Código Postal",
        "book.hasPets": "¿Tienes mascotas?",
        "book.petNotesPlaceholder": "ej., Un perro amigable, dos gatos",

        // Service Type
        "book.serviceTitle": "Elige Tu Servicio",
        "book.serviceDesc": "¿Qué tipo de limpieza necesitas?",
        "book.regularClean": "Limpieza Regular",
        "book.regularDesc": "Quitar polvo, aspirar, trapear, limpieza de baño y cocina",
        "book.deepClean": "Limpieza Profunda",
        "book.deepDesc": "Todo lo de Regular + zócalos, interior de gabinetes, electrodomésticos",
        "book.moveInOut": "Mudanza",
        "book.moveDesc": "Limpieza profunda + interior de closets, horno, refrigerador, garaje",
        "book.windowsOnly": "Solo Ventanas",
        "book.windowsDesc": "Ventanas interiores y exteriores, marcos, rieles, mosquiteros",

        // Add-ons
        "book.addonsTitle": "Servicios Adicionales",
        "book.addonsDesc": "Personaliza tu limpieza (opcional)",
        "book.addonOven": "Limpieza Profunda de Horno",
        "book.addonFridge": "Interior del Refrigerador",
        "book.addonWindows": "Ventanas Interiores",
        "book.addonLaundry": "Lavado y Doblado",
        "book.addonBaseboards": "Limpieza de Zócalos",
        "book.addonOrganize": "Organización Ligera",

        // Schedule
        "book.scheduleTitle": "Elige Fecha y Hora",
        "book.scheduleDesc": "¿Cuándo te gustaría que vayamos?",
        "book.selectTime": "Selecciona Horario",
        "book.morning": "Mañana",
        "book.afternoon": "Tarde",
        "book.evening": "Noche",

        // Special Instructions
        "book.instructionsTitle": "Instrucciones Especiales",
        "book.instructionsDesc": "¿Alguna solicitud específica o áreas de enfoque?",
        "book.tagBathrooms": "Enfoque en baños",
        "book.tagPetFriendly": "Productos para mascotas",
        "book.tagEco": "Solo ecológicos",
        "book.tagFolding": "Doblar ropa",
        "book.notesPlaceholder": "Instrucciones adicionales para nuestro limpiador...",

        // Contact Info
        "book.contactTitle": "Tu Información",
        "book.contactDesc": "¿Cómo podemos contactarte?",
        "book.firstName": "Nombre",
        "book.lastName": "Apellido",
        "book.email": "Correo Electrónico",
        "book.phone": "Teléfono",
        "book.accessLabel": "Instrucciones de Acceso (Opcional)",
        "book.accessPlaceholder": "ej., Tocar timbre, llave bajo tapete, código 1234",

        // Pricing
        "book.yourQuote": "Tu Cotización",
        "book.baseService": "Servicio Base",
        "book.petFee": "Cargo por Mascota",
        "book.addons": "Adicionales",
        "book.subtotal": "Subtotal",
        "book.tax": "Impuesto (8.25%)",
        "book.total": "Total",
        "book.pricingNote": "No se requiere pago ahora. Paga después de tu limpieza.",

        // Submit
        "book.submitBtn": "Reservar Mi Limpieza",
        "book.termsNote": "Al reservar, aceptas nuestros",
        "book.termsOfService": "Términos de Servicio",
        "book.and": "y",
        "book.privacyPolicy": "Política de Privacidad",

        // Success
        "book.successTitle": "¡Solicitud de Reserva Enviada!",
        "book.successMessage": "Gracias por elegir Mopt. Te asignaremos un limpiador de confianza y enviaremos confirmación a tu correo pronto.",
        "book.bookingDetails": "Detalles de la Reserva",
        "book.service": "Servicio:",
        "book.date": "Fecha:",
        "book.time": "Hora:",
        "book.addressLabel": "Dirección:",
        "book.estimatedTotal": "Total Estimado:",
        "book.whatsNext": "¿Qué Sigue?",
        "book.step1": "Confirmaremos tu reserva por correo en 1 hora",
        "book.step2": "Recibirás el perfil del limpiador y hora de llegada",
        "book.step3": "El día de limpieza, tu limpiador llegará a la hora programada",
        "book.step4": "Paga de forma segura después de completar el trabajo",
        "book.backHome": "Volver al Inicio"
    }
};

// Current language - get from localStorage immediately
let currentLang = 'en';
try {
    currentLang = localStorage.getItem('mopt_lang') || 'en';
} catch (e) {
    console.warn('localStorage not available, defaulting to English');
}

// Track if initial translation has been applied
let isInitialized = false;

// Apply translations
function applyTranslations(lang) {
    currentLang = lang;

    // Save to localStorage
    try {
        localStorage.setItem('mopt_lang', lang);
    } catch (e) {
        console.warn('Could not save language preference');
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update HTML content (for elements with icons)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update language buttons - ensure correct button is active
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Restart counter animation for form subtitle (only on initial load)
    if (!isInitialized) {
        isInitialized = true;
        const counter = document.querySelector('.counter');
        if (counter) {
            const target = 2847;
            let current = Math.floor(target * 0.7);
            const increment = Math.ceil((target - current) / 50);
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = current.toLocaleString();
            }, 30);
        }
    }

    // Dispatch event so other scripts can react
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Apply language button states immediately (before DOMContentLoaded)
// This prevents the flash of wrong button being active
function applyButtonStates() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Try to apply immediately if DOM is ready
function initI18n() {
    // Apply initial translations
    applyTranslations(currentLang);

    // Language toggle buttons - use event delegation for reliability
    // This handles both existing and any dynamically added buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (btn) {
            e.preventDefault();
            const lang = btn.getAttribute('data-lang');
            if (lang && lang !== currentLang) {
                console.log(`Language toggle: switching from ${currentLang} to ${lang}`);
                applyTranslations(lang);
            }
        }
    });
}

// Ensure it runs once
let hasInitialized = false;
function safeInit() {
    if (hasInitialized) return;
    hasInitialized = true;
    initI18n();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
} else {
    safeInit();
}

// Also export for other scripts if needed
window.mopt_i18n = {
    applyTranslations,
    getCurrentLang: () => currentLang
};
