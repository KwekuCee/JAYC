// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    initializeTabs();
    populateInviterDropdown();
    loadChurchGroups();
    setupFormHandlers();
    
    // Run debug after a short delay
    setTimeout(debugInviters, 1000);
});

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert('Registration successful!');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Tab navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-btn[data-tab]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Populate inviter dropdown
async function populateInviterDropdown() {
    const inviterSelect = document.getElementById('inviterName');
    
    try {
        // Get inviters from database
        const inviters = await Database.getInviters();
        console.log('Inviters from database for dropdown:', inviters);
        
        // Clear existing options
        inviterSelect.innerHTML = '<option value="">Select Inviter</option>';
        
        if (inviters.length === 0) {
            console.log('No inviters found in database');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No inviters available - Please sign up first';
            option.disabled = true;
            inviterSelect.appendChild(option);
            return;
        }
        
        // Populate dropdown
        inviters.forEach(inviter => {
            const option = document.createElement('option');
            option.value = inviter.full_name;
            option.textContent = `${inviter.full_name} - ${inviter.church_name}`;
            option.setAttribute('data-church', inviter.church_name);
            inviterSelect.appendChild(option);
        });
        
        console.log('Inviter dropdown populated with', inviters.length, 'options');
        
    } catch (error) {
        console.error('Error loading inviters for dropdown:', error);
        inviterSelect.innerHTML = '<option value="">Error loading inviters</option>';
    }
}

// Load church groups for inviters view
async function loadChurchGroups() {
    const churchGroups = document.getElementById('churchGroups');
    
    try {
        const inviters = await Database.getInviters();
        const members = await Database.getMembers();
        
        // Group inviters by church
        const churches = {};
        inviters.forEach(inviter => {
            if (!churches[inviter.church_name]) {
                churches[inviter.church_name] = [];
            }
            churches[inviter.church_name].push(inviter);
        });
        
        if (Object.keys(churches).length === 0) {
            churchGroups.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-church"></i>
                    <p>No inviters registered yet</p>
                </div>
            `;
            return;
        }
        
        // Create church group sections
        churchGroups.innerHTML = Object.keys(churches).map(churchName => {
            const churchInviters = churches[churchName];
            
            return `
                <div class="church-group">
                    <h3><i class="fas fa-church"></i> ${churchName}</h3>
                    <div class="inviters-grid">
                        ${churchInviters.map(inviter => {
                            const memberCount = members.filter(member => 
                                member.inviter_name === inviter.full_name
                            ).length;
                            
                            return `
                                <div class="inviter-card">
                                    <h4>${inviter.full_name}</h4>
                                    <p><i class="fas fa-envelope"></i> ${inviter.email}</p>
                                    <p><i class="fas fa-users"></i> ${memberCount} members registered</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading church groups:', error);
        churchGroups.innerHTML = '<div class="empty-state"><p>Error loading data</p></div>';
    }
}

// Setup form handlers
function setupFormHandlers() {
    const registrationForm = document.getElementById('registrationForm');
    
    if (!registrationForm) {
        console.error('Registration form not found!');
        return;
    }
    
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Get selected inviter name
        const selectedInviterName = document.getElementById('inviterName').value;
        
        if (!selectedInviterName) {
            alert('Please select an inviter.');
            return;
        }
        
        console.log('Selected inviter:', selectedInviterName);
        
        let churchName = '';
        
        // Get church name from the selected option's data attribute
        const selectedOption = document.getElementById('inviterName').selectedOptions[0];
        if (selectedOption && selectedOption.getAttribute('data-church')) {
            churchName = selectedOption.getAttribute('data-church');
            console.log('Found church from dropdown data:', churchName);
        }
        
        // If we still don't have church name, try to get it from database
        if (!churchName) {
            try {
                const inviters = await Database.getInviters();
                const selectedInviter = inviters.find(inv => inv.full_name === selectedInviterName);
                if (selectedInviter) {
                    churchName = selectedInviter.church_name;
                    console.log('Found church from database:', churchName);
                }
            } catch (error) {
                console.error('Error getting church:', error);
            }
        }
        
        // Final validation
        if (!churchName) {
            alert('Could not determine church. Please try again.');
            return;
        }
        
        // Get form values
        const formData = {
            full_name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            occupation: document.getElementById('occupation').value.trim(),
            location: document.getElementById('location').value.trim(),
            church_name: churchName,
            inviter_name: selectedInviterName,
            registration_date: new Date().toISOString()
        };
        
        console.log('Form data to register:', formData);
        
        // Register member
        registerMember(formData);
    });
    
    console.log('Form handler setup complete');
}

// Register member
async function registerMember(memberData) {
    try {
        console.log('Registering member:', memberData);
        
        // Save to database
        const newMember = await Database.registerMember(memberData);
        
        if (newMember) {
            console.log('Member registered successfully in database');

// ✅ SEND NOTIFICATIONS
            try {
                // Send welcome email to member
                await Notifications.sendMemberWelcome(memberData);
                
                // Find inviter and send notification
                const inviters = await Database.getInviters();
                const inviter = inviters.find(inv => inv.full_name === memberData.inviter_name);
                if (inviter) {
                    await Notifications.sendInviterNotification(inviter.email, memberData);
                }
            } catch (notificationError) {
                console.error('Notification failed, but registration succeeded:', notificationError);
            }
            
            // Show success modal
            showSuccessModal();
            
            // Reset form
            document.getElementById('registrationForm').reset();
            
            // Refresh the views
            await loadChurchGroups();
            
        } else {
            throw new Error('Failed to register member - no data returned');
        }
        
    } catch (error) {
        console.error('Error registering member:', error);
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            alert('This email is already registered. Please use a different email.');
        } else {
            alert('Error registering member. Please try again.');
        }
    }
}

// Debug function
async function debugInviters() {
    console.log('=== DEBUG: Checking database inviters ===');
    try {
        const inviters = await Database.getInviters();
        console.log('Total inviters in database:', inviters.length);
        console.log('Inviters details:', inviters);
        
        const members = await Database.getMembers();
        console.log('Total members in database:', members.length);
        
        // Check what's in the dropdown
        const inviterSelect = document.getElementById('inviterName');
        if (inviterSelect) {
            console.log('Dropdown options:', {
                selectedValue: inviterSelect.value,
                options: Array.from(inviterSelect.options).map(opt => ({
                    value: opt.value,
                    text: opt.text,
                    selected: opt.selected
                }))
            });
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Refresh data when coming back to the page
window.addEventListener('pageshow', function() {
    populateInviterDropdown();
    loadChurchGroups();
});

// Make functions globally available for HTML onclick events
window.showSuccessModal = showSuccessModal;
window.closeModal = closeModal;




