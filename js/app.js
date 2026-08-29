/**
 * Main Application Logic - LivePulse (3-Tab Music Live & Tokuten Planner)
 * Tab 1: 🎸 活动列表 (Festivals Directory & Structured Template / Smart Text Parser)
 * Tab 2: 🗺️ 活动路线 (My Itinerary & Overlap Timetable - Default)
 *   - 月视图：聚合展示大活动/拼盘标题及项目数
 *   - 日视图：类型、标题、时间单行水平紧凑展示
 *   - 时间轴缩放：支持放大缩小并持久化保存至 localStorage
 * Tab 3: ⚙️ 设置与备份 (Settings & Data Backup Center)
 */

import { eventManager, CATEGORIES } from './events.js';
import { i18n, SUPPORTED_LANGUAGES } from './i18n.js';

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
      settingsLangButtonsGrid: document.getElementById('settingsLangButtonsGrid'),
      calendarWeekdaysHeader: document.getElementById('calendarWeekdaysHeader'),
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
    this.applyLanguage(i18n.getLang(), false);
    this.updateZoomDisplay();
    this.renderCategoryChips();
    this.updateParentEventDropdown();
    this.switchTab('myroute');
    this.bindNavigationTabs();
    this.bindEvents();
    this.bindLanguageEvents();
    this.bindZoomControls();
    this.bindTouchGestures();
    this.bindSettingsEvents();
    this.bindFestivalInspectEvents();
    this.bindTemplateModalEvents();
  }

  /* --------------------------------------------------------------------------
     Internationalization (i18n) Engine
     -------------------------------------------------------------------------- */
  bindLanguageEvents() {
    this.dom.settingsLangButtonsGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn-card');
      if (btn && btn.dataset.lang) {
        this.applyLanguage(btn.dataset.lang);
      }
    });
  }

  applyLanguage(lang, reRender = true) {
    i18n.setLang(lang);

    // 1. Update settings language buttons active state
    document.querySelectorAll('.lang-btn-card').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // 2. Global Header & Action Buttons
    if (this.dom.headerSubtitle) {
      if (this.activeTab === 'events') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleEvents');
      else if (this.activeTab === 'myroute') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleMyRoute');
      else if (this.activeTab === 'settings') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleSettings');
    }

    const headerNewBtn = document.getElementById('headerNewEventBtnText');
    if (headerNewBtn) headerNewBtn.textContent = i18n.t('btnAddEvent');

    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.title = i18n.t('themeToggle');
      this.dom.themeToggleBtn.setAttribute('aria-label', i18n.t('themeToggle'));
    }

    if (this.dom.mobileFabBtn) {
      this.dom.mobileFabBtn.title = i18n.t('btnAddEvent');
      this.dom.mobileFabBtn.setAttribute('aria-label', i18n.t('btnAddEvent'));
    }

    // 3. Tab 1: Events Directory Page
    const page1Title = document.querySelector('#page-events .page-title-group h2');
    if (page1Title) page1Title.textContent = i18n.t('eventsPageTitle');
    const page1Desc = document.querySelector('#page-events .page-title-group p');
    if (page1Desc) page1Desc.textContent = i18n.t('eventsPageDesc');

    if (this.dom.openTemplateModalBtn) {
      const sp = this.dom.openTemplateModalBtn.querySelector('span');
      if (sp) sp.textContent = i18n.t('btnOpenTemplate');
    }
    if (this.dom.importFestivalBtn) {
      const sp = this.dom.importFestivalBtn.querySelector('span');
      if (sp) sp.textContent = i18n.t('btnUploadJson');
      this.dom.importFestivalBtn.title = i18n.t('btnUploadJson');
    }
    const featTag = document.querySelector('.template-featured-banner .featured-tag');
    if (featTag) featTag.textContent = i18n.t('featuredTag');
    const featH3 = document.querySelector('.template-featured-banner h3');
    if (featH3) featH3.textContent = i18n.t('featuredTitle');
    const featP = document.querySelector('.template-featured-banner p');
    if (featP) featP.textContent = i18n.t('featuredDesc');

    if (this.dom.quickSaveTemplateJsonBtn) this.dom.quickSaveTemplateJsonBtn.textContent = i18n.t('quickDownloadTemplate');
    if (this.dom.quickImportFeaturedTemplateBtn) this.dom.quickImportFeaturedTemplateBtn.textContent = i18n.t('quickImportTemplate');

    // 4. Tab 2: My Route Timetable Page
    document.querySelectorAll('.view-btn').forEach(btn => {
      const view = btn.dataset.view;
      const fullLabel = btn.querySelector('.view-label-full');
      const shortLabel = btn.querySelector('.view-label-short');
      if (view === 'month') {
        if (fullLabel) fullLabel.textContent = i18n.t('viewMonth');
        if (shortLabel) shortLabel.textContent = i18n.t('viewMonthShort');
      } else if (view === 'week') {
        if (fullLabel) fullLabel.textContent = i18n.t('viewWeek');
        if (shortLabel) shortLabel.textContent = i18n.t('viewWeekShort');
      } else if (view === '3day') {
        if (fullLabel) fullLabel.textContent = i18n.t('view3Day');
        if (shortLabel) shortLabel.textContent = i18n.t('view3DayShort');
      } else if (view === 'day') {
        if (fullLabel) fullLabel.textContent = i18n.t('viewDay');
        if (shortLabel) shortLabel.textContent = i18n.t('viewDayShort');
      }
    });

    if (this.dom.zoomInBtn) this.dom.zoomInBtn.title = i18n.t('zoomIn');
    if (this.dom.zoomOutBtn) this.dom.zoomOutBtn.title = i18n.t('zoomOut');
    if (this.dom.prevBtn) {
      this.dom.prevBtn.title = i18n.t('prevCycle');
      this.dom.prevBtn.setAttribute('aria-label', i18n.t('prevCycle'));
    }
    if (this.dom.nextBtn) {
      this.dom.nextBtn.title = i18n.t('nextCycle');
      this.dom.nextBtn.setAttribute('aria-label', i18n.t('nextCycle'));
    }
    if (this.dom.todayBtn) this.dom.todayBtn.textContent = i18n.t('btnToday');

    if (this.dom.myRouteBtnText) {
      this.dom.myRouteBtnText.textContent = this.onlyStarred ? i18n.t('myRouteActive') : i18n.t('myRouteAll');
    }
    if (this.dom.myRouteBtn) {
      this.dom.myRouteBtn.title = this.onlyStarred ? i18n.t('myRouteTitleActive') : i18n.t('myRouteTitleAll');
    }

    const statLabels = document.querySelectorAll('.calendar-meta-stats .stat-item span:first-child');
    if (statLabels && statLabels.length >= 2) {
      statLabels[0].textContent = i18n.t('statCurrentEvents');
      statLabels[1].textContent = i18n.t('statTotal');
    }

    const swipeHint = document.querySelector('.mobile-swipe-hint span');
    if (swipeHint) swipeHint.textContent = i18n.t('mobileSwipeHint');

    // 5. Tab 3: Settings Page
    const settingsTitle = document.getElementById('settingsTitleText');
    if (settingsTitle) settingsTitle.textContent = i18n.t('settingsTitle');
    const settingsDesc = document.getElementById('settingsDescText');
    if (settingsDesc) settingsDesc.textContent = i18n.t('settingsDesc');
    const settingsLangCard = document.getElementById('settingsLangCardTitle');
    if (settingsLangCard) settingsLangCard.textContent = i18n.t('langCardTitle');

    const storageTitle = document.querySelector('.storage-status-info h4');
    if (storageTitle) storageTitle.textContent = i18n.t('storageTitle');

    const exportSectionTitle = document.querySelector('.data-action-grid')?.closest('.settings-card')?.querySelector('.settings-card-title span');
    if (exportSectionTitle) exportSectionTitle.textContent = i18n.t('exportCardTitle');

    if (this.dom.settingsExportJsonBtn) {
      const title = this.dom.settingsExportJsonBtn.querySelector('.action-card-text strong');
      const desc = this.dom.settingsExportJsonBtn.querySelector('.action-card-text span');
      if (title) title.textContent = i18n.t('exportJsonTitle');
      if (desc) desc.textContent = i18n.t('exportJsonDesc');
    }
    if (this.dom.settingsExportIcsBtn) {
      const title = this.dom.settingsExportIcsBtn.querySelector('.action-card-text strong');
      const desc = this.dom.settingsExportIcsBtn.querySelector('.action-card-text span');
      if (title) title.textContent = i18n.t('exportIcsTitle');
      if (desc) desc.textContent = i18n.t('exportIcsDesc');
    }

    const importSectionTitle = document.querySelector('#settingsFileDropzone')?.closest('.settings-card')?.querySelector('.settings-card-title span');
    if (importSectionTitle) importSectionTitle.textContent = i18n.t('importCardTitle');

    if (this.dom.settingsDropzoneText) {
      this.dom.settingsDropzoneText.innerHTML = i18n.t('dropzoneText');
    }
    const mergeLabel = document.querySelector('input[value="merge"] + span');
    if (mergeLabel) mergeLabel.innerHTML = `<strong>${i18n.t('importModeMerge')}</strong>`;
    const overwriteLabel = document.querySelector('input[value="overwrite"] + span');
    if (overwriteLabel) overwriteLabel.innerHTML = `<strong>${i18n.t('importModeOverwrite')}</strong>`;
    if (this.dom.settingsConfirmImportBtn) this.dom.settingsConfirmImportBtn.textContent = i18n.t('btnConfirmImport');

    const maintenanceTitle = document.querySelector('.settings-card-title.danger span');
    if (maintenanceTitle) maintenanceTitle.textContent = i18n.t('maintenanceCardTitle');
    if (this.dom.settingsClearAllDataBtn) this.dom.settingsClearAllDataBtn.textContent = i18n.t('btnClearAllData');

    // 6. Bottom Navigation Bar Tooltips & Labels
    document.querySelectorAll('.nav-tab-item').forEach(tab => {
      const tabKey = tab.dataset.tab;
      if (tabKey === 'events') { tab.title = i18n.t('navEvents'); tab.setAttribute('aria-label', i18n.t('navEvents')); }
      if (tabKey === 'myroute') { tab.title = i18n.t('navMyRoute'); tab.setAttribute('aria-label', i18n.t('navMyRoute')); }
      if (tabKey === 'settings') { tab.title = i18n.t('navSettings'); tab.setAttribute('aria-label', i18n.t('navSettings')); }
    });

    // 7. Modals
    // Template Modal
    const templateModalTitle = document.querySelector('#templateModal .modal-header h2');
    if (templateModalTitle) templateModalTitle.textContent = i18n.t('templateModalTitle');
    const templateModalSubtitle = document.querySelector('#templateModal .festival-modal-subtitle');
    if (templateModalSubtitle) templateModalSubtitle.textContent = i18n.t('templateModalSubtitle');
    const presetLabel = document.querySelector('label[for="presetTemplateSelect"]');
    if (presetLabel) presetLabel.textContent = i18n.t('labelPresetTemplate');
    const rawTextLabel = document.querySelector('label[for="rawTimetableTextInput"]');
    if (rawTextLabel) rawTextLabel.textContent = i18n.t('labelRawText');
    if (this.dom.parseTextBtn) this.dom.parseTextBtn.textContent = i18n.t('btnReparseText');
    if (this.dom.rawTimetableTextInput) this.dom.rawTimetableTextInput.placeholder = i18n.t('rawTextPlaceholder');
    const previewHeaderH4 = document.querySelector('.parsed-preview-box .preview-header h4');
    if (previewHeaderH4) previewHeaderH4.innerHTML = `${i18n.t('parsedPreviewTitle', { count: `<span id="parsedItemCount">${this.dom.parsedItemCount ? this.dom.parsedItemCount.textContent : '0'}</span>` })}`;
    if (this.dom.saveTemplateJsonBtn) this.dom.saveTemplateJsonBtn.textContent = i18n.t('btnSaveTemplateJson');
    if (this.dom.importParsedTemplateBtn) this.dom.importParsedTemplateBtn.textContent = i18n.t('btnImportParsedTemplate');

    // Festival Inspect Modal
    if (this.dom.festivalSelectAllBtn) this.dom.festivalSelectAllBtn.textContent = i18n.t('btnSelectAll');
    if (this.dom.festivalDeselectAllBtn) this.dom.festivalDeselectAllBtn.textContent = i18n.t('btnDeselectAll');
    if (this.dom.goToMyRouteFromInspectBtn) this.dom.goToMyRouteFromInspectBtn.textContent = i18n.t('btnGoToMyRoute');

    // Day Detail Modal
    if (this.dom.addDayEventBtn) this.dom.addDayEventBtn.textContent = i18n.t('btnAddDayEvent');

    // Event Form Modal
    const groupNameLabel = document.querySelector('label[for="eventGroupNameInput"]');
    if (groupNameLabel) groupNameLabel.textContent = i18n.t('labelGroupName');
    if (this.dom.eventGroupNameInput) this.dom.eventGroupNameInput.placeholder = i18n.t('groupNamePlaceholder');

    const typeLabel = document.querySelector('label[for="eventTypeSelect"]');
    if (typeLabel) typeLabel.textContent = i18n.t('labelEventType');
    const optLive = document.querySelector('#eventTypeSelect option[value="live"]');
    if (optLive) optLive.textContent = i18n.t('catLive');
    const optTokuten = document.querySelector('#eventTypeSelect option[value="tokuten"]');
    if (optTokuten) optTokuten.textContent = i18n.t('catTokuten');
    const optOther = document.querySelector('#eventTypeSelect option[value="other"]');
    if (optOther) optOther.textContent = i18n.t('catOther');

    const dateLabel = document.querySelector('label[for="eventDateInput"]');
    if (dateLabel) dateLabel.textContent = `${i18n.t('viewDay')} *`;

    const parentLabel = document.querySelector('label[for="eventParentInput"]');
    if (parentLabel) parentLabel.textContent = i18n.t('labelEventParent');
    if (this.dom.eventParentInput) this.dom.eventParentInput.placeholder = i18n.t('parentEventPlaceholder');

    const venueLabel = document.querySelector('label[for="eventVenueInput"]');
    if (venueLabel) venueLabel.textContent = i18n.t('labelEventVenue');
    if (this.dom.eventVenueInput) this.dom.eventVenueInput.placeholder = i18n.t('venuePlaceholder');

    const startLabel = document.querySelector('label[for="eventStartTimeInput"]');
    if (startLabel) startLabel.textContent = i18n.t('labelEventStartTime');
    const endLabel = document.querySelector('label[for="eventEndTimeInput"]');
    if (endLabel) endLabel.textContent = i18n.t('labelEventEndTime');

    const tableAreaLabel = document.querySelector('label[for="eventTableAreaInput"]');
    if (tableAreaLabel) tableAreaLabel.textContent = i18n.t('labelEventTableArea');
    if (this.dom.eventTableAreaInput) this.dom.eventTableAreaInput.placeholder = i18n.t('tableAreaPlaceholder');

    const starSpan = document.querySelector('.star-checkbox-label span');
    if (starSpan) starSpan.textContent = i18n.t('labelEventStarred');

    const descLabel = document.querySelector('label[for="eventDescInput"]');
    if (descLabel) descLabel.textContent = i18n.t('labelEventDesc');
    if (this.dom.eventDescInput) this.dom.eventDescInput.placeholder = i18n.t('descPlaceholder');

    if (this.dom.deleteEventBtn) this.dom.deleteEventBtn.textContent = i18n.t('btnDeleteEvent');
    if (this.dom.cancelEventModalBtn) this.dom.cancelEventModalBtn.textContent = i18n.t('btnCancel');
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) saveEventBtn.textContent = i18n.t('btnSaveEvent');

    // 8. Re-render dynamic elements
    this.renderWeekdayHeaders();
    this.renderCategoryChips();
    this.updateParentEventDropdown();

    if (reRender) {
      this.renderFestivalsDirectory();
      this.renderView();
      this.renderSettingsStats();
    }
  }

  renderWeekdayHeaders() {
    if (!this.dom.calendarWeekdaysHeader) return;
    const weekdays = i18n.t('weekdays');
    const weekdaysShort = i18n.t('weekdaysShort');

    this.dom.calendarWeekdaysHeader.innerHTML = '';
    weekdays.forEach((name, idx) => {
      const isWeekend = idx >= 5;
      const div = document.createElement('div');
      div.className = `weekday-title ${isWeekend ? 'weekend' : ''}`;
      div.innerHTML = `<span class="full-label">${name}</span><span class="short-label">${weekdaysShort[idx]}</span>`;
      this.dom.calendarWeekdaysHeader.appendChild(div);
    });
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
      if (tabId === 'events') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleEvents');
      else if (tabId === 'myroute') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleMyRoute');
      else if (tabId === 'settings') this.dom.headerSubtitle.textContent = i18n.t('headerSubtitleSettings');
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
      if (this.dom.parsedMetaSummary) this.dom.parsedMetaSummary.textContent = '';
      if (this.dom.parsedItemsList) {
        this.dom.parsedItemsList.innerHTML = `<div class="empty-day-state" style="padding: 1rem;"><p>${i18n.t('emptyEventsTitle')}</p></div>`;
      }
      if (this.dom.importParsedTemplateBtn) this.dom.importParsedTemplateBtn.disabled = true;
      if (this.dom.saveTemplateJsonBtn) this.dom.saveTemplateJsonBtn.disabled = true;
      return;
    }

    if (this.dom.parsedItemCount) this.dom.parsedItemCount.textContent = totalCount;
    if (this.dom.parsedMetaSummary) {
      this.dom.parsedMetaSummary.textContent = `📅 ${parsed.festival.date} · 📍 ${parsed.festival.venue} (${parsed.festival.openTime ? 'OPEN ' + parsed.festival.openTime + ' / ' : ''}START ${parsed.festival.startTime} ~ END ${parsed.festival.endTime})`;
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
          <span class="time-event-type-badge">${this.getTypeBadge('live')}</span>
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
          <span class="time-event-type-badge">${this.getTypeBadge('tokuten')}</span>
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
          <span class="time-event-type-badge">${this.getTypeBadge('other')}</span>
        `;
        this.dom.parsedItemsList.appendChild(item);
      });
    }

    if (this.dom.importParsedTemplateBtn) this.dom.importParsedTemplateBtn.disabled = false;
    if (this.dom.saveTemplateJsonBtn) this.dom.saveTemplateJsonBtn.disabled = false;
  }

  saveParsedTemplateAsJsonFile() {
    if (!this.currentParsedTemplate) {
      this.showToast('No valid template data', 'error');
      return;
    }
    const jsonStr = JSON.stringify(this.currentParsedTemplate, null, 2);
    const safeName = (this.currentParsedTemplate.festival?.name || 'event_template').replace(/[\s\/\\]+/g, '_');
    this.downloadFile(jsonStr, `${safeName}_template.json`, 'application/json;charset=utf-8');
    this.showToast(i18n.t('toastExportJson'), 'success');
  }

  importParsedTemplateDirectly() {
    if (!this.currentParsedTemplate) {
      this.showToast('No schedules to import', 'error');
      return;
    }
    const totalCount = (this.currentParsedTemplate?.lives?.length || 0) + (this.currentParsedTemplate?.tokutenkais?.length || 0) + (this.currentParsedTemplate?.otherEvents?.length || 0);
    const jsonStr = JSON.stringify(this.currentParsedTemplate);
    const result = eventManager.importFromJSON(jsonStr, 'merge');
    if (result.success) {
      this.showToast(i18n.t('toastImportTemplateSuccess', { name: this.currentParsedTemplate.festival.name, count: totalCount }), 'success');
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
      const totalCount = (parsed?.lives?.length || 0) + (parsed?.tokutenkais?.length || 0) + (parsed?.otherEvents?.length || 0);
      const jsonStr = JSON.stringify(parsed);
      const res = eventManager.importFromJSON(jsonStr, 'merge');
      if (res.success) {
        this.showToast(i18n.t('toastImportTemplateSuccess', { name: 'ワンコインショーケース', count: totalCount }), 'success');
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
          <p><strong>${i18n.t('emptyEventsTitle')}</strong></p>
          <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text-muted);">${i18n.t('emptyEventsDesc')}</p>
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
              <span class="meta-tag">👥 ${fest.groupCount} ${i18n.t('itemsCount')}</span>
            </div>
          </div>
        </div>

        <div class="festival-progress-box">
          <div class="progress-header">
            <span>${i18n.t('starProgress')}</span>
            <span><strong>${fest.starredCount}</strong> / ${fest.totalEvents} ${i18n.t('itemsCount')} (${pct}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="festival-card-actions">
          <button class="btn-inspect-schedule inspect-btn">
            🔍 ${i18n.t('btnInspectTimetable')}
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
      this.dom.festivalInspectSubtitle.textContent = `${allEvents.length} ${i18n.t('itemsCount')} · ${dates}`;
    }

    this.renderFestivalInspectTimeline(allEvents);
    this.dom.festivalInspectModal.classList.add('active');
  }

  getStarStatusText(isStarred) {
    const lang = i18n.getLang();
    if (isStarred) {
      if (lang === 'zh') return '⭐ 已标记参加';
      if (lang === 'ja') return '⭐ 参加予定';
      if (lang === 'ko') return '⭐ 참가 예정';
      return '⭐ Attending';
    } else {
      if (lang === 'zh') return '标记参加';
      if (lang === 'ja') return '参加する';
      if (lang === 'ko') return '참가 선택';
      return 'Attend';
    }
  }

  renderFestivalInspectTimeline(events) {
    if (!this.dom.festivalInspectTimeline) return;
    this.dom.festivalInspectTimeline.innerHTML = '';

    events.forEach(evt => {
      const row = document.createElement('div');
      const type = evt.type || evt.category || 'live';
      row.className = `timeline-item-row ${evt.isStarred ? 'is-starred' : ''}`;

      const typeBadge = this.getTypeBadge(type);
      const timeDisplay = (evt.startTime || evt.endTime) ? `${evt.startTime || ''} ~ ${evt.endTime || ''}` : i18n.t('allDay');

      let metaInfo = `${evt.date || ''} · ${evt.venue || 'Main Stage'}`;
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
          <span>${this.getStarStatusText(evt.isStarred)}</span>
        </button>
      `;

      const starBtn = row.querySelector('.timeline-star-toggle');
      starBtn.addEventListener('click', () => {
        const newStarred = eventManager.toggleStar(evt.id);
        evt.isStarred = newStarred;
        row.classList.toggle('is-starred', newStarred);
        starBtn.classList.toggle('active', newStarred);
        starBtn.querySelector('span').textContent = this.getStarStatusText(newStarred);
        this.showToast(newStarred ? i18n.t('toastStarred', { group: evt.groupName || evt.title }) : i18n.t('toastUnstarred', { group: evt.groupName || evt.title }), 'info');
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
        this.showToast(i18n.t('toastAllStarred', { festival: this.currentInspectingFestival }), 'success');
        const allEvents = eventManager.getEventsByParent(this.currentInspectingFestival);
        this.renderFestivalInspectTimeline(allEvents);
      }
    });

    this.dom.festivalDeselectAllBtn?.addEventListener('click', () => {
      if (this.currentInspectingFestival) {
        eventManager.setFestivalAllStarred(this.currentInspectingFestival, false);
        this.showToast(i18n.t('toastAllDeselected', { festival: this.currentInspectingFestival }), 'info');
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
      this.dom.dateDisplay.textContent = i18n.formatMonthYear(year, month);
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
        <span class="fest-pill-title">${starIcon}🎸 ${this.escapeHtml(fest.name)}</span>
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
      <div class="time-grid-header-corner">🕒</div>
      <div class="time-grid-header-cols"></div>
    `;
    const headerColsContainer = this.dom.timeGridHeader.querySelector('.time-grid-header-cols');

    const weekdays = i18n.t('weekdays');
    const weekdaysShort = i18n.t('weekdaysShort');

    viewDates.forEach(d => {
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const isToday = dateStr === todayStr;
      const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
      const weekdayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const col = document.createElement('div');
      col.className = `time-grid-header-col ${isToday ? 'is-today' : ''}`;
      col.innerHTML = `
        <span class="col-weekday"><span class="full-label">${weekdays[weekdayIdx]}</span><span class="short-label">${weekdaysShort[weekdayIdx]}</span></span>
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

    const typeLabel = this.getTypeBadge(type);
    const timeText = (evt.startTime || evt.endTime) ? `${evt.startTime || ''} - ${evt.endTime || ''}` : i18n.t('allDay');
    const groupName = evt.groupName || evt.title || 'Live Event';

    let locationInfo = '';
    if (evt.venue) locationInfo += evt.venue;
    if (evt.tableArea) locationInfo += ` · ${evt.tableArea}`;

    // Multiline Layout: Title + Star, Time, Location/Parent, and Type Badge in the last row
    card.innerHTML = `
      <div class="time-event-top-row">
        <div class="time-event-title">${this.escapeHtml(groupName)}</div>
        <button class="star-toggle-btn ${evt.isStarred ? 'active' : ''}" title="${evt.isStarred ? i18n.t('toastStarred', {group: groupName}) : i18n.t('labelEventStarred')}">
          ⭐
        </button>
      </div>
      <div class="time-event-time">🕒 ${timeText}</div>
      ${evt.parentEvent || locationInfo ? `
        <div class="time-event-meta-row">
          ${evt.parentEvent ? `<span class="time-event-parent-badge">🎸 ${this.escapeHtml(evt.parentEvent)}</span>` : ''}
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
      this.showToast(newStarred ? i18n.t('toastStarred', { group: groupName }) : i18n.t('toastUnstarred', { group: groupName }), 'info');
      this.renderView();
    });

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditEventModal(evt);
    });

    return card;
  }

  getTypeBadge(type) {
    if (type === 'tokuten') return i18n.t('catTokutenBadge');
    if (type === 'other') return i18n.t('catOtherBadge');
    return i18n.t('catLiveBadge');
  }

  getCategoryName(catId) {
    if (catId === 'live') return i18n.t('catLive');
    if (catId === 'tokuten') return i18n.t('catTokuten');
    if (catId === 'other') return i18n.t('catOther');
    return i18n.t('catAll');
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

    const storageTitle = document.querySelector('.storage-status-info h4');
    if (storageTitle) storageTitle.textContent = i18n.t('storageTitle');
    const storageP = document.querySelector('.storage-status-info p');
    if (storageP) {
      storageP.innerHTML = i18n.t('storageDesc', {
        festivals: `<strong id="settingsFestivalCount">${stats.festivalCount}</strong>`,
        events: `<strong id="settingsEventCount">${stats.count}</strong>`,
        sizeKB: `<strong id="settingsSizeKB">${stats.sizeKB}</strong>`
      });
    }
  }

  resetSettingsDropzone() {
    this.stagedImportContent = null;
    this.stagedFileName = null;
    if (this.dom.settingsImportFileInput) this.dom.settingsImportFileInput.value = '';
    if (this.dom.settingsDropzoneText) this.dom.settingsDropzoneText.innerHTML = i18n.t('dropzoneText');
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
        this.showToast('Please select a valid .json file first', 'error');
        return;
      }

      const selectedModeRadio = document.querySelector('input[name="settingsImportMode"]:checked');
      const mode = selectedModeRadio ? selectedModeRadio.value : 'merge';

      const result = eventManager.importFromJSON(this.stagedImportContent, mode);
      if (result.success) {
        this.showToast(i18n.t('toastImportSuccess', { count: result.count }), 'success');
        this.updateParentEventDropdown();
        this.renderSettingsStats();
        this.resetSettingsDropzone();
      } else {
        this.showToast(result.error, 'error', 4000);
      }
    });

    this.dom.settingsClearAllDataBtn?.addEventListener('click', () => {
      if (confirm(i18n.t('confirmClearAll'))) {
        eventManager.clearAllEvents();
        this.showToast(i18n.t('toastAllCleared'), 'info');
        this.updateParentEventDropdown();
        this.renderSettingsStats();
        this.renderFestivalsDirectory();
        this.renderView();
      }
    });
  }

  /* --------------------------------------------------------------------------
     General Modal & Touch Handlers
     -------------------------------------------------------------------------- */
  openNewEventModal(prefilledDate = null, startTime = '14:00', endTime = '14:30') {
    this.dom.modalTitle.textContent = i18n.t('modalTitleAdd');
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
    this.dom.modalTitle.textContent = i18n.t('modalTitleEdit');
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
      parentEvent: this.dom.eventParentInput.value.trim() || 'Live Festival',
      venue: this.dom.eventVenueInput.value.trim() || 'Main Stage',
      tableArea: this.dom.eventTableAreaInput.value.trim(),
      date: this.dom.eventDateInput.value,
      startTime: this.dom.eventStartTimeInput.value,
      endTime: this.dom.eventEndTimeInput.value,
      isStarred: this.dom.eventStarredInput.checked,
      description: this.dom.eventDescInput.value.trim()
    };

    if (!eventData.groupName || !eventData.date) {
      alert('Group name and date are required!');
      return;
    }

    if (id) {
      eventManager.updateEvent(id, eventData);
      this.showToast(i18n.t('toastEventSaved'), 'success');
    } else {
      eventManager.addEvent(eventData);
      this.showToast(i18n.t('toastEventSaved'), 'success');
    }

    this.updateParentEventDropdown();
    this.closeEventModal();
    if (this.activeTab === 'events') this.renderFestivalsDirectory();
    else if (this.activeTab === 'myroute') this.renderView();
  }

  handleDeleteEvent() {
    const id = this.dom.eventIdInput.value;
    if (id && confirm(i18n.t('confirmDeleteEvent'))) {
      eventManager.deleteEvent(id);
      this.showToast(i18n.t('toastEventDeleted'), 'info');
      this.updateParentEventDropdown();
      this.closeEventModal();
      if (this.activeTab === 'events') this.renderFestivalsDirectory();
      else if (this.activeTab === 'myroute') this.renderView();
    }
  }

  openDayDetailModal(dateStr) {
    this.selectedDate = dateStr;
    this.dom.dayDetailTitle.textContent = `${dateStr} ${i18n.t('dayDetailModalTitle')}`;
    
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
          <p>${i18n.t('emptyEventsTitle')}</p>
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
          : i18n.t('allDay');

        const typeBadge = this.getTypeBadge(type);
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
            ${evt.parentEvent ? `<div class="event-parent-tag">🎸 ${this.escapeHtml(evt.parentEvent)}</div>` : ''}
            ${evt.description ? `<p>${this.escapeHtml(evt.description)}</p>` : ''}
          </div>
          <button class="btn-text-sm edit-btn" style="margin-left:auto; align-self: center;">Edit</button>
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

    this.dom.parentEventSelect.innerHTML = `<option value="all">${i18n.t('parentAll')}</option>`;
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
      btn.innerHTML = `${dotHtml}<span>${this.getCategoryName(cat.id)}</span>`;

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
