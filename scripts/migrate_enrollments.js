require('dotenv').config();
const { supabase } = require('../lib/supabase');
const { runAsync } = require('../lib/db');

async function migrate() {
  console.log('Fetching enrollments from Supabase...');
  const { data: enrollments, error } = await supabase.from('enrollments').select('*');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${enrollments.length} enrollments. Inserting into SQLite...`);
  
  for (const row of enrollments) {
    try {
      await runAsync(
        'INSERT INTO enrollments (course_id, full_name, email, phone, age, status, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [row.course_id, row.full_name, row.email, row.phone, row.age, row.status, row.registered_at]
      );
      console.log(`Inserted: ${row.full_name}`);
    } catch (e) {
      console.error(`Error inserting ${row.full_name}:`, e.message);
    }
  }
  
  console.log('Done migration.');
}

migrate();
