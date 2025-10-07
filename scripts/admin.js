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
        
        setupSearch();
        
        
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
    
    // Update section title
    const sectionTitles = {
        overview: 'Dashboard Overview',
        files: 'File Management',
        inviters: 'Manage Inviters',
        members: 'Manage Members',
        exports: 'Data Export'
    };
    
    const sectionDescriptions = {
        overview: 'Real-time statistics and analytics',
        files: 'Download Excel files for each inviter',
        inviters: 'Manage registered inviters',
        members: 'Manage all member registrations',
        exports: 'Export complete datasets'
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

// Analytics Functions
async function loadAnalytics() {
    try {
        const period = document.getElementById('analyticsPeriod').value;
        
        // Load registration trends
        const trends = await Analytics.getRegistrationTrends(parseInt(period));
        renderTrendsChart(trends);
        
        // Load church distribution
        const distribution = await Analytics.getChurchDistribution();
        renderDistributionChart(distribution);
        
        // Load inviter performance
        const performance = await Analytics.getInviterPerformance();
        renderInviterPerformance(performance);
        
        // Load daily stats
        const dailyStats = await Analytics.getDailyStats();
        updateAnalyticsStats(dailyStats);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics data', 'error');
    }
}

function renderTrendsChart(trends) {
    const ctx = document.getElementById('trendsCanvas').getContext('2d');
    
    // Simple chart rendering (you can integrate Chart.js for better charts)
    const canvas = document.getElementById('trendsCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (trends.labels.length === 0) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Simple bar chart implementation
    const maxValue = Math.max(...trends.data);
    const barWidth = (canvas.width - 100) / trends.data.length;
    const scale = (canvas.height - 50) / maxValue;
    
    ctx.fillStyle = '#4361ee';
    
    trends.data.forEach((value, index) => {
        const barHeight = value * scale;
        const x = 50 + index * barWidth;
        const y = canvas.height - barHeight - 30;
        
        ctx.fillRect(x, y, barWidth - 5, barHeight);
        
        // Label
        ctx.fillStyle = '#2b2d42';
        ctx.font = '12px Arial';
        ctx.fillText(value, x + (barWidth - 5) / 2, y - 5);
        
        // Date label
        if (index % Math.ceil(trends.labels.length / 10) === 0) {
            const date = new Date(trends.labels[index]);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            ctx.fillText(label, x + (barWidth - 5) / 2, canvas.height - 10);
        }
        
        ctx.fillStyle = '#4361ee';
    });
}

function renderDistributionChart(distribution) {
    const ctx = document.getElementById('distributionCanvas').getContext('2d');
    const canvas = document.getElementById('distributionCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (distribution.labels.length === 0) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Simple pie chart implementation
    const total = distribution.data.reduce((sum, value) => sum + value, 0);
    let startAngle = 0;
    
    distribution.data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = distribution.colors[index % distribution.colors.length];
        ctx.fill();
        
        // Label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = canvas.width / 2 + Math.cos(labelAngle) * (Math.min(canvas.width, canvas.height) / 3 + 20);
        const labelY = canvas.height / 2 + Math.sin(labelAngle) * (Math.min(canvas.width, canvas.height) / 3 + 20);
        
        ctx.fillStyle = '#2b2d42';
        ctx.font = '12px Arial';
        ctx.fillText(distribution.labels[index], labelX, labelY);
        
        startAngle += sliceAngle;
    });
}

function renderInviterPerformance(performance) {
    const container = document.getElementById('inviterPerformance');
    
    const sortedInviters = Object.entries(performance)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10); // Top 10
    
    if (sortedInviters.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No inviter data available</p></div>';
        return;
    }
    
    container.innerHTML = sortedInviters.map(([name, data], index) => `
        <div class="inviter-rank">
            <div class="rank-number ${index < 3 ? `rank-${index + 1}` : ''}">${index + 1}</div>
            <div class="inviter-details">
                <strong>${name}</strong>
                <div class="notification-meta">${data.church}</div>
            </div>
            <div class="inviter-count">${data.count} members</div>
        </div>
    `).join('');
}

function updateAnalyticsStats(stats) {
    document.getElementById('totalRegistrations').textContent = stats.totalMembers;
    document.getElementById('todayRegistrations').textContent = stats.todayRegistrations;
    document.getElementById('activeChurches').textContent = new Set(stats.churchDistribution || []).size;
    document.getElementById('activeInviters').textContent = stats.totalInviters;
}

// Attendance Functions
async function loadAttendance() {
    try {
        const date = document.getElementById('attendanceDate').value;
        const report = await Attendance.getAttendanceReport(date);
        renderAttendanceList(report);
        
        const events = await Attendance.getEvents();
        renderEventsList(events);
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        showNotification('Error loading attendance data', 'error');
    }
}

function renderAttendanceList(attendance) {
    const container = document.getElementById('attendanceList');
    
    if (attendance.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No attendance records for this date</p></div>';
        return;
    }
    
    container.innerHTML = attendance.map(record => `
        <div class="attendance-item ${record.status}">
            <div class="attendance-info">
                <strong>${record.members?.full_name || 'Unknown Member'}</strong>
                <div class="notification-meta">
                    ${record.members?.church_name || ''} • 
                    ${record.members?.inviter_name || ''}
                </div>
            </div>
            <div class="attendance-actions">
                <span class="attendance-status status-${record.status}">${record.status}</span>
                <button class="btn btn-sm btn-primary" onclick="markAttendance('${record.member_email}', 'present')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="markAttendance('${record.member_email}', 'late')">
                    <i class="fas fa-clock"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="markAttendance('${record.member_email}', 'absent')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderEventsList(events) {
    const container = document.getElementById('eventsList');
    
    if (events.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No upcoming events</p></div>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <h4>${event.event_name}</h4>
            <p><i class="fas fa-calendar"></i> ${new Date(event.event_date).toLocaleDateString()} ${event.event_time || ''}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${event.location || 'TBA'}</p>
            ${event.description ? `<p>${event.description}</p>` : ''}
        </div>
    `).join('');
}

async function markAttendance(email, status) {
    try {
        const date = document.getElementById('attendanceDate').value;
        await Attendance.markAttendance(email, date, status);
        showNotification(`Attendance marked as ${status}`, 'success');
        loadAttendance(); // Refresh the list
    } catch (error) {
        console.error('Error marking attendance:', error);
        showNotification('Error marking attendance', 'error');
    }
}

async function markAllPresent() {
    if (!confirm('Mark all members as present for today?')) return;
    
    try {
        const members = await Database.getMembers();
        const date = new Date().toISOString().split('T')[0];
        
        for (const member of members) {
            await Attendance.markAttendance(member.email, date, 'present');
        }
        
        showNotification('All members marked as present', 'success');
        loadAttendance();
    } catch (error) {
        console.error('Error marking all present:', error);
        showNotification('Error marking attendance', 'error');
    }
}

async function createEvent() {
    const name = prompt('Enter event name:');
    if (!name) return;
    
    const date = prompt('Enter event date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    
    const time = prompt('Enter event time (HH:MM):', '19:00');
    const location = prompt('Enter location:');
    const description = prompt('Enter description:');
    
    try {
        await Attendance.createEvent({
            event_name: name,
            event_date: date,
            event_time: time,
            location: location,
            description: description
        });
        
        showNotification('Event created successfully', 'success');
        loadAttendance();
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification('Error creating event', 'error');
    }
}

// Notifications Functions
function loadNotifications() {
    try {
        const filter = document.getElementById('notificationFilter').value;
        const logs = Notifications.getNotificationLogs(50, filter);
        renderNotificationsLog(logs);
        
        const stats = Notifications.getNotificationStats();
        updateNotificationStats(stats);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNotification('Error loading notification logs', 'error');
    }
}

function renderNotificationsLog(logs) {
    const container = document.getElementById('notificationsLog');
    
    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notification logs</p></div>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="notification-log-item ${log.success ? 'success' : 'error'}">
            <div class="notification-info">
                <div class="notification-type">${log.type}</div>
                <strong>${log.event}</strong>
                <div class="notification-meta">
                    ${new Date(log.timestamp).toLocaleString()} • 
                    ${log.data.to_email || log.data.phoneNumber || 'System'}
                </div>
            </div>
            <div class="notification-status">
                ${log.success ? '✅' : '❌'}
            </div>
        </div>
    `).join('');
}

function updateNotificationStats(stats) {
    document.getElementById('totalNotifications').textContent = stats.total;
    document.getElementById('successfulNotifications').textContent = stats.successful;
    document.getElementById('failedNotifications').textContent = stats.failed;
}

function clearNotificationLogs() {
    if (confirm('Are you sure you want to clear all notification logs?')) {
        Notifications.clearNotificationLogs();
        showNotification('Notification logs cleared', 'success');
        loadNotifications();
    }
}

function exportAnalytics() {
    showNotification('Export feature coming soon!', 'info');
}

// Update section titles
const sectionTitles = {
    overview: 'Dashboard Overview',
    files: 'File Management',
    inviters: 'Manage Inviters',
    members: 'Manage Members',
    exports: 'Data Export',
    analytics: 'Analytics & Reports',
    attendance: 'Attendance Tracking',
    notifications: 'Notifications Log'
};

const sectionDescriptions = {
    overview: 'Real-time statistics and analytics',
    files: 'Download Excel files for each inviter',
    inviters: 'Manage registered inviters',
    members: 'Manage all member registrations',
    exports: 'Export complete datasets',
    analytics: 'Registration trends and performance analytics',
    attendance: 'Track member attendance and events',
    notifications: 'View email and SMS notification logs'
};

// Make new functions globally available
window.loadAnalytics = loadAnalytics;
window.loadAttendance = loadAttendance;
window.markAttendance = markAttendance;
window.markAllPresent = markAllPresent;
window.createEvent = createEvent;
window.loadNotifications = loadNotifications;
window.clearNotificationLogs = clearNotificationLogs;
window.exportAnalytics = exportAnalytics;

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





