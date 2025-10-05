// Database handler with Supabase integration ONLY
const SUPABASE_URL = 'https://bbmcgriiakxlrzdwogqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWNncmlpYWt4bHJ6ZHdvZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODEzOTgsImV4cCI6MjA3NTI1NzM5OH0.b01T393EkDXuMzt6GPoeDnOdNQ8Aan-2yYA-fcZikfQ';

// Initialize Supabase
let supabase = null;

console.log('=== SUPABASE INITIALIZATION ===');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase library available:', typeof window.supabase !== 'undefined');
console.log('createClient function available:', typeof window.supabase?.createClient !== 'undefined');

try {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase library not loaded. Check the script tag.');
    }
    
    if (typeof window.supabase.createClient === 'undefined') {
        throw new Error('Supabase createClient function not available.');
    }
    
    // Create Supabase client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (!supabase) {
        throw new Error('Supabase client creation returned null');
    }
    
    console.log('✅ Supabase client created successfully');
    
    // Test the connection immediately
    const { data, error } = await supabase
        .from('inviters')
        .select('count')
        .limit(1);
    
    if (error) {
        throw new Error(`Supabase connection test failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection test successful!');
    console.log('Test response:', data);
    
} catch (error) {
    console.error('❌ SUPABASE SETUP FAILED:', error);
    console.error('Please check:');
    console.error('1. Supabase project is active');
    console.error('2. Tables (inviters, members) exist');
    console.error('3. RLS policies allow operations');
    console.error('4. Network connection to Supabase');
    throw error; // Stop execution if Supabase fails
}

// Make Supabase globally available
window.supabase = supabase;

class Database {
    static async registerInviter(inviterData) {
        console.log('Database.registerInviter called with:', inviterData);
        
        // Validate required fields
        if (!inviterData.full_name || !inviterData.email || !inviterData.church_name) {
            throw new Error('Missing required fields: full_name, email, or church_name');
        }
        
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
            console.error('Supabase insert error:', error);
            throw new Error(`Failed to register inviter: ${error.message}`);
        }
        
        return data[0];
    }
    
    static async getInviters() {
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .order('full_name');
        
        if (error) {
            console.error('Supabase getInviters error:', error);
            throw new Error(`Failed to get inviters: ${error.message}`);
        }
        
        return data || [];
    }
    
    static async getMembers() {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('registration_date', { ascending: false });
        
        if (error) {
            console.error('Supabase getMembers error:', error);
            throw new Error(`Failed to get members: ${error.message}`);
        }
        
        return data || [];
    }
    
    static async registerMember(memberData) {
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
            console.error('Supabase registerMember error:', error);
            throw new Error(`Failed to register member: ${error.message}`);
        }
        
        return data[0];
    }

    // Delete methods
    static async deleteInviter(email) {
        const { error } = await supabase
            .from('inviters')
            .delete()
            .eq('email', email);
        
        if (error) {
            console.error('Supabase deleteInviter error:', error);
            throw new Error(`Failed to delete inviter: ${error.message}`);
        }
        
        return true;
    }

    static async deleteMember(email) {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('email', email);
        
        if (error) {
            console.error('Supabase deleteMember error:', error);
            throw new Error(`Failed to delete member: ${error.message}`);
        }
        
        return true;
    }

    // Edit methods
    static async editInviter(email, updates) {
        const { error } = await supabase
            .from('inviters')
            .update(updates)
            .eq('email', email);
        
        if (error) {
            console.error('Supabase editInviter error:', error);
            throw new Error(`Failed to edit inviter: ${error.message}`);
        }
        
        return true;
    }

    static async editMember(email, updates) {
        const { error } = await supabase
            .from('members')
            .update(updates)
            .eq('email', email);
        
        if (error) {
            console.error('Supabase editMember error:', error);
            throw new Error(`Failed to edit member: ${error.message}`);
        }
        
        return true;
    }
}

// Make Database class globally available
window.Database = Database;

console.log('✅ Database.js loaded successfully - Supabase only mode');
