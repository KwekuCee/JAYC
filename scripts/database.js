// Database handler with Supabase integration
const SUPABASE_URL = 'https://bfmiudjyvnpwgnshpvdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbWl1ZGp5dm5wd2duc2hwdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc1MTYsImV4cCI6MjA3NTE0MzUxNn0.1xjr8SFKZvtpPSqzMSpOriLF8jZ81N7HS6fFdESBsnc';

// Initialize Supabase and make it globally available
let supabase = null;
let supabaseAvailable = false;

console.log('=== SUPABASE INITIALIZATION ===');
console.log('Supabase library available:', typeof window.supabase !== 'undefined');
console.log('createClient function available:', typeof window.supabase?.createClient !== 'undefined');

try {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient === 'undefined') {
        throw new Error('Supabase library not loaded. Check if the script tag is correct.');
    }
    
    // Try to create Supabase client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (!supabase) {
        throw new Error('Supabase client creation returned null/undefined');
    }
    
    console.log('✅ Supabase client created successfully');
    supabaseAvailable = true;
    window.supabase = supabase;
    
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    console.error('Error details:', error.message);
    supabase = null;
    window.supabase = null;
    supabaseAvailable = false;
}

// Simple connection test
async function testSupabaseConnection() {
    console.log('=== SUPABASE CONNECTION TEST ===');
    console.log('Supabase client exists:', !!supabase);
    console.log('Supabase available flag:', supabaseAvailable);

    if (!supabase) {
        console.log('❌ No Supabase client - using localStorage fallback');
        return false;
    }

    try {
        console.log('Testing Supabase connection with simple query...');
        // Use a simpler test query
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Supabase query failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful!');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase test failed:', error);
        return false;
    }
}

// Initialize and test
(async function() {
    const connected = await testSupabaseConnection();
    console.log('Final Supabase status:', connected ? 'CONNECTED' : 'NOT CONNECTED - USING LOCALSTORAGE');
    window.supabaseAvailable = connected;
})();

class Database {
    static async registerInviter(inviterData) {
        console.log('Database.registerInviter called with:', inviterData);
        
        // Validate required fields
        if (!inviterData.full_name || !inviterData.email || !inviterData.church_name) {
            throw new Error('Missing required fields: full_name, email, or church_name');
        }
        
        // Check if Supabase is working
        if (!window.supabaseAvailable) {
            console.log('Using localStorage fallback for inviter registration');
            return this._registerInviterLocal(inviterData);
        }
        
        try {
            console.log('Attempting Supabase insert...');
            const { data, error } = await supabase
                .from('inviters')
                .insert([
                    {
                        ...inviterData,
                        registration_date: new Date().toISOString()
                    }
                ])
                .select();
            
            if (error) {
                console.error('Supabase insert failed:', error);
                console.log('Falling back to localStorage');
                return this._registerInviterLocal(inviterData);
            }
            
            return data[0];
            
        } catch (error) {
            console.error('Supabase error:', error);
            return this._registerInviterLocal(inviterData);
        }
    }
    
    static _registerInviterLocal(inviterData) {
        try {
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            
            // Check for duplicate email
            if (inviters.some(inviter => inviter.email === inviterData.email)) {
                throw new Error('An inviter with this email already exists');
            }
            
            const newInviter = {
                ...inviterData,
                id: Date.now().toString(),
                registration_date: new Date().toISOString()
            };
            
            inviters.push(newInviter);
            localStorage.setItem('inviters', JSON.stringify(inviters));
            
            console.log('Inviter saved to localStorage:', newInviter);
            return newInviter;
            
        } catch (error) {
            console.error('LocalStorage error:', error);
            throw error;
        }
    }
    
    static async getInviters() {
        if (!window.supabaseAvailable) {
            return JSON.parse(localStorage.getItem('inviters')) || [];
        }
        
        try {
            const { data, error } = await supabase
                .from('inviters')
                .select('*')
                .order('full_name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            return JSON.parse(localStorage.getItem('inviters')) || [];
        }
    }
    
    static async getMembers() {
        if (!window.supabaseAvailable) {
            return JSON.parse(localStorage.getItem('members')) || [];
        }
        
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('registration_date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            return JSON.parse(localStorage.getItem('members')) || [];
        }
    }
    
    static async registerMember(memberData) {
        if (!window.supabaseAvailable) {
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const newMember = {
                ...memberData, 
                id: Date.now().toString(),
                registration_date: new Date().toISOString()
            };
            members.push(newMember);
            localStorage.setItem('members', JSON.stringify(members));
            return newMember;
        }
        
        try {
            const { data, error } = await supabase
                .from('members')
                .insert([
                    {
                        ...memberData,
                        registration_date: new Date().toISOString()
                    }
                ])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const newMember = {
                ...memberData, 
                id: Date.now().toString(),
                registration_date: new Date().toISOString()
            };
            members.push(newMember);
            localStorage.setItem('members', JSON.stringify(members));
            return newMember;
        }
    }

    // Delete methods
    static async deleteInviter(email) {
        if (!window.supabaseAvailable) {
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            const updatedInviters = inviters.filter(inviter => inviter.email !== email);
            
            if (updatedInviters.length === inviters.length) {
                throw new Error('Inviter not found');
            }
            
            localStorage.setItem('inviters', JSON.stringify(updatedInviters));
            return true;
        }
        
        try {
            const { error } = await supabase
                .from('inviters')
                .delete()
                .eq('email', email);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Supabase delete failed, using localStorage:', error);
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            const updatedInviters = inviters.filter(inviter => inviter.email !== email);
            localStorage.setItem('inviters', JSON.stringify(updatedInviters));
            return true;
        }
    }

    static async deleteMember(email) {
        if (!window.supabaseAvailable) {
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const updatedMembers = members.filter(member => member.email !== email);
            
            if (updatedMembers.length === members.length) {
                throw new Error('Member not found');
            }
            
            localStorage.setItem('members', JSON.stringify(updatedMembers));
            return true;
        }
        
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('email', email);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Supabase delete failed, using localStorage:', error);
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const updatedMembers = members.filter(member => member.email !== email);
            localStorage.setItem('members', JSON.stringify(updatedMembers));
            return true;
        }
    }
}

// Make Database class globally available
window.Database = Database;
window.supabase = supabase;

console.log('Database.js loaded successfully');
