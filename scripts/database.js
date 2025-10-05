// Database handler with Supabase integration ONLY
const SUPABASE_URL = 'https://bbmcgriiakxlrzdwogqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWNncmlpYWt4bHJ6ZHdvZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODEzOTgsImV4cCI6MjA3NTI1NzM5OH0.b01T393EkDXuMzt6GPoeDnOdNQ8Aan-2yYA-fcZikfQ';

console.log('🔧 ===== SUPABASE DEBUGGING =====');
console.log('Step 1: Checking Supabase library...');
console.log('window.supabase exists:', typeof window.supabase !== 'undefined');
console.log('window.supabase.createClient exists:', typeof window.supabase?.createClient !== 'undefined');

if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase library not loaded! Check your script tag.');
    console.log('Make sure you have: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

let supabase;

try {
    console.log('Step 2: Creating Supabase client...');
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
}

console.log('Step 3: Testing Supabase connection...');

// Test the connection with multiple approaches
async function testSupabaseConnection() {
    try {
        console.log('Testing method 1: Simple query...');
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Query failed:', error);
            console.log('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return false;
        }

        console.log('✅ Query successful! Data:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed completely:', error);
        return false;
    }
}

// Initialize and test
(async function() {
    const isConnected = await testSupabaseConnection();
    
    if (isConnected) {
        console.log('🎉 SUPABASE CONNECTION SUCCESSFUL!');
        window.supabase = supabase;
        window.supabaseConnected = true;
    } else {
        console.error('💥 SUPABASE CONNECTION FAILED');
        console.log('Please check:');
        console.log('1. Supabase project is active and running');
        console.log('2. Tables "inviters" and "members" exist');
        console.log('3. RLS policies allow public access (or disable RLS)');
        console.log('4. Network can reach Supabase URL');
        window.supabaseConnected = false;
    }
})();

// Database class - Only works if Supabase is connected
class Database {
    static async checkConnection() {
        if (!window.supabaseConnected) {
            throw new Error('Supabase is not connected. Check console for errors.');
        }
        return true;
    }

    static async registerInviter(inviterData) {
        await this.checkConnection();
        
        const { data, error } = await supabase
            .from('inviters')
            .insert([{
                ...inviterData,
                registration_date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data[0];
    }
    
    static async getInviters() {
        await this.checkConnection();
        
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .order('full_name');

        if (error) throw error;
        return data || [];
    }
    
    static async getMembers() {
        await this.checkConnection();
        
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('registration_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }
    
    static async registerMember(memberData) {
        await this.checkConnection();
        
        const { data, error } = await supabase
            .from('members')
            .insert([{
                ...memberData,
                registration_date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data[0];
    }

    static async deleteInviter(email) {
        await this.checkConnection();
        
        const { error } = await supabase
            .from('inviters')
            .delete()
            .eq('email', email);

        if (error) throw error;
        return true;
    }

    static async deleteMember(email) {
        await this.checkConnection();
        
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('email', email);

        if (error) throw error;
        return true;
    }
}

window.Database = Database;
console.log('Database class initialized (Supabase only)');
