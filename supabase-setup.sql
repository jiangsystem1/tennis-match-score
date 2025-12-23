-- 在 Supabase SQL Editor 中运行这些命令来创建表

-- 选手表
CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 比赛表
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  player1_id BIGINT REFERENCES players(id),
  player2_id BIGINT REFERENCES players(id),
  sets JSONB NOT NULL, -- [[6,4], [3,6], [10,5]] 格式
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 Row Level Security 但允许所有操作（简单起见）
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 允许所有人读写（公开访问）
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true) WITH CHECK (true);

