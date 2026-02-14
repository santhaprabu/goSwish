document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Particles.js with reference-site style connectivity
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 100, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#1b7a91" },
                "shape": { "type": "circle" },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": { "enable": true, "speed": 1, "opacity_min": 0.2, "sync": false }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": { "enable": false }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 170,
                    "color": "#1b7a91",
                    "opacity": 0.5,
                    "width": 1.5
                },
                "move": {
                    "enable": true,
                    "speed": 1.8,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 140, "line_linked": { "opacity": 0.6 } },
                    "push": { "particles_nb": 3 }
                }
            },
            "retina_detect": true
        });
    }

    const form = document.getElementById('waitlist-form');
    const successMessage = document.getElementById('success-message');
    const emailInput = document.getElementById('email');
    const resetBtn = document.querySelector('.reset-btn');
    const submitBtn = document.getElementById('submit-btn');

    // 2. Form Submission Handling
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedRole = document.querySelector('input[name="role"]:checked');
        const email = emailInput.value;
        const state = document.getElementById('state').value;
        const consentCheckbox = document.getElementById('email-consent');
        const errorMessage = document.getElementById('error-message');

        // Validation
        if (!selectedRole) {
            errorMessage.textContent = 'Please select a role to continue.';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (!consentCheckbox.checked) {
            errorMessage.textContent = 'Please agree to receive email updates to continue.';
            errorMessage.classList.remove('hidden');
            return;
        }

        const role = selectedRole.value;
        const entryData = {
            email: email,
            role: role,
            state: state,
            timestamp: new Date().toISOString(),
            status: 'unverified_waitlist'
        };

        // 3. Data Capture (Classified Storage)
        console.log('✔ Capturing classified Mopt waitlist entry:', entryData);

        // Change button state to loading
        const originalText = submitBtn.querySelector('.btn-text').innerText;
        submitBtn.querySelector('.btn-text').innerText = 'Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Persistence
            const waitlist = JSON.parse(localStorage.getItem('mopt_waitlist') || '[]');
            waitlist.push(entryData);
            localStorage.setItem('mopt_waitlist', JSON.stringify(waitlist));

            // Transition UI
            form.classList.add('hidden');
            successMessage.classList.remove('hidden');

        } catch (err) {
            console.error('Submission error:', err);
            alert('Wait! Something went wrong while saving your spot. Please try again.');
        } finally {
            submitBtn.querySelector('.btn-text').innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    // 4. Reset Form
    resetBtn.addEventListener('click', () => {
        form.reset();
        form.classList.remove('hidden');
        successMessage.classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
        emailInput.focus();
    });

    // Clear error on radio change
    const radioButtons = document.querySelectorAll('input[name="role"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            document.getElementById('error-message').classList.add('hidden');
        });
    });

    // Clear error on checkbox change
    const consentCheck = document.getElementById('email-consent');
    consentCheck.addEventListener('change', () => {
        document.getElementById('error-message').classList.add('hidden');
    });
});
