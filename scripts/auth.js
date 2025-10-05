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
        
        // Validate authentication code
        if (formData.authCode !== 'CHURCH2024') {
            alert('Invalid authentication code. Please contact admin.');
            return;
        }
        
        // Register inviter
        registerInviter(formData);
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
            showSuccessModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            throw new Error('No data returned from database');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error registering inviter: ' + error.message);
    }
}

// Modal functions for signup page
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert('Registration successful! Redirecting...');
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Redirect immediately when modal is closed
    window.location.href = 'index.html';
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeModal();
    }
});
