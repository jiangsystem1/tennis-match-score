# 🎾 网球小组赛计分系统

Tennis Round Robin Tournament Tracker

## 规则说明

- 每两人之间打一场比赛，每人最多8场比赛
- 每场比赛三盘两胜，第三盘是 10 point TB (抢十)
- 每场胜者得两分，负者获得和自己赢得盘数相同分数 (2:0 负者不得分，2:1 负者得一分)
- Round Robin 结束统计总分，前四名进入半决赛
- 积分相同时：两人按对战记录；三人及以上按盘分差，再按局分差

## 🚀 快速部署 (3步)

### 第一步：设置 Supabase 数据库

1. 访问 [supabase.com](https://supabase.com) 注册免费账号
2. 创建新项目 (记住项目名和密码)
3. 等待项目初始化完成后，进入 **SQL Editor**
4. 复制 `supabase-setup.sql` 的内容，粘贴运行
5. 进入 **Settings > API > API Keys**，复制：
   - `Project URL` → 这是你的 `SUPABASE_URL`
   - `Publishable key` → 这是你的 `SUPABASE_ANON_KEY`

### 第二步：配置代码

1. 复制 `config.example.js` 为 `config.js`
2. 填入你的 Supabase 信息：

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',       // 替换成你的 URL
  SUPABASE_ANON_KEY: 'sb_publishable_xxx...'      // 替换成你的 Publishable Key
};
```

> ⚠️ `config.js` 已加入 `.gitignore`，不会上传到 GitHub

### 第三步：部署到 Vercel

1. 把代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com) 用 GitHub 登录
3. 点击 **New Project** → 导入你的仓库·
4. 在部署前，添加 **Environment Variables**：
   - `SUPABASE_URL` = 你的 Project URL
   - `SUPABASE_ANON_KEY` = 你的 Publishable Key
5. 点击 **Deploy**
6. 完成！访问 Vercel 给你的域名即可使用

> 环境变量在 Vercel 项目的 Settings → Environment Variables 中也可以修改
·
## 📁 文件说明

```
├── index.html          # 主页面
├── config.js           # 配置文件（本地/构建时生成，不上传 GitHub）
├── config.example.js   # 配置模板（本地测试用）
├── build.js            # 构建脚本（从环境变量生成 config.js）
├── vercel.json         # Vercel 配置
├── supabase-setup.sql  # 数据库表结构
├── .gitignore          # Git 忽略文件
├── package.json        # 项目配置
└── README.md           # 说明文档
```

## 本地测试

直接用浏览器打开 `index.html` 即可（需要先配置 Supabase）。

## 功能特性

- ✅ 选手管理（添加/删除）
- ✅ 比赛记录（三盘两胜，支持抢十）
- ✅ 自动排名计算
- ✅ 完整的 tiebreaker 规则
- ✅ 响应式设计，手机友好
- ✅ 美观的网球主题 UI
