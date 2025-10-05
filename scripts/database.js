// Minimal Supabase Test
console.log('=== STARTING SUPABASE DEBUG ===');

// Replace with your actual new credentials
const SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY_HERE';

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
