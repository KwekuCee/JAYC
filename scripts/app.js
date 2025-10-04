// Sample data storage
let inviters = JSON.parse(localStorage.getItem('inviters')) || [];
let members = JSON.parse(localStorage.getItem('members')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    initializeTabs();
    populateInviterDropdown();
    loadChurchGroups();
    setupFormHandlers();
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

// Updated populateInviterDropdown function
async function populateInviterDropdown() {
    const inviterSelect = document.getElementById('inviterName');
    
    try {
        // Get inviters from database
        const inviters = await Database.getInviters();
        console.log('Inviters from database:', inviters);
        
        // Clear existing options
        inviterSelect.innerHTML = '<option value="">Select Inviter</option>';
        
        if (inviters.length === 0) {
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
            inviterSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading inviters:', error);
        inviterSelect.innerHTML = '<option value="">Error loading inviters</option>';
    }
}
/////////
// Updated loadChurchGroups function
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
        churchGroups.innerHTML = '<p>Error loading data</p>';
    }
}
// Get member count for an inviter
function getMemberCount(inviterName) {
    return members.filter(member => member.inviterName === inviterName).length;
}

// Setup form handlers
// Setup form handlers
function setupFormHandlers() {
    const registrationForm = document.getElementById('registrationForm');
    
    if (!registrationForm) {
        console.error('Registration form not found!');
        return;
    }
    
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Get selected inviter details
        const inviterSelect = document.getElementById('inviterName');
        const selectedInviterName = inviterSelect.value;
        const selectedInviter = inviters.find(inv => inv.fullName === selectedInviterName);
        
        if (!selectedInviter) {
            alert('Please select a valid inviter.');
            return;
        }
        
        // Get form values - NO churchName field from form
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            occupation: document.getElementById('occupation').value.trim(),
            location: document.getElementById('location').value.trim(),
            // Auto-populate churchName from selected inviter
            churchName: document.getElementById('churchName').value, //From dropdown
            inviterName: document.getElementById('inviterName').value,
            registrationDate: new Date().toISOString()
        };
        
        console.log('Form data:', formData);
        
        // Validate required fields (no churchName validation needed as it's auto-populated)
        if (!formData.fullName || !formData.email || !formData.phone || 
            !formData.occupation || !formData.location || !formData.inviterName) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        // Check if email already exists
        if (members.some(member => member.email === formData.email)) {
            alert('This email is already registered. Please use a different email.');
            return;
        }
        
        // Register member
        registerMember(formData);
    });
    
    console.log('Form handler setup complete');
}

// Updated registerMember function
async function registerMember(memberData) {
    try {
        console.log('Registering member:', memberData);
        
        // Save to database
        const newMember = await Database.registerMember(memberData);
        
        if (newMember) {
            console.log('Member registered successfully in database');
            
            // Show success modal
            showSuccessModal();
            
            // Reset form
            document.getElementById('registrationForm').reset();
            
        } else {
            throw new Error('Failed to register member');
        }
        
    } catch (error) {
        console.error('Error registering member:', error);
        alert('Error registering member. Please try again.');
    }
}

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

// Refresh inviters list when coming back to the page
window.addEventListener('pageshow', function() {
    inviters = JSON.parse(localStorage.getItem('inviters')) || [];
    members = JSON.parse(localStorage.getItem('members')) || [];
    populateInviterDropdown();
    loadChurchGroups();

});
