// Database handler with Supabase integration
const SUPABASE_URL = 'https://bbmcgriiakxlrzdwogqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWNncmlpYWt4bHJ6ZHdvZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODEzOTgsImV4cCI6MjA3NTI1NzM5OH0.b01T393EkDXuMzt6GPoeDnOdNQ8Aan-2yYA-fcZikfQ';

console.log('🚀 Initializing Supabase Database...');

let supabase;

try {
    console.log('Creating Supabase client...');
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created successfully');
    
    // Make globally available
    window.supabase = supabase;
    
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
}

// Simple connection test
async function testConnection() {
    try {
        console.log('Testing database connection...');
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Database test failed:', error);
            return false;
        }

        console.log('✅ Database connection successful!');
        console.log('Test data:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Connection test error:', error);
        return false;
    }
}

// Initialize and test
testConnection();

class Database {
    static async getInviters() {
        console.log('Fetching inviters from Supabase...');
        
        const { data, error } = await supabase
            .from('inviters')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Error fetching inviters:', error);
            throw new Error(`Failed to get inviters: ${error.message}`);
        }

        console.log(`Retrieved ${data?.length || 0} inviters`);
        return data || [];
    }
    
    static async getMembers() {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('registration_date', { ascending: false });

        if (error) {
            console.error('Error fetching members:', error);
            throw new Error(`Failed to get members: ${error.message}`);
        }

        return data || [];
    }
    
    static async registerInviter(inviterData) {
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
            console.error('Error registering inviter:', error);
            throw new Error(`Failed to register inviter: ${error.message}`);
        }

        return data[0];
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
            console.error('Error registering member:', error);
            throw new Error(`Failed to register member: ${error.message}`);
        }

        return data[0];
    }

    static async deleteInviter(email) {
        const { error } = await supabase
            .from('inviters')
            .delete()
            .eq('email', email);

        if (error) {
            console.error('Error deleting inviter:', error);
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
            console.error('Error deleting member:', error);
            throw new Error(`Failed to delete member: ${error.message}`);
        }

        return true;
    }

    // Active Inviters - Daily Goals Tracking
    static async getInviterDailyGoals(inviterEmail = null) {
        let query = supabase
            .from('inviter_daily_goals')
            .select('*')
            .order('date', { ascending: false });

        if (inviterEmail) {
            query = query.eq('inviter_email', inviterEmail);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching daily goals:', error);
            throw new Error(`Failed to get daily goals: ${error.message}`);
        }

        return data || [];
    }

    static async updateInviterDailyGoal(inviterEmail, inviterName, date, count) {
        const { data, error } = await supabase
            .from('inviter_daily_goals')
            .upsert({
                inviter_email: inviterEmail,
                inviter_name: inviterName,
                date: date,
                actual_count: count,
                goal_achieved: count >= 10,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('Error updating daily goal:', error);
            throw new Error(`Failed to update daily goal: ${error.message}`);
        }

        return data[0];
    }

    // Get today's registrations count for an inviter
    static async getTodayRegistrationsCount(inviterName) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('inviter_name', inviterName)
            .gte('registration_date', `${today}T00:00:00`)
            .lte('registration_date', `${today}T23:59:59`);

        if (error) {
            console.error('Error fetching today registrations:', error);
            throw new Error(`Failed to get today registrations: ${error.message}`);
        }

        return data?.length || 0;
    }

    // Get inviter streak data
    static async getInviterStreak(inviterEmail) {
        const { data, error } = await supabase
            .from('inviter_daily_goals')
            .select('date, goal_achieved')
            .eq('inviter_email', inviterEmail)
            .order('date', { ascending: false })
            .limit(7);

        if (error) {
            console.error('Error fetching inviter streak:', error);
            throw new Error(`Failed to get inviter streak: ${error.message}`);
        }

        return data || [];
    }
}

// Make Database class globally available
window.Database = Database;

console.log('✅ Database.js loaded successfully with Active Inviters support');