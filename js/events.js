/**
 * Event Data Layer - LivePulse (Music Live & Tokutenkai Rush Timetable)
 * Handles storage, retrieval, backup, JSON/ICS import & export with support
 * for Structured Festival Templates, Group Names, Parent Events, Live/Tokutenkai Types, and My Rush Itinerary (Star).
 */

const STORAGE_KEY = 'livepulse_schedules_v3';

export const CATEGORIES = {
  all: { id: 'all', name: '全部', color: '#6366f1', icon: '✨' },
  live: { id: 'live', name: 'Live (舞台演出)', color: '#ec4899', icon: '🎤' },
  tokuten: { id: 'tokuten', name: '特典会 (物贩/合影)', color: '#f59e0b', icon: '📸' },
  other: { id: 'other', name: '其他 (转场/入场)', color: '#06b6d4', icon: '🏷️' }
};

/**
 * Default sample events: Only includes the standard ワンコインショーケース @ Spotify O-WEST
 */
function generateInitialSampleEvents() {
  const dateStr = '2026-09-05';
  return [
    {
      id: 'onecoin_live_1',
      groupName: 'Mirror,Mirror',
      title: 'Mirror,Mirror',
      category: 'live',
      type: 'live',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '12:30',
      endTime: '12:55',
      isStarred: true,
      description: 'Live 舞台演出 (25分钟)'
    },
    {
      id: 'onecoin_live_2',
      groupName: 'AKANECLUB.',
      title: 'AKANECLUB.',
      category: 'live',
      type: 'live',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '12:55',
      endTime: '13:20',
      isStarred: true,
      description: 'Live 舞台演出 (25分钟)'
    },
    {
      id: 'onecoin_live_3',
      groupName: 'かすみ草とステラ',
      title: 'かすみ草とステラ',
      category: 'live',
      type: 'live',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '13:20',
      endTime: '13:45',
      isStarred: true,
      description: 'Live 舞台演出 (25分钟)'
    },
    {
      id: 'onecoin_tokuten_1',
      groupName: 'Mirror,Mirror',
      title: 'Mirror,Mirror',
      category: 'tokuten',
      type: 'tokuten',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '13:55',
      endTime: '15:25',
      isStarred: true,
      description: '終演後物販・特典会 (拍立得合影/签名交流)'
    },
    {
      id: 'onecoin_tokuten_2',
      groupName: 'AKANECLUB.',
      title: 'AKANECLUB.',
      category: 'tokuten',
      type: 'tokuten',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '13:55',
      endTime: '15:25',
      isStarred: true,
      description: '終演後物販・特典会 (拍立得合影/签名交流)'
    },
    {
      id: 'onecoin_tokuten_3',
      groupName: 'かすみ草とステラ',
      title: 'かすみ草とステラ',
      category: 'tokuten',
      type: 'tokuten',
      parentEvent: 'ワンコインショーケース',
      venue: 'Spotify O-WEST',
      tableArea: '',
      date: dateStr,
      startTime: '13:55',
      endTime: '15:25',
      isStarred: true,
      description: '終演後物販・特典会 (拍立得合影/签名交流)'
    }
  ];
}

class EventManager {
  constructor() {
    this.events = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      const legacyData = localStorage.getItem('event_pulse_schedules_v1');
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        const migrated = parsed.map(e => ({
          ...e,
          groupName: e.groupName || e.title,
          parentEvent: e.parentEvent || '常规演出活动',
          venue: e.venue || '主舞台',
          tableArea: e.tableArea || '',
          isStarred: !!e.isStarred,
          type: (e.category === 'meeting' ? 'tokuten' : (e.category === 'work' ? 'live' : 'other')),
          category: (e.category === 'meeting' ? 'tokuten' : (e.category === 'work' ? 'live' : 'other'))
        }));
        this.saveToStorage(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn('Failed to parse events from localStorage:', e);
    }
    const initial = generateInitialSampleEvents();
    this.saveToStorage(initial);
    return initial;
  }

  saveToStorage(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events to localStorage:', e);
    }
  }

  getAllEvents() {
    return [...this.events];
  }

  getEventById(id) {
    return this.events.find(e => e.id === id);
  }

  getEventsByDate(dateStr) {
    return this.events.filter(e => e.date === dateStr);
  }

  getEventsByParent(parentEventName) {
    return this.events.filter(e => e.parentEvent === parentEventName);
  }

  getParentEvents() {
    const set = new Set();
    this.events.forEach(e => {
      if (e.parentEvent && e.parentEvent.trim()) {
        set.add(e.parentEvent.trim());
      }
    });
    return Array.from(set);
  }

  getFestivalSummaryList() {
    const map = new Map();
    
    this.events.forEach(e => {
      const parentName = e.parentEvent ? e.parentEvent.trim() : '其他独立排程';
      if (!map.has(parentName)) {
        map.set(parentName, {
          name: parentName,
          dates: new Set(),
          venues: new Set(),
          groups: new Set(),
          events: [],
          starredCount: 0,
          totalCount: 0
        });
      }
      const item = map.get(parentName);
      if (e.date) item.dates.add(e.date);
      if (e.venue) item.venues.add(e.venue);
      if (e.groupName) item.groups.add(e.groupName);
      item.events.push(e);
      item.totalCount++;
      if (e.isStarred) item.starredCount++;
    });

    const list = [];
    map.forEach((val, key) => {
      val.events.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

      const datesArr = Array.from(val.dates).sort();
      const dateRange = datesArr.length <= 1 ? (datesArr[0] || '待定') : `${datesArr[0]} ~ ${datesArr[datesArr.length - 1]}`;

      list.push({
        name: key,
        dateRange: dateRange,
        venues: Array.from(val.venues).join(' / ') || '主场地',
        groupCount: val.groups.size,
        groups: Array.from(val.groups),
        totalEvents: val.totalCount,
        starredCount: val.starredCount,
        events: val.events
      });
    });

    return list;
  }

  setFestivalAllStarred(parentEventName, isStarred) {
    this.events.forEach(e => {
      if (e.parentEvent === parentEventName) {
        e.isStarred = isStarred;
      }
    });
    this.saveToStorage(this.events);
  }

  toggleStar(id) {
    const event = this.getEventById(id);
    if (event) {
      event.isStarred = !event.isStarred;
      this.saveToStorage(this.events);
      return event.isStarred;
    }
    return false;
  }

  addEvent(eventData) {
    const nowISO = new Date().toISOString();
    const groupName = (eventData.groupName || eventData.title || '').trim();
    const type = eventData.type || eventData.category || 'live';

    const newEvent = {
      id: 'live_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      groupName: groupName,
      title: groupName,
      type: type,
      category: type,
      parentEvent: (eventData.parentEvent || '拼盘演出活动').trim(),
      venue: (eventData.venue || '主舞台').trim(),
      tableArea: (eventData.tableArea || '').trim(),
      date: eventData.date,
      startTime: eventData.startTime || '',
      endTime: eventData.endTime || '',
      description: (eventData.description || '').trim(),
      isStarred: eventData.isStarred !== undefined ? eventData.isStarred : true,
      createdAt: nowISO,
      updatedAt: nowISO
    };
    this.events.push(newEvent);
    this.saveToStorage(this.events);
    return newEvent;
  }

  updateEvent(id, updatedData) {
    const index = this.events.findIndex(e => e.id === id);
    if (index !== -1) {
      const groupName = (updatedData.groupName || updatedData.title || this.events[index].groupName).trim();
      const type = updatedData.type || updatedData.category || this.events[index].type || 'live';

      this.events[index] = {
        ...this.events[index],
        ...updatedData,
        groupName: groupName,
        title: groupName,
        type: type,
        category: type,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage(this.events);
      return this.events[index];
    }
    return null;
  }

  deleteEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this.saveToStorage(this.events);
  }

  deleteFestival(parentEventName) {
    this.events = this.events.filter(e => e.parentEvent !== parentEventName);
    this.saveToStorage(this.events);
  }

  clearAllEvents() {
    this.events = [];
    this.saveToStorage(this.events);
    return true;
  }

  resetToDefault() {
    const initial = generateInitialSampleEvents();
    this.events = initial;
    this.saveToStorage(initial);
    return initial;
  }

  getStorageStats() {
    const jsonStr = JSON.stringify(this.events);
    const sizeBytes = new Blob([jsonStr]).size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    const festivals = this.getParentEvents();
    return {
      count: this.events.length,
      festivalCount: festivals.length,
      sizeKB,
      sizeBytes
    };
  }

  /* --------------------------------------------------------------------------
     Export Formats (JSON & iCalendar & Template)
     -------------------------------------------------------------------------- */
  exportToJSON() {
    const exportBundle = {
      version: '2.0',
      appName: 'LivePulse',
      exportedAt: new Date().toISOString(),
      totalEvents: this.events.length,
      categories: CATEGORIES,
      events: this.events
    };
    return JSON.stringify(exportBundle, null, 2);
  }

  exportFestivalAsStructuredTemplate(parentEventName) {
    const events = this.getEventsByParent(parentEventName);
    if (events.length === 0) return null;

    const lives = [];
    const tokutenkais = [];
    const otherEvents = [];
    let minTime = '23:59';
    let maxTime = '00:00';
    let venue = events[0].venue || '';
    let date = events[0].date || '';

    events.forEach(e => {
      if (e.startTime && e.startTime < minTime) minTime = e.startTime;
      if (e.endTime && e.endTime > maxTime) maxTime = e.endTime;
      if (e.venue) venue = e.venue;
      if (e.date) date = e.date;

      const type = e.type || e.category || 'live';
      if (type === 'live') {
        lives.push({
          id: e.id,
          groupName: e.groupName || e.title,
          stage: e.venue || '主舞台',
          startTime: e.startTime || '',
          endTime: e.endTime || '',
          description: e.description || '',
          isStarred: !!e.isStarred
        });
      } else if (type === 'tokuten') {
        tokutenkais.push({
          id: e.id,
          groupName: e.groupName || e.title,
          venue: e.venue || '物贩特典区',
          tableArea: e.tableArea || '',
          startTime: e.startTime || '',
          endTime: e.endTime || '',
          description: e.description || '',
          isStarred: !!e.isStarred
        });
      } else {
        otherEvents.push({
          id: e.id,
          title: e.groupName || e.title,
          startTime: e.startTime || '',
          endTime: e.endTime || '',
          venue: e.venue || '',
          description: e.description || '',
          isStarred: !!e.isStarred
        });
      }
    });

    const templateObj = {
      version: '2.0',
      festival: {
        name: parentEventName,
        venue: venue,
        date: date,
        openTime: minTime !== '23:59' ? minTime : '12:00',
        startTime: minTime !== '23:59' ? minTime : '12:30',
        endTime: maxTime !== '00:00' ? maxTime : '18:00',
        description: `${parentEventName} @ ${venue}`
      },
      lives,
      tokutenkais,
      otherEvents
    };

    return JSON.stringify(templateObj, null, 2);
  }

  exportToICS(onlyStarred = false) {
    const pad = (n) => String(n).padStart(2, '0');
    const formatICSDate = (dateStr, timeStr = '00:00') => {
      const [y, m, d] = (dateStr || '').split('-').map(Number);
      const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
      if (!y || !m || !d) return '';
      return `${y}${pad(m)}${pad(d)}T${pad(hh || 0)}${pad(mm || 0)}00`;
    };

    const escapeICSText = (str) => {
      if (!str) return '';
      return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LivePulse//Music Live & Tokuten Timetable//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:LivePulse 个人活动路线日程',
      'X-WR-TIMEZONE:Asia/Shanghai'
    ];

    const nowStr = formatICSDate(new Date().toISOString().split('T')[0], '00:00') + 'Z';
    const targetEvents = onlyStarred ? this.events.filter(e => e.isStarred) : this.events;

    targetEvents.forEach(evt => {
      const startTime = evt.startTime || '12:00';
      const endTime = evt.endTime || '13:00';
      const dtStart = formatICSDate(evt.date, startTime);
      const dtEnd = formatICSDate(evt.date, endTime);
      const typeLabel = (evt.type === 'tokuten' ? '📸 特典会' : (evt.type === 'live' ? '🎤 Live' : '🏷️ 其他'));
      const summaryText = `[${typeLabel}] ${evt.groupName || evt.title}`;

      let location = evt.parentEvent || '';
      if (evt.venue) location += ` - ${evt.venue}`;
      if (evt.tableArea) location += ` (${evt.tableArea})`;

      let descriptionText = evt.description || '';
      if (evt.parentEvent) descriptionText = `【活动】${evt.parentEvent}\n` + descriptionText;

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${evt.id || ('live_' + Date.now() + '@livepulse.app')}`);
      ics.push(`DTSTAMP:${nowStr}`);
      ics.push(`DTSTART:${dtStart}`);
      ics.push(`DTEND:${dtEnd}`);
      ics.push(`SUMMARY:${escapeICSText(summaryText)}`);
      if (location) {
        ics.push(`LOCATION:${escapeICSText(location)}`);
      }
      if (descriptionText) {
        ics.push(`DESCRIPTION:${escapeICSText(descriptionText)}`);
      }
      ics.push(`CATEGORIES:${evt.type || 'live'}`);
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  /* --------------------------------------------------------------------------
     Import Logic (Supports Structured Template & Full Backup JSON)
     -------------------------------------------------------------------------- */
  importFromJSON(jsonString, mode = 'merge') {
    let parsed;
    try {
      parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (e) {
      return { success: false, error: 'JSON 文件格式不合法，无法解析。' };
    }

    let incomingEvents = [];

    // 1. Structured Festival Template schema: { festival, lives, tokutenkais, otherEvents }
    if (parsed && parsed.festival && (Array.isArray(parsed.lives) || Array.isArray(parsed.tokutenkais) || Array.isArray(parsed.otherEvents))) {
      const fest = parsed.festival;
      const festName = fest.name || '拼盘演出';
      const festDate = fest.date || new Date().toISOString().split('T')[0];
      const defaultVenue = fest.venue || '主舞台';

      // Parse Lives
      if (Array.isArray(parsed.lives)) {
        parsed.lives.forEach((l, idx) => {
          if (l.groupName || l.title) {
            incomingEvents.push({
              id: l.id || `tpl_live_${Date.now()}_${idx}`,
              groupName: l.groupName || l.title,
              title: l.groupName || l.title,
              type: 'live',
              category: 'live',
              parentEvent: festName,
              venue: l.stage || defaultVenue,
              tableArea: '',
              date: l.date || festDate,
              startTime: l.startTime || '',
              endTime: l.endTime || '',
              description: l.description || '',
              isStarred: l.isStarred !== undefined ? !!l.isStarred : true
            });
          }
        });
      }

      // Parse Tokutenkais (one event per group)
      if (Array.isArray(parsed.tokutenkais)) {
        parsed.tokutenkais.forEach((t, idx) => {
          if (t.groupName || t.title) {
            incomingEvents.push({
              id: t.id || `tpl_tokuten_${Date.now()}_${idx}`,
              groupName: t.groupName || t.title,
              title: t.groupName || t.title,
              type: 'tokuten',
              category: 'tokuten',
              parentEvent: festName,
              venue: t.venue || '物贩特典区',
              tableArea: t.tableArea || '',
              date: t.date || festDate,
              startTime: t.startTime || '',
              endTime: t.endTime || '',
              description: t.description || '',
              isStarred: t.isStarred !== undefined ? !!t.isStarred : true
            });
          }
        });
      }

      // Parse Other Events
      if (Array.isArray(parsed.otherEvents)) {
        parsed.otherEvents.forEach((o, idx) => {
          const title = o.title || o.groupName;
          if (title) {
            incomingEvents.push({
              id: o.id || `tpl_other_${Date.now()}_${idx}`,
              groupName: title,
              title: title,
              type: 'other',
              category: 'other',
              parentEvent: festName,
              venue: o.venue || defaultVenue,
              tableArea: '',
              date: o.date || festDate,
              startTime: o.startTime || '',
              endTime: o.endTime || '',
              description: o.description || '',
              isStarred: o.isStarred !== undefined ? !!o.isStarred : false
            });
          }
        });
      }
    }
    // 2. Flat Events Backup format
    else if (Array.isArray(parsed)) {
      incomingEvents = parsed;
    } else if (parsed && Array.isArray(parsed.events)) {
      incomingEvents = parsed.events;
    } else {
      return { success: false, error: '未找到有效的演出排程数据列表。' };
    }

    const validEvents = [];
    incomingEvents.forEach((evt, idx) => {
      const groupName = evt.groupName || evt.title;
      if (evt && typeof evt === 'object' && groupName && evt.date) {
        const type = evt.type || evt.category || 'live';
        validEvents.push({
          id: evt.id || `imported_live_${Date.now()}_${idx}`,
          groupName: String(groupName).trim(),
          title: String(groupName).trim(),
          type: type,
          category: type,
          parentEvent: String(evt.parentEvent || '拼盘演出活动').trim(),
          venue: String(evt.venue || '主舞台').trim(),
          tableArea: String(evt.tableArea || '').trim(),
          date: String(evt.date).trim(),
          startTime: evt.startTime || '',
          endTime: evt.endTime || '',
          description: evt.description || '',
          isStarred: evt.isStarred !== undefined ? !!evt.isStarred : true,
          createdAt: evt.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    if (validEvents.length === 0) {
      return { success: false, error: '文件中没有包含任何有效的演出/特典会项目。' };
    }

    if (mode === 'overwrite') {
      this.events = validEvents;
      this.saveToStorage(this.events);
      return {
        success: true,
        count: validEvents.length,
        message: `已完全覆盖导入 ${validEvents.length} 条演出/特典会排程！`
      };
    } else {
      let addedCount = 0;
      let updatedCount = 0;

      validEvents.forEach(newItem => {
        const existingIdx = this.events.findIndex(
          e => e.id === newItem.id || (e.date === newItem.date && e.groupName === newItem.groupName && e.type === newItem.type && e.startTime === newItem.startTime)
        );

        if (existingIdx !== -1) {
          this.events[existingIdx] = { ...this.events[existingIdx], ...newItem };
          updatedCount++;
        } else {
          this.events.push(newItem);
          addedCount++;
        }
      });

      this.saveToStorage(this.events);
      return {
        success: true,
        count: validEvents.length,
        addedCount,
        updatedCount,
        message: `合并导入完成：新增 ${addedCount} 条，更新 ${updatedCount} 条。`
      };
    }
  }
}

export const eventManager = new EventManager();
