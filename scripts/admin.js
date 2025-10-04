// Enhanced Admin Dashboard Functionality
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin2024'
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
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Successful login
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminDashboard();
        } else {
            alert('Invalid admin credentials. Please try again.');
        }
    });
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    loadAdminData();
}

// Load all admin data
function loadAdminData() {
    const members = getMembers();
    const inviters = getInviters();
    
    updateStats(members, inviters);
    loadChurchDistribution(members);
    loadRecentRegistrations(members);
    loadFileManagement(members, inviters);
    loadInvitersManagement(inviters);
    loadMembersManagement(members);
    
    // Setup search functionality
    setupSearch();
}

// Get members data
function getMembers() {
    return JSON.parse(localStorage.getItem('members')) || [];
}

// Get inviters data
function getInviters() {
    return JSON.parse(localStorage.getItem('inviters')) || [];
}

// Save members data
function saveMembers(members) {
    localStorage.setItem('members', JSON.stringify(members));
}

// Save inviters data
function saveInviters(inviters) {
    localStorage.setItem('inviters', JSON.stringify(inviters));
}

// Update statistics cards
function updateStats(members, inviters) {
    document.getElementById('totalMembers').textContent = members.length;
    document.getElementById('totalInviters').textContent = inviters.length;
    
    const uniqueChurches = new Set(members.map(member => member.churchName));
    document.getElementById('totalChurches').textContent = uniqueChurches.size;
    
    const today = new Date().toDateString();
    const todayRegistrations = members.filter(member => 
        new Date(member.registrationDate).toDateString() === today
    );
    document.getElementById('todayRegistrations').textContent = todayRegistrations.length;
}

// Load church distribution
function loadChurchDistribution(members) {
    const distributionContainer = document.getElementById('churchDistribution');
    
    const churchGroups = {};
    members.forEach(member => {
        if (!churchGroups[member.churchName]) {
            churchGroups[member.churchName] = 0;
        }
        churchGroups[member.churchName]++;
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
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
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
                <h4>${member.fullName}</h4>
                <p>${member.churchName} • Invited by: ${member.inviterName}</p>
            </div>
            <div class="registration-date">
                ${new Date(member.registrationDate).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// Load file management section
function loadFileManagement(members, inviters) {
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
        const inviterMembers = members.filter(member => member.inviterName === inviter.fullName);
        const memberCount = inviterMembers.length;
        
        return `
            <div class="file-item">
                <div class="file-info">
                    <h4>${inviter.fullName}</h4>
                    <p>${inviter.churchName} • ${memberCount} members registered</p>
                </div>
                <div class="file-actions">
                    <button class="btn btn-download btn-sm" onclick="downloadInviterFile('${inviter.fullName}')">
                        <i class="fas fa-download"></i> Download Excel
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Download Excel file for specific inviter
function downloadInviterFile(inviterName) {
    const members = getMembers();
    const inviterMembers = members.filter(member => member.inviterName === inviterName);
    
    if (inviterMembers.length === 0) {
        showNotification('No members found for this inviter!', 'warning');
        return;
    }
    
    // Create Excel data
    const excelData = [
        ['Full Name', 'Email', 'Phone', 'Occupation', 'Location', 'Church', 'Registration Date'],
        ...inviterMembers.map(member => [
            member.fullName,
            member.email,
            member.phone,
            member.occupation,
            member.location,
            member.churchName,
            new Date(member.registrationDate).toLocaleDateString()
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
                        <td>${inviter.fullName}</td>
                        <td>${inviter.email}</td>
                        <td>${inviter.churchName}</td>
                        <td>${new Date(inviter.registrationDate).toLocaleDateString()}</td>
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
                        <td>${member.fullName}</td>
                        <td>${member.email}</td>
                        <td>${member.phone}</td>
                        <td>${member.churchName}</td>
                        <td>${member.inviterName}</td>
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
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const members = getMembers();
        
        const filteredMembers = members.filter(member => 
            member.fullName.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm) ||
            member.churchName.toLowerCase().includes(searchTerm) ||
            member.inviterName.toLowerCase().includes(searchTerm)
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
                        <td>${member.fullName}</td>
                        <td>${member.email}</td>
                        <td>${member.phone}</td>
                        <td>${member.churchName}</td>
                        <td>${member.inviterName}</td>
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

// Edit inviter
function editInviter(email) {
    const inviters = getInviters();
    const inviter = inviters.find(inv => inv.email === email);
    
    if (!inviter) return;
    
    // Create edit modal
    const modal = createEditModal('inviter', inviter);
    document.body.appendChild(modal);
    showModal(modal);
}

// Edit member
function editMember(email) {
    const members = getMembers();
    const member = members.find(mem => mem.email === email);
    
    if (!member) return;
    
    const modal = createEditModal('member', member);
    document.body.appendChild(modal);
    showModal(modal);
}

// Create edit modal
function createEditModal(type, data) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.id = `edit${type.charAt(0).toUpperCase() + type.slice(1)}Modal`;
    
    const isInviter = type === 'inviter';
    
    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="modal-header">
                <h3>Edit ${isInviter ? 'Inviter' : 'Member'}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <form class="modal-form" onsubmit="handle${isInviter ? 'Inviter' : 'Member'}Edit(event, '${data.email}')">
                <div class="form-group">
                    <label for="editFullName">Full Name</label>
                    <input type="text" id="editFullName" value="${data.fullName}" required>
                </div>
                <div class="form-group">
                    <label for="editEmail">Email</label>
                    <input type="email" id="editEmail" value="${data.email}" required>
                </div>
                ${isInviter ? `
                    <div class="form-group">
                        <label for="editChurch">Church Name</label>
                        <input type="text" id="editChurch" value="${data.churchName}" required>
                    </div>
                ` : `
                    <div class="form-group">
                        <label for="editPhone">Phone</label>
                        <input type="tel" id="editPhone" value="${data.phone}" required>
                    </div>
                    <div class="form-group">
                        <label for="editOccupation">Occupation</label>
                        <input type="text" id="editOccupation" value="${data.occupation}" required>
                    </div>
                    <div class="form-group">
                        <label for="editLocation">Location</label>
                        <input type="text" id="editLocation" value="${data.location}" required>
                    </div>
                    <div class="form-group">
                        <label for="editChurchName">Church Name</label>
                        <input type="text" id="editChurchName" value="${data.churchName}" required>
                    </div>
                    <div class="form-group">
                        <label for="editInviterName">Inviter Name</label>
                        <input type="text" id="editInviterName" value="${data.inviterName}" required>
                    </div>
                `}
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal(this)">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

// Handle inviter edit
function handleInviterEdit(event, oldEmail) {
    event.preventDefault();
    
    const inviters = getInviters();
    const inviterIndex = inviters.findIndex(inv => inv.email === oldEmail);
    
    if (inviterIndex === -1) return;
    
    const updatedInviter = {
        ...inviters[inviterIndex],
        fullName: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        churchName: document.getElementById('editChurch').value
    };
    
    // Update members if inviter name changed
    if (inviters[inviterIndex].fullName !== updatedInviter.fullName) {
        updateMembersInviterName(inviters[inviterIndex].fullName, updatedInviter.fullName);
    }
    
    inviters[inviterIndex] = updatedInviter;
    saveInviters(inviters);
    
    closeModal(event.target);
    loadAdminData();
    showNotification('Inviter updated successfully!', 'success');
}

// Handle member edit
function handleMemberEdit(event, oldEmail) {
    event.preventDefault();
    
    const members = getMembers();
    const memberIndex = members.findIndex(mem => mem.email === oldEmail);
    
    if (memberIndex === -1) return;
    
    members[memberIndex] = {
        ...members[memberIndex],
        fullName: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        occupation: document.getElementById('editOccupation').value,
        location: document.getElementById('editLocation').value,
        churchName: document.getElementById('editChurchName').value,
        inviterName: document.getElementById('editInviterName').value
    };
    
    saveMembers(members);
    
    closeModal(event.target);
    loadAdminData();
    showNotification('Member updated successfully!', 'success');
}

// Update members when inviter name changes
function updateMembersInviterName(oldName, newName) {
    const members = getMembers();
    const updatedMembers = members.map(member => 
        member.inviterName === oldName 
            ? { ...member, inviterName: newName }
            : member
    );
    saveMembers(updatedMembers);
}

// Delete inviter
function deleteInviter(email) {
    if (!confirm('Are you sure you want to delete this inviter? This will also remove them from all associated members.')) {
        return;
    }
    
    const inviters = getInviters();
    const inviter = inviters.find(inv => inv.email === email);
    
    if (!inviter) return;
    
    // Remove inviter from members
    const members = getMembers();
    const updatedMembers = members.map(member => 
        member.inviterName === inviter.fullName 
            ? { ...member, inviterName: 'Unknown' }
            : member
    );
    saveMembers(updatedMembers);
    
    // Remove inviter
    const updatedInviters = inviters.filter(inv => inv.email !== email);
    saveInviters(updatedInviters);
    
    loadAdminData();
    showNotification('Inviter deleted successfully!', 'success');
}

// Delete member
function deleteMember(email) {
    if (!confirm('Are you sure you want to delete this member?')) {
        return;
    }
    
    const members = getMembers();
    const updatedMembers = members.filter(member => member.email !== email);
    saveMembers(updatedMembers);
    
    loadAdminData();
    showNotification('Member deleted successfully!', 'success');
}

// Modal functions
function showModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(element) {
    const modal = element.closest('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

// Refresh data
function refreshData() {
    const refreshBtn = event.target.closest('.btn');
    const originalHtml = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
        loadAdminData();
        refreshBtn.innerHTML = originalHtml;
        refreshBtn.disabled = false;
        showNotification('Data refreshed successfully!', 'success');
    }, 1000);
}

// Export all data
function exportAllData() {
    const members = getMembers();
    
    if (members.length === 0) {
        showNotification('No data to export!', 'warning');
        return;
    }
    
    const excelData = [
        ['Full Name', 'Email', 'Phone', 'Occupation', 'Location', 'Church', 'Inviter', 'Registration Date'],
        ...members.map(member => [
            member.fullName,
            member.email,
            member.phone,
            member.occupation,
            member.location,
            member.churchName,
            member.inviterName,
            new Date(member.registrationDate).toLocaleDateString()
        ])
    ];
    
    const csvContent = excelData.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `All_Church_Data_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('All data exported successfully!', 'success');
}

// Export inviters data
function exportInvitersData() {
    const inviters = getInviters();
    const members = getMembers();
    
    if (inviters.length === 0) {
        showNotification('No inviter data to export!', 'warning');
        return;
    }
    
    const excelData = [
        ['Full Name', 'Email', 'Church', 'Members Registered', 'Registration Date'],
        ...inviters.map(inviter => {
            const memberCount = members.filter(member => member.inviterName === inviter.fullName).length;
            return [
                inviter.fullName,
                inviter.email,
                inviter.churchName,
                memberCount,
                new Date(inviter.registrationDate).toLocaleDateString()
            ];
        })
    ];
    
    const csvContent = excelData.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `All_Inviters_Data_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Inviters data exported successfully!', 'success');
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
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4cc9f0' : type === 'warning' ? '#f8961e' : '#4361ee'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;

document.head.appendChild(style);
