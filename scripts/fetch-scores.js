/**
 * Fetch Tennis Scores from Gemini API and save to Supabase
 * 
 * This script is run by GitHub Actions every hour
 * 
 * Required environment variables:
 * - GEMINI_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables (from GitHub Secrets)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('Required: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tournament calendar - updates based on month
function getActiveTournaments() {
  const month = new Date().getMonth() + 1; // 1-12
  const day = new Date().getDate();

  // January tournaments
  if (month === 1) {
    if (day <= 11) {
      return 'United Cup, ATP Hong Kong Open, ASB Classic Auckland, Brisbane International';
    } else if (day <= 17) {
      return 'Adelaide International, ASB Classic Auckland ATP';
    } else {
      return 'Australian Open';
    }
  }

  // February
  if (month === 2) {
    return 'Australian Open (if early Feb), Rotterdam, Dubai, Doha';
  }

  // March
  if (month === 3) {
    return 'Indian Wells Masters, Miami Open';
  }

  // April
  if (month === 4) {
    return 'Monte Carlo Masters, Barcelona Open';
  }

  // May
  if (month === 5) {
    return 'Madrid Masters, Rome Masters, French Open';
  }

  // June
  if (month === 6) {
    return 'French Open, Queens Club, Halle, Wimbledon';
  }

  // July
  if (month === 7) {
    return 'Wimbledon, Hamburg, Washington';
  }

  // August
  if (month === 8) {
    return 'Montreal/Toronto Masters, Cincinnati Masters, US Open';
  }

  // September
  if (month === 9) {
    return 'US Open, Laver Cup';
  }

  // October
  if (month === 10) {
    return 'Shanghai Masters, Vienna, Paris Masters';
  }

  // November
  if (month === 11) {
    return 'ATP Finals Turin, WTA Finals, Davis Cup Finals';
  }

  // December
  return 'Off-season exhibitions';
}

// Build the prompt for Gemini
function buildPrompt() {
  const tournaments = getActiveTournaments();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Search the web for tennis match results from today ${today}.

Tournaments: ${tournaments}

RULES:
- Start your response with "## 🏆" immediately
- NO introduction like "Here are the results" or "It is January..."
- NO explanation, just the formatted scores

FORMAT:
## 🏆 Tournament Name
- Player1 def. Player2: 6-4, 6-3 ✓
- Player3 vs Player4: 6-2, 3-1 🔴 LIVE

Use ✓ for completed, 🔴 LIVE for in-progress.`;
}

// Query Gemini API with search grounding
async function queryGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

// Clean up Gemini response - remove any preamble before first ##
function cleanupContent(content) {
  // Find the first ## and remove everything before it
  const firstHeader = content.indexOf('## ');
  if (firstHeader > 0) {
    content = content.substring(firstHeader);
  }
  return content.trim();
}

// Save to Supabase
async function saveToSupabase(content) {
  // Clean up the content before saving
  const cleanContent = cleanupContent(content);

  const { data, error } = await supabase
    .from('score_snapshots')
    .insert([{
      content: cleanContent,
      fetched_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data[0];
}

// Optional: Clean up old records (keep last 7 days)
async function cleanupOldRecords() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabase
    .from('score_snapshots')
    .delete()
    .lt('fetched_at', sevenDaysAgo.toISOString());

  if (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  } else {
    console.log('🧹 Cleaned up records older than 7 days');
  }
}

// Main function
async function main() {
  console.log('🎾 Tennis Score Fetcher');
  console.log('========================\n');
  console.log('📅 Time:', new Date().toISOString());
  console.log('🏟️ Active tournaments:', getActiveTournaments());
  console.log('');

  try {
    // Build prompt
    const prompt = buildPrompt();
    console.log('📝 Querying Gemini...\n');

    // Query Gemini
    const content = await queryGemini(prompt);
    console.log('✅ Got response from Gemini');
    console.log('---');
    console.log(content.substring(0, 500) + '...\n');
    console.log('---\n');

    // Save to Supabase
    console.log('💾 Saving to Supabase...');
    const record = await saveToSupabase(content);
    console.log('✅ Saved! Record ID:', record.id);

    // Cleanup old records
    await cleanupOldRecords();

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
