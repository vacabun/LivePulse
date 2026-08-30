/**
 * Internationalization (i18n) Engine - LivePulse
 * Supported Languages:
 *  - zh: 简体中文 (Simplified Chinese - Default)
 *  - en: English
 *  - ja: 日本語 (Japanese)
 *  - ko: 한국어 (Korean)
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', short: '한' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', short: '日' },
  { code: 'en', name: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳', short: '中' }
];

export const translations = {
  zh: {
    // Header & Global
    appTitle: 'LivePulse',
    headerSubtitle: '演出·特典会活动路线规划',
    headerSubtitleEvents: '拼盘与演出活动列表',
    headerSubtitleMyRoute: '我的活动路线时间表',
    headerSubtitleSettings: '设置与数据中心',
    btnAddEvent: '添加活动',
    themeToggle: '切换深色/浅色模式',
    langSelector: '界面语言',

    // View Switcher & Toolbar
    viewMonth: '月视图',
    viewMonthShort: '月',
    viewWeek: '周视图',
    viewWeekShort: '周',
    view3Day: '3天视图',
    view3DayShort: '3天',
    viewDay: '日视图',
    viewDayShort: '日',
    zoomIn: '放大时间轴',
    zoomOut: '缩小时间轴',
    btnToday: '回到现在',
    prevCycle: '前一周期',
    nextCycle: '后一周期',

    // Categories & Filters
    catAll: '全部',
    catLive: 'Live (舞台演出)',
    catTokuten: '特典会 (物贩/合影)',
    catOther: '其他 (入场/转场)',
    catLiveBadge: '🎤 Live',
    catTokutenBadge: '📸 特典会',
    catOtherBadge: '🏷️ 其他',
    parentAll: '🎸 全部活动 / 跨场总览',
    myRouteActive: '我的活动路线',
    myRouteAll: '全部活动',
    myRouteTitleActive: '切换：仅看我标记参加的活动路线 / 查看全部活动',
    myRouteTitleAll: '切换：显示全部活动',

    // Meta Stats
    statCurrentEvents: '当前活动:',
    statTotal: '总计:',
    statStarred: '已标记参加:',
    statFestivals: '演出活动:',

    // Weekdays
    weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    weekdaysShort: ['一', '二', '三', '四', '五', '六', '日'],
    mobileSwipeHint: '左右轻扫切换周期 · 底部切换页签',

    // Tab 1 Events Page
    eventsPageTitle: '🎸 拼盘与演出活动列表',
    eventsPageDesc: '浏览所有活动时间表，或使用模版/文本快速导入新拼盘',
    btnOpenTemplate: '📝 模版库 & 文本智能导入',
    btnUploadJson: '上传 JSON',
    featuredTag: '🔥 官方示例模版',
    featuredTitle: 'ワンコインショーケース @ Spotify O-WEST',
    featuredDesc: '出演：Mirror,Mirror / AKANECLUB. / かすみ草とステラ / 終演後物販·特典会',
    quickDownloadTemplate: '💾 保存/下载模版 JSON',
    quickImportTemplate: '⚡ 一键导入此活动',
    emptyEventsTitle: '暂无已收录的演出活动',
    emptyEventsDesc: '点击上方推荐模版快速体验，或打开模版库粘贴通知文本智能识别活动！',
    btnInspectTimetable: '查看时间表 & 勾选参加',
    btnDeleteFestival: '删除活动',
    itemsCount: '项',
    groupsCount: '组',

    // Tab 3 Settings Page
    settingsTitle: '⚙️ 数据管理与系统设置',
    settingsDesc: '导出个人活动日历、备份与恢复数据、配置偏好设置',
    langCardTitle: '🌐 界面语言 (Language)',
    storageTitle: '浏览器本地缓存 (localStorage)',
    storageDesc: '已收录 {festivals} 场演出活动，共 {events} 项活动（约占用 {sizeKB} KB 空间）',
    exportCardTitle: '导出与同步数据',
    exportJsonTitle: '导出 JSON 全量备份文件',
    exportJsonDesc: '包含全部活动、参演阵容与个人参加标记',
    exportIcsTitle: '导出 iCal (.ics) 个人活动日历',
    exportIcsDesc: '一键导入 iPhone / Mac / Google Calendar 开启演出提醒',
    settingsTemplateTitle: '💾 下载活动配置模版 (JSON)',
    settingsTemplateDesc: '下载官方标准示例配置文件（ワンコインショーケース），可直接填入新演出',
    importCardTitle: '导入日程数据 (JSON)',
    dropzoneText: '点击选择或将 <strong>.json</strong> 备份文件拖拽至此处',
    importModeMerge: '合并追加（保留现有日程，追加新活动）',
    importModeOverwrite: '完全覆盖（清空当前数据，完全替换为导入内容）',
    btnConfirmImport: '开始导入备份',
    maintenanceCardTitle: '数据维护',
    btnClearAllData: '清空所有本地数据',

    // Modal: Template & Text Parser
    templateModalTitle: '📝 活动模版库 & 文本智能解析',
    templateModalSubtitle: '选择精选活动模版或直接粘贴官方活动通知文本',
    labelPresetTemplate: '选择预置活动模版',
    labelRawText: '活动通知 / 时间表文本',
    btnReparseText: '✨ 重新智能解析文本',
    rawTextPlaceholder: `粘贴活动公告文本，例如：
ワンコインショーケース
○日程 9.5（土）
○会場 Spotify O-WEST
○タイムテーブル
12:30〜12:55 Mirror,Mirror
12:55〜13:20 AKANECLUB.
13:20〜13:45 かすみ草とステラ
13:55〜15:25 終演後物販・特典会`,
    parsedPreviewTitle: '解析结果预览 ({count} 项活动)',
    btnSaveTemplateJson: '💾 保存/下载模版 JSON',
    btnImportParsedTemplate: '📥 一键导入到我的活动列表',

    // Modal: Festival Inspect
    inspectModalTitle: '活动时间表',
    btnSelectAll: '⭐ 全部标记参加',
    btnDeselectAll: '取消全部',
    btnGoToMyRoute: '查看我的活动路线 ➔',

    // Modal: Day Detail
    dayDetailModalTitle: '日期演出清单',
    btnAddDayEvent: '+ 添加该日活动',

    // Modal: Event Create/Edit Form
    modalTitleAdd: '添加活动',
    modalTitleEdit: '编辑活动',
    labelGroupName: '团体名 / 参演艺人 *',
    groupNamePlaceholder: '例如：Starry☆Sky / Mirror,Mirror',
    labelEventType: '活动类别 *',
    labelEventParent: '所属活动 / 拼盘名称 *',
    parentEventPlaceholder: '例如：ワンコインショーケース',
    labelEventVenue: '场地 / 舞台 / 区域',
    venuePlaceholder: '例如：Spotify O-WEST 主舞台',
    labelEventStartTime: '开始时间',
    labelEventEndTime: '结束时间',
    labelEventTableArea: '特典桌号 / 展位号',
    tableAreaPlaceholder: '例如：3号桌 / 展位 A-02',
    labelEventStarred: '⭐ 标记参加 (加入我的活动路线)',
    labelEventDesc: '活动备注 (限定周边/曲目/注意事项)',
    descPlaceholder: '例如：新单曲首发，结束后立即转至物贩区...',
    btnDeleteEvent: '删除活动',
    btnCancel: '取消',
    btnSaveEvent: '保存活动',

    // Nav Titles
    navEvents: '活动列表',
    navMyRoute: '活动路线',
    navSettings: '设置与备份',

    // Toasts & Prompts
    toastStarred: '已将「{group}」标记为参加！',
    toastUnstarred: '已取消参加「{group}」',
    toastAllStarred: '已将「{festival}」全部团体标记为参加！',
    toastAllDeselected: '已取消勾选「{festival}」的全部团体',
    toastImportSuccess: '成功导入 {count} 项活动！',
    toastImportTemplateSuccess: '已成功导入模版「{name}」，共 {count} 项活动！',
    toastExportIcs: '个人活动日历 (.ics) 已生成！可直接导入手机/系统日历',
    toastExportJson: 'JSON 备份文件已导出！',
    toastTemplateDownloaded: '已下载官方活动配置模版 JSON 文件！',
    toastAllCleared: '所有本地活动已清空',
    toastEventSaved: '活动保存成功！',
    toastEventDeleted: '活动已删除',
    toastFestivalDeleted: '活动已删除',
    toastSwitchStarred: '已切换至【我的活动路线】模式',
    toastSwitchAll: '已显示【全部活动】',
    confirmClearAll: '【危险操作】确定要清空所有本地日程数据吗？此操作无法撤销。',
    confirmDeleteEvent: '确定要删除该活动吗？',
    confirmDeleteFestival: '确定要删除活动「{name}」及其所有日程吗？',
    allDay: '全天',

    // Schedule Repository Hub
    btnRepoHub: '云端活动库',
    repoModalTitle: '🌐 云端活动库 (Schedule Repository)',
    repoModalSubtitle: '从官方推荐或自定义 GitHub 仓库浏览并一键导入活动时间表',
    repoSelectLabel: '选择资源库：',
    repoOfficialName: '🌟 官方仓库 (vacabun/LivePulse-Schedule)',
    btnAddCustomRepo: '添加仓库',
    btnRefreshRepo: '刷新',
    repoSearchPlaceholder: '搜索活动名称、艺人、场地或日期...',
    btnBatchImport: '📥 批量导入所选活动 ({count})',
    repoFooterTip: '💡 提示：从云端仓库导入的活动默认不勾选（未标记参加），导入后可在活动列表中自由选择想看的舞台。',
    toastRepoLoaded: '成功获取 {count} 个云端活动配置文件！',
    toastRepoImportSuccess: '已成功从资源库导入「{name}」！',
    toastRepoBatchSuccess: '已成功批量导入 {count} 场活动的全部时间表！',
    promptAddRepoUrl: '请输入 GitHub 仓库地址或 owner/repo（例如：vacabun/LivePulse-Schedule）：',
    btnImportSchedule: '📥 导入此活动',
    btnAlreadyImported: '✓ 已在活动列表中',
    btnUpdateSchedule: '🔄 更新活动',
    btnUpdating: '⏳ 更新中...',
    btnUpdatedSuccess: '✅ 更新成功',
    btnUpdateSuccess: '✅ 更新成功',
    btnImporting: '⏳ 导入中...',
    btnImportSuccess: '✅ 导入成功',
    btnImportedSuccess: '✅ 导入成功',
    btnDeleteFestivalShort: '删除',
    btnDeleteFromLocal: '从本地删除',
    btnDeleteThisFestival: '🗑️ 删除此活动',
    toastRepoUpdateSuccess: '已成功更新「{name}」的活动数据！',
    selectLabel: '勾选',
    lineupLabel: '参演阵容',
    repoLoadingText: '正在连接 GitHub 检索活动配置...',
    repoEmptyText: '该仓库下未找到有效的活动 JSON 配置文件',
    settingsRepoTitle: '🌐 云端活动库 (GitHub Hub)',
    settingsRepoDesc: '从官方推荐 (LivePulse-Schedule) 或自定义仓库浏览并一键同步演出活动'
  },

  en: {
    // Header & Global
    appTitle: 'LivePulse',
    headerSubtitle: 'Live & Tokuten Itinerary Planner',
    headerSubtitleEvents: 'Festivals & Joint Lives Directory',
    headerSubtitleMyRoute: 'My Event Itinerary Timetable',
    headerSubtitleSettings: 'Settings & Data Center',
    btnAddEvent: 'Add Schedule',
    themeToggle: 'Toggle Dark / Light Mode',
    langSelector: 'Language',

    // View Switcher & Toolbar
    viewMonth: 'Month',
    viewMonthShort: 'M',
    viewWeek: 'Week',
    viewWeekShort: 'W',
    view3Day: '3-Day',
    view3DayShort: '3D',
    viewDay: 'Day',
    viewDayShort: 'D',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    btnToday: 'Now',
    prevCycle: 'Previous',
    nextCycle: 'Next',

    // Categories & Filters
    catAll: 'All',
    catLive: 'Live (Stage)',
    catTokuten: 'Tokutenkai (Meet & Greet)',
    catOther: 'Other (Transit/Entry)',
    catLiveBadge: '🎤 Live',
    catTokutenBadge: '📸 Meet/Tokuten',
    catOtherBadge: '🏷️ Other',
    parentAll: '🎸 All Events & Rush Overview',
    myRouteActive: 'My Itinerary',
    myRouteAll: 'All Schedules',
    myRouteTitleActive: 'Filter: Showing Starred Itinerary Only',
    myRouteTitleAll: 'Filter: Showing All Schedules',

    // Meta Stats
    statCurrentEvents: 'Schedules:',
    statTotal: 'Total:',
    statStarred: 'Attending:',
    statFestivals: 'Events:',

    // Weekdays
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekdaysShort: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    mobileSwipeHint: 'Swipe horizontally to switch cycle · Tap bottom bar to switch tabs',

    // Tab 1 Events Page
    eventsPageTitle: '🎸 Festivals & Events Directory',
    eventsPageDesc: 'Browse all event timetables, or import schedules via templates / official text',
    btnOpenTemplate: '📝 Templates & Smart Text Parser',
    btnUploadJson: 'Upload JSON',
    featuredTag: '🔥 Official Sample Template',
    featuredTitle: 'One Coin Showcase @ Spotify O-WEST',
    featuredDesc: 'Lineup: Mirror,Mirror / AKANECLUB. / Kasumisou to Stella / After-show Tokutenkai',
    quickDownloadTemplate: '💾 Save / Download Template JSON',
    quickImportTemplate: '⚡ 1-Click Import Event',
    emptyEventsTitle: 'No events added yet',
    emptyEventsDesc: 'Import the recommended template above, or paste official announcement text to auto-parse schedules!',
    btnInspectTimetable: 'Inspect Timetable & Select Lineup',
    btnDeleteFestival: 'Delete Event',
    itemsCount: 'items',
    groupsCount: 'groups',

    // Tab 3 Settings Page
    settingsTitle: '⚙️ Settings & Data Backup Center',
    settingsDesc: 'Export personal calendar, backup & restore data, configure preferences',
    langCardTitle: '🌐 Interface Language',
    storageTitle: 'Browser Local Storage (localStorage)',
    storageDesc: '{festivals} events recorded with {events} schedules (~{sizeKB} KB space used)',
    exportCardTitle: 'Export & Sync Data',
    exportJsonTitle: 'Export Full JSON Backup',
    exportJsonDesc: 'Includes all events, lineups, and starred itinerary selections',
    exportIcsTitle: 'Export iCal (.ics) Calendar',
    exportIcsDesc: 'Directly sync to iPhone / Mac / Google Calendar for live show reminders',
    settingsTemplateTitle: '💾 Download Template JSON',
    settingsTemplateDesc: 'Download official sample template (One Coin Showcase) to create new event configs',
    importCardTitle: 'Import Schedules (JSON)',
    dropzoneText: 'Click to choose or drag <strong>.json</strong> backup file here',
    importModeMerge: 'Merge (Keep existing schedules, append new events)',
    importModeOverwrite: 'Overwrite (Wipe current data, completely replace with imported file)',
    btnConfirmImport: 'Start Importing Backup',
    maintenanceCardTitle: 'Data Maintenance',
    btnClearAllData: 'Clear All Local Data',

    // Modal: Template & Text Parser
    templateModalTitle: '📝 Template Library & Smart Text Parser',
    templateModalSubtitle: 'Choose preset templates or paste official announcement timetable text',
    labelPresetTemplate: 'Choose Preset Event Template',
    labelRawText: 'Event Timetable Announcement Text',
    btnReparseText: '✨ Re-parse Announcement Text',
    rawTextPlaceholder: `Paste official announcement text, for example:
ワンコインショーケース
○日程 9.5（土）
○会場 Spotify O-WEST
○タイムテーブル
12:30〜12:55 Mirror,Mirror
12:55〜13:20 AKANECLUB.
13:20〜13:45 かすみ草とステラ
13:55〜15:25 終演後物販・特典会`,
    parsedPreviewTitle: 'Parsed Results Preview ({count} schedules)',
    btnSaveTemplateJson: '💾 Save / Download Template JSON',
    btnImportParsedTemplate: '📥 Import to My Event List',

    // Modal: Festival Inspect
    inspectModalTitle: 'Event Timetable',
    btnSelectAll: '⭐ Select All as Attending',
    btnDeselectAll: 'Deselect All',
    btnGoToMyRoute: 'View My Itinerary ➔',

    // Modal: Day Detail
    dayDetailModalTitle: 'Date Schedule List',
    btnAddDayEvent: '+ Add Schedule for This Date',

    // Modal: Event Create/Edit Form
    modalTitleAdd: 'Add Schedule',
    modalTitleEdit: 'Edit Schedule',
    labelGroupName: 'Group / Artist Name *',
    groupNamePlaceholder: 'e.g. Starry☆Sky / Mirror,Mirror',
    labelEventType: 'Category *',
    labelEventParent: 'Event / Festival Name *',
    parentEventPlaceholder: 'e.g. One Coin Showcase',
    labelEventVenue: 'Venue / Stage / Area',
    venuePlaceholder: 'e.g. Spotify O-WEST Main Stage',
    labelEventStartTime: 'Start Time',
    labelEventEndTime: 'End Time',
    labelEventTableArea: 'Table / Booth No.',
    tableAreaPlaceholder: 'e.g. Table #3 / Booth A-02',
    labelEventStarred: '⭐ Mark as Attending (Add to My Itinerary)',
    labelEventDesc: 'Schedule Notes (Exclusive merch/Setlist/Notes)',
    descPlaceholder: 'e.g. New single premiere, move to booth area right after live...',
    btnDeleteEvent: 'Delete Schedule',
    btnCancel: 'Cancel',
    btnSaveEvent: 'Save Schedule',

    // Nav Titles
    navEvents: 'Events',
    navMyRoute: 'Itinerary',
    navSettings: 'Settings',

    // Toasts & Prompts
    toastStarred: 'Marked "{group}" as attending!',
    toastUnstarred: 'Removed "{group}" from attending',
    toastAllStarred: 'Marked all groups in "{festival}" as attending!',
    toastAllDeselected: 'Deselected all groups in "{festival}"',
    toastImportSuccess: 'Successfully imported {count} schedules!',
    toastImportTemplateSuccess: 'Imported template "{name}" with {count} schedules!',
    toastExportIcs: 'Personal calendar (.ics) generated! Import to system calendar directly',
    toastExportJson: 'JSON backup file exported!',
    toastTemplateDownloaded: 'Official template JSON file downloaded!',
    toastAllCleared: 'All local schedules cleared',
    toastEventSaved: 'Schedule saved successfully!',
    toastEventDeleted: 'Schedule deleted',
    toastFestivalDeleted: 'Event deleted',
    toastSwitchStarred: 'Switched to [My Itinerary] mode',
    toastSwitchAll: 'Showing [All Schedules]',
    confirmClearAll: '【Warning】Are you sure you want to clear all local schedule data? This cannot be undone.',
    confirmDeleteEvent: 'Are you sure you want to delete this schedule?',
    confirmDeleteFestival: 'Are you sure you want to delete event "{name}" and all its schedules?',
    allDay: 'All Day',

    // Schedule Repository Hub
    btnRepoHub: 'Schedule Hub',
    repoModalTitle: '🌐 Cloud Schedule Repository',
    repoModalSubtitle: 'Browse and import festival schedules from official or custom GitHub repositories',
    repoSelectLabel: 'Select Repository:',
    repoOfficialName: '🌟 Official (vacabun/LivePulse-Schedule)',
    btnAddCustomRepo: 'Add Repo',
    btnRefreshRepo: 'Refresh',
    repoSearchPlaceholder: 'Search festival, artist, venue, or date...',
    btnBatchImport: '📥 Import Selected Events ({count})',
    repoFooterTip: '💡 Note: Imported schedules default to unselected (Attend: No), allowing you to freely pick your favorite stages.',
    toastRepoLoaded: 'Successfully loaded {count} schedule configs from repository!',
    toastRepoImportSuccess: 'Successfully imported "{name}" from repository!',
    toastRepoBatchSuccess: 'Successfully imported {count} festival schedules in batch!',
    promptAddRepoUrl: 'Enter GitHub repository URL or owner/repo (e.g. yourname/my-schedules):',
    btnImportSchedule: '📥 Import Event',
    btnAlreadyImported: '✓ In Library',
    btnUpdateSchedule: '🔄 Update',
    btnUpdating: '⏳ Updating...',
    btnUpdatedSuccess: '✅ Updated!',
    btnUpdateSuccess: '✅ Updated!',
    btnImporting: '⏳ Importing...',
    btnImportSuccess: '✅ Imported!',
    btnImportedSuccess: '✅ Imported!',
    btnDeleteFestivalShort: 'Delete',
    btnDeleteFromLocal: 'Delete from local',
    btnDeleteThisFestival: '🗑️ Delete Event',
    toastRepoUpdateSuccess: 'Successfully updated "{name}" schedule!',
    selectLabel: 'Select',
    lineupLabel: 'Lineup',
    repoLoadingText: 'Connecting to GitHub & indexing schedule files...',
    repoEmptyText: 'No valid event JSON configurations found in this repository',
    settingsRepoTitle: '🌐 Cloud Schedule Repository (GitHub Hub)',
    settingsRepoDesc: 'Browse and sync festival timetables from official or custom GitHub repositories'
  },

  ja: {
    // Header & Global
    appTitle: 'LivePulse',
    headerSubtitle: 'ライブ・特典会タイムテーブル',
    headerSubtitleEvents: '対バン・フェス一覧',
    headerSubtitleMyRoute: 'マイタイムテーブル',
    headerSubtitleSettings: '設定とデータ管理',
    btnAddEvent: '予定を追加',
    themeToggle: 'ダーク／ライトモード切替',
    langSelector: '表示言語',

    // View Switcher & Toolbar
    viewMonth: '月表示',
    viewMonthShort: '月',
    viewWeek: '週表示',
    viewWeekShort: '週',
    view3Day: '3日表示',
    view3DayShort: '3日',
    viewDay: '日表示',
    viewDayShort: '日',
    zoomIn: 'タイムライン拡大',
    zoomOut: 'タイムライン縮小',
    btnToday: '現在',
    prevCycle: '前へ',
    nextCycle: '次へ',

    // Categories & Filters
    catAll: 'すべて',
    catLive: 'Live (ライブステージ)',
    catTokuten: '特典会 (物販・チェキ)',
    catOther: 'その他 (入場・移動回し)',
    catLiveBadge: '🎤 ライブ',
    catTokutenBadge: '📸 特典会',
    catOtherBadge: '🏷️ その他',
    parentAll: '🎸 全イベント・回し総覧',
    myRouteActive: '参加予定のみ',
    myRouteAll: '全タイムテーブル',
    myRouteTitleActive: '切替：参加予定のみ表示中',
    myRouteTitleAll: '切替：すべての予定を表示',

    // Meta Stats
    statCurrentEvents: '表示予定:',
    statTotal: '合計:',
    statStarred: '参加予定:',
    statFestivals: 'イベント:',

    // Weekdays
    weekdays: ['月', '火', '水', '木', '金', '土', '日'],
    weekdaysShort: ['月', '火', '水', '木', '金', '土', '日'],
    mobileSwipeHint: '左右スワイプで期間切替 · 下部でタブ切替',

    // Tab 1 Events Page
    eventsPageTitle: '🎸 対バン・フェス一覧',
    eventsPageDesc: 'タイムテーブルを確認、またはテンプレートやテキストから一括取り込み',
    btnOpenTemplate: '📝 テンプレート＆テキスト自動解析',
    btnUploadJson: 'JSON 読込',
    featuredTag: '🔥 公式おすすめテンプレート',
    featuredTitle: 'ワンコインショーケース @ Spotify O-WEST',
    featuredDesc: '出演：Mirror,Mirror / AKANECLUB. / かすみ草とステラ / 終演後物販・特典会',
    quickDownloadTemplate: '💾 テンプレート保存 (JSON)',
    quickImportTemplate: '⚡ イベントを取り込む',
    emptyEventsTitle: '登録されたイベントはありません',
    emptyEventsDesc: '上記のおすすめテンプレートを取り込むか、公式告知テキストを貼り付けて自動解析してください！',
    btnInspectTimetable: 'タイテ確認・参加選択',
    btnDeleteFestival: 'イベント削除',
    itemsCount: '件',
    groupsCount: '組',

    // Tab 3 Settings Page
    settingsTitle: '⚙️ 設定とデータ管理センター',
    settingsDesc: 'カレンダー出力・バックアップ・言語設定',
    langCardTitle: '🌐 表示言語 (Language)',
    storageTitle: 'ブラウザローカル保存 (localStorage)',
    storageDesc: '{festivals} 件のイベント、計 {events} 件の予定を保存中 (約 {sizeKB} KB)',
    exportCardTitle: 'データ出力・カレンダー同期',
    exportJsonTitle: 'JSONバックアップをエクスポート',
    exportJsonDesc: 'すべてのイベント・出演者・参加チェック状態を含む完全バックアップ',
    exportIcsTitle: 'iCal (.ics) マイカレンダーを書き出し',
    exportIcsDesc: 'iPhone / Mac / Googleカレンダーに追加してライブ通知を設定',
    settingsTemplateTitle: '💾 設定テンプレート (JSON) をダウンロード',
    settingsTemplateDesc: '公式サンプル設定（ワンコインショーケース）をダウンロードして編集可能',
    importCardTitle: 'スケジュールを取り込む (JSON)',
    dropzoneText: 'クリックして選択、または <strong>.json</strong> ファイルをドロップ',
    importModeMerge: '統合追加（既存の予定を残して新しいイベントを追加）',
    importModeOverwrite: '完全上書き（現在のデータを削除してファイル内容に全置換）',
    btnConfirmImport: 'インポート開始',
    maintenanceCardTitle: 'データ管理',
    btnClearAllData: '全データを削除',

    // Modal: Template & Text Parser
    templateModalTitle: '📝 テンプレート一覧＆テキスト自動解析',
    templateModalSubtitle: 'テンプレートを選択、または公式X・告知テキストを貼り付け',
    labelPresetTemplate: 'プリセットテンプレート選択',
    labelRawText: '告知テキスト / タイムテーブル',
    btnReparseText: '✨ テキストを再解析',
    rawTextPlaceholder: `公式告知テキストを貼り付けてください：
ワンコインショーケース
○日程 9.5（土）
○会場 Spotify O-WEST
○タイムテーブル
12:30〜12:55 Mirror,Mirror
12:55〜13:20 AKANECLUB.
13:20〜13:45 かすみ草とステラ
13:55〜15:25 終演後物販・特典会`,
    parsedPreviewTitle: '解析結果プレビュー ({count} 件の予定)',
    btnSaveTemplateJson: '💾 テンプレート保存 (JSON)',
    btnImportParsedTemplate: '📥 イベント一覧に取り込む',

    // Modal: Festival Inspect
    inspectModalTitle: 'タイムテーブル',
    btnSelectAll: '⭐ すべて参加予定にする',
    btnDeselectAll: 'すべて解除',
    btnGoToMyRoute: 'マイタイムテーブルを見る ➔',

    // Modal: Day Detail
    dayDetailModalTitle: '日別タイムテーブル',
    btnAddDayEvent: '+ この日の予定を追加',

    // Modal: Event Create/Edit Form
    modalTitleAdd: '予定を追加',
    modalTitleEdit: '予定を編集',
    labelGroupName: 'グループ名・アーティスト名 *',
    groupNamePlaceholder: '例：Starry☆Sky / Mirror,Mirror',
    labelEventType: '種別 *',
    labelEventParent: 'イベント名・対バン名 *',
    parentEventPlaceholder: '例：ワンコインショーケース',
    labelEventVenue: '会場・ステージ・エリア',
    venuePlaceholder: '例：Spotify O-WEST メインステージ',
    labelEventStartTime: '開始時間',
    labelEventEndTime: '終了時間',
    labelEventTableArea: '特典会卓・ブース番号',
    tableAreaPlaceholder: '例：3号卓 / ブース A-02',
    labelEventStarred: '⭐ 参加予定にする（マイタイテに追加）',
    labelEventDesc: 'メモ（限定グッズ・セトリ・回し注意点など）',
    descPlaceholder: '例：新曲初披露、ライブ後すぐに物販エリアへ移動...',
    btnDeleteEvent: '予定を削除',
    btnCancel: 'キャンセル',
    btnSaveEvent: '保存する',

    // Nav Titles
    navEvents: 'イベント',
    navMyRoute: 'マイタイテ',
    navSettings: '設定',

    // Toasts & Prompts
    toastStarred: '「{group}」を参加予定に追加しました！',
    toastUnstarred: '「{group}」の参加を解除しました',
    toastAllStarred: '「{festival}」の全グループを参加予定にしました！',
    toastAllDeselected: '「{festival}」の選択を全解除しました',
    toastImportSuccess: '{count} 件の予定を取り込みました！',
    toastImportTemplateSuccess: 'テンプレート「{name}」({count}件) を取り込みました！',
    toastExportIcs: 'マイカレンダー (.ics) を生成しました！カレンダーアプリに読み込めます',
    toastExportJson: 'JSONバックアップを出力しました！',
    toastTemplateDownloaded: '公式テンプレートJSONファイルをダウンロードしました！',
    toastAllCleared: 'すべてのローカルデータを削除しました',
    toastEventSaved: '予定を保存しました！',
    toastEventDeleted: '予定を削除しました',
    toastFestivalDeleted: 'イベントを削除しました',
    toastSwitchStarred: '【参加予定のみ】モードに切り替えました',
    toastSwitchAll: '【全タイムテーブル】を表示中',
    confirmClearAll: '【警告】ローカルの全予定データを削除しますか？この操作は取り消せません。',
    confirmDeleteEvent: 'この予定を削除しますか？',
    confirmDeleteFestival: 'イベント「{name}」と関連する予定をすべて削除しますか？',
    allDay: '終日',

    // Schedule Repository Hub
    btnRepoHub: 'クラウドイベント庫',
    repoModalTitle: '🌐 クラウドスケジュールリポジトリ (Schedule Repository)',
    repoModalSubtitle: '公式またはカスタムGitHubリポジトリからイベントスケジュールを閲覧・インポート',
    repoSelectLabel: 'リポジトリ選択：',
    repoOfficialName: '🌟 公式リポジトリ (vacabun/LivePulse-Schedule)',
    btnAddCustomRepo: 'リポジトリ追加',
    btnRefreshRepo: '更新',
    repoSearchPlaceholder: 'イベント名、アーティスト、会場、日付を検索...',
    btnBatchImport: '📥 選択したイベントを一括インポート ({count})',
    repoFooterTip: '💡 ヒント：クラウドからインポートしたスケジュールはデフォルトで未選択です。インポート後に自由に選択できます。',
    toastRepoLoaded: 'リポジトリから {count} 件のスケジュール設定を読み込みました！',
    toastRepoImportSuccess: 'リポジトリから「{name}」を正常にインポートしました！',
    toastRepoBatchSuccess: '{count} 件のイベントスケジュールを一括インポートしました！',
    promptAddRepoUrl: 'GitHubリポジトリURLまたはowner/repoを入力してください（例：vacabun/LivePulse-Schedule）：',
    btnImportSchedule: '📥 このイベントを取り込む',
    btnAlreadyImported: '✓ 登録済み',
    btnUpdateSchedule: '🔄 更新',
    btnUpdating: '⏳ 更新中...',
    btnUpdatedSuccess: '✅ 更新完了',
    btnUpdateSuccess: '✅ 更新完了',
    btnImporting: '⏳ インポート中...',
    btnImportSuccess: '✅ インポート完了',
    btnImportedSuccess: '✅ インポート完了',
    btnDeleteFestivalShort: '削除',
    btnDeleteFromLocal: 'ローカルから削除',
    btnDeleteThisFestival: '🗑️ このイベントを削除',
    toastRepoUpdateSuccess: '「{name}」の予定データを更新しました！',
    selectLabel: '選択',
    lineupLabel: '出演者',
    repoLoadingText: 'GitHubからイベント設定を取得中...',
    repoEmptyText: 'このリポジトリ内に有効なイベントJSONが見つかりませんでした',
    settingsRepoTitle: '🌐 クラウドスケジュールリポジトリ (GitHub Hub)',
    settingsRepoDesc: '公式推奨リポジトリやカスタムリポジトリからイベントを直接同期'
  },

  ko: {
    // Header & Global
    appTitle: 'LivePulse',
    headerSubtitle: '라이브 & 특전회 타임테이블',
    headerSubtitleEvents: '페스티벌 & 합동 라이브 목록',
    headerSubtitleMyRoute: '나의 활동 타임테이블',
    headerSubtitleSettings: '설정 및 데이터 센터',
    btnAddEvent: '일정 추가',
    themeToggle: '다크 / 라이트 모드 전환',
    langSelector: '표시 언어',

    // View Switcher & Toolbar
    viewMonth: '월간',
    viewMonthShort: '월',
    viewWeek: '주간',
    viewWeekShort: '주',
    view3Day: '3일간',
    view3DayShort: '3일',
    viewDay: '일간',
    viewDayShort: '일',
    zoomIn: '타임라인 확대',
    zoomOut: '타임라인 축소',
    btnToday: '오늘',
    prevCycle: '이전',
    nextCycle: '다음',

    // Categories & Filters
    catAll: '전체',
    catLive: 'Live (무대 라이브)',
    catTokuten: '특전회 (물판/체키/사인)',
    catOther: '기타 (입장/이동)',
    catLiveBadge: '🎤 라이브',
    catTokutenBadge: '📸 특전회',
    catOtherBadge: '🏷️ 기타',
    parentAll: '🎸 전체 이벤트 & 동선 총람',
    myRouteActive: '참가 일정만 보기',
    myRouteAll: '전체 타임테이블',
    myRouteTitleActive: '전환: 내가 참가 체크한 일정만 표시',
    myRouteTitleAll: '전환: 전체 일정 표시',

    // Meta Stats
    statCurrentEvents: '현재 일정:',
    statTotal: '총계:',
    statStarred: '참가 예정:',
    statFestivals: '이벤트:',

    // Weekdays
    weekdays: ['월', '화', '수', '목', '금', '토', '일'],
    weekdaysShort: ['월', '화', '수', '목', '금', '토', '일'],
    mobileSwipeHint: '좌우로 밀어 기간 이동 · 하단 바에서 탭 전환',

    // Tab 1 Events Page
    eventsPageTitle: '🎸 페스티벌 & 라이브 목록',
    eventsPageDesc: '전체 타임테이블을 확인하거나 템플릿/텍스트로 새 이벤트를 빠르게 추가하세요',
    btnOpenTemplate: '📝 템플릿 & 스마트 텍스트 가져오기',
    btnUploadJson: 'JSON 업로드',
    featuredTag: '🔥 공식 추천 템플릿',
    featuredTitle: '원코인 쇼케이스 @ Spotify O-WEST',
    featuredDesc: '출연: Mirror,Mirror / AKANECLUB. / 안개꽃과 스텔라 / 종연 후 물판·특전회',
    quickDownloadTemplate: '💾 템플릿 다운로드 (JSON)',
    quickImportTemplate: '⚡ 이 이벤트 가져오기',
    emptyEventsTitle: '등록된 이벤트가 없습니다',
    emptyEventsDesc: '위의 추천 템플릿을 가져오거나 공지 텍스트를 붙여넣어 자동으로 타임테이블을 생성하세요!',
    btnInspectTimetable: '타임테이블 확인 및 참가 선택',
    btnDeleteFestival: '이벤트 삭제',
    itemsCount: '개',
    groupsCount: '팀',

    // Tab 3 Settings Page
    settingsTitle: '⚙️ 데이터 관리 및 환경설정',
    settingsDesc: '개인 캘린더 내보내기, 백업 및 복원, 언어 환경설정',
    langCardTitle: '🌐 표시 언어 (Language)',
    storageTitle: '브라우저 로컬 저장소 (localStorage)',
    storageDesc: '{festivals}개 이벤트, 총 {events}개 일정 저장 중 (약 {sizeKB} KB 사용)',
    exportCardTitle: '데이터 내보내기 및 캘린더 동기화',
    exportJsonTitle: 'JSON 전체 백업 내보내기',
    exportJsonDesc: '모든 이벤트, 출연진 및 참가 체크 상태가 포함된 전체 백업',
    exportIcsTitle: 'iCal (.ics) 개인 캘린더 내보내기',
    exportIcsDesc: 'iPhone / Mac / Google 캘린더에 추가하여 라이브 알림 설정',
    settingsTemplateTitle: '💾 이벤트 설정 템플릿 (JSON) 다운로드',
    settingsTemplateDesc: '공식 표준 템플릿(원코인 쇼케이스)을 다운로드하여 새 일정을 직접 작성 가능',
    importCardTitle: '일정 데이터 가져오기 (JSON)',
    dropzoneText: '클릭하여 선택하거나 <strong>.json</strong> 파일을 여기에 드롭하세요',
    importModeMerge: '병합 추가 (기존 일정을 유지하고 새 이벤트 추가)',
    importModeOverwrite: '전체 덮어쓰기 (현재 데이터를 지우고 파일 내용으로 대체)',
    btnConfirmImport: '가져오기 시작',
    maintenanceCardTitle: '데이터 유지관리',
    btnClearAllData: '모든 로컬 데이터 삭제',

    // Modal: Template & Text Parser
    templateModalTitle: '📝 템플릿 목록 & 스마트 텍스트 파싱',
    templateModalSubtitle: '추천 템플릿을 선택하거나 공식 공지 텍스트를 붙여넣으세요',
    labelPresetTemplate: '추천 템플릿 선택',
    labelRawText: '공지 텍스트 / 타임테이블',
    btnReparseText: '✨ 텍스트 다시 파싱',
    rawTextPlaceholder: `공식 타임테이블 공지 텍스트를 붙여넣으세요:
ワンコインショーケース
○日程 9.5（土）
○会場 Spotify O-WEST
○タイムテーブル
12:30〜12:55 Mirror,Mirror
12:55〜13:20 AKANECLUB.
13:20〜13:45 かすみ草とステラ
13:55〜15:25 終演後物販・特典会`,
    parsedPreviewTitle: '파싱 결과 미리보기 ({count}개 일정)',
    btnSaveTemplateJson: '💾 템플릿 다운로드 (JSON)',
    btnImportParsedTemplate: '📥 내 이벤트 목록으로 가져오기',

    // Modal: Festival Inspect
    inspectModalTitle: '이벤트 타임테이블',
    btnSelectAll: '⭐ 전체 참가 일정으로 선택',
    btnDeselectAll: '전체 해제',
    btnGoToMyRoute: '나의 활동 일정 보기 ➔',

    // Modal: Day Detail
    dayDetailModalTitle: '일자별 공연 일정',
    btnAddDayEvent: '+ 이 날짜에 일정 추가',

    // Modal: Event Create/Edit Form
    modalTitleAdd: '일정 추가',
    modalTitleEdit: '일정 편집',
    labelGroupName: '그룹명 / 아티스트 *',
    groupNamePlaceholder: '예: Starry☆Sky / Mirror,Mirror',
    labelEventType: '분류 *',
    labelEventParent: '소속 이벤트 / 페스티벌명 *',
    parentEventPlaceholder: '예: 원코인 쇼케이스',
    labelEventVenue: '공연장 / 무대 / 구역',
    venuePlaceholder: '예: Spotify O-WEST 메인 스테이지',
    labelEventStartTime: '시작 시간',
    labelEventEndTime: '종료 시간',
    labelEventTableArea: '특전회 테이블 / 부스 번호',
    tableAreaPlaceholder: '예: 3번 테이블 / 부스 A-02',
    labelEventStarred: '⭐ 참가 일정으로 표시 (나의 일정에 추가)',
    labelEventDesc: '일정 메모 (한정 굿즈/세트리스트/주의사항 등)',
    descPlaceholder: '예: 신곡 최초 공개, 공연 후 즉시 물판 구역으로 이동...',
    btnDeleteEvent: '일정 삭제',
    btnCancel: '취소',
    btnSaveEvent: '일정 저장',

    // Nav Titles
    navEvents: '이벤트',
    navMyRoute: '나의 일정',
    navSettings: '설정',

    // Toasts & Prompts
    toastStarred: '「{group}」을(를) 참가 일정으로 추가했습니다!',
    toastUnstarred: '「{group}」의 참가 일정을 해제했습니다',
    toastAllStarred: '「{festival}」의 모든 그룹을 참가 일정으로 설정했습니다!',
    toastAllDeselected: '「{festival}」의 모든 선택을 해제했습니다',
    toastImportSuccess: '{count}개의 일정을 성공적으로 가져왔습니다!',
    toastImportTemplateSuccess: '템플릿「{name}」({count}개 일정)을(를) 가져왔습니다!',
    toastExportIcs: '개인 캘린더 (.ics)가 생성되었습니다! 캘린더 앱에 바로 추가할 수 있습니다',
    toastExportJson: 'JSON 백업 파일이 내보내졌습니다!',
    toastTemplateDownloaded: '공식 템플릿 JSON 파일이 다운로드되었습니다!',
    toastAllCleared: '모든 로컬 일정이 삭제되었습니다',
    toastEventSaved: '일정이 저장되었습니다!',
    toastEventDeleted: '일정이 삭제되었습니다',
    toastFestivalDeleted: '이벤트가 삭제되었습니다',
    toastSwitchStarred: '【참가 일정만 보기】모드로 전환되었습니다',
    toastSwitchAll: '【전체 일정】을 표시합니다',
    confirmClearAll: '【주의】모든 로컬 일정 데이터를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
    confirmDeleteEvent: '이 일정을 삭제하시겠습니까?',
    confirmDeleteFestival: '이벤트「{name}」및 모든 관련 일정을 삭제하시겠습니까?',
    allDay: '하루 종일',

    // Schedule Repository Hub
    btnRepoHub: '클라우드 일정 리포지토리',
    repoModalTitle: '🌐 클라우드 일정 리포지토리 (Schedule Repository)',
    repoModalSubtitle: '공식 또는 커스텀 GitHub 저장소에서 이벤트 일정을 탐색하고 바로 가져옵니다',
    repoSelectLabel: '리포지토리 선택:',
    repoOfficialName: '🌟 공식 리포지토리 (vacabun/LivePulse-Schedule)',
    btnAddCustomRepo: '저장소 추가',
    btnRefreshRepo: '새로고침',
    repoSearchPlaceholder: '이벤트명, 아티스트, 공연장, 날짜 검색...',
    btnBatchImport: '📥 선택한 이벤트 일괄 가져오기 ({count})',
    repoFooterTip: '💡 팁: 클라우드에서 가져온 일정은 기본적으로 미선택(참가 안함) 상태로 등록되어, 원하는 무대를 자유롭게 선택할 수 있습니다.',
    toastRepoLoaded: '저장소에서 {count}개의 일정 설정 파일을 성공적으로 불러왔습니다!',
    toastRepoImportSuccess: '저장소에서「{name}」을(를) 성공적으로 가져왔습니다!',
    toastRepoBatchSuccess: '{count}개 이벤트의 모든 일정을 성공적으로 일괄 가져왔습니다!',
    promptAddRepoUrl: 'GitHub 저장소 주소 또는 owner/repo를 입력하세요 (예: vacabun/LivePulse-Schedule):',
    btnImportSchedule: '📥 이 일정 가져오기',
    btnAlreadyImported: '✓ 목록에 있음',
    btnUpdateSchedule: '🔄 업데이트',
    btnUpdating: '⏳ 업데이트 중...',
    btnUpdatedSuccess: '✅ 업데이트 완료',
    btnUpdateSuccess: '✅ 업데이트 완료',
    btnImporting: '⏳ 가져오는 중...',
    btnImportSuccess: '✅ 가져오기 완료',
    btnImportedSuccess: '✅ 가져오기 완료',
    btnDeleteFestivalShort: '삭제',
    btnDeleteFromLocal: '로컬에서 삭제',
    btnDeleteThisFestival: '🗑️ 이 이벤트 삭제',
    toastRepoUpdateSuccess: '「{name}」일정을 업데이트했습니다!',
    selectLabel: '선택',
    lineupLabel: '출연진',
    repoLoadingText: 'GitHub에서 일정 설정을 가져오는 중...',
    repoEmptyText: '이 저장소에서 유효한 이벤트 JSON 설정을 찾을 수 없습니다',
    settingsRepoTitle: '🌐 클라우드 일정 저장소 (GitHub Hub)',
    settingsRepoDesc: '공식 또는 커스텀 GitHub 저장소에서 타임테이블을 탐색하고 동기화'
  }
};

class I18nManager {
  constructor() {
    const savedLang = localStorage.getItem('livepulse_lang');
    if (savedLang && translations[savedLang]) {
      this.currentLang = savedLang;
    } else {
      // Default to Korean
      this.currentLang = 'ko';
    }
  }

  getLang() {
    return this.currentLang;
  }

  setLang(lang) {
    if (!translations[lang]) return;
    this.currentLang = lang;
    try {
      localStorage.setItem('livepulse_lang', lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }

  t(key, params = {}, defaultVal = null) {
    const dict = translations[this.currentLang] || translations.zh;
    let str = (dict && dict[key]) || (translations.zh && translations.zh[key]);
    if (!str) {
      if (defaultVal !== null) return defaultVal;
      str = key;
    }
    if (typeof str === 'string') {
      Object.keys(params).forEach(paramKey => {
        str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }
    return str;
  }

  formatMonthYear(year, month) {
    // month is 1-12
    const pad = (n) => String(n).padStart(2, '0');
    if (this.currentLang === 'en') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[month - 1]} ${year}`;
    } else if (this.currentLang === 'ja') {
      return `${year}年 ${pad(month)}月`;
    } else if (this.currentLang === 'ko') {
      return `${year}년 ${pad(month)}월`;
    }
    return `${year}年 ${pad(month)}月`;
  }
}

export const i18n = new I18nManager();
