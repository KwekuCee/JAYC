// Supabase configuration
const SUPABASE_URL = 'https://bfmiudjyvnpwgnshpvdr.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbWl1ZGp5dm5wd2duc2hwdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc1MTYsImV4cCI6MjA3NTE0MzUxNn0.1xjr8SFKZvtpPSqzMSpOriLF8jZ81N7HS6fFdESBsnc'; // Replace with your key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database functions
class Database {
    // Get all inviters
    static async getInviters() {
        try {
            const { data, error } = await supabase
                .from('inviters')
                .select('*')
                .order('full_name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching inviters:', error);
            return [];
        }
    }

    // Register new inviter
    static async registerInviter(inviterData) {
        try {
            const { data, error } = await supabase
                .from('inviters')
                .insert([inviterData])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error registering inviter:', error);
            throw error;
        }
    }

    // Get all members
    static async getMembers() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('registration_date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        }
    }

    // Register new member
    static async registerMember(memberData) {
        try {
            const { data, error } = await supabase
                .from('members')
                .insert([memberData])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error registering member:', error);
            throw error;
        }
    }

    // Get members by inviter
    static async getMembersByInviter(inviterName) {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('inviter_name', inviterName);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching members by inviter:', error);
            return [];
        }
    }
}
