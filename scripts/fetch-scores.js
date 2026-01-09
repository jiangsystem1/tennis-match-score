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

  console.log('🌐 Making request to Gemini API...');
  console.log('📍 URL:', url.replace(GEMINI_API_KEY, '***API_KEY***'));

  const startTime = Date.now();

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

  const elapsed = Date.now() - startTime;

  console.log('📊 Response status:', response.status, response.statusText);
  console.log('⏱️ Response time:', elapsed, 'ms');

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Error response body:', errorBody);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  console.log('📦 Response structure:', {
    hasCandidates: !!data.candidates,
    candidatesCount: data.candidates?.length || 0,
    hasContent: !!data.candidates?.[0]?.content,
    partsCount: data.candidates?.[0]?.content?.parts?.length || 0,
    finishReason: data.candidates?.[0]?.finishReason || 'unknown'
  });

  if (!data.candidates || !data.candidates[0]) {
    console.error('❌ Full response:', JSON.stringify(data, null, 2));
    throw new Error('No response from Gemini');
  }

  const textContent = data.candidates[0].content?.parts?.[0]?.text;

  if (!textContent) {
    console.error('❌ No text in response. Parts:', JSON.stringify(data.candidates[0].content?.parts, null, 2));
    throw new Error('No text content in Gemini response');
  }

  console.log('✅ Got text response, length:', textContent.length, 'characters');

  return textContent;
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

// Validate content has actual tennis scores
function isValidContent(content) {
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Must have at least one tournament header (## 🏆)
  if (!content.includes('## ')) {
    return false;
  }

  // Must have at least one match result (contains "def." or "vs" or score pattern)
  const hasMatch = content.includes(' def. ') ||
    content.includes(' vs ') ||
    /\d+-\d+/.test(content); // Score pattern like 6-4

  if (!hasMatch) {
    return false;
  }

  // Content should be at least 100 characters (rough check for meaningful content)
  if (content.length < 100) {
    return false;
  }

  return true;
}

// Save to Supabase
async function saveToSupabase(content) {
  const { data, error } = await supabase
    .from('score_snapshots')
    .insert([{
      content: content,
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

    // Clean and validate content
    const cleanContent = cleanupContent(content);

    if (!isValidContent(cleanContent)) {
      console.log('⚠️ No valid tennis scores in response. Skipping save.');
      console.log('📝 Raw content length:', content.length);
      console.log('📝 Clean content length:', cleanContent.length);
      process.exit(0); // Exit successfully but don't save
    }

    // Save to Supabase
    console.log('💾 Saving to Supabase...');
    const record = await saveToSupabase(cleanContent);
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
