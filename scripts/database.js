// Database handler with Supabase integration
const SUPABASE_URL = 'https://bfmiudjyvnpwgnshpvdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbWl1ZGp5dm5wd2duc2hwdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc1MTYsImV4cCI6MjA3NTE0MzUxNn0.1xjr8SFKZvtpPSqzMSpOriLF8jZ81N7HS6fFdESBsnc';

// Initialize Supabase and make it globally available
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized successfully');
    
    // Make supabase available globally for all files
    window.supabase = supabase;
} catch (error) {
    console.error('Supabase initialization failed:', error);
    supabase = null;
    window.supabase = null;
}

class Database {
    static async registerInviter(inviterData) {
        console.log('Database.registerInviter called with:', inviterData);
        
        // Validate required fields
        if (!inviterData.full_name || !inviterData.email || !inviterData.church_name) {
            throw new Error('Missing required fields: full_name, email, or church_name');
        }
        
        // If Supabase is not available, use localStorage as fallback
        if (!supabase) {
            console.log('Using localStorage fallback for inviter');
            return this._registerInviterLocal(inviterData);
        }
        
        try {
            console.log('Attempting Supabase insert...');
            const { data, error } = await supabase
                .from('inviters')
                .insert([inviterData])
                .select();
            
            console.log('Supabase response - data:', data, 'error:', error);
            
            if (error) {
                throw error;
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
                id: Date.now(),
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
        if (!supabase) {
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
        if (!supabase) {
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
        if (!supabase) {
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const newMember = {...memberData, id: Date.now()};
            members.push(newMember);
            localStorage.setItem('members', JSON.stringify(members));
            return newMember;
        }
        
        try {
            const { data, error } = await supabase
                .from('members')
                .insert([memberData])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const newMember = {...memberData, id: Date.now()};
            members.push(newMember);
            localStorage.setItem('members', JSON.stringify(members));
            return newMember;
        }
    }
}

// Make Database class globally available
window.Database = Database;
window.supabase = supabase;
