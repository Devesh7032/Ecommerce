import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okwmhbjqhjqslyqktbll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rd21oYmpxaGpxc2x5cWt0YmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzQ1OTYsImV4cCI6MjA5NzQ1MDU5Nn0.QmSR6hdnWX1fMQtLkfE2WqsKGS490v9l5AeF8t0Zo2Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
