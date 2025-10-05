// Inviter signup functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded on signup page');
    
    const signupForm = document.getElementById('signupForm');
    
    if (!signupForm) {
        console.error('Signup form not found!');
        return;
    }
    
    console.log('Signup form found, setting up event listener');
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('=== SIGNUP FORM SUBMITTED ===');
        
        const formData = {
            fullName: document.getElementById('inviterFullName').value.trim(),
            email: document.getElementById('inviterEmail').value.trim(),
            churchName: document.getElementById('inviterChurch').value,
            authCode: document.getElementById('authCode').value.trim()
        };
        
        console.log('Form data collected:', formData);
        
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
            console.log('Attempting to register inviter...');
            await registerInviter(formData);
        } catch (error) {
            console.error('Signup process failed:', error);
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

async function registerInviter(inviterData) {
    try {
        console.log('Starting database registration...');
        
        // Prepare data for database
        const dbData = {
            full_name: inviterData.fullName,
            email: inviterData.email,
            church_name: inviterData.churchName
        };
        
        console.log('Sending to database:', dbData);
        
        // Save to database
        const newInviter = await Database.registerInviter(dbData);
        
        console.log('Database response received:', newInviter);
        
        if (newInviter) {
            console.log('✅ Registration successful in database');
            showSuccessModal();
        } else {
            throw new Error('No data returned from database');
        }
        
    } catch (error) {
        console.error('❌ Registration failed:', error);
        
        // Show specific error messages
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            alert('An inviter with this email already exists. Please use a different email.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            alert('Network error. Please check your internet connection and try again.');
        } else {
            alert('Error registering inviter: ' + error.message);
        }
        throw error;
    }
}

// Modal functions for signup page
function showSuccessModal() {
    console.log('Attempting to show success modal...');
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('✅ Success modal displayed');
    } else {
        console.error('❌ Success modal not found in DOM');
        // Fallback
        alert('Registration successful! You can now close this page and return to the main dashboard.');
    }
}

function closeModal() {
    console.log('Closing modal and redirecting...');
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Redirect to main dashboard
    window.location.href = 'index.html';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Make functions globally available
window.showSuccessModal = showSuccessModal;
window.closeModal = closeModal;

console.log('✅ Auth.js initialization complete');
