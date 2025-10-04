const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// Data storage (in production, use a database)
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    // In production, use proper JWT validation
    if (token !== 'admin-secret-token') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    next();
};

// Routes

// Get all inviters
app.get('/api/inviters', (req, res) => {
    try {
        const inviters = JSON.parse(fs.readFileSync('./data/inviters.json', 'utf8') || '[]');
        res.json(inviters);
    } catch (error) {
        res.json([]);
    }
});

// Register new inviter
app.post('/api/inviters', (req, res) => {
    const { fullName, email, churchName, authCode } = req.body;
    
    // Validate auth code
    if (authCode !== 'CHURCH2024') {
        return res.status(400).json({ error: 'Invalid authentication code' });
    }
    
    const inviters = JSON.parse(fs.readFileSync('./data/inviters.json', 'utf8') || '[]');
    
    // Check for duplicate email
    if (inviters.some(inviter => inviter.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    
    const newInviter = {
        id: Date.now().toString(),
        fullName,
        email,
        churchName,
        registrationDate: new Date().toISOString()
    };
    
    inviters.push(newInviter);
    fs.writeFileSync('./data/inviters.json', JSON.stringify(inviters, null, 2));
    
    res.json({ message: 'Inviter registered successfully', inviter: newInviter });
});

// Register new member
app.post('/api/members', (req, res) => {
    const memberData = req.body;
    
    const members = JSON.parse(fs.readFileSync('./data/members.json', 'utf8') || '[]');
    members.push({
        id: Date.now().toString(),
        ...memberData,
        registrationDate: new Date().toISOString()
    });
    
    fs.writeFileSync('./data/members.json', JSON.stringify(members, null, 2));
    
    // Generate Excel file
    generateExcelFile(memberData.inviterName, members.filter(m => m.inviterName === memberData.inviterName));
    
    res.json({ message: 'Member registered successfully' });
});

// Generate Excel file function
async function generateExcelFile(inviterName, members) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members');
    
    // Add headers
    worksheet.columns = [
        { header: 'Full Name', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Occupation', key: 'occupation', width: 20 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Church', key: 'churchName', width: 25 },
        { header: 'Registration Date', key: 'registrationDate', width: 20 }
    ];
    
    // Add data
    members.forEach(member => {
        worksheet.addRow({
            fullName: member.fullName,
            email: member.email,
            phone: member.phone,
            occupation: member.occupation,
            location: member.location,
            churchName: member.churchName,
            registrationDate: new Date(member.registrationDate).toLocaleDateString()
        });
    });
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4361EE' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    // Create inviter directory if it doesn't exist
    const inviterDir = `./data/exports/${inviterName.replace(/\s+/g, '_')}`;
    if (!fs.existsSync(inviterDir)) {
        fs.mkdirSync(inviterDir, { recursive: true });
    }
    
    // Save file
    const fileName = `${inviterName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = `${inviterDir}/${fileName}`;
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

// Admin routes
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    try {
        const members = JSON.parse(fs.readFileSync('./data/members.json', 'utf8') || '[]');
        const inviters = JSON.parse(fs.readFileSync('./data/inviters.json', 'utf8') || '[]');
        
        const stats = {
            totalMembers: members.length,
            totalInviters: inviters.length,
            membersByChurch: {},
            recentRegistrations: members.slice(-10).reverse()
        };
        
        // Calculate members by church
        members.forEach(member => {
            stats.membersByChurch[member.churchName] = (stats.membersByChurch[member.churchName] || 0) + 1;
        });
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error loading statistics' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
});