/**
 * Seed the score_snapshots table with test data
 * 
 * FIRST: Run the SQL in Supabase Dashboard to create the table:
 *   1. Go to https://supabase.com/dashboard
 *   2. Select your project
 *   3. Click "SQL Editor" in the sidebar
 *   4. Paste and run the CREATE TABLE statement below
 * 
 * THEN: Run this script to insert test data:
 *   node seed-news.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load config (same as your config.js)
const CONFIG = {
  SUPABASE_URL: 'https://eskdfmaconjskwnisxmb.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_RQN66YmgJMVcHmbiKgpjxg_xlK28l40'
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Test data based on January 9, 2026 Gemini query
const testContent = `## 🏆 United Cup - Quarter-Finals

### USA 2 - 1 Greece ✓
- Coco Gauff def. Maria Sakkari: 6-3, 6-2
- Taylor Fritz def. Stefanos Tsitsipas: 6-4, 7-5
- Gauff/Harrison def. Sakkari/Tsitsipas: 4-6, 6-4, 10-8

### Switzerland 2 - 1 Argentina ✓
- Belinda Bencic def. Solana Sierra: 6-2, 6-2
- Stan Wawrinka def. Sebastian Baez: 7-5, 6-4
- Bencic/Paul def. Carle/Andreozzi: 6-3, 6-3

### Belgium 2 - 1 Czechia ✓
- Zizou Bergs def. Jakub Mensik: 6-2, 7-6(4)
- Elise Mertens def. Barbora Krejcikova: 5-7, 6-1, 7-5

### Australia vs Poland 🔴 LIVE
- Maya Joint vs Iga Swiatek - not started
- Alex de Minaur vs Hubert Hurkacz - not started

## 🇭🇰 ATP Hong Kong Open

- Michael Mmoh def. Karen Khachanov: 7-6(2), 7-6(4) ✓
- Shang Juncheng def. Lorenzo Sonego: 6-3, 6-4 ✓
- Alexander Bublik def. Botic van de Zandschulp: 6-3, 6-3 ✓
- Marcos Giron def. Alexandre Muller: 6-4, 7-6(4) ✓
- Andrey Rublev def. Yibing Wu: 3-6, 6-2, 6-1 ✓
- Nuno Borges def. Marin Cilic: 7-5, 6-3 ✓

## 🇳🇿 ASB Classic Auckland (WTA)

- Alex Eala def. Petra Marcinko: 6-0, 6-2 ✓
- Elina Svitolina def. Katie Boulter: 7-5, 6-4 ✓
- Magda Linette def. Elisabetta Cocciaretto: 7-5, 2-6, 6-3 ✓

**Next:** Eala vs Linette (QF), Eala/Jovic vs Xu/Yang (SF doubles)`;

async function createTable() {
  console.log('📋 SQL to create table (run in Supabase Dashboard → SQL Editor):\n');
  console.log(`
CREATE TABLE IF NOT EXISTS score_snapshots (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for public read
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON score_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON score_snapshots FOR INSERT WITH CHECK (true);
`);
}

async function seedData() {
  console.log('\n🌱 Inserting test data...\n');

  const { data, error } = await supabase
    .from('score_snapshots')
    .insert([
      {
        content: testContent,
        fetched_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    if (error.message.includes('does not exist')) {
      console.log('❌ Table does not exist yet!\n');
      await createTable();
      console.log('\n👆 Run the SQL above in Supabase Dashboard first, then run this script again.');
    } else {
      console.error('❌ Error:', error.message);
    }
    return;
  }

  console.log('✅ Test data inserted successfully!');
  console.log('📊 Record ID:', data[0].id);
  console.log('📅 Fetched at:', data[0].fetched_at);
  console.log('\n🎾 Now refresh your app and check the News tab!');
}

async function checkData() {
  console.log('🔍 Checking existing data...\n');

  const { data, error } = await supabase
    .from('score_snapshots')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(5);

  if (error) {
    if (error.message.includes('does not exist')) {
      console.log('❌ Table does not exist yet!\n');
      await createTable();
      return;
    }
    console.error('❌ Error:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('📭 No records found. Inserting test data...');
    await seedData();
  } else {
    console.log(`📊 Found ${data.length} record(s):\n`);
    data.forEach((row, i) => {
      console.log(`--- Record ${i + 1} ---`);
      console.log('ID:', row.id);
      console.log('Fetched:', new Date(row.fetched_at).toLocaleString());
      console.log('Preview:', row.content.substring(0, 100) + '...\n');
    });
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--seed') || args.includes('-s')) {
  seedData();
} else if (args.includes('--sql')) {
  createTable();
} else {
  console.log('🎾 Tennis News Seeder\n');
  console.log('Usage:');
  console.log('  node seed-news.js          Check existing data');
  console.log('  node seed-news.js --seed   Insert test data');
  console.log('  node seed-news.js --sql    Show CREATE TABLE SQL\n');
  checkData();
}
