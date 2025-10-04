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

function registerInviter(inviterData) {
    let inviters = JSON.parse(localStorage.getItem('inviters')) || [];
    
    // Check if email already exists
    if (inviters.some(inviter => inviter.email === inviterData.email)) {
        alert('An inviter with this email already exists.');
        return;
    }
    
    // Add to inviters array
    inviters.push(inviterData);
    localStorage.setItem('inviters', JSON.stringify(inviters));
    
    // Show success modal
    showSuccessModal();
    
    // Redirect to main page after delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}