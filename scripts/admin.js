// Enhanced Admin Dashboard Functionality
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'jayc0024'
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminLogin();
    
    // Check if already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminDashboard();
    }
});

// Initialize admin login form
function initializeAdminLogin() {
    const loginForm = document.getElementById('adminLoginForm');
    
    if (!loginForm) {
        console.error('Admin login form not found!');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Admin login form submitted');
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        console.log('Login attempt:', { username, password });
        
        // Show loading state
        const loginBtn = document.querySelector('.btn-login');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
        
        // Small delay to show loading state
        setTimeout(async () => {
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                console.log('Login successful');
                // Successful login
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminDashboard();
            } else {
                console.log('Login failed');
                alert('Invalid admin credentials. Please try again.');
                // Reset button
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1000);
    });
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    loadAdminData();
}

// Load admin data
async function loadAdminData() {
    try {
        console.log('Loading admin data from Supabase...');
        const members = await Database.getMembers();
        const inviters = await Database.getInviters();
        
        console.log('Loaded members:', members);
        console.log('Loaded inviters:', inviters);
        
        updateStats(members, inviters);
        loadChurchDistribution(members);
        loadRecentRegistrations(members);
        loadFileManagement(members, inviters);
        loadInvitersManagement(inviters);
        loadMembersManagement(members);
        loadAnalytics(); // Load analytics data
        loadNotifications(); // Load notifications log
        loadActiveInviters(); // Load active inviters
        
        setupSearch();

         // Load analytics only if Analytics class is available
        if (typeof Analytics !== 'undefined') {
            await loadAnalytics();
        } else {
            console.warn('Analytics class not available, skipping analytics');
        }
        
        // Load notifications
        await loadNotifications();
        
        // Load active inviters only if ActiveInviters class is available
        if (typeof ActiveInviters !== 'undefined') {
            await loadActiveInviters();
        } else {
            console.warn('ActiveInviters class not available, skipping active inviters');
        }
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('Error loading data: ' + error.message, 'error');
    }
}

// Update statistics cards
function updateStats(members, inviters) {
    document.getElementById('totalMembers').textContent = members.length;
    document.getElementById('totalInviters').textContent = inviters.length;
    
    const uniqueChurches = new Set(members.map(member => member.church_name));
    document.getElementById('totalChurches').textContent = uniqueChurches.size;
    
    const today = new Date().toDateString();
    const todayRegistrations = members.filter(member => 
        new Date(member.registration_date).toDateString() === today
    );
    document.getElementById('todayRegistrations').textContent = todayRegistrations.length;
}

// Load church distribution
function loadChurchDistribution(members) {
    const distributionContainer = document.getElementById('churchDistribution');
    
    const churchGroups = {};
    members.forEach(member => {
        if (!churchGroups[member.church_name]) {
            churchGroups[member.church_name] = 0;
        }
        churchGroups[member.church_name]++;
    });
    
    if (Object.keys(churchGroups).length === 0) {
        distributionContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-church"></i>
                <p>No church data available</p>
            </div>
        `;
        return;
    }
    
    distributionContainer.innerHTML = Object.entries(churchGroups)
        .map(([churchName, count]) => `
            <div class="church-item">
                <div class="church-name">${churchName}</div>
                <div class="church-count">${count} members</div>
            </div>
        `).join('');
}

// Load recent registrations
function loadRecentRegistrations(members) {
    const registrationsContainer = document.getElementById('recentRegistrations');
    
    const recentMembers = members
        .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
        .slice(0, 10);
    
    if (recentMembers.length === 0) {
        registrationsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No registrations yet</p>
            </div>
        `;
        return;
    }
    
    registrationsContainer.innerHTML = recentMembers.map(member => `
        <div class="registration-item">
            <div class="registration-info">
                <h4>${member.full_name}</h4>
                <p>${member.church_name} • Invited by: ${member.inviter_name}</p>
            </div>
            <div class="registration-date">
                ${new Date(member.registration_date).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// Load file management section
async function loadFileManagement(members, inviters) {
    const fileManagement = document.getElementById('fileManagement');
    
    if (inviters.length === 0) {
        fileManagement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No inviters available for file generation</p>
            </div>
        `;
        return;
    }
    
    fileManagement.innerHTML = inviters.map(inviter => {
        const inviterMembers = members.filter(member => member.inviter_name === inviter.full_name);
        const memberCount = inviterMembers.length;
        
        return `
            <div class="file-item">
                <div class="file-info">
                    <h4>${inviter.full_name}</h4>
                    <p>${inviter.church_name} • ${memberCount} members registered</p>
                </div>
                <div class="file-actions">
                    <button class="btn btn-download btn-sm" onclick="downloadInviterFile('${inviter.full_name}')">
                        <i class="fas fa-download"></i> Download Excel
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Download Excel file for specific inviter
async function downloadInviterFile(inviterName) {
    try {
        const members = await Database.getMembers();
        const inviterMembers = members.filter(member => member.inviter_name === inviterName);
        
        if (inviterMembers.length === 0) {
            showNotification('No members found for this inviter!', 'warning');
            return;
        }
        
        // Create Excel data
        const excelData = [
            ['Full Name', 'Email', 'Phone', 'Occupation', 'Location', 'Church', 'Registration Date'],
            ...inviterMembers.map(member => [
                member.full_name,
                member.email,
                member.phone,
                member.occupation,
                member.location,
                member.church_name,
                new Date(member.registration_date).toLocaleDateString()
            ])
        ];
        
        // Create CSV content
        const csvContent = excelData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fileName = `${inviterName.replace(/\s+/g, '_')}_Members_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification(`Excel file downloaded for ${inviterName}`, 'success');
    } catch (error) {
        console.error('Error downloading file:', error);
        showNotification('Error downloading file', 'error');
    }
}

// Load inviters management section
function loadInvitersManagement(inviters) {
    const invitersManagement = document.getElementById('invitersManagement');
    
    if (inviters.length === 0) {
        invitersManagement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <p>No inviters registered yet</p>
            </div>
        `;
        return;
    }
    
    invitersManagement.innerHTML = `
        <table class="management-table">
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Church</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${inviters.map(inviter => `
                    <tr>
                        <td>${inviter.full_name}</td>
                        <td>${inviter.email}</td>
                        <td>${inviter.church_name}</td>
                        <td>${new Date(inviter.registration_date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-edit btn-sm" onclick="editInviter('${inviter.email}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-delete btn-sm" onclick="deleteInviter('${inviter.email}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load members management section
function loadMembersManagement(members) {
    const membersManagement = document.getElementById('membersManagement');
    
    if (members.length === 0) {
        membersManagement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No members registered yet</p>
            </div>
        `;
        return;
    }
    
    membersManagement.innerHTML = `
        <table class="management-table">
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Church</th>
                    <th>Inviter</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${members.map(member => `
                    <tr>
                        <td>${member.full_name}</td>
                        <td>${member.email}</td>
                        <td>${member.phone}</td>
                        <td>${member.church_name}</td>
                        <td>${member.inviter_name}</td>
                        <td>
                            <button class="btn btn-edit btn-sm" onclick="editMember('${member.email}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-delete btn-sm" onclick="deleteMember('${member.email}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('memberSearch');
    searchInput.addEventListener('input', async function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const members = await Database.getMembers();
        
        const filteredMembers = members.filter(member => 
            member.full_name.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm) ||
            member.church_name.toLowerCase().includes(searchTerm) ||
            member.inviter_name.toLowerCase().includes(searchTerm)
        );
        
        loadFilteredMembers(filteredMembers);
    });
}

// Load filtered members
function loadFilteredMembers(members) {
    const membersManagement = document.getElementById('membersManagement');
    
    if (members.length === 0) {
        membersManagement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No members found matching your search</p>
            </div>
        `;
        return;
    }
    
    membersManagement.innerHTML = `
        <table class="management-table">
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Church</th>
                    <th>Inviter</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${members.map(member => `
                    <tr>
                        <td>${member.full_name}</td>
                        <td>${member.email}</td>
                        <td>${member.phone}</td>
                        <td>${member.church_name}</td>
                        <td>${member.inviter_name}</td>
                        <td>
                            <button class="btn btn-edit btn-sm" onclick="editMember('${member.email}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-delete btn-sm" onclick="deleteMember('${member.email}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// SIMPLIFIED Delete inviter function - uses Database class
async function deleteInviter(email) {
    if (!confirm('Are you sure you want to delete this inviter? This action cannot be undone.')) {
        return;
    }
    
    try {
        await Database.deleteInviter(email);
        showNotification('Inviter deleted successfully!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error deleting inviter:', error);
        showNotification('Error deleting inviter: ' + error.message, 'error');
    }
}

// SIMPLIFIED Delete member function - uses Database class
async function deleteMember(email) {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
        return;
    }
    
    try {
        await Database.deleteMember(email);
        showNotification('Member deleted successfully!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error deleting member:', error);
        showNotification('Error deleting member: ' + error.message, 'error');
    }
}

// REAL Edit inviter function
async function editInviter(email) {
    try {
        const inviters = await Database.getInviters();
        const inviter = inviters.find(inv => inv.email === email);
        
        if (!inviter) {
            showNotification('Inviter not found', 'error');
            return;
        }
        
        const newName = prompt('Enter new name for inviter:', inviter.full_name);
        if (newName && newName.trim() !== '') {
            // Get the supabase client from window
            const supabase = window.supabase;
            
            if (!supabase) {
                throw new Error('Database connection not available');
            }
            
            // Update in Supabase
            const { error } = await supabase
                .from('inviters')
                .update({ full_name: newName.trim() })
                .eq('email', email);
            
            if (error) {
                throw error;
            }
            
            showNotification('Inviter updated successfully!', 'success');
            
            // Refresh the data to show the change
            setTimeout(() => {
                loadAdminData();
            }, 1000);
        }
    } catch (error) {
        console.error('Error editing inviter:', error);
        showNotification('Error editing inviter: ' + error.message, 'error');
    }
}

// REAL Edit member function
async function editMember(email) {
    try {
        const members = await Database.getMembers();
        const member = members.find(mem => mem.email === email);
        
        if (!member) {
            showNotification('Member not found', 'error');
            return;
        }
        
        const newName = prompt('Enter new name for member:', member.full_name);
        if (newName && newName.trim() !== '') {
            // Get the supabase client from window
            const supabase = window.supabase;
            
            if (!supabase) {
                throw new Error('Database connection not available');
            }
            
            // Update in Supabase
            const { error } = await supabase
                .from('members')
                .update({ full_name: newName.trim() })
                .eq('email', email);
            
            if (error) {
                throw error;
            }
            
            showNotification('Member updated successfully!', 'success');
            
            // Refresh the data to show the change
            setTimeout(() => {
                loadAdminData();
            }, 1000);
        }
    } catch (error) {
        console.error('Error editing member:', error);
        showNotification('Error editing member: ' + error.message, 'error');
    }
}

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked sidebar item
    event.target.classList.add('active');
    
    // Update section title and description
    updateSectionHeader(sectionId);
}

// Update section header based on section
function updateSectionHeader(sectionId) {
    const sectionTitles = {
        overview: 'Dashboard Overview',
        analytics: 'Analytics Dashboard',
        files: 'File Management',
        inviters: 'Manage Inviters',
        members: 'Manage Members',
        attendance: 'Attendance Management',
        notifications: 'Notifications Log',
        exports: 'Data Export',
        'active-inviters': 'Active Inviters Leaderboard'
    };
    
    const sectionDescriptions = {
        overview: 'Real-time statistics and analytics',
        analytics: 'Registration trends and performance metrics',
        files: 'Download Excel files for each inviter',
        inviters: 'Manage registered inviters',
        members: 'Manage all member registrations',
        attendance: 'Track event attendance and create events',
        notifications: 'View email and SMS notification logs',
        exports: 'Export complete datasets',
        'active-inviters': 'Daily and weekly goal achievers'
    };
    
    document.getElementById('sectionTitle').textContent = sectionTitles[sectionId] || 'Admin Panel';
    document.getElementById('sectionDescription').textContent = sectionDescriptions[sectionId] || 'Management dashboard';
}

// Refresh data
async function refreshData() {
    const refreshBtn = event?.target?.closest('.btn');
    
    if (refreshBtn) {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        try {
            await loadAdminData();
            showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            showNotification('Error refreshing data', 'error');
        } finally {
            refreshBtn.innerHTML = originalHtml;
            refreshBtn.disabled = false;
        }
    } else {
        // Fallback if no button context
        await loadAdminData();
        showNotification('Data refreshed successfully!', 'success');
    }
}

// Export all data
async function exportAllData() {
    try {
        const members = await Database.getMembers();
        
        if (members.length === 0) {
            showNotification('No data to export!', 'warning');
            return;
        }
        
        const excelData = [
            ['Full Name', 'Email', 'Phone', 'Occupation', 'Location', 'Church', 'Inviter', 'Registration Date'],
            ...members.map(member => [
                member.full_name,
                member.email,
                member.phone,
                member.occupation,
                member.location,
                member.church_name,
                member.inviter_name,
                new Date(member.registration_date).toLocaleDateString()
            ])
        ];
        
        const csvContent = excelData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fileName = `JAYC_All_Data_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('All data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

// Export inviters data
async function exportInvitersData() {
    try {
        const inviters = await Database.getInviters();
        const members = await Database.getMembers();
        
        if (inviters.length === 0) {
            showNotification('No inviter data to export!', 'warning');
            return;
        }
        
        const excelData = [
            ['Full Name', 'Email', 'Church', 'Members Registered', 'Registration Date'],
            ...inviters.map(inviter => {
                const memberCount = members.filter(member => member.inviter_name === inviter.full_name).length;
                return [
                    inviter.full_name,
                    inviter.email,
                    inviter.church_name,
                    memberCount,
                    new Date(inviter.registration_date).toLocaleDateString()
                ];
            })
        ];
        
        const csvContent = excelData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fileName = `JAYC_Inviters_Data_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Inviters data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting inviters:', error);
        showNotification('Error exporting inviters data', 'error');
    }
}

// Generate all inviter files
function generateAllInviterFiles() {
    showNotification('Batch file generation coming soon!', 'info');
}

// Logout function
function logout() {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminLoginForm').reset();
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('mobile-open') &&
        !sidebar.contains(event.target) &&
        !mobileBtn.contains(event.target)) {
        sidebar.classList.remove('mobile-open');
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('mobile-open');
    }
});

// Load Analytics Data
async function loadAnalytics() {
    try {
        // Check if Analytics class exists
        if (typeof Analytics === 'undefined') {
            console.warn('Analytics class not available');
            showNotification('Analytics features not available', 'warning');
            return;
        }
        
        const period = document.getElementById('analyticsPeriod')?.value || 30;
        const trends = await Analytics.getRegistrationTrends(parseInt(period));
        const performance = await Analytics.getInviterPerformance();
        const dailyStats = await Analytics.getDailyStats();
        
        // Update registration trends
        const trendsContainer = document.getElementById('registrationTrends');
        if (!trendsContainer) {
            console.warn('Analytics container not found');
            return;
        }
        
        if (trends.labels.length === 0) {
            trendsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>No registration data available for the selected period</p>
                    <small>Data will appear here once registrations start coming in</small>
                </div>
            `;
        } else {
            // Enhanced analytics display
            trendsContainer.innerHTML = `
                <div class="trends-display">
                    <div class="analytics-metrics">
                        <div class="metric-card">
                            <div class="metric-value">${trends.total || trends.data.reduce((a, b) => a + b, 0)}</div>
                            <div class="metric-label">Total Registrations</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${trends.average || Math.round(trends.data.reduce((a, b) => a + b, 0) / trends.data.length)}</div>
                            <div class="metric-label">Average Per Day</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${period}</div>
                            <div class="metric-label">Days Analyzed</div>
                        </div>
                    </div>
                    
                    <h4 style="margin: 1.5rem 0 1rem 0; color: var(--dark);">Recent Activity</h4>
                    ${trends.labels.slice(-7).map((label, index) => {
                        const dataIndex = trends.labels.length - 7 + index;
                        return `
                            <div class="trend-item">
                                <div class="trend-date">${new Date(label).toLocaleDateString()}</div>
                                <div class="trend-count">${trends.data[dataIndex]} registrations</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        // Update top inviters
        const topInvitersContainer = document.getElementById('topInviters');
        if (topInvitersContainer) {
            const sortedInviters = Object.entries(performance)
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 5);
                
            if (sortedInviters.length === 0) {
                topInvitersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <p>No inviter performance data available</p>
                        <small>Performance data will appear as inviters start registering members</small>
                    </div>
                `;
            } else {
                topInvitersContainer.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 1rem; height: 100%;">
                        <div class="analytics-metrics">
                            <div class="metric-card">
                                <div class="metric-value">${Object.keys(performance).length}</div>
                                <div class="metric-label">Total Inviters</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${Math.max(...Object.values(performance).map(p => p.count))}</div>
                                <div class="metric-label">Top Score</div>
                            </div>
                        </div>
                        
                        <h4 style="margin: 0 0 1rem 0; color: var(--dark);">Top Performers</h4>
                        
                        <div style="flex: 1; overflow-y: auto;">
                            ${sortedInviters
                                .map(([name, data], index) => `
                                    <div class="inviter-rank" style="margin-bottom: 0.75rem;">
                                        <div class="rank-number ${index < 3 ? `rank-${index + 1}` : ''}">${index + 1}</div>
                                        <div class="inviter-details">
                                            <strong>${name}</strong>
                                            <div style="font-size: 0.9em; color: var(--gray);">${data.church}</div>
                                        </div>
                                        <div class="inviter-count">${data.count} members</div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics data', 'error');
    }
}

// Load Notifications Log
async function loadNotifications() {
    try {
        console.log('🔔 Loading notifications...');
        
        // Ensure Notifications class is available
        if (typeof Notifications === 'undefined') {
            console.error('❌ Notifications class not available');
            const notificationsLog = document.getElementById('notificationsLog');
            if (notificationsLog) {
                notificationsLog.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Notifications system not available</p>
                        <small>Please refresh the page</small>
                    </div>
                `;
            }
            return;
        }

        const filter = document.getElementById('notificationFilter')?.value || 'all';
        const notifications = Notifications.getNotifications(50, filter === 'all' ? 'all' : filter);
        const stats = Notifications.getStats();
        
        console.log('📊 Notifications loaded:', { 
            filter, 
            count: notifications.length,
            stats 
        });

        // Update stats cards
        const totalEl = document.getElementById('totalNotifications');
        const successEl = document.getElementById('successfulNotifications');
        const failedEl = document.getElementById('failedNotifications');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (successEl) successEl.textContent = stats.successful;
        if (failedEl) failedEl.textContent = stats.failed;

        const notificationsLog = document.getElementById('notificationsLog');
        
        if (!notificationsLog) {
            console.error('❌ Notifications log container not found');
            return;
        }

        if (notifications.length === 0) {
            notificationsLog.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications found</p>
                    <small>Notifications will appear here when emails are sent</small>
                    <button class="btn btn-primary btn-sm" onclick="Notifications.createSampleData(); setTimeout(loadNotifications, 500);" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Load Sample Data
                    </button>
                </div>
            `;
            return;
        }

        // Create notifications HTML
        const notificationsHTML = notifications.map(notification => {
            const successClass = notification.success ? 'success' : 'error';
            const icon = notification.success ? 'fa-check' : 'fa-times';
            const timeAgo = getTimeAgo(notification.timestamp);
            
            return `
                <div class="notification-log-item ${successClass}">
                    <div class="notification-info">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 1rem;">
                            <div style="flex: 1;">
                                <strong style="display: block; margin-bottom: 0.25rem;">${notification.event}</strong>
                                <span class="notification-type">${notification.type}</span>
                            </div>
                            <div style="color: ${notification.success ? 'var(--success)' : 'var(--danger)'}; font-size: 1.2rem;">
                                <i class="fas ${icon}"></i>
                            </div>
                        </div>
                        
                        <div class="notification-meta">
                            <span><i class="fas fa-user"></i> ${notification.recipient}</span>
                            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                        </div>
                        
                        ${notification.note ? `
                            <div style="font-size: 0.875rem; color: var(--info); margin-top: 0.5rem; padding: 0.5rem; background: rgba(72, 149, 239, 0.1); border-radius: 4px; border-left: 3px solid var(--info);">
                                <i class="fas fa-info-circle"></i> ${notification.note}
                            </div>
                        ` : ''}
                        
                        ${notification.error ? `
                            <div style="font-size: 0.875rem; color: var(--danger); margin-top: 0.5rem; padding: 0.5rem; background: rgba(247, 37, 133, 0.1); border-radius: 4px; border-left: 3px solid var(--danger);">
                                <i class="fas fa-exclamation-triangle"></i> ${notification.error}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        notificationsLog.innerHTML = notificationsHTML;
        console.log('✅ Notifications displayed successfully');
        
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        const notificationsLog = document.getElementById('notificationsLog');
        if (notificationsLog) {
            notificationsLog.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading notifications</p>
                    <small>${error.message}</small>
                    <button class="btn btn-primary btn-sm" onclick="loadNotifications()" style="margin-top: 1rem;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Helper function to show time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString();
}

// Clear notification logs
function clearNotificationLogs() {
    if (confirm('Are you sure you want to clear all notification logs? This action cannot be undone.')) {
        Notifications.clearLogs();
        showNotification('Notification logs cleared successfully!', 'success');
        loadNotifications();
    }
}

// Load Active Inviters
async function loadActiveInviters() {
    try {
        const activeData = await ActiveInviters.getActiveInviters();
        
        // If there's a specific container for active inviters, update it
        const activeContainer = document.getElementById('activeInvitersContent');
        if (activeContainer) {
            const html = `
                <div class="active-inviters-section">
                    <h3><i class="fas fa-calendar-day"></i> Daily Active Inviters</h3>
                    <p>Invited 10+ people today</p>
                    ${activeData.daily.length === 0 ? 
                        '<div class="empty-state"><p>No daily active inviters yet</p></div>' :
                        activeData.daily.map(inviter => `
                            <div class="active-inviter-item">
                                <div>
                                    <strong>${inviter.inviter_name}</strong>
                                    <div style="font-size: 0.9em; color: var(--gray);">
                                        ${inviter.church_name} • ${inviter.actual_count} members
                                    </div>
                                </div>
                                <span class="inviter-badge">${inviter.consecutive_days} days</span>
                            </div>
                        `).join('')
                    }
                </div>
                
                <div class="active-inviters-section">
                    <h3><i class="fas fa-calendar-week"></i> Weekly Active Inviters</h3>
                    <p>3+ consecutive days of 10+ invitations</p>
                    ${activeData.weekly.length === 0 ? 
                        '<div class="empty-state"><p>No weekly active inviters yet</p></div>' :
                        activeData.weekly.map(inviter => `
                            <div class="active-inviter-item weekly-inviter">
                                <div>
                                    <strong>${inviter.inviter_name}</strong>
                                    <div style="font-size: 0.9em; color: var(--gray);">
                                        ${inviter.church_name} • ${inviter.consecutive_days} days streak
                                    </div>
                                </div>
                                <span class="inviter-badge weekly-badge">⭐ Weekly</span>
                            </div>
                        `).join('')
                    }
                </div>
            `;
            
            activeContainer.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Error loading active inviters:', error);
    }
}

// Create Event Function - FIXED
function createNewEvent() {
    const eventName = prompt('Enter event name:');
    if (!eventName) return;
    
    const eventDate = prompt('Enter event date (YYYY-MM-DD):');
    if (!eventDate) return;
    
    const eventTime = prompt('Enter event time (HH:MM):', '16:00');
    if (!eventTime) return;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventDate)) {
        showNotification('Please enter a valid date in YYYY-MM-DD format', 'error');
        return;
    }
    
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(eventTime)) {
        showNotification('Please enter a valid time in HH:MM format', 'error');
        return;
    }
    
    // Combine date and time
    const eventDateTime = `${eventDate}T${eventTime}:00`;
    
    // In a real implementation, you would save this to your database
    // For now, we'll just show a notification
    showNotification(`Event "${eventName}" created for ${eventDate} at ${eventTime}`, 'success');
    
    console.log('New event created:', {
        name: eventName,
        date: eventDateTime,
        created: new Date().toISOString()
    });
    
    // You can add database saving logic here later:
    // await saveEventToDatabase({ name: eventName, date: eventDateTime });
}

// Attendance Management Functions
async function loadAttendance() {
    showNotification('Attendance feature coming soon!', 'info');
}

function markAllPresent() {
    showNotification('Mark all present feature coming soon!', 'info');
}

function createNewEvent() {
    showNotification('Create event feature coming soon!', 'info');
}

// Make functions globally available
window.showSection = showSection;
window.refreshData = refreshData;
window.logout = logout;
window.exportAllData = exportAllData;
window.exportInvitersData = exportInvitersData;
window.generateAllInviterFiles = generateAllInviterFiles;
window.downloadInviterFile = downloadInviterFile;
window.editInviter = editInviter;
window.editMember = editMember;
window.deleteInviter = deleteInviter;
window.deleteMember = deleteMember;
window.toggleSidebar = toggleSidebar;
window.loadAnalytics = loadAnalytics;
window.loadNotifications = loadNotifications;
window.clearNotificationLogs = clearNotificationLogs;
window.loadAttendance = loadAttendance;
window.markAllPresent = markAllPresent;
window.createEvent = createEvent;

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        animation: slideInRight 0.3s ease;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);