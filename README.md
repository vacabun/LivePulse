# LivePulse - 音乐演出与特典会活动路线规划器 (Live & Tokuten Timetable)

专为**音乐演出拼盘、Livehouse 演出、偶像拼盘与大型音乐节观众**打造的排程与个人活动路线规划 Web 应用。纯静态架构，无需 Node.js 构建，直接推送即可在 GitHub Pages 上线。

---

## 🌟 核心特性与三大页签

底部常驻三页签导航栏：

```text
┌─────────────────────────────────────────────────────────────┐
│ 🎸 活动列表      │ 🗺️ 活动路线 (默认主页) │ ⚙️ 设置与备份   │
└─────────────────────────────────────────────────────────────┘
```

### 1. 🎸 活动列表 & 📝 模版库与文本智能解析导入
- **拼盘活动卡片**：展示拼盘活动名称、举办日期区间、场地及已选团进度条。
- **📝 文本智能识别解析器 (Smart Text Parser)**：直接粘贴 Twitter/X 或官方通知文本（如 `12:30〜12:55 Mirror,Mirror`、`13:55〜15:25 終演後物販・特典会`），系统自动解析时间、分类与团体名，终演后特典会按参演团体独立拆分！
- **💾 保存/下载模版 JSON**：一键生成并下载标准化活动模版 JSON 文件（如 `ワンコインショーケース_template.json`），方便主办方或观众分发与分享。
- **⚡ 一键导入活动**：点击即可将模版或文本解析结果秒级导入到个人日程库。

### 2. 🗺️ 活动路线 (My Itinerary / 默认主页)
- **个人专属活动路线**：默认只呈现观众已标记参加的团体排程。
- **月视图大活动聚合**：按大活动/拼盘名称聚合展示，卡片清爽整洁。
- **日视图单行水平排版**：类型、团体名、时间段与场地在同一行紧凑清晰对齐。
- **时间轴自适应缩放**：支持放大缩小并持久化保存缩放比例至浏览器缓存。
- **Live 与 特典会并行重叠排布 (Parallel Overlap Layout)**：重叠时段自适应分栏并列（50% / 50% 宽），冲突时间清晰可见。

### 3. ⚙️ 设置与备份 (Settings & Data Backup Center)
- **数据导出**：
  - 📤 **导出 JSON 全量备份**：包含所有活动、团体与参加标记。
  - 📲 **导出 iCal (.ics) 个人活动日历**：直接同步至 iPhone / Mac / Google Calendar 开启演出提醒。
- **数据导入**：支持拖拽上传 `.json` 备份文件，支持合并追加与完全覆盖。

---

## 📂 项目结构

```text
event_table/
├── index.html        # 页面主入口 (三页签容器、模版解析器、活动与排程弹窗)
├── templates/
│   └── one_coin_showcase_template.json # 官方标准示例模版文件 (ワンコインショーケース)
├── css/
│   └── style.css     # 设计系统、模版横幅、Live/特典会主题与响应式样式
├── js/
│   ├── events.js     # 数据管理层 (父活动聚合统计、批量标记参加、JSON/ICS 导出)
│   └── app.js        # 核心控制器 (文本智能识别引擎、模版导入导出、三页签路由)
└── README.md         # 项目使用与部署说明
```

---

## 🌐 本地预览运行

在项目根目录运行：
```bash
python3 -m http.server 8088
```
在浏览器中打开：`http://localhost:8088`

---

## 🚀 GitHub Pages 部署指南

1. **推送代码到 GitHub 仓库**：
   ```bash
   git add .
   git commit -m "refactor: update terminology to professional itinerary and participation marking"
   git push origin main
   ```

2. **开启 GitHub Pages**：
   - 打开 GitHub 仓库页面 -> **Settings** -> **Pages**。
   - 在 **Source** 下选择 `Deploy from a branch`。
   - **Branch** 选择 `main` / `/ (root)`，点击 **Save**。
   - 稍等片刻即可在线访问您的个人演出活动路线时间表！
