// Database handler with Supabase integration
const SUPABASE_URL = 'https://bfmiudjyvnpwgnshpvdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbWl1ZGp5dm5wd2duc2hwdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc1MTYsImV4cCI6MjA3NTE0MzUxNn0.1xjr8SFKZvtpPSqzMSpOriLF8jZ81N7HS6fFdESBsnc';

// Initialize Supabase and make it globally available
let supabase;
let supabaseAvailable = false;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized successfully');
    supabaseAvailable = true;
    
    // Make supabase available globally for all files
    window.supabase = supabase;
} catch (error) {
    console.error('Supabase initialization failed:', error);
    supabase = null;
    window.supabase = null;
    supabaseAvailable = false;
}

// Enhanced connection test
async function testSupabaseConnection() {
    console.log('=== SUPABASE CONNECTION TEST ===');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Key exists:', !!SUPABASE_ANON_KEY);
    console.log('Supabase client created:', !!supabase);
    console.log('Supabase available:', supabaseAvailable);

    if (!supabase) {
        console.log('❌ Supabase client not created - using localStorage fallback');
        return false;
    }

    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('inviters')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection FAILED:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details
            });
            return false;
        } else {
            console.log('✅ Supabase connection SUCCESSFUL!');
            console.log('Test response:', data);
            return true;
        }
    } catch (error) {
        console.error('❌ Supabase test failed completely:', error);
        return false;
    }
}

// Run connection test immediately
testSupabaseConnection().then(connected => {
    console.log('Final Supabase status:', connected ? 'CONNECTED' : 'NOT CONNECTED');
    window.supabaseAvailable = connected;
});

class Database {
    static async registerInviter(inviterData) {
        console.log('Database.registerInviter called with:', inviterData);
        
        // Validate required fields
        if (!inviterData.full_name || !inviterData.email || !inviterData.church_name) {
            throw new Error('Missing required fields: full_name, email, or church_name');
        }
        
        // Check if Supabase is actually working
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
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
            
            console.log('Supabase response - data:', data, 'error:', error);
            
            if (error) {
                console.error('Supabase insert failed, falling back to localStorage');
                return this._registerInviterLocal(inviterData);
            }
            
            if (!data || data.length === 0) {
                throw new Error('No data returned from database');
            }
            
            return data[0];
            
        } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
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
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
            console.log('Using localStorage fallback for getInviters');
            return JSON.parse(localStorage.getItem('inviters')) || [];
        }
        
        try {
            const { data, error } = await supabase
                .from('inviters')
                .select('*')
                .order('full_name');
            
            if (error) {
                console.error('Supabase getInviters failed, using localStorage:', error);
                return JSON.parse(localStorage.getItem('inviters')) || [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            return JSON.parse(localStorage.getItem('inviters')) || [];
        }
    }
    
    static async getMembers() {
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
            console.log('Using localStorage fallback for getMembers');
            return JSON.parse(localStorage.getItem('members')) || [];
        }
        
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('registration_date', { ascending: false });
            
            if (error) {
                console.error('Supabase getMembers failed, using localStorage:', error);
                return JSON.parse(localStorage.getItem('members')) || [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            return JSON.parse(localStorage.getItem('members')) || [];
        }
    }
    
    static async registerMember(memberData) {
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
            console.log('Using localStorage fallback for member registration');
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
            
            if (error) {
                console.error('Supabase registerMember failed, using localStorage:', error);
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
            
            return data ? data[0] : null;
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

    // NEW: Delete methods that work with both Supabase and localStorage
    static async deleteInviter(email) {
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
            console.log('Using localStorage fallback for deleteInviter');
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
            console.error('Supabase delete failed, trying localStorage:', error);
            // Fallback to localStorage
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            const updatedInviters = inviters.filter(inviter => inviter.email !== email);
            localStorage.setItem('inviters', JSON.stringify(updatedInviters));
            return true;
        }
    }

    static async deleteMember(email) {
        const isSupabaseWorking = await testSupabaseConnection();
        
        if (!isSupabaseWorking) {
            console.log('Using localStorage fallback for deleteMember');
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
            console.error('Supabase delete failed, trying localStorage:', error);
            // Fallback to localStorage
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
window.supabaseAvailable = supabaseAvailable;

console.log('Database.js loaded successfully');
