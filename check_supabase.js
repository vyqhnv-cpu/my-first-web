require('dotenv').config();
const { supabase } = require('./lib/supabase');

async function checkSupabase() {
  const { data: enrollments, error: e1 } = await supabase.from('enrollments').select('*');
  console.log('enrollments:', enrollments, e1);

  const { data: orders, error: e2 } = await supabase.from('orders').select('*');
  console.log('orders:', orders, e2);
  
  const { data: test_leads, error: e3 } = await supabase.from('test_leads').select('*');
  console.log('test_leads:', test_leads, e3);
  
  const { data: talkshow, error: e4 } = await supabase.from('talkshow_enrollments').select('*');
  console.log('talkshow_enrollments:', talkshow, e4);
}

checkSupabase();
