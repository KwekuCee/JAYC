// Inviter signup functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('inviterFullName').value,
            email: document.getElementById('inviterEmail').value,
            churchName: document.getElementById('inviterChurch').value,
            authCode: document.getElementById('authCode').value,
            registrationDate: new Date().toISOString()
        };
        
        // Validate authentication code (in real app, this would be server-side)
        if (formData.authCode !== 'CHURCH2024') { // Default code
            alert('Invalid authentication code. Please contact admin.');
            return;
        }
        
        // Register inviter
        registerInviter(formData);
    });
});

// Updated registerInviter function
async function registerInviter(inviterData) {
    try {
        // Validate authentication code
        if (inviterData.authCode !== 'CHURCH2024') {
            alert('Invalid authentication code. Please contact admin.');
            return;
        }
        
        // Remove authCode before saving to database
        const { authCode, ...inviterDataWithoutAuth } = inviterData;
        
        // Save to database
        const newInviter = await Database.registerInviter(inviterDataWithoutAuth);
        
        if (newInviter) {
            showSuccessModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            alert('Error registering inviter. Please try again.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('duplicate key')) {
            alert('An inviter with this email already exists.');
        } else {
            alert('Error registering inviter. Please try again.');
        }
    }
}
