// Simple database handler with error recovery
const SUPABASE_URL = 'https://bfmiudjyvnpwgnshpvdr.supabase.co'; // REPLACE WITH YOURS
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbWl1ZGp5dm5wd2duc2hwdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc1MTYsImV4cCI6MjA3NTE0MzUxNn0.1xjr8SFKZvtpPSqzMSpOriLF8jZ81N7HS6fFdESBsnc'; // REPLACE WITH YOURS

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
} catch (error) {
    console.error('Supabase init failed:', error);
    supabase = null;
}

class Database {
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

    static async registerInviter(inviterData) {
        if (!supabase) {
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            const newInviter = {...inviterData, id: Date.now()};
            inviters.push(newInviter);
            localStorage.setItem('inviters', JSON.stringify(inviters));
            return newInviter;
        }
        
        try {
            const { data, error } = await supabase
                .from('inviters')
                .insert([inviterData])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Supabase error, using localStorage:', error);
            const inviters = JSON.parse(localStorage.getItem('inviters')) || [];
            const newInviter = {...inviterData, id: Date.now()};
            inviters.push(newInviter);
            localStorage.setItem('inviters', JSON.stringify(inviters));
            return newInviter;
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
