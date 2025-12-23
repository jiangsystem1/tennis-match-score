// 导出数据脚本
// 本地运行: SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx node export-data.js
// GitHub Actions 会自动使用环境变量

const https = require('https');
const fs = require('fs');

// 从环境变量读取配置
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  console.error('');
  console.error('本地运行方式:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=xxx node export-data.js');
  process.exit(1);
}

async function fetchData(table) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}?select=*`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function exportData() {
  console.log('📥 正在导出数据...\n');

  try {
    // 获取数据
    const [players, matches] = await Promise.all([
      fetchData('players'),
      fetchData('matches')
    ]);

    // 创建选手 ID -> 名字的映射
    const playerMap = {};
    players.forEach(p => playerMap[p.id] = p.name);

    // 1. 导出 JSON 备份
    const backup = {
      exported_at: new Date().toISOString(),
      players,
      matches
    };
    fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));
    console.log('✅ backup.json - 完整数据备份');

    // 2. 导出选手列表 CSV
    let playersCsv = 'ID,名字,加入时间\n';
    players.forEach(p => {
      playersCsv += `${p.id},"${p.name}",${p.created_at}\n`;
    });
    fs.writeFileSync('players.csv', playersCsv);
    console.log('✅ players.csv - 选手列表');

    // 3. 导出比赛记录 CSV
    let matchesCsv = 'ID,选手1,选手2,第一盘,第二盘,第三盘,比赛时间\n';
    matches.forEach(m => {
      const p1 = playerMap[m.player1_id] || m.player1_id;
      const p2 = playerMap[m.player2_id] || m.player2_id;
      const set1 = m.sets[0] ? `${m.sets[0][0]}-${m.sets[0][1]}` : '';
      const set2 = m.sets[1] ? `${m.sets[1][0]}-${m.sets[1][1]}` : '';
      const set3 = m.sets[2] && m.sets[2][0] !== null ? `${m.sets[2][0]}-${m.sets[2][1]}` : '';
      matchesCsv += `${m.id},"${p1}","${p2}",${set1},${set2},${set3},${m.created_at}\n`;
    });
    fs.writeFileSync('matches.csv', matchesCsv);
    console.log('✅ matches.csv - 比赛记录');

    // 4. 查找重复比赛
    const duplicates = [];
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const m1 = matches[i];
        const m2 = matches[j];
        if ((m1.player1_id === m2.player1_id && m1.player2_id === m2.player2_id) ||
          (m1.player1_id === m2.player2_id && m1.player2_id === m2.player1_id)) {
          duplicates.push({
            match1: { id: m1.id, players: `${playerMap[m1.player1_id]} vs ${playerMap[m1.player2_id]}`, time: m1.created_at },
            match2: { id: m2.id, players: `${playerMap[m2.player1_id]} vs ${playerMap[m2.player2_id]}`, time: m2.created_at }
          });
        }
      }
    }

    if (duplicates.length > 0) {
      console.log('\n⚠️  发现重复比赛:');
      duplicates.forEach(d => {
        console.log(`   ID ${d.match1.id}: ${d.match1.players} (${d.match1.time})`);
        console.log(`   ID ${d.match2.id}: ${d.match2.players} (${d.match2.time})`);
        console.log('');
      });
      console.log('💡 建议删除 ID 较大的那条（较新的）');
    } else {
      console.log('\n✅ 没有发现重复比赛');
    }

    // 5. 打印统计
    console.log('\n📊 统计:');
    console.log(`   选手数: ${players.length}`);
    console.log(`   比赛数: ${matches.length}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

exportData();

