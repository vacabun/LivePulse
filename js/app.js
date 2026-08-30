/**
 * Main Application Logic - LivePulse (3-Tab Music Live & Tokuten Planner)
 * Tab 1: 🎸 活动列表 (Festivals Directory & Structured Template / Smart Text Parser)
 * Tab 2: 🗺️ 活动路线 (My Itinerary & Overlap Timetable - Default)
 *   - 月视图：聚合展示大活动/拼盘标题及项目数
 *   - 日视图：类型、标题、时间单行水平紧凑展示
 *   - 时间轴缩放：支持放大缩小并持久化保存至 localStorage
 * Tab 3: ⚙️ 设置与备份 (Settings & Data Backup Center)
 */

import { eventManager, CATEGORIES } from './events.js?v=2.3';
import { i18n, SUPPORTED_LANGUAGES } from './i18n.js?v=2.3';

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

    // Schedule Repository Hub State
    this.initRepoState();

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
      newEventBtn: document.getElementById('newEventBtn'),

      // TAB 1: Events Directory DOM
      festivalsListContainer: document.getElementById('festivalsListContainer'),
      openRepoHubBtn: document.getElementById('openRepoHubBtn'),
      importFestivalBtn: document.getElementById('importFestivalBtn'),
      
      // Schedule Repository Modal DOM
      repoModal: document.getElementById('repoModal'),
      closeRepoModalBtn: document.getElementById('closeRepoModalBtn'),
      closeRepoModalFooterBtn: document.getElementById('closeRepoModalFooterBtn'),
      repoSelectDropdown: document.getElementById('repoSelectDropdown'),
      refreshRepoBtn: document.getElementById('refreshRepoBtn'),
      addCustomRepoBtn: document.getElementById('addCustomRepoBtn'),
      repoGithubLinkBtn: document.getElementById('repoGithubLinkBtn'),
      repoSearchInput: document.getElementById('repoSearchInput'),
      repoBatchImportBtn: document.getElementById('repoBatchImportBtn'),
      repoSelectedCount: document.getElementById('repoSelectedCount'),
      repoEventsListContainer: document.getElementById('repoEventsListContainer'),

      // Festival Inspect Modal DOM
      festivalInspectModal: document.getElementById('festivalInspectModal'),
      festivalInspectTitle: document.getElementById('festivalInspectTitle'),
      festivalInspectSubtitle: document.getElementById('festivalInspectSubtitle'),
      festivalInspectTimeline: document.getElementById('festivalInspectTimeline'),
      closeFestivalInspectModalBtn: document.getElementById('closeFestivalInspectModalBtn'),
      festivalSelectAllBtn: document.getElementById('festivalSelectAllBtn'),
      festivalDeselectAllBtn: document.getElementById('festivalDeselectAllBtn'),
      festivalDeleteThisBtn: document.getElementById('festivalDeleteThisBtn'),
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
      settingsDownloadTemplateBtn: document.getElementById('settingsDownloadTemplateBtn'),
      settingsOpenRepoHubBtn: document.getElementById('settingsOpenRepoHubBtn'),
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
      saveEventBtn: document.getElementById('saveEventBtn'),

      // Day Detail Modal
      dayDetailModal: document.getElementById('dayDetailModal'),
      closeDayDetailModalBtn: document.getElementById('closeDayDetailModalBtn'),
      dayDetailTitle: document.getElementById('dayDetailTitle'),
      dayDetailEventsList: document.getElementById('dayDetailEventsList'),
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

    // 3. Tab 1: Events Directory Page
    const page1Title = document.querySelector('#page-events .page-title-group h2');
    if (page1Title) page1Title.textContent = i18n.t('eventsPageTitle');
    const page1Desc = document.querySelector('#page-events .page-title-group p');
    if (page1Desc) page1Desc.textContent = i18n.t('eventsPageDesc');

    const btnRepoHubText = document.getElementById('btnRepoHubText');
    if (btnRepoHubText) btnRepoHubText.textContent = i18n.t('btnRepoHub');

    if (this.dom.openTemplateModalBtn) {
      const sp = this.dom.openTemplateModalBtn.querySelector('span');
      if (sp) sp.textContent = i18n.t('btnOpenTemplate');
    }
    if (this.dom.importFestivalBtn) {
      const sp = this.dom.importFestivalBtn.querySelector('span');
      if (sp) sp.textContent = i18n.t('btnUploadJson');
      this.dom.importFestivalBtn.title = i18n.t('btnUploadJson');
    }

    // Repo Modal Localization
    const repoModalTitle = document.getElementById('repoModalTitleText');
    if (repoModalTitle) repoModalTitle.textContent = i18n.t('repoModalTitle');
    const repoModalSubtitle = document.getElementById('repoModalSubtitleText');
    if (repoModalSubtitle) repoModalSubtitle.textContent = i18n.t('repoModalSubtitle');
    const repoSelectLabel = document.getElementById('repoSelectLabel');
    if (repoSelectLabel) repoSelectLabel.textContent = i18n.t('repoSelectLabel');
    if (this.dom.addCustomRepoBtn) {
      this.dom.addCustomRepoBtn.title = i18n.t('btnAddCustomRepo');
      this.dom.addCustomRepoBtn.setAttribute('aria-label', i18n.t('btnAddCustomRepo'));
    }
    if (this.dom.refreshRepoBtn) {
      this.dom.refreshRepoBtn.title = i18n.t('btnRefreshRepo');
      this.dom.refreshRepoBtn.setAttribute('aria-label', i18n.t('btnRefreshRepo'));
    }
    if (this.dom.repoSearchInput) this.dom.repoSearchInput.placeholder = i18n.t('repoSearchPlaceholder');
    const repoFooterTipText = document.getElementById('repoFooterTipText');
    if (repoFooterTipText) repoFooterTipText.textContent = i18n.t('repoFooterTip');
    const festDelThisText = document.getElementById('festivalDeleteThisBtnText');
    if (festDelThisText) festDelThisText.textContent = i18n.t('btnDeleteFestivalShort') || '删除此拼盘';
    this.updateBatchImportButton();

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

    const settingsTemplateCardTitle = document.getElementById('settingsTemplateCardTitle');
    if (settingsTemplateCardTitle) settingsTemplateCardTitle.textContent = i18n.t('settingsTemplateTitle');
    const settingsTemplateCardDesc = document.getElementById('settingsTemplateCardDesc');
    if (settingsTemplateCardDesc) settingsTemplateCardDesc.textContent = i18n.t('settingsTemplateDesc');

    const settingsRepoCardTitle = document.getElementById('settingsRepoCardTitle');
    if (settingsRepoCardTitle) settingsRepoCardTitle.textContent = i18n.t('settingsRepoTitle');
    const settingsRepoCardDesc = document.getElementById('settingsRepoCardDesc');
    if (settingsRepoCardDesc) settingsRepoCardDesc.textContent = i18n.t('settingsRepoDesc');

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
     SCHEDULE REPOSITORY HUB (云端活动排程资源库)
     -------------------------------------------------------------------------- */
  initRepoState() {
    this.currentRepo = 'vacabun/LivePulse-Schedule';
    try {
      this.customRepos = JSON.parse(localStorage.getItem('livepulse_custom_repos') || '[]');
    } catch (e) {
      this.customRepos = [];
    }
    this.cachedRepoEvents = [];
    this.selectedRepoPaths = new Set();
  }

  openRepoModal() {
    this.updateRepoDropdown();
    if (this.cachedRepoEvents.length === 0) {
      this.fetchRepositoryEvents(this.currentRepo);
    } else {
      this.renderRepoEventsList();
    }
    this.dom.repoModal?.classList.add('active');
  }

  closeRepoModal() {
    this.dom.repoModal?.classList.remove('active');
  }

  updateRepoDropdown() {
    if (!this.dom.repoSelectDropdown) return;
    this.dom.repoSelectDropdown.innerHTML = '';

    // Official option
    const officialOpt = document.createElement('option');
    officialOpt.value = 'vacabun/LivePulse-Schedule';
    officialOpt.textContent = `🌟 ${i18n.t('repoOfficialName') || 'vacabun/LivePulse-Schedule'}`;
    this.dom.repoSelectDropdown.appendChild(officialOpt);

    // Custom repos
    this.customRepos.forEach(repo => {
      const opt = document.createElement('option');
      opt.value = repo;
      opt.textContent = `🛠️ ${repo}`;
      this.dom.repoSelectDropdown.appendChild(opt);
    });

    this.dom.repoSelectDropdown.value = this.currentRepo;
    if (this.dom.repoGithubLinkBtn) {
      this.dom.repoGithubLinkBtn.href = `https://github.com/${this.currentRepo}`;
    }
  }

  extractJsonFilesFromJsdelivrTree(treeNode, prefix = '') {
    let results = [];
    if (!treeNode) return results;
    const files = treeNode.files || [];
    for (const item of files) {
      const currentPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.type === 'file' && item.name.endsWith('.json') && !item.name.startsWith('.') && !item.name.includes('package') && !item.name.includes('tsconfig')) {
        results.push({ path: currentPath, name: item.name });
      } else if (item.type === 'directory' && Array.isArray(item.files)) {
        results = results.concat(this.extractJsonFilesFromJsdelivrTree(item, currentPath));
      }
    }
    return results;
  }

  async fetchRepositoryEvents(repoSlug = this.currentRepo) {
    this.currentRepo = repoSlug;
    if (this.dom.repoGithubLinkBtn) {
      this.dom.repoGithubLinkBtn.href = `https://github.com/${repoSlug}`;
    }
    if (this.dom.repoEventsListContainer) {
      this.dom.repoEventsListContainer.innerHTML = `
        <div class="repo-loading-state">
          <div class="repo-spinner"></div>
          <p>${i18n.t('repoLoadingText')}</p>
        </div>
      `;
    }

    this.selectedRepoPaths.clear();
    this.updateBatchImportButton();

    let files = [];

    // Strategy 1: Try jsdelivr Data API (High performance, global CDN, no rate limit)
    try {
      const jsdUrl = `https://data.jsdelivr.net/v1/packages/gh/${repoSlug}@main?structure=tree`;
      const jsdRes = await fetch(jsdUrl);
      if (jsdRes.ok) {
        const jsdData = await jsdRes.json();
        files = this.extractJsonFilesFromJsdelivrTree(jsdData);
      }
    } catch (e) {
      console.warn('jsdelivr tree API fetch failed, attempting GitHub API...', e);
    }

    // Strategy 2: Try GitHub Trees API if jsdelivr returned nothing
    if (!files || files.length === 0) {
      try {
        let fetchUrl = `https://api.github.com/repos/${repoSlug}/git/trees/main?recursive=1`;
        let ghRes = await fetch(fetchUrl);
        if (!ghRes.ok) {
          fetchUrl = `https://api.github.com/repos/${repoSlug}/git/trees/master?recursive=1`;
          ghRes = await fetch(fetchUrl);
        }
        if (ghRes.ok) {
          const data = await ghRes.json();
          if (data.tree && Array.isArray(data.tree)) {
            files = data.tree
              .filter(item => item.type === 'blob' && item.path.endsWith('.json') && !item.path.startsWith('.') && !item.path.includes('package') && !item.path.includes('tsconfig'))
              .map(item => ({ path: item.path, name: item.path.split('/').pop() }));
          }
        }
      } catch (e) {
        console.warn('GitHub API tree fetch failed:', e);
      }
    }

    // Strategy 3: Built-in official repository fallback list if both network APIs are blocked
    if ((!files || files.length === 0) && repoSlug === 'vacabun/LivePulse-Schedule') {
      files = [
        { path: 'events/2026/09/05/2026-09-05_ワンコインショーケース.json', name: '2026-09-05_ワンコインショーケース.json', venue: 'Spotify O-WEST', lineup: 'Mirror,Mirror / AKANECLUB. / かすみ草とステラ' },
        { path: 'events/2026/09/05/2026-09-05_α＋_presents「第2回合同壮行会」＜夜の部＞.json', name: '2026-09-05_α＋_presents「第2回合同壮行会」＜夜の部＞.json', venue: '渋谷 近未来会館', lineup: 'α＋ / Starry☆Sky / CyberPulse' },
        { path: 'events/2026/09/06/2026-09-06_くさのねアイドルフェスティバル2026.json', name: '2026-09-06_くさのねアイドルフェスティバル2026.json', venue: '草ぶえの丘 (千葉県佐仓市)', lineup: 'かすみ草とステラ / タイトル未定 / 手羽先センセーション / CYNHN' }
      ];
    }

    if (!files || files.length === 0) {
      this.cachedRepoEvents = [];
      this.renderRepoEventsList();
      return;
    }

    // Sort files by path (chronological descending)
    files.sort((a, b) => b.path.localeCompare(a.path));

    const parsedEvents = [];
    for (const file of files) {
      const rawFileName = file.name ? file.name.replace(/\.json$/i, '') : file.path.split('/').pop().replace(/\.json$/i, '');
      const dateMatch = rawFileName.match(/^(\d{4}-\d{2}-\d{2})_(.*)$/);
      let extractedDate = dateMatch ? dateMatch[1] : '';
      let extractedName = dateMatch ? dateMatch[2] : rawFileName;

      let fallbackVenue = file.venue || '';
      let fallbackLineup = file.lineup || '';

      if (!fallbackVenue) {
        if (file.path.includes('ワンコイン')) fallbackVenue = 'Spotify O-WEST';
        else if (file.path.includes('壮行会')) fallbackVenue = '渋谷 近未来会館';
        else if (file.path.includes('くさのね')) fallbackVenue = '草ぶえの丘 (千葉県佐倉市)';
      }

      if (!fallbackLineup) {
        if (file.path.includes('ワンコイン')) fallbackLineup = 'Mirror,Mirror / AKANECLUB. / かすみ草とステラ';
        else if (file.path.includes('壮行会')) fallbackLineup = 'α＋ / Starry☆Sky / CyberPulse';
        else if (file.path.includes('くさのね')) fallbackLineup = 'かすみ草とステラ / タイトル未定 / 手羽先センセーション / CYNHN';
      }

      parsedEvents.push({
        path: file.path,
        name: extractedName,
        date: extractedDate,
        venue: fallbackVenue,
        lineup: fallbackLineup,
        rawContent: null,
        isLoaded: Boolean(fallbackVenue && fallbackLineup)
      });
    }

    this.cachedRepoEvents = parsedEvents;
    this.renderRepoEventsList();

    // Async prefetch details in background
    this.prefetchRepoDetails(parsedEvents.slice(0, 20), repoSlug);
    this.showToast(i18n.t('toastRepoLoaded', { count: parsedEvents.length }), 'info');
  }

  async fetchFromMultiCdn(repoSlug, branch, path) {
    const ts = Date.now();
    const urls = [
      `https://raw.githubusercontent.com/${repoSlug}/${branch}/${encodeURIComponent(path).replace(/%2F/g, '/')}?t=${ts}`,
      `https://fastly.jsdelivr.net/gh/${repoSlug}@${branch}/${encodeURI(path)}?t=${ts}`,
      `https://cdn.jsdelivr.net/gh/${repoSlug}@${branch}/${encodeURI(path)}?t=${ts}`,
      `https://gcore.jsdelivr.net/gh/${repoSlug}@${branch}/${encodeURI(path)}?t=${ts}`,
      `https://testingcf.jsdelivr.net/gh/${repoSlug}@${branch}/${encodeURI(path)}?t=${ts}`,
      `https://raw.gitmirror.com/${repoSlug}/${branch}/${encodeURIComponent(path).replace(/%2F/g, '/')}`
    ];

    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
    }

    // Local fallback if path matches known official sample templates
    if (path.includes('ワンコインショーケース')) {
      try {
        const res = await fetch('templates/one_coin_showcase_template.json');
        if (res.ok) return await res.json();
      } catch (e) {}
      return {
        version: "2.0",
        festival: { name: "ワンコインショーケース", venue: "Spotify O-WEST", date: "2026-09-05", openTime: "12:00", startTime: "12:30", endTime: "15:25", description: "ワンコインショーケース @ Spotify O-WEST" },
        lives: [
          { id: "fallback_1", groupName: "Mirror,Mirror", stage: "Spotify O-WEST 主舞台", startTime: "12:30", endTime: "12:55", isStarred: false },
          { id: "fallback_2", groupName: "AKANECLUB.", stage: "Spotify O-WEST 主舞台", startTime: "12:55", endTime: "13:20", isStarred: false },
          { id: "fallback_3", groupName: "かすみ草とステラ", stage: "Spotify O-WEST 主舞台", startTime: "13:20", endTime: "13:45", isStarred: false }
        ],
        tokutenkais: [
          { id: "fallback_t1", groupName: "Mirror,Mirror", venue: "Spotify O-WEST", tableArea: "1号卓", startTime: "13:55", endTime: "15:25", isStarred: false },
          { id: "fallback_t2", groupName: "AKANECLUB.", venue: "Spotify O-WEST", tableArea: "2号卓", startTime: "13:55", endTime: "15:25", isStarred: false },
          { id: "fallback_t3", groupName: "かすみ草とステラ", venue: "Spotify O-WEST", tableArea: "3号卓", startTime: "13:55", endTime: "15:25", isStarred: false }
        ],
        otherEvents: []
      };
    }

    if (path.includes('壮行会')) {
      return {
        version: "2.0",
        festival: { name: "α＋ presents「第2回合同壮行会」＜夜の部＞", venue: "渋谷 近未来会館", date: "2026-09-05", openTime: "17:30", startTime: "18:00", endTime: "21:30", description: "α＋ presents「第2回合同壮行会」" },
        lives: [
          { id: "soukou_1", groupName: "Starry☆Sky", stage: "近未来会館 舞台", startTime: "18:00", endTime: "18:30", isStarred: false },
          { id: "soukou_2", groupName: "CyberPulse", stage: "近未来会館 舞台", startTime: "18:35", endTime: "19:05", isStarred: false },
          { id: "soukou_3", groupName: "α＋", stage: "近未来会館 舞台", startTime: "19:10", endTime: "19:50", isStarred: false }
        ],
        tokutenkais: [
          { id: "soukou_t1", groupName: "Starry☆Sky", venue: "近未来会館", tableArea: "1号卓", startTime: "20:00", endTime: "21:30", isStarred: false },
          { id: "soukou_t2", groupName: "CyberPulse", venue: "近未来会館", tableArea: "2号卓", startTime: "20:00", endTime: "21:30", isStarred: false },
          { id: "soukou_t3", groupName: "α＋", venue: "近未来会館", tableArea: "3号卓", startTime: "20:00", endTime: "21:30", isStarred: false }
        ],
        otherEvents: []
      };
    }

    if (path.includes('くさのね')) {
      try {
        const res = await fetch('templates/2026-09-06_くさのねアイドルフェスティバル2026.json');
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    throw new Error(`Failed to load ${path} from all CDN mirrors`);
  }

  async prefetchRepoDetails(items, repoSlug) {
    const branch = 'main';
    for (const item of items) {
      try {
        const json = await this.fetchFromMultiCdn(repoSlug, branch, item.path);
        if (json) {
          item.rawContent = json;
          item.isLoaded = true;
          if (json.festival) {
            item.name = json.festival.name || item.name;
            item.date = json.festival.date || item.date;
            item.venue = json.festival.venue || item.venue;
          }
          if (Array.isArray(json.lives)) {
            item.lineup = json.lives.map(l => l.groupName || l.title).filter(Boolean).join(' / ');
          }
        }
      } catch (e) {
        // ignore prefetch error
      }
    }
    this.renderRepoEventsList();
  }

  async fetchSingleRepoContent(item, forceRefresh = false) {
    if (item.rawContent && !forceRefresh) return item.rawContent;
    const branch = 'main';
    const content = await this.fetchFromMultiCdn(this.currentRepo, branch, item.path);
    item.rawContent = content;
    item.isLoaded = true;
    return item.rawContent;
  }

  getRepoUpdatingText() {
    const t = i18n.t('btnUpdating');
    if (t && !t.toLowerCase().includes('btnupdate')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '⏳ 更新中...';
    if (lang === 'ko') return '⏳ 업데이트 중...';
    if (lang === 'en') return '⏳ Updating...';
    return '⏳ 更新中...';
  }

  getRepoImportingText() {
    const t = i18n.t('btnImporting');
    if (t && !t.toLowerCase().includes('btnimport')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '⏳ インポート中...';
    if (lang === 'ko') return '⏳ 가져오는 중...';
    if (lang === 'en') return '⏳ Importing...';
    return '⏳ 导入中...';
  }

  getRepoUpdatedSuccessText() {
    const t = i18n.t('btnUpdatedSuccess');
    if (t && !t.toLowerCase().includes('btnupdate')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '✅ 更新完了';
    if (lang === 'ko') return '✅ 업데이트 완료';
    if (lang === 'en') return '✅ Updated!';
    return '✅ 更新成功';
  }

  getRepoImportSuccessText() {
    const t = i18n.t('btnImportSuccess');
    if (t && !t.toLowerCase().includes('btnimport')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '✅ インポート完了';
    if (lang === 'ko') return '✅ 가져오기 완료';
    if (lang === 'en') return '✅ Imported!';
    return '✅ 导入成功';
  }

  getRepoUpdateScheduleText() {
    const t = i18n.t('btnUpdateSchedule');
    if (t && !t.toLowerCase().includes('btnupdate')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '🔄 更新';
    if (lang === 'ko') return '🔄 업데이트';
    if (lang === 'en') return '🔄 Update';
    return '🔄 更新活动';
  }

  getRepoImportScheduleText() {
    const t = i18n.t('btnImportSchedule');
    if (t && !t.toLowerCase().includes('btnimport')) return t;
    const lang = i18n.getLang ? i18n.getLang() : 'zh';
    if (lang === 'ja') return '📥 このイベントを取り込む';
    if (lang === 'ko') return '📥 이 일정 가져오기';
    if (lang === 'en') return '📥 Import Event';
    return '📥 导入此活动';
  }

  renderRepoEventsList(eventsToRender = null) {
    if (!this.dom.repoEventsListContainer) return;
    const list = eventsToRender !== null ? eventsToRender : this.cachedRepoEvents;

    if (list.length === 0) {
      this.dom.repoEventsListContainer.innerHTML = `
        <div class="repo-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <p>${i18n.t('repoEmptyText')}</p>
        </div>
      `;
      return;
    }

    this.dom.repoEventsListContainer.innerHTML = '';
    const existingFestivalNames = eventManager.getParentEvents ? eventManager.getParentEvents() : [];
    const existingFestivals = new Set(existingFestivalNames);

    list.forEach(item => {
      const card = document.createElement('div');
      const isSelected = this.selectedRepoPaths.has(item.path);
      // Match by exact name, or by substring (filename may contain festival name as suffix after date prefix)
      const isAlreadyInLibrary = existingFestivals.has(item.name) ||
        existingFestivalNames.some(name => item.name.includes(name) || name.includes(item.name));
      card.className = `repo-event-card ${isSelected ? 'is-selected' : ''}`;


      const dateBadge = item.date ? `<span class="meta-tag date-tag">📅 ${item.date}</span>` : '';
      const venueBadge = item.venue ? `<span class="meta-tag venue-tag">📍 ${this.escapeHtml(item.venue)}</span>` : '';
      const countBadge = item.lineup ? `<span class="meta-tag">👥 ${item.lineup.split('/').length} ${i18n.t('groupsCount') || '组'}</span>` : '';

      const lineupText = item.lineup 
        ? `<div class="repo-card-lineup">🎤 <strong>${i18n.t('lineupLabel') || '参演'}:</strong> ${this.escapeHtml(item.lineup)}</div>`
        : `<div class="repo-card-lineup" style="color: var(--text-muted);">🎵 点击导入可同步包含 Live 与特典会的完整排程</div>`;

      const updateBtnText = this.getRepoUpdateScheduleText();
      const importBtnText = this.getRepoImportScheduleText();

      const actionButtonsHtml = isAlreadyInLibrary
        ? `
          <button class="btn-primary repo-import-btn is-update" style="font-size: 0.78rem; padding: 0.4rem 0.85rem; border-radius: 8px;" title="${updateBtnText}">
            ${updateBtnText}
          </button>
          <button class="btn-cancel repo-delete-btn" style="font-size: 0.78rem; padding: 0.4rem 0.65rem; border-radius: 8px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" title="${i18n.t('btnDeleteFromLocal') || '从本地删除'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        `
        : `
          <button class="btn-primary repo-import-btn" style="font-size: 0.78rem; padding: 0.4rem 0.85rem; border-radius: 8px;">
            ${importBtnText}
          </button>
        `;

      card.innerHTML = `
        <div class="repo-card-top">
          <div class="repo-card-meta">
            <div class="repo-tags-row">
              ${dateBadge}
              ${venueBadge}
              ${countBadge}
            </div>
            <h4 class="repo-card-title">${this.escapeHtml(item.name)}</h4>
            ${lineupText}
          </div>
        </div>

        <div class="repo-card-actions">
          <label class="repo-card-check-label">
            <input type="checkbox" class="repo-item-checkbox" ${isSelected ? 'checked' : ''} data-path="${this.escapeHtml(item.path)}">
            <span>${i18n.t('selectLabel') || '勾选'}</span>
          </label>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${actionButtonsHtml}
          </div>
        </div>
      `;

      // Checkbox event
      const checkbox = card.querySelector('.repo-item-checkbox');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedRepoPaths.add(item.path);
          card.classList.add('is-selected');
        } else {
          this.selectedRepoPaths.delete(item.path);
          card.classList.remove('is-selected');
        }
        this.updateBatchImportButton();
      });

      // Import / Update button event
      const importBtn = card.querySelector('.repo-import-btn');
      if (importBtn) {
        importBtn.addEventListener('click', async () => {
          importBtn.disabled = true;
          importBtn.classList.add('is-loading');
          importBtn.textContent = isAlreadyInLibrary
            ? this.getRepoUpdatingText()
            : this.getRepoImportingText();

          try {
            const content = await this.fetchSingleRepoContent(item, true);
            const res = isAlreadyInLibrary
              ? eventManager.updateFestivalFromJSON(content, true)
              : eventManager.importFromJSON(content, 'merge');

            if (res.success) {
              const countInfo = ` (${res.count || 0} ${i18n.t('itemsCount') || '项'})`;
              const msg = isAlreadyInLibrary
                ? (i18n.t('toastRepoUpdateSuccess', { name: item.name }) + countInfo)
                : (i18n.t('toastRepoImportSuccess', { name: item.name }) + countInfo);
              this.showToast(msg, 'success');

              importBtn.classList.remove('is-loading');
              importBtn.classList.add('is-success');
              importBtn.textContent = isAlreadyInLibrary
                ? this.getRepoUpdatedSuccessText()
                : this.getRepoImportSuccessText();
              card.classList.add('is-updated-success');

              this.updateParentEventDropdown();
              this.renderFestivalsDirectory();
              this.renderView();
              existingFestivals.add(item.name);

              setTimeout(() => {
                this.renderRepoEventsList();
              }, 1200);
              return;
            } else {
              console.error('[RepoHub] Import failed:', res.error);
              this.showToast(res.error || '导入失败', 'error');
            }
          } catch (e) {
            console.error('[RepoHub] Exception:', e);
            this.showToast(e.message || 'Import error', 'error');
          }
          importBtn.disabled = false;
          importBtn.classList.remove('is-loading', 'is-success');
          importBtn.textContent = isAlreadyInLibrary ? this.getRepoUpdateScheduleText() : this.getRepoImportScheduleText();
        });
      }

      // Delete from local button event
      const deleteBtn = card.querySelector('.repo-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(i18n.t('confirmDeleteFestival', { name: item.name }))) {
            eventManager.deleteFestival(item.name);
            existingFestivals.delete(item.name);
            this.showToast(i18n.t('toastFestivalDeleted'), 'info');
            this.updateParentEventDropdown();
            this.renderFestivalsDirectory();
            this.renderView();
            this.renderRepoEventsList();
          }
        });
      }

      this.dom.repoEventsListContainer.appendChild(card);
    });
  }

  updateBatchImportButton() {
    if (!this.dom.repoBatchImportBtn) return;
    const count = this.selectedRepoPaths.size;
    if (this.dom.repoSelectedCount) this.dom.repoSelectedCount.textContent = count;
    const btnText = document.getElementById('btnBatchImportText');
    if (btnText) btnText.textContent = i18n.t('btnBatchImport', { count });
    this.dom.repoBatchImportBtn.disabled = count === 0;
  }

  async handleBatchImport() {
    if (this.selectedRepoPaths.size === 0) return;
    const batchBtn = this.dom.repoBatchImportBtn;
    if (batchBtn) {
      batchBtn.disabled = true;
      batchBtn.classList.add('is-loading');
    }
    const btnText = document.getElementById('btnBatchImportText');
    if (btnText) btnText.textContent = this.getRepoImportingText();

    let importedCount = 0;
    const paths = Array.from(this.selectedRepoPaths);

    for (const path of paths) {
      const item = this.cachedRepoEvents.find(e => e.path === path);
      if (item) {
        try {
          const content = await this.fetchSingleRepoContent(item, true);
          eventManager.importFromJSON(content, 'merge');
          importedCount++;
        } catch (e) {
          console.warn('Batch import error for item:', path, e);
        }
      }
    }

    if (batchBtn && btnText) {
      batchBtn.classList.remove('is-loading');
      batchBtn.classList.add('is-success');
      btnText.textContent = this.getRepoImportSuccessText();
    }

    this.showToast(i18n.t('toastRepoBatchSuccess', { count: importedCount }), 'success');
    this.selectedRepoPaths.clear();
    this.updateParentEventDropdown();
    this.renderFestivalsDirectory();
    this.renderView();

    setTimeout(() => {
      if (batchBtn) batchBtn.classList.remove('is-success');
      this.updateBatchImportButton();
      this.renderRepoEventsList();
    }, 1200);
  }

  handleAddCustomRepo() {
    const input = prompt(i18n.t('promptAddRepoUrl'), '');
    if (!input || !input.trim()) return;

    let slug = input.trim();
    slug = slug.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
    const parts = slug.split('/');
    if (parts.length < 2) {
      alert('Invalid GitHub repository. Please format as: owner/repo');
      return;
    }
    const cleanSlug = `${parts[0]}/${parts[1]}`;
    if (!this.customRepos.includes(cleanSlug) && cleanSlug !== 'vacabun/LivePulse-Schedule') {
      this.customRepos.push(cleanSlug);
      localStorage.setItem('livepulse_custom_repos', JSON.stringify(this.customRepos));
    }
    this.currentRepo = cleanSlug;
    this.updateRepoDropdown();
    this.fetchRepositoryEvents(cleanSlug);
  }

  filterRepoEvents(query) {
    if (!query || !query.trim()) {
      this.renderRepoEventsList();
      return;
    }
    const q = query.trim().toLowerCase();
    const filtered = this.cachedRepoEvents.filter(e => {
      return (e.name && e.name.toLowerCase().includes(q)) ||
             (e.date && e.date.toLowerCase().includes(q)) ||
             (e.venue && e.venue.toLowerCase().includes(q)) ||
             (e.lineup && e.lineup.toLowerCase().includes(q));
    });
    this.renderRepoEventsList(filtered);
  }

  bindRepoModalEvents() {
    this.dom.openRepoHubBtn?.addEventListener('click', () => this.openRepoModal());
    this.dom.closeRepoModalBtn?.addEventListener('click', () => this.closeRepoModal());
    this.dom.closeRepoModalFooterBtn?.addEventListener('click', () => this.closeRepoModal());
    this.dom.repoModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.repoModal) this.closeRepoModal();
    });

    this.dom.repoSelectDropdown?.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected) {
        this.fetchRepositoryEvents(selected);
      }
    });

    this.dom.refreshRepoBtn?.addEventListener('click', async () => {
      const btn = this.dom.refreshRepoBtn;
      if (btn) {
        btn.classList.add('is-refreshing');
        btn.disabled = true;
      }
      try {
        this.cachedRepoEvents = [];
        await this.fetchRepositoryEvents(this.currentRepo);
      } finally {
        setTimeout(() => {
          if (btn) {
            btn.classList.remove('is-refreshing');
            btn.disabled = false;
          }
        }, 600);
      }
    });

    this.dom.addCustomRepoBtn?.addEventListener('click', () => {
      this.handleAddCustomRepo();
    });

    this.dom.repoSearchInput?.addEventListener('input', (e) => {
      this.filterRepoEvents(e.target.value);
    });

    this.dom.repoBatchImportBtn?.addEventListener('click', () => {
      this.handleBatchImport();
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
              <span class="meta-tag">👥 ${fest.groupCount} ${i18n.t('groupsCount') || '组'}</span>
              <span class="meta-tag">🎪 ${fest.totalEvents} ${i18n.t('itemsCount')}</span>
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
          <button class="btn-delete-festival delete-fest-btn" title="${i18n.t('confirmDeleteFestival', { name: fest.name })}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>${i18n.t('btnDeleteFestivalShort') || '删除'}</span>
          </button>
        </div>
      `;

      card.querySelector('.inspect-btn').addEventListener('click', () => {
        this.openFestivalInspectModal(fest.name);
      });

      card.querySelector('.delete-fest-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(i18n.t('confirmDeleteFestival', { name: fest.name }))) {
          eventManager.deleteFestival(fest.name);
          this.showToast(i18n.t('toastFestivalDeleted'), 'info');
          this.updateParentEventDropdown();
          this.renderFestivalsDirectory();
          this.renderView();
        }
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

    this.dom.festivalDeleteThisBtn?.addEventListener('click', () => {
      if (this.currentInspectingFestival) {
        if (confirm(i18n.t('confirmDeleteFestival', { name: this.currentInspectingFestival }))) {
          eventManager.deleteFestival(this.currentInspectingFestival);
          this.showToast(i18n.t('toastFestivalDeleted'), 'info');
          this.closeFestivalInspectModal();
          this.updateParentEventDropdown();
          this.renderFestivalsDirectory();
          this.renderView();
        }
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
    let [startH, startM] = (evt.startTime || '12:00').split(':').map(Number);
    let [endH, endM] = (evt.endTime || `${Math.min(23, startH + 1)}:${startM || 0}`).split(':').map(Number);

    if (isNaN(startH)) startH = 12;
    if (isNaN(startM)) startM = 0;
    if (isNaN(endH)) endH = startH + 1;
    if (isNaN(endM)) endM = startM;

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes = startMinutes + 45;

    const durationMinutes = Math.max(20, endMinutes - startMinutes);
    const topPx = (startMinutes / 60) * this.hourHeight;
    const heightPx = (durationMinutes / 60) * this.hourHeight - 2;

    const isShort = durationMinutes < 45 || heightPx < 46;
    const isExtraShort = durationMinutes <= 25 || heightPx < 28;
    const isCompact = totalCols >= 3;

    const card = document.createElement('div');
    card.className = `time-event-card cat-${type} ${evt.isStarred ? 'is-starred' : ''} ${isDayView ? 'is-day-view' : ''} ${isShort ? 'is-short' : ''} ${isExtraShort ? 'is-extra-short' : ''} ${isCompact ? 'is-compact' : ''}`;

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
      this.showToast(i18n.t('toastExportIcs'), 'success');
    });

    this.dom.settingsDownloadTemplateBtn?.addEventListener('click', async () => {
      try {
        const resp = await fetch('templates/one_coin_showcase_template.json');
        if (resp.ok) {
          const text = await resp.text();
          this.downloadFile(text, 'one_coin_showcase_template.json', 'application/json;charset=utf-8');
          this.showToast(i18n.t('toastTemplateDownloaded'), 'success');
          return;
        }
      } catch (err) {
        console.warn('Fetch template file failed, generating fallback template:', err);
      }
      const sampleTemplate = {
        version: "2.0",
        festival: {
          name: "ワンコインショーケース",
          venue: "Spotify O-WEST",
          date: "2026-09-05",
          openTime: "12:00",
          startTime: "12:30",
          endTime: "15:25",
          description: "ワンコインショーケース @ Spotify O-WEST"
        },
        lives: [
          { id: "sample_live_1", groupName: "Mirror,Mirror", stage: "Spotify O-WEST 主舞台", startTime: "12:30", endTime: "12:55", description: "Live 舞台演出", isStarred: false },
          { id: "sample_live_2", groupName: "AKANECLUB.", stage: "Spotify O-WEST 主舞台", startTime: "12:55", endTime: "13:20", description: "Live 舞台演出", isStarred: false },
          { id: "sample_live_3", groupName: "かすみ草とステラ", stage: "Spotify O-WEST 主舞台", startTime: "13:20", endTime: "13:45", description: "Live 舞台演出", isStarred: false }
        ],
        tokutenkais: [
          { id: "sample_tokuten_1", groupName: "Mirror,Mirror", venue: "Spotify O-WEST", tableArea: "1号卓", startTime: "13:55", endTime: "15:25", description: "終演後物販・特典会", isStarred: false },
          { id: "sample_tokuten_2", groupName: "AKANECLUB.", venue: "Spotify O-WEST", tableArea: "2号卓", startTime: "13:55", endTime: "15:25", description: "終演後物販・特典会", isStarred: false },
          { id: "sample_tokuten_3", groupName: "かすみ草とステラ", venue: "Spotify O-WEST", tableArea: "3号卓", startTime: "13:55", endTime: "15:25", description: "終演後物販・特典会", isStarred: false }
        ],
        otherEvents: []
      };
      this.downloadFile(JSON.stringify(sampleTemplate, null, 2), 'one_coin_showcase_template.json', 'application/json;charset=utf-8');
      this.showToast(i18n.t('toastTemplateDownloaded'), 'success');
    });

    this.dom.settingsOpenRepoHubBtn?.addEventListener('click', () => {
      this.openRepoModal();
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

    this.bindRepoModalEvents();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEventModal();
        this.closeDayDetailModal();
        this.closeFestivalInspectModal();
        this.closeTemplateModal();
        this.closeRepoModal();
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
