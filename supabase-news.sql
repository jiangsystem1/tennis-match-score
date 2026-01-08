-- Tennis News/Scores Table
-- Run this in Supabase SQL Editor

-- Create the score_snapshots table
CREATE TABLE IF NOT EXISTS score_snapshots (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, for public read access)
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for public app)
CREATE POLICY "Allow public read access" ON score_snapshots
  FOR SELECT USING (true);

-- Allow authenticated insert (for GitHub Action with service key)
CREATE POLICY "Allow service insert" ON score_snapshots
  FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_score_snapshots_fetched_at ON score_snapshots(fetched_at DESC);

-- Insert hardcoded test record based on January 9, 2026 query
INSERT INTO score_snapshots (content, fetched_at) VALUES (
'## 🏆 United Cup - Quarter-Finals

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

**Next:** Eala vs Linette (QF), Eala/Jovic vs Xu/Yang (SF doubles)',
'2026-01-09 15:00:00+00'
);

-- Verify the insert
SELECT * FROM score_snapshots ORDER BY fetched_at DESC LIMIT 1;
