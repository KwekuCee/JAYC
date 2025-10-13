// Database handler with Supabase integration - DEBUG VERSION
const SUPABASE_URL = 'https://bbmcgriiakxlrzdwogqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWNncmlpYWt4bHJ6ZHdvZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODEzOTgsImV4cCI6MjA3NTI1NzM5OH0.b01T393EkDXuMzt6GPoeDnOdNQ8Aan-2yYA-fcZikfQ';

console.log('🚀 DEBUG: Starting database initialization...');

let supabase;

try {
    console.log('DEBUG: Creating Supabase client...');
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ DEBUG: Supabase client created successfully');
    window.supabase = supabase;
} catch (error) {
    console.error('❌ DEBUG: Failed to create Supabase client:', error);
    throw error;
}

// Test connection immediately
async function testConnection() {
    try {
        console.log('DEBUG: Testing database connection...');
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ DEBUG: Database test failed:', error);
            return false;
        }

        console.log('✅ DEBUG: Database connection successful! Found', data?.length, 'inviters');
        return true;
    } catch (error) {
        console.error('❌ DEBUG: Connection test error:', error);
        return false;
    }
}

// Test immediately
testConnection().then(success => {
    console.log('DEBUG: Connection test completed:', success);
});

// SIMPLE DATABASE CLASS - MINIMAL VERSION
class Database {
    static async getInviters() {
        console.log('DEBUG: getInviters called');
        try {
            const { data, error } = await supabase
                .from('inviters')
                .select('*')
                .order('full_name');

            if (error) {
                console.error('DEBUG: Error in getInviters:', error);
                return [];
            }

            console.log('DEBUG: getInviters returning', data?.length, 'inviters');
            return data || [];
        } catch (error) {
            console.error('DEBUG: Catch error in getInviters:', error);
            return [];
        }
    }
    
    static async getMembers() {
        console.log('DEBUG: getMembers called');
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('registration_date', { ascending: false });

            if (error) {
                console.error('DEBUG: Error in getMembers:', error);
                return [];
            }

            console.log('DEBUG: getMembers returning', data?.length, 'members');
            return data || [];
        } catch (error) {
            console.error('DEBUG: Catch error in getMembers:', error);
            return [];
        }
    }
    
    static async registerInviter(inviterData) {
        console.log('DEBUG: registerInviter called');
        try {
            const { data, error } = await supabase
                .from('inviters')
                .insert([{ ...inviterData, registration_date: new Date().toISOString() }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('DEBUG: Error in registerInviter:', error);
            throw error;
        }
    }
    
    static async registerMember(memberData) {
        console.log('DEBUG: registerMember called');
        try {
            const { data, error } = await supabase
                .from('members')
                .insert([{ ...memberData, registration_date: new Date().toISOString() }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('DEBUG: Error in registerMember:', error);
            throw error;
        }
    }
}

// Make globally available
window.Database = Database;
console.log('✅ DEBUG: Database class initialized and available globally');

// Test if Database is working
setTimeout(async () => {
    console.log('DEBUG: Testing Database class...');
    try {
        const inviters = await Database.getInviters();
        const members = await Database.getMembers();
        console.log('DEBUG: Final test - Inviters:', inviters.length, 'Members:', members.length);
    } catch (error) {
        console.error('DEBUG: Final test failed:', error);
    }
}, 1000);
