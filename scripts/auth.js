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
        console.log('Starting inviter registration:', inviterData);
        
        // Validate authentication code
        if (inviterData.authCode !== 'CHURCH2024') {
            alert('Invalid authentication code. Please contact admin.');
            return;
        }
        
        // Prepare data for database (remove authCode)
        const dbData = {
            full_name: inviterData.fullName,
            email: inviterData.email,
            church_name: inviterData.churchName
            // registration_date is auto-added by database
        };
        
        console.log('Sending to database:', dbData);
        
        // Save to database
        const newInviter = await Database.registerInviter(dbData);
        
        console.log('Database response:', newInviter);
        
        if (newInviter) {
            showSuccessModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            throw new Error('No data returned from database');
        }
        
    } catch (error) {
        console.error('Registration error details:', error);
        
        // Show specific error messages
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            alert('An inviter with this email already exists. Please use a different email.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            alert('Network error. Please check your internet connection and try again.');
        } else {
            alert('Error registering inviter: ' + error.message);
        }
    }
}
