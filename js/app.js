/**
 * Main Application Logic - LivePulse (3-Tab Music Live & Tokuten Planner)
 * Tab 1: 🎪 活动列表 (Festivals Directory & Structured Template / Smart Text Parser)
 * Tab 2: 🗺️ 活动路线 (My Itinerary & Overlap Timetable - Default)
 *   - 月视图：聚合展示大活动/拼盘标题及项目数
 *   - 日视图：类型、标题、时间单行水平紧凑展示
 *   - 时间轴缩放：支持放大缩小并持久化保存至 localStorage
 * Tab 3: ⚙️ 设置与备份 (Settings & Data Backup Center)
 */

import { eventManager, CATEGORIES } from './events.js';

const PRESET_TEMPLATES = {
  onecoin: {
    name: "ワンコインショーケース",
    venue: "Spotify O-WEST",
    date: "2026-09-05",
    rawText: `ワンコインショーケース
○日程 9.5（土）
○会場 Spotify O-WEST
○時間 開場12:00/開演12:30
○タイムテーブル
OPEN12:00/START12:30
12:30〜12:55 Mirror,Mirror
12:55〜13:20 AKANECLUB.
13:20〜13:45 かすみ草とステラ
13:55〜15:25 終演後物販・特典会`
  },
  summeridol: {
    name: "SUMMER IDOL FES 2026",
    venue: "瓦肆 VAS",
    date: "2026-08-29",
    rawText: `SUMMER IDOL FES 2026
○日程 8.29
○会場 瓦肆 VAS
13:30〜14:00 Starry☆Sky
14:05〜14:35 CyberPulse
14:20〜15:30 Starry☆Sky (特典会 3号桌)
14:40〜15:15 Lunar Mirage
14:50〜15:50 CyberPulse (特典会 5号桌)`
  },
  anisong: {
    name: "ANISONG NIGHT 2026",
    venue: "MAO Livehouse",
    date: "2026-08-29",
    rawText: `ANISONG NIGHT 2026
○日程 8.29
○会場 MAO Livehouse
16:30〜17:15 Neon Blossom
17:30〜19:00 終演後物販・特典会`
  }
};

class CalendarApp {
  constructor() {
    this.activeTab = 'myroute'; // 'events' | 'myroute' (default) | 'settings'
    
    // Initialize anchorDate to the date of first event (or 2026-09-05)
    const allEvents = eventManager.getAllEvents();
    if (allEvents.length > 0 && allEvents[0].date) {
      const [y, m, d] = allEvents[0].date.split('-').map(Number);
      if (y && m && d) {
        this.anchorDate = new Date(y, m - 1, d);
      } else {
        this.anchorDate = new Date(2026, 8, 5);
      }
    } else {
      this.anchorDate = new Date(2026, 8, 5);
    }

    this.currentView = 'month'; // 'month' | 'week' | '3day' | 'day'
    this.selectedCategory = 'all';
    this.selectedParentEvent = 'all';
    this.onlyStarred = true; // Default: show starred rush itinerary
    this.theme = localStorage.getItem('theme') || 'dark';

    // Time-grid Hour Height Zoom configuration (Persisted)
    const savedHourHeight = localStorage.getItem('timeGridHourHeight');
    this.hourHeight = savedHourHeight ? Number(savedHourHeight) : 56;
    if (isNaN(this.hourHeight) || this.hourHeight < 36 || this.hourHeight > 140) {
      this.hourHeight = 56;
    }
    document.documentElement.style.setProperty('--hour-height', `${this.hourHeight}px`);

    // Touch gesture tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    // Staged Import & Parsed Template
    this.stagedImportContent = null;
    this.stagedFileName = null;
    this.currentParsedTemplate = null;

    // Inspecting Festival
    this.currentInspectingFestival = null;

    // DOM Elements Cache
    this.dom = {
      // Bottom Navigation Tabs
      bottomNavBar: document.getElementById('bottomNavBar'),
      navTabItems: document.querySelectorAll('.nav-tab-item'),
      pageEvents: document.getElementById('page-events'),
      pageMyRoute: document.getElementById('page-myroute'),
      pageSettings: document.getElementById('page-settings'),
      headerSubtitle: document.getElementById('headerSubtitle'),

      // Global Header Actions
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      themeIcon: document.getElementById('themeIcon'),
      toastContainer: document.getElementById('toastContainer'),
      newEventBtn: document.getElementById('newEventBtn'),
      mobileFabBtn: document.getElementById('mobileFabBtn'),

      // TAB 1: Events Directory DOM
      festivalsListContainer: document.getElementById('festivalsListContainer'),
      importFestivalBtn: document.getElementById('importFestivalBtn'),
      openTemplateModalBtn: document.getElementById('openTemplateModalBtn'),
      quickSaveTemplateJsonBtn: document.getElementById('quickSaveTemplateJsonBtn'),
      quickImportFeaturedTemplateBtn: document.getElementById('quickImportFeaturedTemplateBtn'),
      
      // Template Modal DOM
      templateModal: document.getElementById('templateModal'),
      closeTemplateModalBtn: document.getElementById('closeTemplateModalBtn'),
      presetTemplateSelect: document.getElementById('presetTemplateSelect'),
      rawTimetableTextInput: document.getElementById('rawTimetableTextInput'),
      parseTextBtn: document.getElementById('parseTextBtn'),
      parsedItemCount: document.getElementById('parsedItemCount'),
      parsedMetaSummary: document.getElementById('parsedMetaSummary'),
      parsedItemsList: document.getElementById('parsedItemsList'),
      saveTemplateJsonBtn: document.getElementById('saveTemplateJsonBtn'),
      importParsedTemplateBtn: document.getElementById('importParsedTemplateBtn'),

      // Festival Inspect Modal DOM
      festivalInspectModal: document.getElementById('festivalInspectModal'),
      festivalInspectTitle: document.getElementById('festivalInspectTitle'),
      festivalInspectSubtitle: document.getElementById('festivalInspectSubtitle'),
      festivalInspectTimeline: document.getElementById('festivalInspectTimeline'),
      closeFestivalInspectModalBtn: document.getElementById('closeFestivalInspectModalBtn'),
      festivalSelectAllBtn: document.getElementById('festivalSelectAllBtn'),
      festivalDeselectAllBtn: document.getElementById('festivalDeselectAllBtn'),
      goToMyRouteFromInspectBtn: document.getElementById('goToMyRouteFromInspectBtn'),

      // TAB 2: My Route Timetable DOM
      dateDisplay: document.getElementById('currentDateDisplay'),
      viewSwitcher: document.getElementById('viewSwitcher'),
      monthViewContainer: document.getElementById('monthViewContainer'),
      timeGridViewContainer: document.getElementById('timeGridViewContainer'),
      calendarMonthGrid: document.getElementById('calendarMonthGrid'),
      timeGridHeader: document.getElementById('timeGridHeader'),
      timeGridBodyScroll: document.getElementById('timeGridBodyScroll'),
      timeGutter: document.getElementById('timeGutter'),
      timeColumnsContainer: document.getElementById('timeColumnsContainer'),
      calendarCard: document.getElementById('calendarCard'),
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      todayBtn: document.getElementById('todayBtn'),
      categoryChipsContainer: document.getElementById('categoryChips'),
      parentEventSelect: document.getElementById('parentEventSelect'),
      myRouteBtn: document.getElementById('myRouteBtn'),
      myRouteBtnText: document.getElementById('myRouteBtnText'),
      totalEventsCount: document.getElementById('totalEventsCount'),
      viewEventsCount: document.getElementById('viewEventsCount'),

      // Zoom Controls DOM
      timeGridZoomControls: document.getElementById('timeGridZoomControls'),
      zoomInBtn: document.getElementById('zoomInBtn'),
      zoomOutBtn: document.getElementById('zoomOutBtn'),
      zoomLevelDisplay: document.getElementById('zoomLevelDisplay'),

      // TAB 3: Settings DOM
      settingsFestivalCount: document.getElementById('settingsFestivalCount'),
      settingsEventCount: document.getElementById('settingsEventCount'),
      settingsSizeKB: document.getElementById('settingsSizeKB'),
      settingsExportJsonBtn: document.getElementById('settingsExportJsonBtn'),
      settingsExportIcsBtn: document.getElementById('settingsExportIcsBtn'),
      settingsFileDropzone: document.getElementById('settingsFileDropzone'),
      settingsImportFileInput: document.getElementById('settingsImportFileInput'),
      settingsDropzoneText: document.getElementById('settingsDropzoneText'),
      settingsSelectedFileName: document.getElementById('settingsSelectedFileName'),
      settingsConfirmImportBtn: document.getElementById('settingsConfirmImportBtn'),
      settingsResetDemoBtn: document.getElementById('settingsResetDemoBtn'),
      settingsClearAllDataBtn: document.getElementById('settingsClearAllDataBtn'),

      // Event Modal (Create / Edit)
      eventModal: document.getElementById('eventModal'),
      eventForm: document.getElementById('eventForm'),
      closeEventModalBtn: document.getElementById('closeEventModalBtn'),
      cancelEventModalBtn: document.getElementById('cancelEventModalBtn'),
      modalTitle: document.getElementById('modalTitle'),
      eventIdInput: document.getElementById('eventIdInput'),
      eventGroupNameInput: document.getElementById('eventGroupNameInput'),
      eventTypeSelect: document.getElementById('eventTypeSelect'),
      eventParentInput: document.getElementById('eventParentInput'),
      parentEventDatalist: document.getElementById('parentEventDatalist'),
      eventVenueInput: document.getElementById('eventVenueInput'),
      eventTableAreaInput: document.getElementById('eventTableAreaInput'),
      eventDateInput: document.getElementById('eventDateInput'),
      eventStartTimeInput: document.getElementById('eventStartTimeInput'),
      eventEndTimeInput: document.getElementById('eventEndTimeInput'),
      eventStarredInput: document.getElementById('eventStarredInput'),
      eventDescInput: document.getElementById('eventDescInput'),
      deleteEventBtn: document.getElementById('deleteEventBtn'),

      // Day Detail Modal
      dayDetailModal: document.getElementById('dayDetailModal'),
      dayDetailTitle: document.getElementById('dayDetailTitle'),
      dayEventsList: document.getElementById('dayEventsListContainer'),
      closeDayDetailModalBtn: document.getElementById('closeDayDetailModalBtn'),
      addDayEventBtn: document.getElementById('addDayEventBtn')
    };

    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.updateZoomDisplay();
    this.renderCategoryChips();
    this.updateParentEventDropdown();
    this.switchTab('myroute');
    this.bindNavigationTabs();
    this.bindEvents();
    this.bindZoomControls();
    this.bindTouchGestures();
    this.bindSettingsEvents();
    this.bindFestivalInspectEvents();
    this.bindTemplateModalEvents();
  }

  /* --------------------------------------------------------------------------
     Navigation Tabs Router (3 Tabs)
     -------------------------------------------------------------------------- */
  switchTab(tabId) {
    this.activeTab = tabId;

    this.dom.navTabItems.forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    if (this.dom.headerSubtitle) {
      if (tabId === 'events') this.dom.headerSubtitle.textContent = '拼盘与活动列表';
      else if (tabId === 'myroute') this.dom.headerSubtitle.textContent = '我的活动路线时间表';
      else if (tabId === 'settings') this.dom.headerSubtitle.textContent = '设置与数据中心';
    }

    this.dom.pageEvents.style.display = tabId === 'events' ? 'block' : 'none';
    this.dom.pageMyRoute.style.display = tabId === 'myroute' ? 'block' : 'none';
    this.dom.pageSettings.style.display = tabId === 'settings' ? 'block' : 'none';

    if (tabId === 'events') {
      this.renderFestivalsDirectory();
    } else if (tabId === 'myroute') {
      this.renderView();
    } else if (tabId === 'settings') {
      this.renderSettingsStats();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  bindNavigationTabs() {
    this.dom.navTabItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  /* --------------------------------------------------------------------------
     Zoom Controls & Persistence
     -------------------------------------------------------------------------- */
  setZoom(newHourHeight) {
    this.hourHeight = Math.min(140, Math.max(36, newHourHeight));
    localStorage.setItem('timeGridHourHeight', String(this.hourHeight));
    document.documentElement.style.setProperty('--hour-height', `${this.hourHeight}px`);
    this.updateZoomDisplay();
    if (this.currentView !== 'month') {
      this.renderTimeGridView();
    }
  }

  updateZoomDisplay() {
    if (this.dom.zoomLevelDisplay) {
      const pct = Math.round((this.hourHeight / 56) * 100);
      this.dom.zoomLevelDisplay.textContent = `${pct}%`;
    }
  }

  bindZoomControls() {
    this.dom.zoomInBtn?.addEventListener('click', () => {
      this.setZoom(this.hourHeight + 12);
    });

    this.dom.zoomOutBtn?.addEventListener('click', () => {
      this.setZoom(this.hourHeight - 12);
    });
  }

  /* --------------------------------------------------------------------------
     Smart Timetable Text Parser Engine (Structured Schema Generation)
     -------------------------------------------------------------------------- */
  parseTimetableText(rawText) {
    if (!rawText || !rawText.trim()) return null;

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const today = new Date();
    const currentYear = today.getFullYear();
    const pad = (n) => String(n).padStart(2, '0');

    let eventName = 'ワンコインショーケース';
    let venue = 'Spotify O-WEST';
    let dateStr = `${currentYear}-09-05`;
    let openTime = '';
    let overallStartTime = '';
    let overallEndTime = '';

    // 1. Extract Event Title
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (!firstLine.startsWith('○') && !firstLine.startsWith('【') && !firstLine.includes('：') && !firstLine.includes(':')) {
        eventName = firstLine.replace(/^[#★◆■\s]+/, '').trim();
      }
    }

    // 2. Extract Venue, Date, Open/Start Times from metadata lines
    lines.forEach(line => {
      // Venue
      if (line.match(/(?:会場|会场|Venue|地点|場所)[：:\s]*(.+)/i)) {
        const m = line.match(/(?:会場|会场|Venue|地点|場所)[：:\s]*(.+)/i);
        if (m && m[1]) venue = m[1].trim();
      } else if (line.includes('@') && !line.includes(':')) {
        const parts = line.split('@');
        if (parts[1]) venue = parts[1].trim();
      }

      // Date
      if (line.match(/(?:日程|日期|Date)[：:\s]*(.+)/i)) {
        const dateRaw = line.match(/(?:日程|日期|Date)[：:\s]*(.+)/i)[1];
        const dateMatch = dateRaw.match(/(?:(\d{4})[年\.\/-])?\s*(\d{1,2})[月\.\/-](\d{1,2})/);
        if (dateMatch) {
          const y = dateMatch[1] ? Number(dateMatch[1]) : currentYear;
          const m = Number(dateMatch[2]);
          const d = Number(dateMatch[3]);
          dateStr = `${y}-${pad(m)}-${pad(d)}`;
        }
      }

      // Open/Start Times
      const openMatch = line.match(/(?:OPEN|開場|开场)\s*[:：]?\s*(\d{1,2}:\d{2})/i);
      if (openMatch) openTime = openMatch[1];

      const startMatch = line.match(/(?:START|開演|开演)\s*[:：]?\s*(\d{1,2}:\d{2})/i);
      if (startMatch) overallStartTime = startMatch[1];
    });

    const lives = [];
    const rawTokutenSlots = [];
    const otherEvents = [];
    const liveGroupNames = [];

    const timeRangeRegex = /(\d{1,2}:\d{2})\s*(?:〜|~|-|–|—|到)\s*(\d{1,2}:\d{2})\s*(.+)/;

    lines.forEach((line, idx) => {
      const match = line.match(timeRangeRegex);
      if (match) {
        const start = match[1];
        const end = match[2];
        const rawTitle = match[3].trim();

        if (!overallStartTime && (!openTime || start >= openTime)) {
          overallStartTime = start;
        }
        overallEndTime = end;

        // Categorize
        if (rawTitle.match(/(?:特典|物販|物贩|握手|チェキ|合影|サイン|サイン会|交流)/i)) {
          rawTokutenSlots.push({
            title: rawTitle,
            startTime: start,
            endTime: end,
            lineIdx: idx
          });
        } else if (rawTitle.match(/(?:OPEN|START|開場|開演|换场|転換|转场|休憩|开场|开演|交通|集合)/i)) {
          otherEvents.push({
            id: `tpl_other_${idx}`,
            title: rawTitle,
            startTime: start,
            endTime: end,
            venue: venue,
            description: '',
            isStarred: false
          });
        } else {
          // Live Performance Item
          const groupName = rawTitle.replace(/[\(（].*?(?:Live|演出).*?[\)）]/gi, '').trim();
          liveGroupNames.push(groupName);

          lives.push({
            id: `tpl_live_${idx}`,
            groupName: groupName,
            stage: venue,
            startTime: start,
            endTime: end,
            description: `Live 舞台演出 (${start} ~ ${end})`,
            isStarred: true
          });
        }
      }
    });

    // 3. Process Tokutenkai: if joint/all-group tokutenkai, generate individual event per live group!
    const tokutenkais = [];
    rawTokutenSlots.forEach((slot, sIdx) => {
      const isJoint = slot.title.match(/(?:終演後|全出演|全体|全员|各组|各團|一斉)/i) || (liveGroupNames.length > 0 && !liveGroupNames.some(g => slot.title.includes(g)));

      if (isJoint && liveGroupNames.length > 0) {
        liveGroupNames.forEach((groupName, gIdx) => {
          tokutenkais.push({
            id: `tpl_tokuten_${sIdx}_${gIdx}`,
            groupName: groupName,
            venue: venue,
            tableArea: '',
            startTime: slot.startTime,
            endTime: slot.endTime,
            description: `${slot.title} (拍立得合影/签名交流)`,
            isStarred: true
          });
        });
      } else {
        // Individual group specified
        const matchedGroup = liveGroupNames.find(g => slot.title.includes(g)) || slot.title;
        tokutenkais.push({
          id: `tpl_tokuten_${sIdx}`,
          groupName: matchedGroup,
          venue: venue,
          tableArea: '',
          startTime: slot.startTime,
          endTime: slot.endTime,
          description: slot.title,
          isStarred: true
        });
      }
    });

    return {
      version: "2.0",
      festival: {
        name: eventName,
        venue: venue,
        date: dateStr,
        openTime: openTime || '12:00',
        startTime: overallStartTime || '12:30',
        endTime: overallEndTime || '15:25',
        description: `${eventName} @ ${venue}`
      },
      lives,
      tokutenkais,
      otherEvents
    };
  }

  /* --------------------------------------------------------------------------
     Template Modal & Quick Actions
     -------------------------------------------------------------------------- */
  openTemplateModal(presetKey = 'onecoin') {
    if (this.dom.presetTemplateSelect) {
      this.dom.presetTemplateSelect.value = presetKey;
    }
    const preset = PRESET_TEMPLATES[presetKey] || PRESET_TEMPLATES.onecoin;
    if (this.dom.rawTimetableTextInput) {
      this.dom.rawTimetableTextInput.value = preset.rawText;
    }
    this.executeTextParse();
    this.dom.templateModal.classList.add('active');
  }

  closeTemplateModal() {
    this.dom.templateModal.classList.remove('active');
  }

  executeTextParse() {
    const raw = this.dom.rawTimetableTextInput.value;
    const parsed = this.parseTimetableText(raw);
    this.currentParsedTemplate = parsed;

    const totalCount = (parsed?.lives?.length || 0) + (parsed?.tokutenkais?.length || 0) + (parsed?.otherEvents?.length || 0);

    if (!parsed || totalCount === 0) {
      if (this.dom.parsedItemCount) this.dom.parsedItemCount.textContent = '0';
      if (this.dom.parsedMetaSummary) this.dom.parsedMetaSummary.textContent = '未识别到有效时间段';
      if (this.dom.parsedItemsList) {
        this.dom.parsedItemsList.innerHTML = `<div class="empty-day-state" style="padding: 1rem;"><p>未能识别出时间格式（格式示例：12:30〜12:55 团体名）</p></div>`;
      }
      if (this.dom.importParsedTemplateBtn) this.dom.importParsedTemplateBtn.disabled = true;
      if (this.dom.saveTemplateJsonBtn) this.dom.saveTemplateJsonBtn.disabled = true;
      return;
    }

    if (this.dom.parsedItemCount) this.dom.parsedItemCount.textContent = totalCount;
    if (this.dom.parsedMetaSummary) {
      this.dom.parsedMetaSummary.textContent = `📅 ${parsed.festival.date} · 📍 ${parsed.festival.venue} (${parsed.festival.openTime ? '開場' + parsed.festival.openTime + ' / ' : ''}開演${parsed.festival.startTime} ~ 終演${parsed.festival.endTime})`;
    }

    if (this.dom.parsedItemsList) {
      this.dom.parsedItemsList.innerHTML = '';

      // Render Lives
      parsed.lives.forEach(l => {
        const item = document.createElement('div');
        item.className = 'parsed-item-card cat-live';
        item.innerHTML = `
          <div>
            <strong>${this.escapeHtml(l.groupName)}</strong>
            <span style="font-size: 0.72rem; opacity: 0.8; margin-left: 6px;">🕒 ${l.startTime} ~ ${l.endTime}</span>
          </div>
          <span class="time-event-type-badge">🎤 Live</span>
        `;
        this.dom.parsedItemsList.appendChild(item);
      });

      // Render Tokutenkais (one per group)
      parsed.tokutenkais.forEach(t => {
        const item = document.createElement('div');
        item.className = 'parsed-item-card cat-tokuten';
        item.innerHTML = `
          <div>
            <strong>${this.escapeHtml(t.groupName)}</strong>
            <span style="font-size: 0.72rem; opacity: 0.8; margin-left: 6px;">🕒 ${t.startTime} ~ ${t.endTime}</span>
          </div>
          <span class="time-event-type-badge">📸 特典会</span>
        `;
        this.dom.parsedItemsList.appendChild(item);
      });

      // Render Other Events
      parsed.otherEvents.forEach(o => {
        const item = document.createElement('div');
        item.className = 'parsed-item-card cat-other';
        item.innerHTML = `
          <div>
            <strong>${this.escapeHtml(o.title)}</strong>
            <span style="font-size: 0.72rem; opacity: 0.8; margin-left: 6px;">🕒 ${o.startTime} ~ ${o.endTime}</span>
          </div>
          <span class="time-event-type-badge">🏷️ 其他</span>
        `;
        this.dom.parsedItemsList.appendChild(item);
      });
    }

    if (this.dom.importParsedTemplateBtn) this.dom.importParsedTemplateBtn.disabled = false;
    if (this.dom.saveTemplateJsonBtn) this.dom.saveTemplateJsonBtn.disabled = false;
  }

  saveParsedTemplateAsJsonFile() {
    if (!this.currentParsedTemplate) {
      this.showToast('无可导出的有效模版数据', 'error');
      return;
    }
    const jsonStr = JSON.stringify(this.currentParsedTemplate, null, 2);
    const safeName = (this.currentParsedTemplate.festival?.name || 'event_template').replace(/[\s\/\\]+/g, '_');
    this.downloadFile(jsonStr, `${safeName}_template.json`, 'application/json;charset=utf-8');
    this.showToast(`已成功保存并下载模版「${this.currentParsedTemplate.festival?.name}」！`, 'success');
  }

  importParsedTemplateDirectly() {
    if (!this.currentParsedTemplate) {
      this.showToast('无可导入的有效排程', 'error');
      return;
    }
    const jsonStr = JSON.stringify(this.currentParsedTemplate);
    const result = eventManager.importFromJSON(jsonStr, 'merge');
    if (result.success) {
      this.showToast(`已成功导入「${this.currentParsedTemplate.festival.name}」！`, 'success');
      this.updateParentEventDropdown();
      this.closeTemplateModal();
      this.renderFestivalsDirectory();
      this.renderView();
    } else {
      this.showToast(result.error, 'error');
    }
  }

  bindTemplateModalEvents() {
    this.dom.openTemplateModalBtn?.addEventListener('click', () => this.openTemplateModal('onecoin'));
    this.dom.closeTemplateModalBtn?.addEventListener('click', () => this.closeTemplateModal());
    this.dom.templateModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.templateModal) this.closeTemplateModal();
    });

    this.dom.presetTemplateSelect?.addEventListener('change', (e) => {
      const key = e.target.value;
      const preset = PRESET_TEMPLATES[key];
      if (preset && this.dom.rawTimetableTextInput) {
        this.dom.rawTimetableTextInput.value = preset.rawText;
        this.executeTextParse();
      }
    });

    this.dom.parseTextBtn?.addEventListener('click', () => this.executeTextParse());
    this.dom.saveTemplateJsonBtn?.addEventListener('click', () => this.saveParsedTemplateAsJsonFile());
    this.dom.importParsedTemplateBtn?.addEventListener('click', () => this.importParsedTemplateDirectly());

    // Quick Featured Actions on Banner
    this.dom.quickSaveTemplateJsonBtn?.addEventListener('click', () => {
      const parsed = this.parseTimetableText(PRESET_TEMPLATES.onecoin.rawText);
      this.currentParsedTemplate = parsed;
      this.saveParsedTemplateAsJsonFile();
    });

    this.dom.quickImportFeaturedTemplateBtn?.addEventListener('click', () => {
      const parsed = this.parseTimetableText(PRESET_TEMPLATES.onecoin.rawText);
      const jsonStr = JSON.stringify(parsed);
      const res = eventManager.importFromJSON(jsonStr, 'merge');
      if (res.success) {
        this.showToast('已成功一键导入「ワンコインショーケース」排程！', 'success');
        this.updateParentEventDropdown();
        this.renderFestivalsDirectory();
        this.renderView();
      }
    });
  }

  /* --------------------------------------------------------------------------
     TAB 1: 🎪 活动列表页面 (Festivals Directory & Inspection)
     -------------------------------------------------------------------------- */
  renderFestivalsDirectory() {
    if (!this.dom.festivalsListContainer) return;

    const festivals = eventManager.getFestivalSummaryList();
    this.dom.festivalsListContainer.innerHTML = '';

    if (festivals.length === 0) {
      this.dom.festivalsListContainer.innerHTML = `
        <div class="empty-day-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>暂无收录的拼盘活动，点击上方「模版库 & 文本智能导入」快速添加新活动！</p>
        </div>
      `;
      return;
    }

    festivals.forEach(fest => {
      const card = document.createElement('div');
      card.className = 'festival-card';

      const pct = fest.totalEvents > 0 ? Math.round((fest.starredCount / fest.totalEvents) * 100) : 0;

      card.innerHTML = `
        <div class="festival-card-header">
          <div>
            <h3 class="festival-card-title">${this.escapeHtml(fest.name)}</h3>
            <div class="festival-meta-tags">
              <span class="meta-tag date-tag">📅 ${this.escapeHtml(fest.dateRange)}</span>
              <span class="meta-tag venue-tag">📍 ${this.escapeHtml(fest.venues)}</span>
              <span class="meta-tag">👥 ${fest.groupCount} 组艺人</span>
            </div>
          </div>
        </div>

        <div class="festival-progress-box">
          <div class="progress-header">
            <span>参加标记</span>
            <span><strong>${fest.starredCount}</strong> / ${fest.totalEvents} 项 (${pct}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="festival-card-actions">
          <button class="btn-inspect-schedule inspect-btn">
            🔍 查看完整时间表 & 标记参加
          </button>
        </div>
      `;

      card.querySelector('.inspect-btn').addEventListener('click', () => {
        this.openFestivalInspectModal(fest.name);
      });

      this.dom.festivalsListContainer.appendChild(card);
    });
  }

  openFestivalInspectModal(parentEventName) {
    this.currentInspectingFestival = parentEventName;
    const allEvents = eventManager.getEventsByParent(parentEventName);
    
    allEvents.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    if (this.dom.festivalInspectTitle) this.dom.festivalInspectTitle.textContent = parentEventName;
    if (this.dom.festivalInspectSubtitle) {
      const dates = Array.from(new Set(allEvents.map(e => e.date))).sort().join(', ');
      this.dom.festivalInspectSubtitle.textContent = `包含 ${allEvents.length} 个排程 · 日期: ${dates}`;
    }

    this.renderFestivalInspectTimeline(allEvents);
    this.dom.festivalInspectModal.classList.add('active');
  }

  renderFestivalInspectTimeline(events) {
    if (!this.dom.festivalInspectTimeline) return;
    this.dom.festivalInspectTimeline.innerHTML = '';

    events.forEach(evt => {
      const row = document.createElement('div');
      const type = evt.type || evt.category || 'live';
      row.className = `timeline-item-row ${evt.isStarred ? 'is-starred' : ''}`;

      const typeBadge = (type === 'tokuten' ? '📸 特典会' : (type === 'live' ? '🎤 Live' : '🏷️ 其他'));
      const timeDisplay = (evt.startTime || evt.endTime) ? `${evt.startTime || ''} ~ ${evt.endTime || ''}` : '全天';

      let metaInfo = `${evt.date || ''} · ${evt.venue || '主舞台'}`;
      if (evt.tableArea) metaInfo += ` · ${evt.tableArea}`;

      row.innerHTML = `
        <div class="timeline-time-col">
          <div>${timeDisplay}</div>
          <span class="time-event-type-badge" style="margin-top: 2px;">${typeBadge}</span>
        </div>
        <div class="timeline-info-col">
          <h4>${this.escapeHtml(evt.groupName || evt.title)}</h4>
          <div class="meta-line">${this.escapeHtml(metaInfo)}</div>
          ${evt.description ? `<div class="meta-line" style="color: var(--text-secondary);">${this.escapeHtml(evt.description)}</div>` : ''}
        </div>
        <button class="timeline-star-toggle ${evt.isStarred ? 'active' : ''}">
          <span>${evt.isStarred ? '⭐ 已标记参加' : '标记参加'}</span>
        </button>
      `;

      const starBtn = row.querySelector('.timeline-star-toggle');
      starBtn.addEventListener('click', () => {
        const newStarred = eventManager.toggleStar(evt.id);
        evt.isStarred = newStarred;
        row.classList.toggle('is-starred', newStarred);
        starBtn.classList.toggle('active', newStarred);
        starBtn.querySelector('span').textContent = newStarred ? '⭐ 已标记参加' : '标记参加';
        this.showToast(newStarred ? `已将「${evt.groupName}」标记为参加！` : `已取消参加「${evt.groupName}」`, 'info');
      });

      this.dom.festivalInspectTimeline.appendChild(row);
    });
  }

  closeFestivalInspectModal() {
    this.dom.festivalInspectModal.classList.remove('active');
    this.renderFestivalsDirectory();
  }

  bindFestivalInspectEvents() {
    this.dom.closeFestivalInspectModalBtn?.addEventListener('click', () => this.closeFestivalInspectModal());
    this.dom.festivalInspectModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.festivalInspectModal) this.closeFestivalInspectModal();
    });

    this.dom.festivalSelectAllBtn?.addEventListener('click', () => {
      if (this.currentInspectingFestival) {
        eventManager.setFestivalAllStarred(this.currentInspectingFestival, true);
        this.showToast(`已将「${this.currentInspectingFestival}」全部团体标记为参加！`, 'success');
        const allEvents = eventManager.getEventsByParent(this.currentInspectingFestival);
        this.renderFestivalInspectTimeline(allEvents);
      }
    });

    this.dom.festivalDeselectAllBtn?.addEventListener('click', () => {
      if (this.currentInspectingFestival) {
        eventManager.setFestivalAllStarred(this.currentInspectingFestival, false);
        this.showToast(`已取消勾选「${this.currentInspectingFestival}」的全部团体`, 'info');
        const allEvents = eventManager.getEventsByParent(this.currentInspectingFestival);
        this.renderFestivalInspectTimeline(allEvents);
      }
    });

    this.dom.goToMyRouteFromInspectBtn?.addEventListener('click', () => {
      this.closeFestivalInspectModal();
      this.switchTab('myroute');
    });

    this.dom.importFestivalBtn?.addEventListener('click', () => {
      this.switchTab('settings');
      setTimeout(() => {
        this.dom.settingsImportFileInput?.click();
      }, 100);
    });
  }

  /* --------------------------------------------------------------------------
     TAB 2: 🗺️ 我的赶场页面 (My Itinerary Timetable)
     -------------------------------------------------------------------------- */
  getFilteredEvents() {
    return eventManager.getAllEvents().filter(e => {
      if (this.selectedCategory !== 'all') {
        const type = e.type || e.category;
        if (type !== this.selectedCategory) return false;
      }
      if (this.selectedParentEvent !== 'all') {
        if (e.parentEvent !== this.selectedParentEvent) return false;
      }
      if (this.onlyStarred) {
        if (!e.isStarred) return false;
      }
      return true;
    });
  }

  renderView() {
    document.querySelectorAll('.view-btn').forEach(btn => {
      const isActive = btn.dataset.view === this.currentView;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    if (this.currentView === 'month') {
      this.dom.monthViewContainer.style.display = 'flex';
      this.dom.timeGridViewContainer.style.display = 'none';
      if (this.dom.timeGridZoomControls) this.dom.timeGridZoomControls.style.display = 'none';
      this.renderMonthView();
    } else {
      this.dom.monthViewContainer.style.display = 'none';
      this.dom.timeGridViewContainer.style.display = 'flex';
      if (this.dom.timeGridZoomControls) this.dom.timeGridZoomControls.style.display = 'inline-flex';
      this.renderTimeGridView();
    }
  }

  renderMonthView() {
    const year = this.anchorDate.getFullYear();
    const month = this.anchorDate.getMonth() + 1;
    const pad = (n) => String(n).padStart(2, '0');

    if (this.dom.dateDisplay) {
      this.dom.dateDisplay.textContent = `${year}年 ${pad(month)}月`;
    }

    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay();
    const startOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const filteredEvents = this.getFilteredEvents();
    const eventsByDate = {};
    filteredEvents.forEach(evt => {
      if (!eventsByDate[evt.date]) eventsByDate[evt.date] = [];
      eventsByDate[evt.date].push(evt);
    });

    const monthPrefix = `${year}-${pad(month)}`;
    const thisMonthEvents = filteredEvents.filter(e => e.date && e.date.startsWith(monthPrefix));
    if (this.dom.totalEventsCount) this.dom.totalEventsCount.textContent = eventManager.getAllEvents().length;
    if (this.dom.viewEventsCount) this.dom.viewEventsCount.textContent = thisMonthEvents.length;

    this.dom.calendarMonthGrid.innerHTML = '';
    const totalCells = 42;
    
    // Prev Month
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const dateStr = `${prevYear}-${pad(prevMonth)}-${pad(dayNum)}`;
      this.dom.calendarMonthGrid.appendChild(
        this.createMonthDayCell(dateStr, dayNum, true, false, eventsByDate[dateStr] || [])
      );
    }

    // Current Month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${pad(month)}-${pad(d)}`;
      const isToday = dateStr === todayStr;
      this.dom.calendarMonthGrid.appendChild(
        this.createMonthDayCell(dateStr, d, false, isToday, eventsByDate[dateStr] || [])
      );
    }

    // Next Month
    const remainingCells = totalCells - (startOffset + totalDaysInMonth);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    for (let n = 1; n <= remainingCells; n++) {
      const dateStr = `${nextYear}-${pad(nextMonth)}-${pad(n)}`;
      this.dom.calendarMonthGrid.appendChild(
        this.createMonthDayCell(dateStr, n, true, false, eventsByDate[dateStr] || [])
      );
    }
  }

  createMonthDayCell(dateStr, dayNum, isOtherMonth, isToday, dayEvents) {
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
    cell.dataset.date = dateStr;

    const header = document.createElement('div');
    header.className = 'day-header';

    const numSpan = document.createElement('span');
    numSpan.className = 'day-number';
    numSpan.textContent = dayNum;
    header.appendChild(numSpan);

    if (dayEvents.length > 0) {
      const countBadge = document.createElement('span');
      countBadge.className = 'day-badge-count';
      countBadge.textContent = `${dayEvents.length}`;
      header.appendChild(countBadge);
    }

    cell.appendChild(header);

    // Group by Parent Festival (Big Event / 大活动)
    const festivalsMap = new Map();
    dayEvents.forEach(evt => {
      const parent = (evt.parentEvent || '独立排程').trim();
      if (!festivalsMap.has(parent)) {
        festivalsMap.set(parent, { name: parent, events: [], hasStarred: false });
      }
      const item = festivalsMap.get(parent);
      item.events.push(evt);
      if (evt.isStarred) item.hasStarred = true;
    });

    const festArray = Array.from(festivalsMap.values());

    // Mobile Dots
    if (festArray.length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'day-events-dots';
      festArray.slice(0, 3).forEach(() => {
        const dot = document.createElement('span');
        dot.className = 'mobile-event-dot';
        dot.style.backgroundColor = '#ec4899';
        dotsContainer.appendChild(dot);
      });
      if (festArray.length > 3) {
        const moreDot = document.createElement('span');
        moreDot.className = 'mobile-event-dot-more';
        moreDot.textContent = '+';
        dotsContainer.appendChild(moreDot);
      }
      cell.appendChild(dotsContainer);
    }

    // Month View Big Festival Pills List
    const eventsList = document.createElement('div');
    eventsList.className = 'day-events-list';

    const maxVisibleFestivals = 3;
    const visibleFestivals = festArray.slice(0, maxVisibleFestivals);
    const overflowCount = festArray.length - maxVisibleFestivals;

    visibleFestivals.forEach(fest => {
      const pill = document.createElement('div');
      pill.className = `festival-month-pill ${fest.hasStarred ? 'has-starred' : ''}`;
      
      const starIcon = fest.hasStarred ? '⭐ ' : '';
      pill.title = `【${fest.name}】\n包含 ${fest.events.length} 项排程\n点击查看并标记参加`;

      pill.innerHTML = `
        <span class="fest-pill-title">${starIcon}🎪 ${this.escapeHtml(fest.name)}</span>
        <span class="fest-pill-count">${fest.events.length}项</span>
      `;

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openFestivalInspectModal(fest.name);
      });

      eventsList.appendChild(pill);
    });

    if (overflowCount > 0) {
      const moreBadge = document.createElement('div');
      moreBadge.className = 'more-events-badge';
      moreBadge.textContent = `+${overflowCount} 更多活动`;
      moreBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDayDetailModal(dateStr);
      });
      eventsList.appendChild(moreBadge);
    }

    cell.appendChild(eventsList);

    cell.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      this.openDayDetailModal(dateStr);
    });

    return cell;
  }

  renderTimeGridView() {
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const viewDates = this.getViewDates();
    this.updateTimeGridHeaderTitle(viewDates);

    this.dom.timeGridHeader.innerHTML = `
      <div class="time-grid-header-corner">时间</div>
      <div class="time-grid-header-cols"></div>
    `;
    const headerColsContainer = this.dom.timeGridHeader.querySelector('.time-grid-header-cols');

    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const shortWeekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

    viewDates.forEach(d => {
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const isToday = dateStr === todayStr;
      const dayOfWeek = d.getDay();

      const col = document.createElement('div');
      col.className = `time-grid-header-col ${isToday ? 'is-today' : ''}`;
      col.innerHTML = `
        <span class="col-weekday"><span class="full-label">${weekdayNames[dayOfWeek]}</span><span class="short-label">${shortWeekdayNames[dayOfWeek]}</span></span>
        <span class="col-daynum">${d.getDate()}</span>
      `;
      headerColsContainer.appendChild(col);
    });

    this.dom.timeGutter.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const slot = document.createElement('div');
      slot.className = 'time-gutter-slot';
      slot.innerHTML = `<span class="time-gutter-label">${pad(h)}:00</span>`;
      this.dom.timeGutter.appendChild(slot);
    }

    this.dom.timeColumnsContainer.innerHTML = '';
    const filteredEvents = this.getFilteredEvents();
    let viewEventsCount = 0;

    viewDates.forEach(d => {
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const isToday = dateStr === todayStr;

      const dayCol = document.createElement('div');
      dayCol.className = 'time-day-column';
      dayCol.dataset.date = dateStr;

      for (let h = 0; h < 24; h++) {
        const hourSlot = document.createElement('div');
        hourSlot.className = 'time-hour-slot';
        hourSlot.dataset.hour = h;
        
        hourSlot.addEventListener('click', (e) => {
          if (e.target === hourSlot || e.target.classList.contains('time-hour-slot')) {
            const startH = pad(h);
            const endH = pad(Math.min(23, h + 1));
            this.openNewEventModal(dateStr, `${startH}:00`, `${endH}:00`);
          }
        });

        dayCol.appendChild(hourSlot);
      }

      if (isToday) {
        const curH = now.getHours();
        const curM = now.getMinutes();
        const curMinutes = curH * 60 + curM;
        const topPx = (curMinutes / 60) * this.hourHeight;

        const timeLine = document.createElement('div');
        timeLine.className = 'current-time-line';
        timeLine.style.top = `${topPx}px`;
        timeLine.innerHTML = `<span class="current-time-dot"></span>`;
        dayCol.appendChild(timeLine);
      }

      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      viewEventsCount += dayEvents.length;

      const positionedEvents = this.computeOverlapLayout(dayEvents);

      positionedEvents.forEach(item => {
        const card = this.createTimeEventCard(item.event, item.colIndex, item.totalCols);
        dayCol.appendChild(card);
      });

      this.dom.timeColumnsContainer.appendChild(dayCol);
    });

    if (this.dom.totalEventsCount) this.dom.totalEventsCount.textContent = eventManager.getAllEvents().length;
    if (this.dom.viewEventsCount) this.dom.viewEventsCount.textContent = viewEventsCount;

    setTimeout(() => {
      const scrollHour = (now.getHours() >= 8 && now.getHours() <= 20) ? Math.max(0, now.getHours() - 1) : 8;
      this.dom.timeGridBodyScroll.scrollTop = scrollHour * this.hourHeight;
    }, 20);
  }

  computeOverlapLayout(events) {
    if (!events || events.length === 0) return [];

    const eventItems = events.map(evt => {
      let [startH, startM] = (evt.startTime || '12:00').split(':').map(Number);
      let [endH, endM] = (evt.endTime || `${Math.min(23, startH + 1)}:${startM || 0}`).split(':').map(Number);
      if (isNaN(startH)) startH = 12;
      if (isNaN(startM)) startM = 0;
      if (isNaN(endH)) endH = startH + 1;
      if (isNaN(endM)) endM = startM;

      const startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;
      if (endMinutes <= startMinutes) endMinutes = startMinutes + 45;

      return {
        event: evt,
        startMinutes,
        endMinutes,
        durationMinutes: Math.max(25, endMinutes - startMinutes),
        colIndex: 0,
        totalCols: 1
      };
    });

    eventItems.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    eventItems.forEach(item => {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endMinutes;
      } else if (item.startMinutes < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMinutes);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMinutes;
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    clusters.forEach(cluster => {
      const columns = [];
      cluster.forEach(item => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastItem = columns[i][columns[i].length - 1];
          if (lastItem.endMinutes <= item.startMinutes) {
            columns[i].push(item);
            item.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.colIndex = columns.length;
          columns.push([item]);
        }
      });

      const totalCols = columns.length;
      cluster.forEach(item => {
        item.totalCols = totalCols;
      });
    });

    return eventItems;
  }

  createTimeEventCard(evt, colIndex = 0, totalCols = 1) {
    const type = evt.type || evt.category || 'live';
    const isDayView = this.currentView === 'day';
    const card = document.createElement('div');
    card.className = `time-event-card cat-${type} ${evt.isStarred ? 'is-starred' : ''} ${isDayView ? 'is-day-view' : ''}`;

    let [startH, startM] = (evt.startTime || '12:00').split(':').map(Number);
    let [endH, endM] = (evt.endTime || `${Math.min(23, startH + 1)}:${startM || 0}`).split(':').map(Number);

    if (isNaN(startH)) startH = 12;
    if (isNaN(startM)) startM = 0;
    if (isNaN(endH)) endH = startH + 1;
    if (isNaN(endM)) endM = startM;

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes = startMinutes + 45;

    const durationMinutes = Math.max(25, endMinutes - startMinutes);
    const topPx = (startMinutes / 60) * this.hourHeight;
    const heightPx = (durationMinutes / 60) * this.hourHeight - 2;

    const colWidthPct = (100 / totalCols);
    const colLeftPct = (colIndex * colWidthPct);

    card.style.top = `${topPx}px`;
    card.style.height = `${heightPx}px`;
    card.style.left = `calc(${colLeftPct}% + 2px)`;
    card.style.width = `calc(${colWidthPct}% - 4px)`;

    const typeLabel = (type === 'tokuten' ? '📸 特典会' : (type === 'live' ? '🎤 Live' : '🏷️ 其他'));
    const timeText = (evt.startTime || evt.endTime) ? `${evt.startTime || ''} - ${evt.endTime || ''}` : '全天';
    const groupName = evt.groupName || evt.title || '参演团体';

    let locationInfo = '';
    if (evt.venue) locationInfo += evt.venue;
    if (evt.tableArea) locationInfo += ` · ${evt.tableArea}`;

    // Multiline Layout: Title + Star, Time, Location/Parent, and Type Badge in the last row
    card.innerHTML = `
      <div class="time-event-top-row">
        <div class="time-event-title">${this.escapeHtml(groupName)}</div>
        <button class="star-toggle-btn ${evt.isStarred ? 'active' : ''}" title="${evt.isStarred ? '已标记参加 (在我的活动路线中)' : '标记参加 (加入我的活动路线)'}">
          ⭐
        </button>
      </div>
      <div class="time-event-time">🕒 ${timeText}</div>
      ${evt.parentEvent || locationInfo ? `
        <div class="time-event-meta-row">
          ${evt.parentEvent ? `<span class="time-event-parent-badge">🎪 ${this.escapeHtml(evt.parentEvent)}</span>` : ''}
          ${locationInfo ? `<span class="time-event-venue">📍 ${this.escapeHtml(locationInfo)}</span>` : ''}
        </div>
      ` : ''}
      <div class="time-event-bottom-row">
        <span class="time-event-type-badge">${typeLabel}</span>
      </div>
    `;

    const starBtn = card.querySelector('.star-toggle-btn');
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newStarred = eventManager.toggleStar(evt.id);
      this.showToast(newStarred ? `已将「${groupName}」标记为参加！` : `已取消参加「${groupName}」`, 'info');
      this.renderView();
    });

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditEventModal(evt);
    });

    return card;
  }

  getViewDates() {
    const dates = [];

    if (this.currentView === 'day') {
      dates.push(new Date(this.anchorDate));
    } else if (this.currentView === '3day') {
      for (let i = 0; i < 3; i++) {
        const d = new Date(this.anchorDate);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    } else if (this.currentView === 'week') {
      const current = new Date(this.anchorDate);
      const dayOfWeek = current.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
      const monday = new Date(current);
      monday.setDate(current.getDate() + diffToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
      }
    }
    return dates;
  }

  updateTimeGridHeaderTitle(viewDates) {
    if (!this.dom.dateDisplay || viewDates.length === 0) return;
    const pad = (n) => String(n).padStart(2, '0');

    if (this.currentView === 'day') {
      const d = viewDates[0];
      const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      this.dom.dateDisplay.textContent = `${d.getFullYear()}年 ${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${weekdayNames[d.getDay()]}`;
    } else {
      const start = viewDates[0];
      const end = viewDates[viewDates.length - 1];

      if (start.getFullYear() === end.getFullYear()) {
        if (start.getMonth() === end.getMonth()) {
          this.dom.dateDisplay.textContent = `${start.getFullYear()}年 ${pad(start.getMonth() + 1)}月${pad(start.getDate())}日 - ${pad(end.getDate())}日`;
        } else {
          this.dom.dateDisplay.textContent = `${start.getFullYear()}年 ${pad(start.getMonth() + 1)}月${pad(start.getDate())}日 - ${pad(end.getMonth() + 1)}月${pad(end.getDate())}日`;
        }
      } else {
        this.dom.dateDisplay.textContent = `${start.getFullYear()}年${pad(start.getMonth() + 1)}月${pad(start.getDate())}日 - ${end.getFullYear()}年${pad(end.getMonth() + 1)}月${pad(end.getDate())}日`;
      }
    }
  }

  prev() {
    if (this.currentView === 'month') {
      this.anchorDate.setMonth(this.anchorDate.getMonth() - 1);
    } else if (this.currentView === 'week') {
      this.anchorDate.setDate(this.anchorDate.getDate() - 7);
    } else if (this.currentView === '3day') {
      this.anchorDate.setDate(this.anchorDate.getDate() - 3);
    } else if (this.currentView === 'day') {
      this.anchorDate.setDate(this.anchorDate.getDate() - 1);
    }
    this.renderView();
  }

  next() {
    if (this.currentView === 'month') {
      this.anchorDate.setMonth(this.anchorDate.getMonth() + 1);
    } else if (this.currentView === 'week') {
      this.anchorDate.setDate(this.anchorDate.getDate() + 7);
    } else if (this.currentView === '3day') {
      this.anchorDate.setDate(this.anchorDate.getDate() + 3);
    } else if (this.currentView === 'day') {
      this.anchorDate.setDate(this.anchorDate.getDate() + 1);
    }
    this.renderView();
  }

  goToToday() {
    this.anchorDate = new Date();
    this.renderView();

    if (this.currentView !== 'month' && this.dom.timeGridBodyScroll) {
      const now = new Date();
      const curMinutes = now.getHours() * 60 + now.getMinutes();
      const topPx = (curMinutes / 60) * this.hourHeight;
      const targetScroll = Math.max(0, topPx - 120);
      setTimeout(() => {
        this.dom.timeGridBodyScroll.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }, 50);
    }
  }

  /* --------------------------------------------------------------------------
     TAB 3: ⚙️ 设置与备份逻辑 (Settings & Backup)
     -------------------------------------------------------------------------- */
  renderSettingsStats() {
    const stats = eventManager.getStorageStats();
    if (this.dom.settingsFestivalCount) this.dom.settingsFestivalCount.textContent = stats.festivalCount;
    if (this.dom.settingsEventCount) this.dom.settingsEventCount.textContent = stats.count;
    if (this.dom.settingsSizeKB) this.dom.settingsSizeKB.textContent = stats.sizeKB;
  }

  resetSettingsDropzone() {
    this.stagedImportContent = null;
    this.stagedFileName = null;
    if (this.dom.settingsImportFileInput) this.dom.settingsImportFileInput.value = '';
    if (this.dom.settingsDropzoneText) this.dom.settingsDropzoneText.innerHTML = '点击选择或将 <strong>.json</strong> 备份文件拖拽至此处';
    if (this.dom.settingsSelectedFileName) {
      this.dom.settingsSelectedFileName.style.display = 'none';
      this.dom.settingsSelectedFileName.textContent = '';
    }
    if (this.dom.settingsConfirmImportBtn) this.dom.settingsConfirmImportBtn.disabled = true;
  }

  handleSettingsFileSelect(file) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      this.showToast('请选择 .json 格式的备份文件', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.stagedImportContent = e.target.result;
      this.stagedFileName = file.name;
      
      if (this.dom.settingsDropzoneText) this.dom.settingsDropzoneText.textContent = '已选择文件：';
      if (this.dom.settingsSelectedFileName) {
        this.dom.settingsSelectedFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        this.dom.settingsSelectedFileName.style.display = 'inline-block';
      }
      if (this.dom.settingsConfirmImportBtn) this.dom.settingsConfirmImportBtn.disabled = false;
    };
    reader.onerror = () => {
      this.showToast('读取文件失败，请重试', 'error');
    };
    reader.readAsText(file);
  }

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  bindSettingsEvents() {
    this.dom.settingsExportJsonBtn?.addEventListener('click', () => {
      const jsonContent = eventManager.exportToJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(jsonContent, `livepulse_backup_${dateStr}.json`, 'application/json;charset=utf-8');
      this.showToast('JSON 全量备份文件已生成并下载！', 'success');
    });

    this.dom.settingsExportIcsBtn?.addEventListener('click', () => {
      const icsContent = eventManager.exportToICS(true);
      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(icsContent, `livepulse_myroute_${dateStr}.ics`, 'text/calendar;charset=utf-8');
      this.showToast('个人活动日历 (.ics) 已生成！可直接导入手机/系统日历', 'success');
    });

    this.dom.settingsFileDropzone?.addEventListener('click', () => {
      this.dom.settingsImportFileInput?.click();
    });

    this.dom.settingsImportFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      this.handleSettingsFileSelect(file);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.dom.settingsFileDropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.settingsFileDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dom.settingsFileDropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.settingsFileDropzone.classList.remove('dragover');
      });
    });

    this.dom.settingsFileDropzone?.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleSettingsFileSelect(files[0]);
      }
    });

    this.dom.settingsConfirmImportBtn?.addEventListener('click', () => {
      if (!this.stagedImportContent) {
        this.showToast('请先选择有效的 .json 备份文件', 'error');
        return;
      }

      const selectedModeRadio = document.querySelector('input[name="settingsImportMode"]:checked');
      const mode = selectedModeRadio ? selectedModeRadio.value : 'merge';

      const result = eventManager.importFromJSON(this.stagedImportContent, mode);
      if (result.success) {
        this.showToast(result.message, 'success');
        this.updateParentEventDropdown();
        this.renderSettingsStats();
        this.resetSettingsDropzone();
      } else {
        this.showToast(result.error, 'error', 4000);
      }
    });

    this.dom.settingsResetDemoBtn?.addEventListener('click', () => {
      if (confirm('确定要重置为示范拼盘演出数据吗？现有排程将被替换。')) {
        eventManager.resetToDefault();
        this.showToast('已恢复示范拼盘演出数据！', 'info');
        this.updateParentEventDropdown();
        this.renderSettingsStats();
      }
    });

    this.dom.settingsClearAllDataBtn?.addEventListener('click', () => {
      if (confirm('【危险操作】确定要清空所有本地日程数据吗？此操作无法撤销。')) {
        eventManager.clearAllEvents();
        this.showToast('所有本地排程已清空', 'info');
        this.updateParentEventDropdown();
        this.renderSettingsStats();
      }
    });
  }

  /* --------------------------------------------------------------------------
     General Modal & Touch Handlers
     -------------------------------------------------------------------------- */
  openNewEventModal(prefilledDate = null, startTime = '14:00', endTime = '14:30') {
    this.dom.modalTitle.textContent = '添加演出/特典会排程';
    this.dom.eventIdInput.value = '';
    this.dom.eventForm.reset();

    const todayStr = new Date().toISOString().split('T')[0];
    this.dom.eventDateInput.value = prefilledDate || todayStr;
    this.dom.eventStartTimeInput.value = startTime;
    this.dom.eventEndTimeInput.value = endTime;
    this.dom.eventTypeSelect.value = 'live';
    this.dom.eventParentInput.value = this.selectedParentEvent !== 'all' ? this.selectedParentEvent : 'ワンコインショーケース';
    this.dom.eventVenueInput.value = 'Spotify O-WEST';
    this.dom.eventTableAreaInput.value = '';
    this.dom.eventStarredInput.checked = true;
    this.dom.deleteEventBtn.style.display = 'none';

    this.dom.eventModal.classList.add('active');
  }

  openEditEventModal(evt) {
    this.dom.modalTitle.textContent = '编辑排程';
    this.dom.eventIdInput.value = evt.id;
    this.dom.eventGroupNameInput.value = evt.groupName || evt.title || '';
    this.dom.eventTypeSelect.value = evt.type || evt.category || 'live';
    this.dom.eventParentInput.value = evt.parentEvent || '';
    this.dom.eventVenueInput.value = evt.venue || '';
    this.dom.eventTableAreaInput.value = evt.tableArea || '';
    this.dom.eventDateInput.value = evt.date || '';
    this.dom.eventStartTimeInput.value = evt.startTime || '';
    this.dom.eventEndTimeInput.value = evt.endTime || '';
    this.dom.eventStarredInput.checked = !!evt.isStarred;
    this.dom.eventDescInput.value = evt.description || '';
    this.dom.deleteEventBtn.style.display = 'inline-block';

    this.closeDayDetailModal();
    this.dom.eventModal.classList.add('active');
  }

  closeEventModal() {
    this.dom.eventModal.classList.remove('active');
  }

  handleSaveEvent(e) {
    e.preventDefault();
    const id = this.dom.eventIdInput.value;
    const eventData = {
      groupName: this.dom.eventGroupNameInput.value.trim(),
      title: this.dom.eventGroupNameInput.value.trim(),
      type: this.dom.eventTypeSelect.value,
      category: this.dom.eventTypeSelect.value,
      parentEvent: this.dom.eventParentInput.value.trim() || '拼盘活动',
      venue: this.dom.eventVenueInput.value.trim() || '主舞台',
      tableArea: this.dom.eventTableAreaInput.value.trim(),
      date: this.dom.eventDateInput.value,
      startTime: this.dom.eventStartTimeInput.value,
      endTime: this.dom.eventEndTimeInput.value,
      isStarred: this.dom.eventStarredInput.checked,
      description: this.dom.eventDescInput.value.trim()
    };

    if (!eventData.groupName || !eventData.date) {
      alert('请填写团体名称和演出日期！');
      return;
    }

    if (id) {
      eventManager.updateEvent(id, eventData);
      this.showToast(`已更新「${eventData.groupName}」的排程`, 'success');
    } else {
      eventManager.addEvent(eventData);
      this.showToast(`已添加「${eventData.groupName}」的新排程！`, 'success');
    }

    this.updateParentEventDropdown();
    this.closeEventModal();
    if (this.activeTab === 'events') this.renderFestivalsDirectory();
    else if (this.activeTab === 'myroute') this.renderView();
  }

  handleDeleteEvent() {
    const id = this.dom.eventIdInput.value;
    if (id && confirm('确定要删除此条排程吗？')) {
      eventManager.deleteEvent(id);
      this.showToast('排程已删除', 'info');
      this.updateParentEventDropdown();
      this.closeEventModal();
      if (this.activeTab === 'events') this.renderFestivalsDirectory();
      else if (this.activeTab === 'myroute') this.renderView();
    }
  }

  openDayDetailModal(dateStr) {
    this.selectedDate = dateStr;
    const [y, m, d] = dateStr.split('-');
    this.dom.dayDetailTitle.textContent = `${y}年${m}月${d}日 演出与特典清单`;
    
    const dayEvents = this.getFilteredEvents().filter(e => e.date === dateStr);
    dayEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    this.dom.dayEventsList.innerHTML = '';

    if (dayEvents.length === 0) {
      this.dom.dayEventsList.innerHTML = `
        <div class="empty-day-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>当日暂无匹配的演出/特典排程</p>
        </div>
      `;
    } else {
      dayEvents.forEach(evt => {
        const item = document.createElement('div');
        const type = evt.type || evt.category || 'live';
        item.className = `day-event-detail-item ${evt.isStarred ? 'is-starred' : ''}`;
        
        const cat = CATEGORIES[type] || CATEGORIES.live;
        const timeDisplay = (evt.startTime || evt.endTime) 
          ? `${evt.startTime || ''} ~ ${evt.endTime || ''}`
          : '全天';

        const typeBadge = (type === 'tokuten' ? '📸 特典会' : (type === 'live' ? '🎤 Live' : '🏷️ 其他'));
        const starBtnHtml = `
          <button class="star-toggle-btn ${evt.isStarred ? 'active' : ''}" style="margin-left: 6px;">
            ⭐
          </button>
        `;

        item.innerHTML = `
          <div class="event-category-indicator" style="background: ${cat.color};"></div>
          <div class="event-detail-info">
            <h4>
              <span>${this.escapeHtml(evt.groupName || evt.title)}</span>
              <span class="time-event-type-badge" style="font-size: 0.7rem;">${typeBadge}</span>
              ${starBtnHtml}
            </h4>
            <div class="event-time-badge">
              <span>🕒 ${timeDisplay}</span>
              ${evt.venue ? `<span>· 📍 ${this.escapeHtml(evt.venue)}</span>` : ''}
              ${evt.tableArea ? `<span>· 🪑 ${this.escapeHtml(evt.tableArea)}</span>` : ''}
            </div>
            ${evt.parentEvent ? `<div class="event-parent-tag">🎪 ${this.escapeHtml(evt.parentEvent)}</div>` : ''}
            ${evt.description ? `<p>${this.escapeHtml(evt.description)}</p>` : ''}
          </div>
          <button class="btn-text-sm edit-btn" style="margin-left:auto; align-self: center;">编辑</button>
        `;

        item.querySelector('.star-toggle-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          eventManager.toggleStar(evt.id);
          this.openDayDetailModal(dateStr);
          this.renderView();
        });

        item.querySelector('.edit-btn').addEventListener('click', () => {
          this.openEditEventModal(evt);
        });

        this.dom.dayEventsList.appendChild(item);
      });
    }

    this.dom.dayDetailModal.classList.add('active');
  }

  closeDayDetailModal() {
    this.dom.dayDetailModal.classList.remove('active');
  }

  updateParentEventDropdown() {
    if (!this.dom.parentEventSelect) return;
    const parentEvents = eventManager.getParentEvents();

    this.dom.parentEventSelect.innerHTML = '<option value="all">🎪 全部活动 / 跨场总览</option>';
    parentEvents.forEach(pe => {
      const opt = document.createElement('option');
      opt.value = pe;
      opt.textContent = `📍 ${pe}`;
      if (this.selectedParentEvent === pe) opt.selected = true;
      this.dom.parentEventSelect.appendChild(opt);
    });

    if (this.dom.parentEventDatalist) {
      this.dom.parentEventDatalist.innerHTML = '';
      parentEvents.forEach(pe => {
        const opt = document.createElement('option');
        opt.value = pe;
        this.dom.parentEventDatalist.appendChild(opt);
      });
    }
  }

  renderCategoryChips() {
    if (!this.dom.categoryChipsContainer) return;
    
    this.dom.categoryChipsContainer.innerHTML = '';
    Object.values(CATEGORIES).forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `chip-btn ${this.selectedCategory === cat.id ? 'active' : ''}`;
      btn.dataset.category = cat.id;

      let dotHtml = '';
      if (cat.id !== 'all') {
        dotHtml = `<span class="dot" style="background: ${cat.color}"></span>`;
      }
      btn.innerHTML = `${dotHtml}<span>${cat.name}</span>`;

      btn.addEventListener('click', () => {
        this.selectedCategory = cat.id;
        document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderView();
      });

      this.dom.categoryChipsContainer.appendChild(btn);
    });
  }

  showToast(message, type = 'success', duration = 3000) {
    if (!this.dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-text">${this.escapeHtml(message)}</span>
    `;

    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, duration);
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#090d16' : '#f8fafc');
    }

    if (this.dom.themeIcon) {
      if (theme === 'light') {
        this.dom.themeIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      } else {
        this.dom.themeIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      }
    }
  }

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  bindTouchGestures() {
    const target = this.dom.calendarCard || document.body;
    
    target.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        this.handleSwipeGesture();
      }
    }, { passive: true });
  }

  handleSwipeGesture() {
    if (this.activeTab !== 'myroute') return;
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) this.prev();
      else this.next();
    }
  }

  bindEvents() {
    this.dom.viewSwitcher?.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentView = btn.dataset.view;
        this.renderView();
      });
    });

    this.dom.parentEventSelect?.addEventListener('change', (e) => {
      this.selectedParentEvent = e.target.value;
      this.renderView();
    });

    this.dom.myRouteBtn?.addEventListener('click', () => {
      this.onlyStarred = !this.onlyStarred;
      this.dom.myRouteBtn.classList.toggle('active', this.onlyStarred);
      if (this.dom.myRouteBtnText) {
        this.dom.myRouteBtnText.textContent = this.onlyStarred ? '我的活动路线' : '全部活动排程';
      }
      this.showToast(this.onlyStarred ? '已切换至【我的活动路线】模式' : '已显示【全部活动排程】', 'info');
      this.renderView();
    });

    this.dom.prevBtn?.addEventListener('click', () => this.prev());
    this.dom.nextBtn?.addEventListener('click', () => this.next());
    this.dom.todayBtn?.addEventListener('click', () => this.goToToday());
    this.dom.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

    this.dom.newEventBtn?.addEventListener('click', () => this.openNewEventModal());
    this.dom.mobileFabBtn?.addEventListener('click', () => this.openNewEventModal());
    this.dom.closeEventModalBtn?.addEventListener('click', () => this.closeEventModal());
    this.dom.cancelEventModalBtn?.addEventListener('click', () => this.closeEventModal());
    this.dom.eventForm?.addEventListener('submit', (e) => this.handleSaveEvent(e));
    this.dom.deleteEventBtn?.addEventListener('click', () => this.handleDeleteEvent());

    this.dom.closeDayDetailModalBtn?.addEventListener('click', () => this.closeDayDetailModal());
    this.dom.addDayEventBtn?.addEventListener('click', () => {
      this.closeDayDetailModal();
      this.openNewEventModal(this.selectedDate);
    });

    this.dom.eventModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.eventModal) this.closeEventModal();
    });
    this.dom.dayDetailModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.dayDetailModal) this.closeDayDetailModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEventModal();
        this.closeDayDetailModal();
        this.closeFestivalInspectModal();
        this.closeTemplateModal();
      }
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CalendarApp();
});
