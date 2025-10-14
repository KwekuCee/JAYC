// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    initializeTabs();
    populateInviterDropdown();
    loadChurchGroups();
    setupFormHandlers();
    
    // Initialize countdown with seconds precision
    initializeCountdown();
    
    // Initialize live stats
    LiveStats.updateCounter();
    LiveStats.startAutoUpdate();
    
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

// Close modal and redirect to flyer page
function closeModalAndRedirect() {
    closeModal();
    window.location.href = 'flyer.html';
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
        
        // Get form values - email is now optional
        const formData = {
            full_name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim() || null, // Allow null
            phone: document.getElementById('phone').value.trim(),
            occupation: document.getElementById('occupation').value.trim(),
            location: document.getElementById('location').value.trim(),
            church_name: churchName,
            inviter_name: selectedInviterName,
            registration_date: new Date().toISOString()
        };
        
        console.log('Form data to register:', formData);
        
        // Validate required fields (email is no longer required)
        if (!formData.full_name || !formData.phone || !formData.occupation || !formData.location) {
            alert('Please fill in all required fields: Name, Phone, Occupation, and Location.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('.btn-register');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitBtn.disabled = true;
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Register member
        try {
            await registerMember(formData);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
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
                    
                    // Update daily goals for active inviter tracking
                    await ActiveInviters.updateDailyGoals();
                }
            } catch (notificationError) {
                console.error('Notification failed, but registration succeeded:', notificationError);
            }
            
            // Show success modal briefly, then redirect to flyer page
            showSuccessModal();

            // Wait 2 seconds, then redirect to flyer page
            setTimeout(() => {
                closeModal();
                // Store member name for flyer page
                if (memberData.full_name) {
                    sessionStorage.setItem('lastRegisteredMember', memberData.full_name);
                }
                window.location.href = 'flyer.html';
            }, 2000);

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
            alert('Registration failed. This email may already be registered. Please try using a different email or leave the email field empty.');
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

// Enhanced Countdown Timer
function updateCountdown() {
    // Set the event date: November 7, 2025 at 4:00 PM GMT
    const eventDate = new Date('2025-11-07T16:00:00+00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;

    // If countdown is over
    if (distance < 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        
        // Update hero text when event has started
        const heroTitle = document.querySelector('.hero-content h1');
        const heroText = document.querySelector('.hero-content p');
        if (heroTitle && heroText) {
            heroTitle.textContent = 'JAYC 2025 is Live!';
            heroText.textContent = 'The conference is happening right now! Join us at the National Theatre!';
        }
        return;
    }

    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update display
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

    // Add pulsing animation to seconds for live feel
    if (seconds % 2 === 0) {
        document.getElementById('seconds').style.color = 'var(--success)';
    } else {
        document.getElementById('seconds').style.color = 'white';
    }
}

// Progress Bar Calculation - FIXED
function updateProgressBar() {
    const eventDate = new Date('2025-11-07T16:00:00+00:00').getTime();
    const startDate = new Date('2025-01-01T00:00:00+00:00').getTime(); // Start of 2025
    const now = new Date().getTime();
    
    const totalDuration = eventDate - startDate;
    const elapsed = now - startDate;
    
    let progress = (elapsed / totalDuration) * 100;
    progress = Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    if (progressText) {
        if (progress < 100) {
            const daysLeft = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
            progressText.textContent = `${daysLeft} days until JAYC 2025`;
        } else {
            progressText.textContent = 'JAYC 2025 is here! Join us now!';
        }
    }
}

// Initialize countdown with seconds precision
function initializeCountdown() {
    updateCountdown();
    updateProgressBar();
    // Update every second for real-time countdown
    setInterval(updateCountdown, 1000);
    // Update progress bar every minute
    setInterval(updateProgressBar, 60000);
}

// Scroll to registration form
function scrollToRegistration() {
    document.getElementById('registration').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Live Registration Counter
class LiveStats {
    static async updateCounter() {
        try {
            const members = await Database.getMembers();
            const counter = document.getElementById('liveCounter');
            if (counter) {
                counter.textContent = members.length;
                counter.style.animation = 'pulse 0.5s ease';
                setTimeout(() => counter.style.animation = '', 500);
            }
        } catch (error) {
            console.error('Error updating counter:', error);
        }
    }
    
    static startAutoUpdate() {
        // Update every 30 seconds
        setInterval(() => this.updateCounter(), 30000);
    }
}

// Active Inviter System
class ActiveInviters {
    static async updateDailyGoals() {
        try {
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            const today = new Date().toISOString().split('T')[0];
            
            // Group today's registrations by inviter
            const todayRegistrations = members.filter(member => 
                member.registration_date && 
                member.registration_date.split('T')[0] === today
            );
            
            const inviterCounts = {};
            todayRegistrations.forEach(member => {
                if (member.inviter_name) {
                    inviterCounts[member.inviter_name] = (inviterCounts[member.inviter_name] || 0) + 1;
                }
            });
            
            // Update daily goals for each inviter
            for (const [inviterName, count] of Object.entries(inviterCounts)) {
                const inviter = inviters.find(inv => inv.full_name === inviterName);
                if (inviter) {
                    await Database.updateInviterDailyGoal(
                        inviter.email,
                        inviterName,
                        today,
                        count
                    );
                    
                    // Check if goal achieved and send congratulations
                    if (count >= 10) {
                        await this.checkAndAwardAchievements(inviter.email, inviterName);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error updating daily goals:', error);
        }
    }
    
    static async checkAndAwardAchievements(inviterEmail, inviterName) {
        try {
            const goals = await Database.getInviterDailyGoals(inviterEmail);
            const last7Days = goals.slice(0, 7); // Get last 7 days
            
            // Check for daily achievement
            const today = new Date().toISOString().split('T')[0];
            const todayGoal = goals.find(g => g.date === today);
            
            if (todayGoal && todayGoal.goal_achieved) {
                await Notifications.sendActiveInviterCongratulations(
                    inviterEmail,
                    inviterName,
                    'Daily Goal Achiever - Successfully invited 10+ people today!'
                );
            }
            
            // Check for weekly achievement (3+ consecutive days)
            let consecutiveDays = 0;
            let currentStreak = 0;
            
            for (let i = 0; i < last7Days.length; i++) {
                if (last7Days[i].goal_achieved) {
                    currentStreak++;
                    consecutiveDays = Math.max(consecutiveDays, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }
            
            if (consecutiveDays >= 3) {
                await Notifications.sendActiveInviterCongratulations(
                    inviterEmail,
                    inviterName,
                    `Weekly Active Inviter - Achieved daily goal for ${consecutiveDays} consecutive days!`
                );
            }
            
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    }
    
    static async getActiveInviters() {
        try {
            const goals = await Database.getInviterDailyGoals();
            const today = new Date().toISOString().split('T')[0];
            const inviters = await Database.getInviters();
            
            // Get today's active inviters
            const todayActive = goals
                .filter(g => g.date === today && g.goal_achieved)
                .map(g => {
                    const inviter = inviters.find(inv => inv.email === g.inviter_email);
                    return {
                        ...g,
                        church_name: inviter?.church_name || 'Unknown',
                        consecutive_days: this.calculateConsecutiveDays(goals, g.inviter_email)
                    };
                });
            
            // Get weekly active inviters (3+ consecutive days)
            const weeklyActive = todayActive.filter(inviter => 
                inviter.consecutive_days >= 3
            );
            
            return {
                daily: todayActive,
                weekly: weeklyActive,
                stats: {
                    total_daily: todayActive.length,
                    total_weekly: weeklyActive.length,
                    date: today
                }
            };
            
        } catch (error) {
            console.error('Error getting active inviters:', error);
            return { 
                daily: [], 
                weekly: [], 
                stats: { 
                    total_daily: 0, 
                    total_weekly: 0, 
                    date: new Date().toISOString().split('T')[0] 
                } 
            };
        }
    }
    
    static calculateConsecutiveDays(goals, inviterEmail) {
        const inviterGoals = goals
            .filter(g => g.inviter_email === inviterEmail)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < 7; i++) { // Check last 7 days
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayGoal = inviterGoals.find(g => g.date === dateStr);
            
            if (dayGoal && dayGoal.goal_achieved) {
                streak++;
            } else {
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }
}

// CRITICAL FIX: Make ActiveInviters globally available
window.ActiveInviters = ActiveInviters;

// Update the DOMContentLoaded to start daily tracking
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting active inviter tracking...');
    
    // Start active inviter tracking (check every hour)
    setInterval(() => {
        if (typeof ActiveInviters !== 'undefined') {
            ActiveInviters.updateDailyGoals();
        }
    }, 60 * 60 * 1000);
    
    // Run immediately if available
    if (typeof ActiveInviters !== 'undefined') {
        ActiveInviters.updateDailyGoals();
    }
});

// Refresh data when coming back to the page
window.addEventListener('pageshow', function() {
    populateInviterDropdown();
    loadChurchGroups();
});

// Make functions globally available for HTML onclick events
window.showSuccessModal = showSuccessModal;
window.closeModal = closeModal;
window.closeModalAndRedirect = closeModalAndRedirect;
window.scrollToRegistration = scrollToRegistration;

console.log('✅ App.js loaded successfully with ActiveInviters system');