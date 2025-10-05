// Minimal Supabase Test
console.log('=== STARTING SUPABASE DEBUG ===');

// Replace with your actual new credentials
const SUPABASE_URL = 'https://bbmcgriiakxlrzdwogqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWNncmlpYWt4bHJ6ZHdvZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODEzOTgsImV4cCI6MjA3NTI1NzM5OH0.b01T393EkDXuMzt6GPoeDnOdNQ8Aan-2yYA-fcZikfQ';

console.log('1. Checking Supabase library...');
console.log('window.supabase:', typeof window.supabase);
console.log('window.supabase.createClient:', typeof window.supabase?.createClient);

if (typeof window.supabase === 'undefined') {
    console.error('❌ CRITICAL: Supabase library not loaded!');
    console.log('The script tag for Supabase is missing or failed to load.');
} else {
    console.log('✅ Supabase library loaded');
}

try {
    console.log('2. Creating Supabase client...');
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created');
    
    console.log('3. Testing connection...');
    const { data, error } = await supabase.from('inviters').select('*').limit(1);
    
    if (error) {
        console.error('❌ Connection test failed:', error);
    } else {
        console.log('✅ Connection successful!', data);
    }
    
} catch (error) {
    console.error('❌ Setup failed:', error);
}
