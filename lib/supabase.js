// lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

try {
  require('dotenv').config();
} catch (e) {}

let supabaseInstance = null;

module.exports = {
  get supabase() {
    if (!supabaseInstance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return {
          from: () => { throw new Error("Supabase credentials missing in environment variables. Please check Vercel settings."); },
          auth: {}
        };
      }
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
  }
};
