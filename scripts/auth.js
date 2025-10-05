// Inviter signup functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    
    if (!signupForm) {
        console.error('Signup form not found!');
        return;
    }
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        const formData = {
            fullName: document.getElementById('inviterFullName').value.trim(),
            email: document.getElementById('inviterEmail').value.trim(),
            churchName: document.getElementById('inviterChurch').value,
            authCode: document.getElementById('authCode').value.trim()
        };
        
        console.log('Form data:', formData);
        
        // Validate required fields
        if (!formData.fullName || !formData.email || !formData.churchName || !formData.authCode) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        // Validate authentication code
        if (formData.authCode !== 'CHURCH2024') {
            alert('Invalid authentication code. Please contact admin.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('#signupForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitBtn.disabled = true;
        
        try {
            // Register inviter
            await registerInviter(formData);
        } catch (error) {
            console.error('Signup error:', error);
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

async function registerInviter(inviterData) {
    try {
        console.log('Starting inviter registration:', inviterData);
        
        // Prepare data for database
        const dbData = {
            full_name: inviterData.fullName,
            email: inviterData.email,
            church_name: inviterData.churchName
        };
        
        console.log('Sending to database:', dbData);
        
        // Save to database
        const newInviter = await Database.registerInviter(dbData);
        
        console.log('Database response:', newInviter);
        
        if (newInviter) {
            console.log('Registration successful, showing modal');
            showSuccessModal();
        } else {
            throw new Error('No data returned from database');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Show specific error messages
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            alert('An inviter with this email already exists. Please use a different email.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            alert('Network error. Please check your internet connection and try again.');
        } else {
            alert('Error registering inviter: ' + error.message);
        }
        throw error; // Re-throw to handle in form submit
    }
}

// Modal functions for signup page
function showSuccessModal() {
    console.log('showSuccessModal called');
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal displayed');
    } else {
        // Fallback if modal doesn't exist
        alert('Registration successful! You can now close this page and return to the main dashboard.');
    }
}

function closeModal() {
    console.log('closeModal called');
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Redirect to main dashboard when modal is closed
    window.location.href = 'index.html';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Make functions globally available for HTML onclick events
window.showSuccessModal = showSuccessModal;
window.closeModal = closeModal;

console.log('Auth.js loaded successfully');
