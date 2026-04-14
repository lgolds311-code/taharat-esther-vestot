// ─────────────────────────────────────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────────────────────────────────────
const els = {
  grid:           document.querySelector("#grid"),
  monthLabel:     document.querySelector("#month-label"),
  monthSub:       document.querySelector("#month-sub"),
  monthHeb:       document.querySelector("#month-heb"),
  prev:           document.querySelector("#prev-month"),
  next:           document.querySelector("#next-month"),
  exportIcs:        document.querySelector("#export-ics"),
  clearAll:         document.querySelector("#clear-all"),
  exportBackup:     document.querySelector("#export-backup"),
  importBackupBtn:  document.querySelector("#import-backup-btn"),
  importBackupFile: document.querySelector("#import-backup-file"),
  calcSummary:    document.querySelector("#calc-summary"),
  popover:        document.querySelector("#popover"),
  popoverTitle:   document.querySelector("#popover-title"),
  popoverBody:    document.querySelector("#popover-body"),
  popoverActions: document.querySelector("#popover-actions"),
  citySelect:     document.querySelector("#city-select"),
  locateBtn:      document.querySelector("#locate-btn"),
  locationStatus: document.querySelector("#location-status"),
  settingsBtn:    document.querySelector("#settings-btn"),
  settingsModal:  document.querySelector("#settings-modal"),
  ozToggle:       document.querySelector("#oz-toggle"),
  day31Toggle:    document.querySelector("#day31-toggle"),
  fullDayToggle:  document.querySelector("#full-day-toggle"),
  themeSelect:             document.querySelector("#theme-select"),
  fixedHaflagahSelect:     document.querySelector("#fixed-haflagah-select"),
  notificationsToggle:  document.querySelector("#notifications-toggle"),
  ozScopeRow:           document.querySelector("#oz-scope-row"),
  ozTypeSelect:         document.querySelector("#oz-type-select"),
  notifSub:             document.querySelector("#notif-sub"),
  notif1Name:           document.querySelector("#notif1-name"),
  notif1Min:            document.querySelector("#notif1-min"),
  notif2Name:           document.querySelector("#notif2-name"),
  notif2Min:            document.querySelector("#notif2-min"),
  notif1FixedTime:      document.querySelector("#notif1-fixed-time"),
  notif2FixedTime:      document.querySelector("#notif2-fixed-time"),
  hefsekMinDay:         document.querySelector("#hefsek-min-day"),
  hefsekReminderMin:    document.querySelector("#hefsek-reminder-min"),
  hefsekReminderTime:   document.querySelector("#hefsek-reminder-time"),
  hefsekMorningMin:     document.querySelector("#hefsek-morning-min"),
  hefsekMorningTime:    document.querySelector("#hefsek-morning-time"),
  hefsekEveningMin:     document.querySelector("#hefsek-evening-min"),
  hefsekEveningTime:    document.querySelector("#hefsek-evening-time"),
  hefsekMikvehToggle:   document.querySelector("#hefsek-mikveh-toggle"),
  hefsekMikvehTimeRow:  document.querySelector("#hefsek-mikveh-time-row"),
  hefsekMikvehTime:     document.querySelector("#hefsek-mikveh-time"),
  notifSoundSelect:     document.querySelector("#notif-sound-select"),
  notifSoundTest:       document.querySelector("#notif-sound-test"),
  notifSoundFileRow:    document.querySelector("#notif-sound-file-row"),
  notifSoundFile:       document.querySelector("#notif-sound-file"),
  notifSoundFileBtn:    document.querySelector("#notif-sound-file-btn"),
  notifSoundFileName:   document.querySelector("#notif-sound-file-name"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE = {
  entries:          "monthlyCalendar.entries.v2",
  view:             "monthlyCalendar.view.heb.v1",
  location:         "monthlyCalendar.location.v1",
  settings:         "monthlyCalendar.settings.v1",
  lastNotification: "monthlyCalendar.lastNotification.v1",
  soundData:        "monthlyCalendar.soundData.v1",
};

// ─────────────────────────────────────────────────────────────────────────────
// Hebcal bootstrap
// ─────────────────────────────────────────────────────────────────────────────
function resolveHDateCtor() {
  const b = window.hebcal || window.Hebcal || null;
  return (
    b?.HDate || b?.hdate?.HDate || b?.default?.HDate || window?.HDate || null
  );
}
let HDateCtor = resolveHDateCtor();

// ─────────────────────────────────────────────────────────────────────────────
// Generic date utils
// ─────────────────────────────────────────────────────────────────────────────
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameYmd(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}
function isoKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function parseIsoKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
  if (!m) return null;
  const dt = new Date(+m[1], +m[2]-1, +m[3]);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intl formatters (fallbacks)
// ─────────────────────────────────────────────────────────────────────────────
const HEB_DAY_FMT       = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });
const HEB_MONTH_FMT     = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });
const HEB_YEAR_FMT      = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { year: "numeric" });
const HEB_FULL_FMT      = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const GREG_FULL_FMT     = new Intl.DateTimeFormat("he-IL", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const GREG_MONTHYR_FMT  = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });
const TIME_IL_FMT       = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem", hour12: false,
});

function hebDayFallback(date)   { return HEB_DAY_FMT.format(date); }
function hebMonthYearFallback(date) {
  return `${HEB_MONTH_FMT.format(date)} ${HEB_YEAR_FMT.format(date)}`;
}
function hebFullStr(date)  { return HEB_FULL_FMT.format(date); }
function gregFullStr(date) { return GREG_FULL_FMT.format(date); }
function formatILTime(d)   { return d ? TIME_IL_FMT.format(d) : "—"; }

// ─────────────────────────────────────────────────────────────────────────────
// Gematriya helpers — משתמשים ב-gematriya() של Hebcal ישירות
// ─────────────────────────────────────────────────────────────────────────────

// שמות חודשים עבריים (אינדקס 1-13)
const HEB_MONTH_NAMES = [
  "", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול",
  "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "אדר ב׳",
];

function resolveGematriyaFn() {
  const b = window.hebcal || window.Hebcal || null;
  return b?.gematriya || b?.default?.gematriya || null;
}

/** המר מספר לאותיות גימטריה (למשל 15 → ט״ו, 5786 → תשפ״ו) */
function numToGem(n) {
  const fn = resolveGematriyaFn();
  if (fn) try { return String(fn(n) || "").trim(); } catch {}
  // fallback: Intl (מחזיר לפעמים ספרות, לפחות לא קורס)
  return String(n);
}

function hebMonthName(hMonth) {
  return HEB_MONTH_NAMES[hMonth] || String(hMonth);
}

/** תאריך עברי בגימטריה לתא לוח */
function hebDayGem(date) {
  if (!HDateCtor) return hebDayFallback(date);
  try { return numToGem(new HDateCtor(date).getDate()); }
  catch { return hebDayFallback(date); }
}

/** כותרת "חודש שנה" בגימטריה, למשל "ניסן תשפ״ו" */
function hebMonthYearGem(hYear, hMonth) {
  return `${hebMonthName(hMonth)} ${numToGem(hYear)}`;
}

/** תאריך עברי מלא בגימטריה, למשל "יום שני, ט״ו ניסן תשפ״ו" */
function hebFullGem(date) {
  if (!HDateCtor) return hebFullStr(date);
  try {
    const hd  = new HDateCtor(date);
    const dow = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);
    return `${dow}, ${numToGem(hd.getDate())} ${hebMonthName(hd.getMonth())} ${numToGem(hd.getFullYear())}`;
  } catch { return hebFullStr(date); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hebrew calendar navigation
// ─────────────────────────────────────────────────────────────────────────────
function firstGregOfHebMonth(hYear, hMonth) {
  if (!HDateCtor) return new Date();
  return new HDateCtor(1, hMonth, hYear).greg();
}

function getHebDaysInMonth(hYear, hMonth) {
  if (!HDateCtor) return 30;
  try {
    const hd = new HDateCtor(1, hMonth, hYear);
    if (typeof hd.daysInMonth        === "function") return hd.daysInMonth();
    if (typeof HDateCtor.daysInMonth === "function") return HDateCtor.daysInMonth(hMonth, hYear);
    // fallback: try day 30
    return new HDateCtor(30, hMonth, hYear).getMonth() === hMonth ? 30 : 29;
  } catch { return 30; }
}

function addHebMonths(hYear, hMonth, delta) {
  if (!HDateCtor) return { year: hYear, month: hMonth };
  try {
    // חשבון ידני — מונע קפיצת שני חודשים כשה-add() של Hebcal מוסיף ימים במקום חודשים
    const monthsInYear = (yr) => {
      try {
        if (typeof HDateCtor.isLeapYear === "function") return HDateCtor.isLeapYear(yr) ? 13 : 12;
        return new HDateCtor(1, 7, yr).isLeapYear?.() ? 13 : 12;
      } catch { return 12; }
    };
    let y = hYear, m = hMonth;
    for (let i = 0; i < Math.abs(delta); i++) {
      if (delta > 0) {
        m++;
        if (m > monthsInYear(y)) {
          m = 1;   // אדר/אדר-ב' → ניסן — אותה שנה עברית
        } else if (m === 7) {
          y++;     // אלול → תשרי — שנה עברית חדשה
        }
      } else {
        m--;
        if (m === 0) {
          m = monthsInYear(y); // ניסן → אדר/אדר-ב' — אותה שנה עברית
        } else if (m === 6) {
          y--;     // תשרי → אלול — שנה עברית קודמת
        }
      }
    }
    return { year: y, month: m };
  } catch { return { year: hYear, month: hMonth }; }
}

function todayHebDate() {
  if (!HDateCtor) return null;
  try {
    const hd = new HDateCtor(new Date());
    return { year: hd.getFullYear(), month: hd.getMonth() };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sunrise / Sunset  (NOAA algorithm + optional Hebcal Zmanim)
// ─────────────────────────────────────────────────────────────────────────────

/** Pure-JS NOAA sunrise equation (accurate ~1-2 min for Israel) */
function calcSunTimes(date, lat, lng) {
  const toR = x => x * Math.PI / 180;
  const toD = x => x * 180 / Math.PI;

  const Y = date.getFullYear(), M = date.getMonth() + 1, D = date.getDate();
  const A  = Math.trunc((14 - M) / 12);
  const Yy = Y + 4800 - A, Mm = M + 12 * A - 3;
  // Julian Day Number (noon-based integer) — ללא -0.5 כדי לא לקזז 12 שעות
  const JD = D + Math.trunc((153 * Mm + 2) / 5) + 365 * Yy
           + Math.trunc(Yy / 4) - Math.trunc(Yy / 100)
           + Math.trunc(Yy / 400) - 32045;

  const n     = JD - 2451545.0;
  const Jstar = n - lng / 360;
  const Mval  = ((357.5291 + 0.98560028 * Jstar) % 360 + 360) % 360;
  const Mr    = toR(Mval);
  const C     = 1.9148 * Math.sin(Mr) + 0.020 * Math.sin(2*Mr) + 0.0003 * Math.sin(3*Mr);
  const lamR  = toR(((Mval + 102.9372 + C + 180) % 360 + 360) % 360);
  const Jtr   = 2451545.0 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lamR);

  const sinDec = Math.sin(lamR) * Math.sin(toR(23.4397));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH0  = (Math.sin(toR(-0.833)) - Math.sin(toR(lat)) * sinDec)
               / (Math.cos(toR(lat)) * cosDec);

  if (Math.abs(cosH0) > 1) return null; // polar
  const H0 = toD(Math.acos(cosH0));
  const jdMs = jd => new Date((jd - 2440587.5) * 86400000);

  return { sunrise: jdMs(Jtr - H0 / 360), sunset: jdMs(Jtr + H0 / 360) };
}

/** Try Hebcal Zmanim first, fall back to NOAA */
function getSunTimes(date, lat, lng) {
  const b = window.hebcal || window.Hebcal || null;
  const Z = b?.Zmanim || b?.default?.Zmanim;
  if (Z) {
    try {
      let z;
      try { z = new Z(date, lat, lng); } catch { z = new Z(false, date, lat, lng); }
      const sr = z?.sunrise?.(), ss = z?.sunset?.();
      if (sr instanceof Date && ss instanceof Date) return { sunrise: sr, sunset: ss };
    } catch {}
  }
  return calcSunTimes(date, lat, lng);
}

// ─────────────────────────────────────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_CITIES = [
  { name: "ירושלים", lat: 31.7683, lng: 35.2137 },
  { name: "תל אביב",  lat: 32.0853, lng: 34.7818 },
  { name: "חיפה",    lat: 32.7940, lng: 34.9896 },
  { name: "באר שבע", lat: 31.2518, lng: 34.7913 },
  { name: "אילת",    lat: 29.5577, lng: 34.9519 },
];
const DEFAULT_LOC = { lat: 31.7683, lng: 35.2137, name: "ירושלים" };

function loadLocation() {
  return loadJson(STORAGE.location, DEFAULT_LOC);
}
function saveLocation(lat, lng, name) {
  saveJson(STORAGE.location, { lat, lng, name, tz: "Asia/Jerusalem" });
  renderLocationStatus(name);
}
function renderLocationStatus(name) {
  if (els.locationStatus) els.locationStatus.textContent = name || "לא הוגדר";
}

/** מוצא את העיר הקרובה ביותר מתוך הרשימה המוגדרת */
function nearestCityName(lat, lng) {
  let best = PRESET_CITIES[0], bestDist = Infinity;
  for (const c of PRESET_CITIES) {
    const d = Math.hypot(c.lat - lat, c.lng - lng);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best.name;
}

/** Reverse geocoding דרך Nominatim (fallback: עיר קרובה מהרשימה) */
async function resolveLocationName(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`,
      { headers: { "Accept-Language": "he" } }
    );
    const j = await r.json();
    return j?.address?.city || j?.address?.town || j?.address?.village || null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────
function loadJson(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  ozEnabled: false, ozType: "all",
  day31Enabled: false, fullDayEnabled: false,
  fixedHaflagahMethod: "beit_yosef",  // ב״י | rashal | taz
  theme: "light",
  notificationsEnabled: false,
  notif1Name: "", notif2Name: "",
  reminderStartMin: 0, reminderEndMin: 30,
  notif1FixedTime: "", notif2FixedTime: "",
  notifSound: "default",
  // ── הפסק טהרה ──
  hefsekMinDay: 4,            // יום מינימלי להפסק (4/5/6/7)
  hefsekReminderMin: 30,      // דקות לפני שקיעה לתזכורת הפסק טהרה
  hefsekReminderTime: "",     // שעה קבועה לתזכורת הפסק (ריק = לפי דקות)
  hefsekMorningMin: 0,        // דקות אחרי זריחה לבדיקת בוקר
  hefsekMorningTime: "07:00", // שעה קבועה לבדיקת בוקר (גוברת על דקות)
  hefsekEveningMin: 30,       // דקות לפני שקיעה לבדיקת ערב
  hefsekEveningTime: "",      // שעה קבועה לבדיקת ערב (ריק = לפי דקות)
  hefsekMikvehReminder: true, // תזכורת טבילה ביום 7
  hefsekMikvehTime: "",       // שעה קבועה לתזכורת טבילה (ריק = לפי שקיעה)
};

function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, {}) };
}
function saveSettings(s) {
  saveJson(STORAGE.settings, s);
}

/** החלת ערכת נושא על ה-body */
function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-floral");
  if (theme && theme !== "dark") document.body.classList.add(`theme-${theme}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sound engine
// ─────────────────────────────────────────────────────────────────────────────
let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

/** מנגן צליל התראה לפי סוג */
function playNotificationSound(type) {
  if (!type || type === "default" || type === "silent") return;

  if (type === "custom") {
    const data = localStorage.getItem(STORAGE.soundData);
    if (data) {
      try { new Audio(data).play().catch(() => {}); } catch {}
    }
    return;
  }

  try {
    const ctx = _getAudioCtx();
    if (type === "bell") {
      // פעמון — גל סינוס עם דעיכה
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2);
    } else if (type === "chime") {
      // צלצול עדין — שני תדרים עוקבים
      [[880, 0, 1.2], [1320, 0.14, 1.1]].forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t); osc.stop(t + dur);
      });
    } else if (type === "beeps") {
      // שלוש פעימות קצרות
      [0, 0.22, 0.44].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660; osc.type = "square";
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.start(t); osc.stop(t + 0.14);
      });
    }
  } catch {}
}

/** בדיקת התראות יומית — מופעלת פעם אחת בעליית האפליקציה */
function checkDailyNotifications() {
  // בדפדפנים שלא תומכים ב-Notifications — יציאה שקטה
  if (!("Notification" in window)) return;
  if (!state.settings?.notificationsEnabled) return;
  if (Notification.permission !== "granted") return;

  const now      = new Date();
  const todayKey = isoKey(now);

  // טעינת רשומת "מה נשלח היום" — { "YYYY-MM-DD": ["id1","id2",...] }
  let sentLog = {};
  try { sentLog = JSON.parse(localStorage.getItem(STORAGE.lastNotification) || "{}"); } catch {}
  // ניקוי תאריכים ישנים
  for (const k of Object.keys(sentLog)) { if (k !== todayKey) delete sentLog[k]; }
  if (!sentLog[todayKey]) sentLog[todayKey] = [];
  const sentSet = new Set(sentLog[todayKey]);

  const saveSent = () => {
    sentLog[todayKey] = [...sentSet];
    localStorage.setItem(STORAGE.lastNotification, JSON.stringify(sentLog));
  };

  const loc = loadLocation();
  const sun = getSunTimes(now, loc.lat, loc.lng);
  if (!sun) return;

  const { sunrise, sunset } = sun;

  /** שליחת התראה אחת (אם לא נשלחה עדיין) */
  const send = (id, title, body) => {
    if (sentSet.has(id)) return;
    try {
      const soundType = state.settings.notifSound || "default";
      const notifOpts = { body, icon: "./icon.svg", lang: "he", dir: "rtl" };
      // כשמנגנים צליל מותאם — מושתקים את צליל המערכת
      if (soundType !== "default") notifOpts.silent = true;
      new Notification(`טהרת אסתר — ${title}`, notifOpts);
      playNotificationSound(soundType);
      sentSet.add(id);
      saveSent();
    } catch {}
  };

  /** תזמון התראה — מיידית אם הזמן כבר עבר, אחרת setTimeout */
  const scheduleAt = (targetTime, id, title, body) => {
    const delay = targetTime.getTime() - now.getTime();
    if (delay < -60_000) return;          // עבר לפני יותר מדקה — דלג
    if (delay > 20 * 3_600_000) return;   // רחוק מדי (מעבר ל-20 שעות)
    if (delay <= 0) {
      send(id, title, body);
    } else {
      setTimeout(() => send(id, title, body), delay);
    }
  };

  // ── תזכורות וסת (רק אם יש marks ווסת להיום) ──
  const { marks } = computeMarks();
  const todayMarks = (marks[todayKey] || []).filter(m => m.cat === "veset");
  if (todayMarks.length) {
    const startMin   = state.settings.reminderStartMin ?? 0;
    const endMin     = state.settings.reminderEndMin   ?? 30;
    const fixedTime1 = state.settings.notif1FixedTime || state.settings.reminderFixedTime || "";
    const fixedTime2 = state.settings.notif2FixedTime || "";
    const label1     = state.settings.notif1Name || "תחילת עונת פרישה";
    const label2     = state.settings.notif2Name || "זמן לבדיקה";
    const marksStr   = todayMarks.map(m => m.label).join(", ");

    // ── תזכורת ראשונה: פתיחת עונה ──
    if (fixedTime1) {
      const [hh, mm] = fixedTime1.split(":").map(Number);
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
      scheduleAt(t, `fixed1-${fixedTime1}`, label1, marksStr);
    } else {
      scheduleAt(
        new Date(sunrise.getTime() - startMin * 60_000),
        "sr-start", label1,
        `זריחה בשעה ${formatILTime(sunrise)} — ${marksStr}`
      );
      scheduleAt(
        new Date(sunset.getTime() - startMin * 60_000),
        "ss-start", label1,
        `שקיעה בשעה ${formatILTime(sunset)} — ${marksStr}`
      );
    }

    // ── תזכורת שנייה: זמן לבדיקה ──
    if (fixedTime2) {
      const [hh, mm] = fixedTime2.split(":").map(Number);
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
      scheduleAt(t, `fixed2-${fixedTime2}`, label2, marksStr);
    } else {
      scheduleAt(
        new Date(sunrise.getTime() - endMin * 60_000),
        "sr-end", label2,
        `עוד ${endMin} דק׳ עד הזריחה — ${marksStr}`
      );
      scheduleAt(
        new Date(sunset.getTime() - endMin * 60_000),
        "ss-end", label2,
        `עוד ${endMin} דק׳ עד השקיעה — ${marksStr}`
      );
    }
  }

  // ── תזכורת הפסק טהרה ──
  const vestList = getSortedEntries();
  const lastVest = vestList[0];
  if (lastVest) {
    const eligibleDate = getHefsekEligibleDate(lastVest.iso);
    const vestDate     = parseIsoKey(lastVest.iso);
    if (eligibleDate && now >= eligibleDate) {
      const hasValidHefsek = Object.entries(state.entries || {}).some(([iso, rec]) => {
        if (rec?.hefsek !== "ok") return false;
        const d = parseIsoKey(iso);
        return d && vestDate && d > vestDate;
      });
      if (!hasValidHefsek) {
        const fixedT = state.settings.hefsekReminderTime || "";
        let hefsekT;
        if (fixedT) {
          const [hh, mm] = fixedT.split(":").map(Number);
          hefsekT = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
        } else {
          hefsekT = new Date(sunset.getTime() - (state.settings.hefsekReminderMin ?? 30) * 60_000);
        }
        scheduleAt(hefsekT, `hefsek-reminder-${todayKey}`, "הפסק טהרה", "הגיע הזמן לעשות הפסק טהרה לפני השקיעה");
      }
    }
  }

  // ── תזכורות שבעה נקיים ──
  const nekiimDay = isShivaNekiimDay(todayKey);
  if (nekiimDay) {
    // בדיקת בוקר — שעה קבועה גוברת על דקות אחרי זריחה
    let morningT;
    const morningFixed = state.settings.hefsekMorningTime || "";
    if (morningFixed) {
      const [hh, mm] = morningFixed.split(":").map(Number);
      morningT = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    } else {
      morningT = new Date(sunrise.getTime() + (state.settings.hefsekMorningMin ?? 0) * 60_000);
    }
    scheduleAt(morningT, `nekiim-morning-${todayKey}`, `בדיקת בוקר (יום ${nekiimDay})`, "בוקר טוב, לא לשכוח בדיקת בוקר של שבעה נקיים");

    // בדיקת ערב — שעה קבועה גוברת על דקות לפני שקיעה
    let eveningT;
    const eveningFixed = state.settings.hefsekEveningTime || "";
    if (eveningFixed) {
      const [hh, mm] = eveningFixed.split(":").map(Number);
      eveningT = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    } else {
      eveningT = new Date(sunset.getTime() - (state.settings.hefsekEveningMin ?? 30) * 60_000);
    }
    scheduleAt(eveningT, `nekiim-evening-${todayKey}`, `בדיקת ערב (יום ${nekiimDay})`, "לא לשכוח בדיקת ערב לפני השקיעה");

    // ── תזכורת טבילה — רק ביום 7 ──
    if (nekiimDay === 7 && state.settings.hefsekMikvehReminder !== false) {
      const mikvehTime = state.settings.hefsekMikvehTime || "";
      let mikvehT;
      if (mikvehTime) {
        const [hh, mm] = mikvehTime.split(":").map(Number);
        mikvehT = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
      } else {
        mikvehT = new Date(sunset);
      }
      scheduleAt(
        mikvehT,
        `mikveh-${todayKey}`,
        "ערב טבילה",
        "היום בערב טבילה."
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Popover
// ─────────────────────────────────────────────────────────────────────────────
let popoverAnchorRect = null;

function closePopover() {
  els.popover.hidden = true;
  els.popoverTitle.textContent = "";
  els.popoverBody.textContent  = "";
  els.popoverActions.innerHTML = "";
  popoverAnchorRect = null;
}

function positionPopover() {
  if (els.popover.hidden || !popoverAnchorRect) return;
  const card = els.popover.querySelector(".popover__card");
  if (!card) return;
  const pad = 10, vw = window.innerWidth, vh = window.innerHeight;
  const cr = card.getBoundingClientRect();
  let left = popoverAnchorRect.left;
  let top  = popoverAnchorRect.bottom + 8;
  if (left + cr.width  + pad > vw) left = vw - cr.width  - pad;
  if (left < pad) left = pad;
  if (top  + cr.height + pad > vh) top  = popoverAnchorRect.top - cr.height - 8;
  if (top  < pad) top  = pad;
  card.style.left = `${Math.round(left)}px`;
  card.style.top  = `${Math.round(top)}px`;
}

function openPopover({ title, bodyText, bodyHTML, actions, anchorRect }) {
  els.popoverTitle.textContent = title || "";
  if (bodyHTML) {
    els.popoverBody.innerHTML = bodyHTML;
  } else {
    els.popoverBody.textContent  = bodyText || "";
  }
  els.popoverActions.innerHTML = "";
  popoverAnchorRect = anchorRect || null;
  for (const a of actions || []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = a.className || "btn";
    btn.textContent = a.label;
    // onClick רץ לפני closePopover כדי לאפשר קריאת ערכי textarea
    btn.addEventListener("click", () => { a.onClick?.(); closePopover(); });
    els.popoverActions.appendChild(btn);
  }
  els.popover.hidden = false;
  requestAnimationFrame(positionPopover);
}

function isClickInsidePopover(target) {
  const card = els.popover.querySelector(".popover__card");
  return card ? card.contains(target) : false;
}

document.addEventListener("click", (e) => {
  if (els.popover.hidden) return;
  if (e.target?.getAttribute?.("data-popover-close") === "1") return closePopover();
  if (!isClickInsidePopover(e.target)) closePopover();
});
window.addEventListener("keydown",  e => { if (e.key === "Escape" && !els.popover.hidden) closePopover(); });
window.addEventListener("resize",   () => positionPopover());
window.addEventListener("scroll",   () => positionPopover(), true);

// ─────────────────────────────────────────────────────────────────────────────
// App state
// ─────────────────────────────────────────────────────────────────────────────
//
// מבנה רשומת יום ב-state.entries[isoKey]:
//   tod?:           "day" | "night"          — ראיית וסת
//   feelings?:      string                   — הערת תחושות
//   hefsek?:        "ok" | "fail"            — תוצאת הפסק טהרה
//   shivaNekiimDay?: 1–7                     — מספר יום בז׳ נקיים
//   checkMorning?:  "ok" | "fail"            — בדיקת בוקר בז׳ נקיים
//   checkEvening?:  "ok" | "fail"            — בדיקת ערב בז׳ נקיים
//   updatedAt:      number                   — timestamp
//
let state = {
  viewHYear:   null,
  viewHMonth:  null,
  selectedIso: null,
  entries:     loadJson(STORAGE.entries, {}),
  settings:    loadSettings(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Entry helpers
// ─────────────────────────────────────────────────────────────────────────────
function getSortedEntries() {
  const list = [];
  for (const [iso, rec] of Object.entries(state.entries || {})) {
    if (!rec || (rec.tod !== "day" && rec.tod !== "night")) continue;
    const dt = parseIsoKey(iso);
    if (dt) list.push({ iso, date: dt, tod: rec.tod, updatedAt: Number(rec.updatedAt) || 0 });
  }
  return list.sort((a, b) => b.date - a.date);
}
function adjustForNight(date, tod) {
  return tod !== "night" ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// הפסק טהרה — חישובים
// ─────────────────────────────────────────────────────────────────────────────

/**
 * מחזיר את התאריך המוקדם ביותר שבו מותר לעשות הפסק טהרה.
 * @param {string} vestIsoKey  — מפתח ISO של יום תחילת הווסת
 * @returns {Date|null}
 */
function getHefsekEligibleDate(vestIsoKey) {
  const vestDate = parseIsoKey(vestIsoKey);
  if (!vestDate) return null;
  const minDay = state.settings?.hefsekMinDay ?? 4;
  // יום 1 = יום הווסת עצמו, ולכן מוסיפים (minDay - 1) ימים
  return new Date(vestDate.getFullYear(), vestDate.getMonth(), vestDate.getDate() + (minDay - 1));
}

/**
 * מחפש את ההפסק הטהרה האחרון שהצליח ובודק שהספירה לא נשברה אחריו.
 * ספירה "נשברה" אם באחד מ-7 הימים שלאחר ההפסק יש:
 *   - ראיית ווסת (tod: "day" | "night")
 *   - בדיקת בוקר או ערב שנכשלה (checkMorning/checkEvening: "fail")
 * @returns {{ start: Date, end: Date, hefsekIso: string }|null}
 *   start  = יום 1 (מחרת ההפסק), end = יום 7, hefsekIso = תאריך ההפסק עצמו
 */
function getShivaNekiimRange() {
  // מיון רשומות לפי תאריך, מהחדש לישן
  const sorted = Object.entries(state.entries || {})
    .map(([iso, rec]) => ({ iso, rec }))
    .filter(({ iso }) => parseIsoKey(iso) !== null)
    .sort((a, b) => parseIsoKey(b.iso) - parseIsoKey(a.iso));

  // מציאת ההפסק האחרון שהצליח
  const hefsekEntry = sorted.find(({ rec }) => rec?.hefsek === "ok");
  if (!hefsekEntry) return null;

  const hefsekDate = parseIsoKey(hefsekEntry.iso);
  if (!hefsekDate) return null;

  // 7 ימי ספירה: מחרת ההפסק (יום 1) עד יום 7
  for (let i = 1; i <= 7; i++) {
    const d   = new Date(hefsekDate.getFullYear(), hefsekDate.getMonth(), hefsekDate.getDate() + i);
    const key = isoKey(d);
    const rec = state.entries?.[key];
    if (!rec) continue;
    // ראיית ווסת — שוברת את הספירה
    if (rec.tod === "day" || rec.tod === "night") return null;
    // בדיקה שנכשלה — שוברת את הספירה
    if (rec.checkMorning === "fail" || rec.checkEvening === "fail") return null;
  }

  const start = new Date(hefsekDate.getFullYear(), hefsekDate.getMonth(), hefsekDate.getDate() + 1);
  const end   = new Date(hefsekDate.getFullYear(), hefsekDate.getMonth(), hefsekDate.getDate() + 7);
  return { start, end, hefsekIso: hefsekEntry.iso };
}

/**
 * בודק אם תאריך נתון נמצא בתוך ז׳ נקיים פעילים.
 * @param {string} isoKeyParam  — מפתח ISO של התאריך לבדיקה
 * @returns {number|null}  — מספר היום (1–7) או null אם אינו בתוך הטווח
 */
function isShivaNekiimDay(isoKeyParam) {
  const range = getShivaNekiimRange();
  if (!range) return null;
  const d = parseIsoKey(isoKeyParam);
  if (!d) return null;
  const startMs = range.start.getTime();
  const endMs   = range.end.getTime();
  const dMs     = d.getTime();
  if (dMs < startMs || dMs > endMs) return null;
  return Math.round((dMs - startMs) / 86400000) + 1; // 1 = יום ראשון
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculations (marks + summary)
// ─────────────────────────────────────────────────────────────────────────────
/** מחזיר תאריך גרגוריאני יום אחד לפני — עבור חישוב אור זרוע */
function prevDay(greg) {
  return new Date(greg.getFullYear(), greg.getMonth(), greg.getDate() - 1);
}

/**
 * מחזיר כמה חודשים עבריים יש בין שני HDate (שניהם מאותו יום בחודש).
 * hdOlder < hdNewer. מקסימום 24 חודשים.
 */
function hebMonthsApart(hdOlder, hdNewer) {
  let k = 0;
  let cur = { year: hdOlder.getFullYear(), month: hdOlder.getMonth() };
  const tgtY = hdNewer.getFullYear(), tgtM = hdNewer.getMonth();
  while (k <= 24) {
    if (cur.year === tgtY && cur.month === tgtM) return k;
    cur = addHebMonths(cur.year, cur.month, 1);
    k++;
  }
  return -1; // לא נמצא בטווח
}

/**
 * בודק אם 3 הרשומות האחרונות קובעות וסת קבוע.
 * תנאים: 3 ראיות רצופות באותה עונה (יום/לילה), ואותו יום עברי לחודש / אותו הפרש.
 * @param {Array} entries — מיון מחדש לישן (כל הרשומות)
 * @returns {{ type:"month", hDay:number, tod:string }
 *          |{ type:"haflagah", interval:number, tod:string }
 *          |null}
 */
function detectFixedVeset(entries) {
  if (!HDateCtor || entries.length < 3) return null;
  const [e0, e1, e2] = entries; // e0 = חדשה ביותר

  // כל 3 חייבות להיות באותה עונה
  if (e0.tod !== e1.tod || e1.tod !== e2.tod) return null;

  try {
    const hd0 = new HDateCtor(e0.date);
    const hd1 = new HDateCtor(e1.date);
    const hd2 = new HDateCtor(e2.date);

    // וסת חודש קבוע: אותו יום עברי בחודשים עוקבים (הפרש חודש אחד בין כל שתיים)
    if (hd0.getDate() === hd1.getDate() && hd1.getDate() === hd2.getDate()) {
      const m21 = hebMonthsApart(hd2, hd1);
      const m10 = hebMonthsApart(hd1, hd0);
      if (m21 === 1 && m10 === 1) {
        return { type: "month", hDay: hd0.getDate(), tod: e0.tod };
      }
    }

    // וסת הפלגה קבוע: אותו הפרש בין כל שתי ראיות עוקבות
    const int01 = hd0.abs() - hd1.abs(); // חיובי: e0 מאוחרת מ-e1
    const int12 = hd1.abs() - hd2.abs();
    if (int01 > 0 && int01 === int12) {
      return { type: "haflagah", interval: int01 + 1, tod: e0.tod };
    }
  } catch {}

  return null;
}

/**
 * מזהה דפוסי וסת פחות-מצויים: דילוג (חודש/הפלגה), ימי שבוע, סירוג.
 * מחזיר מערך של דפוסים שנמצאו — כל אחד הוא חשש נוסף (לא מבטל את הרגילים).
 * @param {Array} entries — מיון מחדש לישן
 * @returns {Array<{ type, ... }>}
 */
function detectRareVesetPatterns(entries) {
  if (!HDateCtor || entries.length < 3) return [];
  const [e0, e1, e2] = entries;

  // כל הדפוסים: אותה עונה
  if (e0.tod !== e1.tod || e1.tod !== e2.tod) return [];

  const results = [];

  try {
    const hd0 = new HDateCtor(e0.date);
    const hd1 = new HDateCtor(e1.date);
    const hd2 = new HDateCtor(e2.date);

    const int01 = hd0.abs() - hd1.abs(); // הפרש גולמי (חיובי)
    const int12 = hd1.abs() - hd2.abs();

    const m10 = hebMonthsApart(hd1, hd0); // חודשים בין hd1 ל-hd0
    const m21 = hebMonthsApart(hd2, hd1); // חודשים בין hd2 ל-hd1

    const d0 = hd0.getDate(), d1 = hd1.getDate(), d2 = hd2.getDate();

    // ── 1. וסת החודש בדילוג ──
    // חודשים עוקבים + הפרש יום קבוע ושונה מאפס
    if (m10 === 1 && m21 === 1) {
      const diff01 = d0 - d1, diff12 = d1 - d2;
      if (diff01 === diff12 && diff01 !== 0) {
        const nextDay   = d0 + diff01;
        const nextMInfo = addHebMonths(hd0.getFullYear(), hd0.getMonth(), 1);
        const maxDay    = getHebDaysInMonth(nextMInfo.year, nextMInfo.month);
        // אם יום מחוץ לטווח → קפוץ לא' של החודש שאחריו
        let nextHd;
        if (nextDay < 1) {
          const prevM = addHebMonths(nextMInfo.year, nextMInfo.month, -1);
          nextHd = new HDateCtor(getHebDaysInMonth(prevM.year, prevM.month), prevM.month, prevM.year);
        } else if (nextDay > maxDay) {
          const skip = addHebMonths(nextMInfo.year, nextMInfo.month, 1);
          nextHd = new HDateCtor(1, skip.month, skip.year);
        } else {
          nextHd = new HDateCtor(nextDay, nextMInfo.month, nextMInfo.year);
        }
        results.push({ type: "dilug_month", diff: diff01, nextHd });
      }
    }

    // ── 2. וסת ההפלגה בדילוג ──
    // הפרש בין ההפלגות קבוע ושונה מאפס (int01 ≠ int12)
    if (int01 > 0 && int12 > 0 && int01 !== int12) {
      const step = int01 - int12; // סטפ חיובי = הפלגה גדלה; שלילי = מתקצרת
      const nextRaw = int01 + step;
      if (nextRaw > 0) {
        const nextHd = hd0.add(nextRaw, "d");
        results.push({ type: "dilug_haflagah", step, interval: int01 + 1, nextHd });
      }
    }

    // ── 3. וסת ימי השבוע ──
    // אותו יום בשבוע, הפרש שווה וכפולה של 7
    const dow0 = e0.date.getDay(), dow1 = e1.date.getDay(), dow2 = e2.date.getDay();
    if (dow0 === dow1 && dow1 === dow2 && int01 === int12 && int01 > 0 && int01 % 7 === 0) {
      const weekNames = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
      const nextHd = hd0.add(int01, "d");
      results.push({ type: "weekly", dayName: weekNames[dow0], weeksInterval: int01 / 7, nextHd });
    }

    // ── 4. וסת הסירוג ──
    // אותו יום עברי, הפרש 2 חודשים עבריים בין כל זוג
    if (d0 === d1 && d1 === d2 && m10 === 2 && m21 === 2) {
      const nextMInfo = addHebMonths(hd0.getFullYear(), hd0.getMonth(), 2);
      const maxDay    = getHebDaysInMonth(nextMInfo.year, nextMInfo.month);
      const nextHd    = d0 <= maxDay
        ? new HDateCtor(d0, nextMInfo.month, nextMInfo.year)
        : new HDateCtor(maxDay, nextMInfo.month, nextMInfo.year);
      results.push({ type: "sirug", hDay: d0, nextHd });
    }

  } catch {}

  return results;
}

/**
 * חישוב המועד הצפוי ה-k של וסת קבוע, החל מ-baseHd.
 * @param {Object} fixed   — { type, hDay?, interval? }
 * @param {HDate}  baseHd  — HDate של הרשומה האחרונה שאישרה את הוסת
 * @param {number} k       — מספר ההיקרות (1, 2, 3, ...)
 * @returns {Date|null}    — תאריך גרגוריאני
 */
function computeExpectedOccurrence(fixed, baseHd, k) {
  try {
    if (fixed.type === "month") {
      const nm       = addHebMonths(baseHd.getFullYear(), baseHd.getMonth(), k);
      const daysInNm = getHebDaysInMonth(nm.year, nm.month);
      let occ;
      if (fixed.hDay > daysInNm) {
        const skip = addHebMonths(nm.year, nm.month, 1);
        occ = new HDateCtor(1, skip.month, skip.year);
      } else {
        occ = new HDateCtor(fixed.hDay, nm.month, nm.year);
      }
      return occ.greg();
    } else {
      return baseHd.add((fixed.interval - 1) * k, "d").greg();
    }
  } catch { return null; }
}

/**
 * מנתח את המצב ההלכתי המלא של הוסת על סמך כל ההיסטוריה:
 *   "fixed"   — 3 הרשומות האחרונות קובעות וסת קבוע
 *   "changed" — וסת קבוע פעיל מהעבר, אך הראיה האחרונה שונה; טרם נעקר
 *   "none"    — אין וסת קבוע (לא נקבע / נעקר)
 *
 * עקירה: וסת קבוע נעקר אחרי 3 פעמים רצופות שהגיע ולא ראתה.
 * חזרה: אם ראתה בזמן הקבוע לפני 3 פוספוסים — חוזרת לוסת הקבוע.
 *
 * @param {Array} entries — מיון מחדש לישן
 * @returns {{ mode, fixed?, confirmedBaseHd?, missedCount? }}
 */
function getActiveVesetState(entries) {
  if (!HDateCtor) return { mode: "none" };

  // בדיקה מהירה: 3 האחרונות = וסת קבוע?
  if (entries.length >= 3) {
    const quick = detectFixedVeset(entries);
    if (quick) return { mode: "fixed", fixed: quick };
  }

  // חיפוש החלון הכי-חדש שיצר וסת קבוע בהיסטוריה
  let estFixed  = null;
  let estBaseHd = null;

  for (let i = 0; i <= entries.length - 3; i++) {
    const f = detectFixedVeset([entries[i], entries[i + 1], entries[i + 2]]);
    if (f) {
      estFixed  = f;
      estBaseHd = new HDateCtor(entries[i].date); // הרשומה החדשה ביותר בחלון
      break;
    }
  }

  if (!estFixed) return { mode: "none" };

  // סימולציה קדימה מהבסיס — ספירת פוספוסים וחזרות
  const today  = startOfDay(new Date());
  const isoSet = new Set(entries.map(e => e.iso));
  let baseHd   = estBaseHd;
  let missed   = 0;
  let k        = 1;

  while (true) {
    const expGreg = computeExpectedOccurrence(estFixed, baseHd, k);
    if (!expGreg || expGreg > today) break;

    if (isoSet.has(isoKey(expGreg))) {
      // ראתה בזמן הקבוע — אישור, מאפסים
      baseHd = new HDateCtor(expGreg);
      missed = 0;
      k      = 1;
    } else {
      missed++;
      if (missed >= 3) return { mode: "none" }; // נעקר
      k++;
    }
  }

  // עדיין פעיל: הראיה האחרונה (entries[0]) שונה מהוסת הקבוע
  return { mode: "changed", fixed: estFixed, confirmedBaseHd: baseHd, missedCount: missed };
}

/**
 * מחשב וסת החודש עבור חודש מסוים (עם טיפול במקרה קצה של חודש חסר).
 */
function monthVesetForOffset(currHd, offsetMonths) {
  const nm        = addHebMonths(currHd.getFullYear(), currHd.getMonth(), offsetMonths);
  const daysInNm  = getHebDaysInMonth(nm.year, nm.month);
  if (currHd.getDate() > daysInNm) {
    const skip = addHebMonths(nm.year, nm.month, 1);
    return new HDateCtor(1, skip.month, skip.year);
  }
  return new HDateCtor(currHd.getDate(), nm.month, nm.year);
}

function computeMarks() {
  if (!HDateCtor) return { marks: {}, summary: "כדי לראות חישובים יש לאפשר טעינת הספרייה (CDN)." };
  const entries = getSortedEntries();           // כל הרשומות, מחדש לישן
  const [current, previous] = entries;
  if (!current) return { marks: {}, summary: "לחצו על תאריך כדי לרשום יום/לילה." };

  const oz      = state.settings?.ozEnabled;
  const ozType  = state.settings?.ozType || "all";
  const day31   = state.settings?.day31Enabled;
  const fullDay = state.settings?.fullDayEnabled;

  const currHd = new HDateCtor(current.date);

  const marks = {};
  const mark = (iso, label, cat = "veset") => {
    if (!marks[iso]) marks[iso] = [];
    marks[iso].push({ label, cat });
  };

  /** סימון יום פרישה + לילה מוקדם (אם fullDay) + אור זרוע (אם oz) */
  function markVesetDay(greg, label, ozLabel) {
    if (fullDay) mark(isoKey(prevDay(greg)), label);
    mark(isoKey(greg), label);
    if (oz && ozLabel) mark(isoKey(prevDay(greg)), ozLabel);
  }

  let sum = `רשומה אחרונה: ${hebFullGem(current.date)} — ${current.tod === "night" ? "לילה" : "יום"}`;

  // ══════════════════════════════════════════════════════════════
  // ניתוח מצב הוסת (קבוע / שינוי / ללא)
  // ══════════════════════════════════════════════════════════════
  const vesetState = getActiveVesetState(entries);

  // ── עזר: סימון 3 הופעות של וסת קבוע ──
  function markFixedOccurrences(fixed, baseHd) {
    const isMonth  = fixed.type === "month";
    const step     = isMonth ? null : fixed.interval - 1;
    for (let i = 1; i <= 3; i++) {
      let occGreg;
      if (isMonth) {
        occGreg = monthVesetForOffset(baseHd, i).greg();
      } else {
        occGreg = baseHd.add(step * i, "d").greg();
      }
      const typeName = isMonth ? "חודש" : "הפלגה";
      const lbl    = `וסת ה${typeName} הקבוע (${i}/3)`;
      const ozLbl  = oz && ozType !== "beinonit" ? `אור זרוע (${typeName} ${i}/3)` : null;
      markVesetDay(occGreg, lbl, ozLbl);
      sum += `\n${lbl}: ${hebFullGem(occGreg)}`;
      if (oz && ozLbl) sum += `\n${ozLbl}: ${hebFullGem(prevDay(occGreg))}`;
    }
    // הפלגה > 30: עונה בינונית (ברירת מחדל: חומרה; ויש מקילים)
    if (!isMonth && fixed.interval > 30) {
      const rule1   = new HDateCtor(entries[0].date).add(29, "d");
      const ozBLbl  = oz ? "אור זרוע (בינונית)" : null;
      markVesetDay(rule1.greg(), "עונה בינונית", ozBLbl);
      sum += `\nעונה בינונית: ${hebFullGem(rule1.greg())} (הפלגה מעל ל׳)`;
      if (oz && ozBLbl) sum += `\n${ozBLbl}: ${hebFullGem(prevDay(rule1.greg()))}`;
    }
  }

  if (vesetState.mode === "fixed") {
    // ══════════════════════════════════════════════════════════════
    // וסת קבוע — 3 הופעות קדימה בלבד
    // ══════════════════════════════════════════════════════════════
    const { fixed } = vesetState;
    const fixedDesc = fixed.type === "month"
      ? `וסת החודש הקבוע — ${numToGem(fixed.hDay)} לחודש`
      : `וסת ההפלגה הקבוע — ${fixed.interval} ימים`;
    sum += `\n\n▪ ${fixedDesc}`;
    markFixedOccurrences(fixed, currHd);

  } else if (vesetState.mode === "changed") {
    // ══════════════════════════════════════════════════════════════
    // שינוי מוסת קבוע — חוששת גם לקבוע וגם לחדש (ללא עונה בינונית)
    // ══════════════════════════════════════════════════════════════
    const { fixed, confirmedBaseHd, missedCount } = vesetState;
    const fixedDesc = fixed.type === "month"
      ? `וסת החודש הקבוע — ${numToGem(fixed.hDay)} לחודש`
      : `וסת ההפלגה הקבוע — ${fixed.interval} ימים`;
    sum += `\n\n▪ שינוי מוסת קבוע (${fixedDesc}, פוספס ${missedCount}/3)`;

    // א. הוסת הקבוע הישן — עדיין בתוקף, חוששת לו
    if (fixed.type === "month") {
      // וסת חודש: אותו יום עברי לחודש, ללא קשר למחלוקת
      sum += `\nחשש לוסת החודש הקבוע (${numToGem(fixed.hDay)} לחודש, טרם נעקר):`;
      markFixedOccurrences(fixed, confirmedBaseHd);

    } else {
      // וסת הפלגה: חישוב לפי שיטת הפוסק
      const method        = state.settings?.fixedHaflagahMethod || "beit_yosef";
      const step          = fixed.interval - 1;
      const lastMissedGreg = computeExpectedOccurrence(fixed, confirmedBaseHd, missedCount);
      const lastMissedHd   = lastMissedGreg ? new HDateCtor(lastMissedGreg) : null;

      sum += `\nחשש לוסת ההפלגה הקבוע (${fixed.interval} ימים, פוספס ${missedCount}/3):`;

      if ((method === "beit_yosef" || method === "taz") && lastMissedHd) {
        // ב״י: סופרת מיום הקביעות המקורי (היום שהיה אמור)
        sum += `\n  ב״י — מיום ${hebFullGem(lastMissedGreg)}:`;
        for (let i = 1; i <= 3; i++) {
          const occGreg = lastMissedHd.add(step * i, "d").greg();
          const lbl     = `ב״י — הפלגה קבועה (${i}/3)`;
          const ozLbl   = oz && ozType !== "beinonit" ? `אור זרוע (ב״י ${i}/3)` : null;
          markVesetDay(occGreg, lbl, ozLbl);
          sum += `\n  ${lbl}: ${hebFullGem(occGreg)}`;
          if (oz && ozLbl) sum += `\n  ${ozLbl}: ${hebFullGem(prevDay(occGreg))}`;
        }
      }

      if (method === "rashal" || method === "taz") {
        // רש״ל: סופרת מיום הראיה האחרונה בפועל
        sum += `\n  רש״ל — מיום ${hebFullGem(current.date)}:`;
        for (let i = 1; i <= 3; i++) {
          const occGreg = currHd.add(step * i, "d").greg();
          const lbl     = `רש״ל — הפלגה קבועה (${i}/3)`;
          const ozLbl   = oz && ozType !== "beinonit" ? `אור זרוע (רש״ל ${i}/3)` : null;
          markVesetDay(occGreg, lbl, ozLbl);
          sum += `\n  ${lbl}: ${hebFullGem(occGreg)}`;
          if (oz && ozLbl) sum += `\n  ${ozLbl}: ${hebFullGem(prevDay(occGreg))}`;
        }
      }
    }

    // ב. ראיה חדשה — וסת החודש + הפלגה (ללא עונה בינונית!)
    sum += `\nחשש מהראיה החדשה (${current.tod === "night" ? "לילה" : "יום"} ${hebFullGem(current.date)}):`;

    // וסת החודש
    const rule2   = monthVesetForOffset(currHd, 1);
    const ozChLbl = oz && ozType !== "beinonit" ? "אור זרוע (חודש)" : null;
    markVesetDay(rule2.greg(), "וסת החודש", ozChLbl);
    sum += `\nוסת החודש: ${hebFullGem(rule2.greg())}`;
    if (oz && ozChLbl) sum += `\n${ozChLbl}: ${hebFullGem(prevDay(rule2.greg()))}`;

    // וסת ההפלגה
    if (previous) {
      const prevHd   = new HDateCtor(previous.date);
      const interval = Math.abs(currHd.abs() - prevHd.abs()) + 1;
      const rule3    = currHd.add(interval - 1, "d");
      const ozHfLbl  = oz && ozType !== "beinonit" ? "אור זרוע (הפלגה)" : null;
      markVesetDay(rule3.greg(), "וסת ההפלגה", ozHfLbl);
      sum += `\nוסת ההפלגה: ${interval} ימים → ${hebFullGem(rule3.greg())}`;
      if (oz && ozHfLbl) sum += `\n${ozHfLbl}: ${hebFullGem(prevDay(rule3.greg()))}`;
    }
    // ← אין עונה בינונית! הוסת הקבוע פוטר ממנה

  } else {
    // ══════════════════════════════════════════════════════════════
    // וסת שאינו קבוע — 3 חישובים רגילים
    // ══════════════════════════════════════════════════════════════
    const rule1 = currHd.add(29, "d"); // עונה בינונית (יום 30)

    // וסת החודש — אותו יום עברי בחודש הבא
    const rule2 = monthVesetForOffset(currHd, 1);

    // ── עונה בינונית ──
    markVesetDay(rule1.greg(), "עונה בינונית", oz ? "אור זרוע (בינונית)" : null);

    // ── חומרת יום ל״א ──
    if (day31) {
      const rule1_31 = currHd.add(30, "d");
      markVesetDay(rule1_31.greg(), "עונה בינונית (ל״א)", oz ? "אור זרוע (ל״א)" : null);
    }

    // ── וסת החודש ──
    const ozChLabel = oz && ozType !== "beinonit" ? "אור זרוע (חודש)" : null;
    markVesetDay(rule2.greg(), "וסת החודש", ozChLabel);

    // ── סיכום ──
    sum += `\nעונה בינונית: ${hebFullGem(rule1.greg())}`;
    if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule1.greg()))})`;
    if (day31) {
      const rule1_31 = currHd.add(30, "d");
      sum += `\nחומרת יום ל״א: ${hebFullGem(rule1_31.greg())}`;
      if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule1_31.greg()))})`;
    }
    sum += `\nוסת החודש: ${hebFullGem(rule2.greg())}`;
    if (oz) {
      sum += `\nאור זרוע (בינונית): ${hebFullGem(prevDay(rule1.greg()))}`;
      if (ozType !== "beinonit") sum += `\nאור זרוע (חודש): ${hebFullGem(prevDay(rule2.greg()))}`;
    }

    // ── וסת ההפלגה ──
    if (previous) {
      const prevHd   = new HDateCtor(previous.date);
      const interval = Math.abs(currHd.abs() - prevHd.abs()) + 1;
      const rule3    = currHd.add(Math.max(0, interval - 1), "d");
      const ozHfLbl  = oz && ozType !== "beinonit" ? "אור זרוע (הפלגה)" : null;
      markVesetDay(rule3.greg(), "וסת ההפלגה", ozHfLbl);
      sum += `\nרשומה קודמת: ${hebFullGem(previous.date)} — ${previous.tod === "night" ? "לילה" : "יום"}`;
      sum += `\nוסת ההפלגה: ${interval} ימים → ${hebFullGem(rule3.greg())}`;
      if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule3.greg()))})`;
      if (oz && ozHfLbl) sum += `\nאור זרוע (הפלגה): ${hebFullGem(prevDay(rule3.greg()))}`;
    } else {
      sum += `\nוסת ההפלגה: הוסיפו גם רשומה קודמת כדי לחשב.`;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // וסתות פחות מצויים — חשש נוסף, לא מבטל את הרגילים
  // ══════════════════════════════════════════════════════════════
  const rarePatterns = detectRareVesetPatterns(entries);
  for (const p of rarePatterns) {
    let lbl = "", nextGreg = null;
    try {
      switch (p.type) {
        case "dilug_month":
          nextGreg = p.nextHd.greg();
          lbl = `דילוג חודש (${p.diff > 0 ? "+" : ""}${p.diff} יום)`;
          break;
        case "dilug_haflagah":
          nextGreg = p.nextHd.greg();
          lbl = `דילוג הפלגה (${p.interval + p.step - 1}→${p.interval + p.step} ימים)`;
          break;
        case "weekly":
          nextGreg = p.nextHd.greg();
          lbl = `וסת יום ${p.dayName} (כל ${p.weeksInterval} שבועות)`;
          break;
        case "sirug":
          nextGreg = p.nextHd.greg();
          lbl = `וסת הסירוג (${numToGem(p.hDay)} לחודש, כל חודשיים)`;
          break;
      }
    } catch {}

    if (!nextGreg) continue;
    const rLabel = `⁓ ${lbl}`;
    mark(isoKey(nextGreg), rLabel, "veset-rare");
    if (fullDay) mark(isoKey(prevDay(nextGreg)), rLabel, "veset-rare");
    sum += `\n\n◈ ${lbl}: ${hebFullGem(nextGreg)}`;
  }

  // ══════════════════════════════════════════════════════════════
  // הפסק טהרה + שבעה נקיים (תמיד)
  // ══════════════════════════════════════════════════════════════

  // ── ימים כשירים להפסק טהרה ──
  const eligibleDate = getHefsekEligibleDate(current.iso);
  const vestDateH    = parseIsoKey(current.iso);
  if (eligibleDate && vestDateH) {
    const hasValidHefsek = Object.entries(state.entries || {}).some(([iso, rec]) => {
      if (rec?.hefsek !== "ok") return false;
      const d = parseIsoKey(iso);
      return d && d > vestDateH;
    });
    if (!hasValidHefsek) mark(isoKey(eligibleDate), "תחילת זמן הפסק", "hefsek-eligible");
  }

  // ── הפסק טהרה ──
  for (const [iso, rec] of Object.entries(state.entries || {})) {
    if (!rec) continue;
    if      (rec.hefsek === "ok")   mark(iso, "הפסק טהרה ✦", "hefsek");
    else if (rec.hefsek === "fail") mark(iso, "הפסק נכשל ✗", "hefsek");
  }

  // ── שבעה נקיים ──
  const nekiimRange = getShivaNekiimRange();
  if (nekiimRange) {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(
        nekiimRange.start.getFullYear(),
        nekiimRange.start.getMonth(),
        nekiimRange.start.getDate() + (i - 1)
      );
      mark(isoKey(d), i === 7 ? `נקי ${i} · ערב טבילה` : `נקי ${i}`, "nekiim");
    }
  }

  return { marks, summary: sum };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────
function renderMonth() {
  if (!HDateCtor) HDateCtor = resolveHDateCtor();

  if (!HDateCtor || !state.viewHYear || !state.viewHMonth) {
    els.grid.innerHTML    = "";
    els.monthLabel.textContent = "⌛";
    els.monthHeb.textContent   = "טוען ספרייה עברית…";
    els.monthSub.textContent   = "";
    setTimeout(() => {
      HDateCtor = resolveHDateCtor();
      if (HDateCtor && !state.viewHYear) {
        const t = todayHebDate();
        if (t) { state.viewHYear = t.year; state.viewHMonth = t.month; }
      }
      renderMonth();
    }, 400);
    return;
  }

  const { viewHYear: hY, viewHMonth: hM } = state;
  const firstGreg   = firstGregOfHebMonth(hY, hM);
  const lastDay     = getHebDaysInMonth(hY, hM);
  const startOffset = firstGreg.getDay();                 // 0=ראשון
  const lastGreg    = new HDateCtor(lastDay, hM, hY).greg();

  // ── כותרות ──
  els.monthLabel.textContent = hebMonthYearGem(hY, hM);
  els.monthHeb.textContent   = firstGreg.getMonth() !== lastGreg.getMonth()
    ? `${GREG_MONTHYR_FMT.format(firstGreg)} – ${GREG_MONTHYR_FMT.format(lastGreg)}`
    : GREG_MONTHYR_FMT.format(firstGreg);
  els.monthSub.textContent = state.selectedIso
    ? `נבחר: ${hebFullGem(parseIsoKey(state.selectedIso) || firstGreg)}`
    : "לחצו על יום כדי לבחור.";

  const today = startOfDay(new Date());
  const { marks, summary } = computeMarks();
  els.calcSummary.textContent = summary;

  els.grid.innerHTML = "";
  const total = 42;

  // ── ריפוד — חודש קודם ──
  if (startOffset > 0) {
    const prev     = addHebMonths(hY, hM, -1);
    const prevLast = getHebDaysInMonth(prev.year, prev.month);
    for (let i = 0; i < startOffset; i++) {
      const dn = prevLast - (startOffset - 1 - i);
      try {
        const d = new HDateCtor(dn, prev.month, prev.year).greg();
        els.grid.appendChild(buildCell({ date: d, muted: true, today, marks }));
      } catch { els.grid.appendChild(emptyCell()); }
    }
  }

  // ── ימי החודש ──
  for (let dn = 1; dn <= lastDay; dn++) {
    try {
      const d = new HDateCtor(dn, hM, hY).greg();
      els.grid.appendChild(buildCell({ date: d, muted: false, today, marks }));
    } catch { els.grid.appendChild(emptyCell()); }
  }

  // ── ריפוד — חודש הבא ──
  const filled = startOffset + lastDay;
  if (filled < total) {
    const next = addHebMonths(hY, hM, 1);
    for (let i = 1; filled + i <= total; i++) {
      try {
        const d = new HDateCtor(i, next.month, next.year).greg();
        els.grid.appendChild(buildCell({ date: d, muted: true, today, marks }));
      } catch { els.grid.appendChild(emptyCell()); }
    }
  }

  saveJson(STORAGE.view, { hYear: hY, hMonth: hM });
}

function emptyCell() {
  const d = document.createElement("div");
  d.className = "cell cell--muted";
  return d;
}

function buildCell({ date, muted, today, marks }) {
  const key      = isoKey(date);
  const isToday  = sameYmd(date, today);
  const isSel    = state.selectedIso === key;
  const status   = state.entries[key]?.tod || null;
  const cellMarks = marks[key] || [];

  const cell = document.createElement("button");
  cell.type  = "button";
  cell.className =
    "cell" +
    (muted   ? " cell--muted"    : "") +
    (isToday ? " cell--today"    : "") +
    (isSel   ? " cell--selected" : "");
  cell.setAttribute("role", "gridcell");
  cell.dataset.iso = key;
  cell.setAttribute("aria-label", hebFullGem(date));

  // תאריך עברי בגימטריה — ראשי
  const numEl = document.createElement("div");
  numEl.className   = "cell__num";
  numEl.textContent = hebDayGem(date);

  // תאריך גרגוריאני — משני
  const gregEl = document.createElement("div");
  gregEl.className   = "cell__heb";
  gregEl.textContent = String(date.getDate());

  cell.appendChild(numEl);
  cell.appendChild(gregEl);

  // ── פילים לפי קטגוריה ──
  const addPill = (cat, cssClass) => {
    const items = cellMarks.filter(m => m.cat === cat);
    if (!items.length) return;
    const mk = document.createElement("div");
    mk.className   = `cell__pill ${cssClass}`;
    mk.textContent = items.map(m => m.label).join(" · ");
    cell.appendChild(mk);
  };
  addPill("veset",          "cell__pill--veset");
  addPill("veset-rare",     "cell__pill--veset-rare");
  addPill("hefsek-eligible","cell__pill--hefsek-eligible");
  addPill("hefsek",         "cell__pill--hefsek");
  addPill("nekiim",         "cell__pill--nekiim");

  if (status === "day" || status === "night") {
    const st = document.createElement("div");
    st.className   = "cell__status cell__status--" + status;
    st.textContent = status === "night" ? "לילה" : "יום";
    if (state.entries[key]?.feelings) {
      const dot = document.createElement("span");
      dot.className = "cell__feelings-dot";
      dot.title = state.entries[key].feelings;
      st.appendChild(dot);
    }
    cell.appendChild(st);
  }

  // ── אינדיקטורי בדיקות בוקר/ערב ──
  const entryRec = state.entries[key];
  if (entryRec && (entryRec.checkMorning || entryRec.checkEvening)) {
    const checks = document.createElement("div");
    checks.className = "cell__checks";
    if (entryRec.checkMorning) {
      const sp = document.createElement("span");
      sp.className = `cell__check cell__check--${entryRec.checkMorning}`;
      sp.title     = entryRec.checkMorning === "ok" ? "בדיקת בוקר תקינה" : "בדיקת בוקר נכשלה";
      sp.textContent = entryRec.checkMorning === "ok" ? "☀✓" : "☀✗";
      checks.appendChild(sp);
    }
    if (entryRec.checkEvening) {
      const sp = document.createElement("span");
      sp.className = `cell__check cell__check--${entryRec.checkEvening}`;
      sp.title     = entryRec.checkEvening === "ok" ? "בדיקת ערב תקינה" : "בדיקת ערב נכשלה";
      sp.textContent = entryRec.checkEvening === "ok" ? "🌙✓" : "🌙✗";
      checks.appendChild(sp);
    }
    cell.appendChild(checks);
  }

  cell.addEventListener("click", (e) => {
    e.stopPropagation();
    state.selectedIso = key;
    const existing = state.entries[key]?.tod || null;
    const title    = hebFullGem(date);
    const anchor   = cell.getBoundingClientRect();

    // ── מקטע הפסק טהרה / ז׳ נקיים ──
    const nekiimDay = isShivaNekiimDay(key);
    let extraHTML = "";

    if (nekiimDay) {
      // יום בתוך שבעה נקיים — כפתורי בדיקת בוקר/ערב
      const rec   = state.entries[key] || {};
      const mOk   = rec.checkMorning === "ok"   ? " popover__check-btn--active" : "";
      const mFail = rec.checkMorning === "fail"  ? " popover__check-btn--active" : "";
      const eOk   = rec.checkEvening === "ok"    ? " popover__check-btn--active" : "";
      const eFail = rec.checkEvening === "fail"  ? " popover__check-btn--active" : "";
      extraHTML = `<div class="popover__hefsek-section"><div class="popover__hefsek-title">יום ${nekiimDay} בשבעה נקיים</div><div class="popover__check-row"><span class="popover__check-label">בדיקת בוקר</span><button type="button" class="popover__check-btn popover__check-btn--ok${mOk}" data-check="morning" data-val="ok">✓</button><button type="button" class="popover__check-btn popover__check-btn--fail${mFail}" data-check="morning" data-val="fail">✗</button></div><div class="popover__check-row"><span class="popover__check-label">בדיקת ערב</span><button type="button" class="popover__check-btn popover__check-btn--ok${eOk}" data-check="evening" data-val="ok">✓</button><button type="button" class="popover__check-btn popover__check-btn--fail${eFail}" data-check="evening" data-val="fail">✗</button></div></div>`;
    } else {
      const rec = state.entries[key] || {};
      if (rec.hefsek) {
        // יש כבר סימון הפסק — מאפשר עריכה ומחיקה
        const statusText = rec.hefsek === "ok" ? "הפסק תקין ✦" : "הפסק נכשל ✗";
        const hOk   = rec.hefsek === "ok"   ? " popover__check-btn--active" : "";
        const hFail = rec.hefsek === "fail"  ? " popover__check-btn--active" : "";
        extraHTML = `<div class="popover__hefsek-section"><div class="popover__hefsek-title">סטטוס: ${statusText}</div><div class="popover__check-row"><span class="popover__check-label">שנה ל:</span><button type="button" class="popover__check-btn popover__check-btn--ok${hOk}" data-hefsek="ok">✓ תקין</button><button type="button" class="popover__check-btn popover__check-btn--fail${hFail}" data-hefsek="fail">✗ ראיתי דם</button><button type="button" class="popover__check-btn popover__check-btn--del" data-hefsek-delete="1">מחק</button></div></div>`;
      } else {
        // בדיקת זכאות להפסק טהרה
        const vestList = getSortedEntries();
        const lastVest = vestList[0];
        if (lastVest) {
          const eligibleDate = getHefsekEligibleDate(lastVest.iso);
          const vestDate     = parseIsoKey(lastVest.iso);
          if (eligibleDate && date >= eligibleDate) {
            const hasValidHefsek = Object.entries(state.entries || {}).some(([iso, r]) => {
              if (r?.hefsek !== "ok") return false;
              const d = parseIsoKey(iso);
              return d && vestDate && d > vestDate;
            });
            if (!hasValidHefsek) {
              extraHTML = `<div class="popover__hefsek-section"><div class="popover__check-row"><span class="popover__check-label">הפסק טהרה</span><button type="button" class="popover__check-btn popover__check-btn--ok" data-hefsek="ok">✓ תקין</button><button type="button" class="popover__check-btn popover__check-btn--fail" data-hefsek="fail">✗ ראיתי דם</button></div></div>`;
            }
          }
        }
      }
    }

    // פונקציית חיבור אירועים לכפתורי הפסק/בדיקות
    const bindHefsekEvents = () => {
      els.popoverBody.querySelectorAll("[data-check]").forEach(btn => {
        btn.addEventListener("click", () => {
          const field = btn.dataset.check === "morning" ? "checkMorning" : "checkEvening";
          const val   = btn.dataset.val;
          if (!state.entries[key]) state.entries[key] = { updatedAt: Date.now() };
          // toggle: לחיצה חוזרת מבטלת
          if (state.entries[key][field] === val) {
            delete state.entries[key][field];
          } else {
            state.entries[key][field] = val;
          }
          state.entries[key].updatedAt = Date.now();
          saveJson(STORAGE.entries, state.entries);
          // עדכון ויזואלי ללא סגירת הפופ-אפ
          const row = btn.closest(".popover__check-row");
          row.querySelectorAll(".popover__check-btn").forEach(b => b.classList.remove("popover__check-btn--active"));
          if (state.entries[key][field]) btn.classList.add("popover__check-btn--active");
          renderMonth();
        });
      });
      els.popoverBody.querySelectorAll("[data-hefsek]").forEach(btn => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.hefsek;
          if (!state.entries[key]) state.entries[key] = { updatedAt: Date.now() };
          state.entries[key].hefsek    = val;
          state.entries[key].updatedAt = Date.now();
          saveJson(STORAGE.entries, state.entries);
          closePopover();
          renderMonth();
        });
      });
      els.popoverBody.querySelectorAll("[data-hefsek-delete]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (state.entries[key]) {
            delete state.entries[key].hefsek;
            state.entries[key].updatedAt = Date.now();
          }
          saveJson(STORAGE.entries, state.entries);
          closePopover();
          renderMonth();
        });
      });
    };

    if (existing) {
      // ── עריכה / מחיקה ──
      const existingFeelings = state.entries[key]?.feelings || "";
      const escapedFeelings  = existingFeelings.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      openPopover({
        title,
        bodyHTML: `<div class="popover__info">מסומן כ־${existing === "night" ? "לילה" : "יום"}.</div><label class="popover__feelings-label">הרגשות גוף<textarea class="popover__feelings-input" placeholder="למשל: כאב ראש, עייפות, כאבי בטן...">${escapedFeelings}</textarea></label>${extraHTML}`,
        actions: [
          {
            label: "שמור", className: "btn btn--primary",
            onClick: () => {
              const feelings = els.popoverBody.querySelector(".popover__feelings-input")?.value?.trim() || "";
              state.entries[key] = { ...state.entries[key], updatedAt: Date.now() };
              if (feelings) state.entries[key].feelings = feelings;
              else delete state.entries[key].feelings;
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "בטל סימון", className: "btn btn--danger",
            onClick: () => {
              delete state.entries[key];
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "סגור", className: "btn btn--ghost",
            onClick: () => {},
          },
        ],
        anchorRect: anchor,
      });
      bindHefsekEvents();
    } else {
      // ── רישום חדש + זמני שמש ──
      const loc   = loadLocation();
      const sun   = getSunTimes(date, loc.lat, loc.lng);
      const srStr = formatILTime(sun?.sunrise);
      const ssStr = formatILTime(sun?.sunset);

      // קביעת ברירת מחדל חכמה
      const now    = new Date();
      const isDay  = sun
        ? (now >= sun.sunrise && now <= sun.sunset)
        : (now.getHours() >= 6 && now.getHours() < 19);

      const dayClass   = isDay ? "btn btn--primary" : "btn";
      const nightClass = isDay ? "btn"               : "btn btn--primary";

      // הרגשות מהוסת הקודמת (לכפתור העתקה)
      const allSorted    = getSortedEntries();
      const prevEntry    = allSorted[0];
      const prevFeelings = prevEntry ? (state.entries[prevEntry.iso]?.feelings || "") : "";
      const copyBtnHtml  = prevFeelings
        ? `<button type="button" class="btn btn--ghost btn--small popover__copy-prev">העתק הרגשות מהוסת הקודמת</button>`
        : "";

      openPopover({
        title,
        bodyHTML: `<div class="popover__times">☀️ זריחה: ${srStr}&nbsp;&nbsp;&nbsp;🌇 שקיעה: ${ssStr}</div><label class="popover__feelings-label">הרגשות גוף (אופציונלי)<textarea class="popover__feelings-input" placeholder="למשל: כאב ראש, עייפות, כאבי בטן..."></textarea></label>${copyBtnHtml}<div class="popover__question">איך לסמן?</div>${extraHTML}`,
        actions: [
          {
            label: "יום ☀️", className: dayClass,
            onClick: () => {
              const feelings = els.popoverBody.querySelector(".popover__feelings-input")?.value?.trim() || "";
              state.entries[key] = { tod: "day", updatedAt: Date.now(), ...(feelings && { feelings }) };
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "לילה 🌙", className: nightClass,
            onClick: () => {
              const feelings = els.popoverBody.querySelector(".popover__feelings-input")?.value?.trim() || "";
              state.entries[key] = { tod: "night", updatedAt: Date.now(), ...(feelings && { feelings }) };
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "ביטול", className: "btn btn--ghost",
            onClick: () => renderMonth(),
          },
        ],
        anchorRect: anchor,
      });
      // חיבור כפתור "העתק הרגשות מהוסת הקודמת"
      if (prevFeelings) {
        const copyBtn = els.popoverBody.querySelector(".popover__copy-prev");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            const ta = els.popoverBody.querySelector(".popover__feelings-input");
            if (ta) ta.value = prevFeelings;
          });
        }
      }
      bindHefsekEvents();
    }
  });

  return cell;
}

// ─────────────────────────────────────────────────────────────────────────────
// ICS Export
// ─────────────────────────────────────────────────────────────────────────────
function toIcsDate(d) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function toIcsUtc(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}T${String(d.getUTCHours()).padStart(2,"0")}${String(d.getUTCMinutes()).padStart(2,"0")}${String(d.getUTCSeconds()).padStart(2,"0")}Z`;
}
function icsEsc(s) {
  return String(s).replaceAll("\\","\\\\").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;");
}
function downloadText(name, text, mime="text/plain") {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([text], { type: mime })), download: name,
  });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportIcs() {
  if (!HDateCtor) { alert("הספרייה לתאריך עברי לא נטענה."); return; }
  const { marks, summary } = computeMarks();
  const dtstamp = toIcsUtc(new Date());
  const events  = [];
  for (const [iso, labels] of Object.entries(marks)) {
    const dt = parseIsoKey(iso); if (!dt) continue;
    for (const label of labels) {
      events.push([
        "BEGIN:VEVENT",
        `UID:${iso}-${label}-${Math.random().toString(16).slice(2)}@monthlycalendar.local`,
        `DTSTAMP:${dtstamp}`,
        `SUMMARY:${icsEsc(`תזכורת (${label})`)}`,
        `DTSTART;VALUE=DATE:${toIcsDate(dt)}`,
        `DTEND;VALUE=DATE:${toIcsDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()+1))}`,
        `DESCRIPTION:${icsEsc(summary)}`,
        "END:VEVENT",
      ].join("\r\n"));
    }
  }
  if (!events.length) { alert("אין תאריכים מחושבים לייצוא."); return; }
  downloadText("calendar-export.ics", [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//MonthlyCalendar//HE//",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH",...events,"END:VCALENDAR","",
  ].join("\r\n"), "text/calendar;charset=utf-8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Controls
// ─────────────────────────────────────────────────────────────────────────────
function clearAll() {
  openPopover({
    title: "מחיקת נתונים",
    bodyText: "האם את בטוחה שברצונך למחוק את כל הנתונים לצמיתות? פעולה זו אינה הפיכה.",
    actions: [
      {
        label: "מחקו הכל", className: "btn btn--danger",
        onClick: () => {
          state.entries = {}; state.selectedIso = null;
          saveJson(STORAGE.entries, state.entries);
          renderMonth();
        },
      },
      { label: "ביטול", className: "btn btn--ghost", onClick: () => {} },
    ],
    anchorRect: els.clearAll?.getBoundingClientRect(),
  });
}

// ── גיבוי ושחזור ──
els.exportBackup?.addEventListener("click", () => {
  const backup = { entries: state.entries, settings: state.settings };
  downloadText("taharat-esther-backup.json", JSON.stringify(backup, null, 2), "application/json");
});

els.importBackupBtn?.addEventListener("click", () => {
  els.importBackupFile?.click();
});

els.importBackupFile?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data || typeof data !== "object") throw new Error("פורמט לא תקין");
      if (data.entries)  { state.entries  = data.entries;  saveJson(STORAGE.entries, state.entries); }
      if (data.settings) { state.settings = { ...loadSettings(), ...data.settings }; saveSettings(state.settings); }
      renderMonth();
      alert("הנתונים שוחזרו בהצלחה.");
    } catch {
      alert("שגיאה בייבוא הקובץ. ודאי שהקובץ תקין.");
    } finally {
      e.target.value = "";   // איפוס לאפשר ייבוא אותו קובץ שוב
    }
  };
  reader.readAsText(file);
});

els.prev.addEventListener("click", () => {
  const p = addHebMonths(state.viewHYear, state.viewHMonth, -1);
  state.viewHYear = p.year; state.viewHMonth = p.month; renderMonth();
});
els.next.addEventListener("click", () => {
  const n = addHebMonths(state.viewHYear, state.viewHMonth, 1);
  state.viewHYear = n.year; state.viewHMonth = n.month; renderMonth();
});
els.exportIcs.addEventListener("click", exportIcs);
els.clearAll.addEventListener("click", clearAll);

window.addEventListener("keydown", (e) => {
  // RTL: ימין (→) = חודש קודם, שמאל (←) = חודש הבא
  if (e.key === "ArrowRight") {
    const p = addHebMonths(state.viewHYear, state.viewHMonth, -1);
    state.viewHYear = p.year; state.viewHMonth = p.month; renderMonth();
  } else if (e.key === "ArrowLeft") {
    const n = addHebMonths(state.viewHYear, state.viewHMonth, 1);
    state.viewHYear = n.year; state.viewHMonth = n.month; renderMonth();
  }
});

// ── מיקום ──
if (els.citySelect) {
  els.citySelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;
    const [lat, lng] = val.split(",").map(Number);
    const name = e.target.selectedOptions[0].text;
    saveLocation(lat, lng, name);
  });
}

if (els.locateBtn) {
  els.locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { alert("הדפדפן שלך אינו תומך ב-GPS."); return; }
    els.locateBtn.disabled    = true;
    els.locateBtn.textContent = "⌛ מאתר…";
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        // ניסיון reverse geocoding, fallback לעיר קרובה
        let name = await resolveLocationName(lat, lng);
        if (!name) name = nearestCityName(lat, lng);
        saveLocation(lat, lng, name);
        if (els.citySelect) els.citySelect.value = "";
        els.locateBtn.disabled    = false;
        els.locateBtn.textContent = "📍 זהה מיקום";
      },
      () => {
        alert("לא הצלחנו לאתר מיקום. אנא אשרי גישה למיקום בדפדפן.");
        els.locateBtn.disabled    = false;
        els.locateBtn.textContent = "📍 זהה מיקום";
      },
      { timeout: 10000 }
    );
  });
}

// ── הגדרות (modal) ──
function openSettings() {
  if (els.settingsModal) els.settingsModal.hidden = false;
}
function closeSettings() {
  if (els.settingsModal) els.settingsModal.hidden = true;
}

els.settingsBtn?.addEventListener("click", openSettings);
document.querySelector("#settings-close")?.addEventListener("click", closeSettings);
document.querySelector("#settings-backdrop")?.addEventListener("click", closeSettings);

// Escape סוגר גם מודאל הגדרות
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.settingsModal && !els.settingsModal.hidden) closeSettings();
});

// טוגל אור זרוע
els.ozToggle?.addEventListener("click", () => {
  const newVal = els.ozToggle.getAttribute("aria-checked") !== "true";
  els.ozToggle.setAttribute("aria-checked", String(newVal));
  state.settings.ozEnabled = newVal;
  saveSettings(state.settings);
  if (els.ozScopeRow) els.ozScopeRow.classList.toggle("setting-row--disabled", !newVal);
  renderMonth();
});

// בחירת טווח אור זרוע
els.ozTypeSelect?.addEventListener("change", (e) => {
  state.settings.ozType = e.target.value;
  saveSettings(state.settings);
  renderMonth();
});

// טוגל חומרת יום ל״א
els.day31Toggle?.addEventListener("click", () => {
  const newVal = els.day31Toggle.getAttribute("aria-checked") !== "true";
  els.day31Toggle.setAttribute("aria-checked", String(newVal));
  state.settings.day31Enabled = newVal;
  saveSettings(state.settings);
  renderMonth();
});

// שיטת חישוב הפלגה קבועה שפוספסה
els.fixedHaflagahSelect?.addEventListener("change", (e) => {
  state.settings.fixedHaflagahMethod = e.target.value;
  saveSettings(state.settings);
  renderMonth();
});

// טוגל עונה בינונית כיממה שלמה
els.fullDayToggle?.addEventListener("click", () => {
  const newVal = els.fullDayToggle.getAttribute("aria-checked") !== "true";
  els.fullDayToggle.setAttribute("aria-checked", String(newVal));
  state.settings.fullDayEnabled = newVal;
  saveSettings(state.settings);
  renderMonth();
});

// טוגל התראות קופצות
els.notificationsToggle?.addEventListener("click", async () => {
  const isOn = els.notificationsToggle.getAttribute("aria-checked") === "true";

  if (isOn) {
    // כיבוי
    els.notificationsToggle.setAttribute("aria-checked", "false");
    state.settings.notificationsEnabled = false;
    saveSettings(state.settings);
    if (els.notifSub) els.notifSub.classList.add("settings-group--dimmed");
    return;
  }

  // הדלקה — בדפדפנים שלא תומכים ב-Notifications
  if (!("Notification" in window)) {
    alert("הדפדפן שלך אינו תומך בהתראות. נסו להוסיף את האפליקציה למסך הבית (PWA).");
    return;
  }

  // אם ההרשאה כבר ניתנה — מדליקים ישירות
  if (Notification.permission === "granted") {
    els.notificationsToggle.setAttribute("aria-checked", "true");
    state.settings.notificationsEnabled = true;
    saveSettings(state.settings);
    if (els.notifSub) els.notifSub.classList.remove("settings-group--dimmed");
    return;
  }

  // בקשת הרשאה
  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    // ספארי ישן מחזיר ב-callback ולא ב-Promise
    permission = await new Promise(resolve => Notification.requestPermission(resolve));
  }

  if (permission === "granted") {
    els.notificationsToggle.setAttribute("aria-checked", "true");
    state.settings.notificationsEnabled = true;
    saveSettings(state.settings);
    if (els.notifSub) els.notifSub.classList.remove("settings-group--dimmed");
  } else {
    els.notificationsToggle.setAttribute("aria-checked", "false");
    state.settings.notificationsEnabled = false;
    saveSettings(state.settings);
    if (els.notifSub) els.notifSub.classList.add("settings-group--dimmed");
    alert("לא ניתנה הרשאה להתראות.\nכדי להפעיל — אשרי הרשאות התראות לאתר זה בהגדרות הדפדפן.");
  }
});

// הגדרות פירוט התראות
els.notif1Name?.addEventListener("change", (e) => {
  state.settings.notif1Name = e.target.value.trim();
  saveSettings(state.settings);
});
els.notif1Min?.addEventListener("change", (e) => {
  state.settings.reminderStartMin = Math.max(0, parseInt(e.target.value) || 0);
  saveSettings(state.settings);
});
els.notif2Name?.addEventListener("change", (e) => {
  state.settings.notif2Name = e.target.value.trim();
  saveSettings(state.settings);
});
els.notif2Min?.addEventListener("change", (e) => {
  state.settings.reminderEndMin = Math.max(0, parseInt(e.target.value) || 30);
  saveSettings(state.settings);
});
els.notif1FixedTime?.addEventListener("change", (e) => {
  state.settings.notif1FixedTime = e.target.value;
  saveSettings(state.settings);
});
els.notif2FixedTime?.addEventListener("change", (e) => {
  state.settings.notif2FixedTime = e.target.value;
  saveSettings(state.settings);
});

// בחירת צליל תזכורת
els.notifSoundSelect?.addEventListener("change", (e) => {
  const type = e.target.value;
  state.settings.notifSound = type;
  saveSettings(state.settings);
  if (els.notifSoundFileRow) els.notifSoundFileRow.hidden = (type !== "custom");
});

// כפתור נגינת דוגמה
els.notifSoundTest?.addEventListener("click", () => {
  const type = state.settings.notifSound || "default";
  if (type === "silent") return;
  if (type === "default") {
    // ברירת מחדל: צליל מהמערכת — משמיעים קצר דרך AudioContext
    try {
      const ctx = _getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.5);
    } catch {}
    return;
  }
  playNotificationSound(type);
});

// בחירת קובץ — פתיחת חלון בחירה
els.notifSoundFileBtn?.addEventListener("click", () => {
  els.notifSoundFile?.click();
});

// טיפול בקובץ שנבחר
els.notifSoundFile?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    alert("הקובץ גדול מדי (מקסימום 3MB). בחרו קובץ קצר יותר.");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      localStorage.setItem(STORAGE.soundData, ev.target.result);
      if (els.notifSoundFileName) els.notifSoundFileName.textContent = file.name;
    } catch {
      alert("לא ניתן לשמור את הקובץ. ייתכן שאין מקום מספיק. בחרו קובץ קצר יותר.");
    }
  };
  reader.readAsDataURL(file);
});

// ── הגדרות הפסק טהרה ──
els.hefsekMinDay?.addEventListener("change", (e) => {
  state.settings.hefsekMinDay = parseInt(e.target.value) || 4;
  saveSettings(state.settings);
});
els.hefsekReminderMin?.addEventListener("change", (e) => {
  state.settings.hefsekReminderMin = Math.max(0, parseInt(e.target.value) || 30);
  saveSettings(state.settings);
});
els.hefsekReminderTime?.addEventListener("change", (e) => {
  state.settings.hefsekReminderTime = e.target.value;
  saveSettings(state.settings);
});
els.hefsekMorningMin?.addEventListener("change", (e) => {
  state.settings.hefsekMorningMin = Math.max(0, parseInt(e.target.value) || 0);
  saveSettings(state.settings);
});
els.hefsekMorningTime?.addEventListener("change", (e) => {
  state.settings.hefsekMorningTime = e.target.value;
  saveSettings(state.settings);
});
els.hefsekEveningMin?.addEventListener("change", (e) => {
  state.settings.hefsekEveningMin = Math.max(0, parseInt(e.target.value) || 30);
  saveSettings(state.settings);
});
els.hefsekEveningTime?.addEventListener("change", (e) => {
  state.settings.hefsekEveningTime = e.target.value;
  saveSettings(state.settings);
});
els.hefsekMikvehToggle?.addEventListener("click", () => {
  const newVal = els.hefsekMikvehToggle.getAttribute("aria-checked") !== "true";
  els.hefsekMikvehToggle.setAttribute("aria-checked", String(newVal));
  state.settings.hefsekMikvehReminder = newVal;
  saveSettings(state.settings);
  if (els.hefsekMikvehTimeRow) els.hefsekMikvehTimeRow.classList.toggle("settings-group--dimmed", !newVal);
});
els.hefsekMikvehTime?.addEventListener("change", (e) => {
  state.settings.hefsekMikvehTime = e.target.value;
  saveSettings(state.settings);
});

// ── מיתוג לשוניות ──
document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.setAttribute("aria-selected", "false"));
    document.querySelectorAll(".tab-pane").forEach(p => { p.hidden = true; });
    btn.setAttribute("aria-selected", "true");
    const pane = document.getElementById(`tab-${tab}`);
    if (pane) pane.hidden = false;
  });
});

// ── טופס צור קשר ──
document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form     = e.target;
  const btn      = document.getElementById("contact-submit");
  const statusEl = document.getElementById("contact-status");

  // ולידציה בסיסית
  const name    = form.querySelector("#contact-name")?.value.trim();
  const email   = form.querySelector("#contact-email")?.value.trim();
  const message = form.querySelector("#contact-message")?.value.trim();
  if (!name || !email || !message) {
    statusEl.textContent = "נא למלא את כל שדות החובה (*)";
    statusEl.className   = "contact-status contact-status--err";
    statusEl.hidden      = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = "שולח…";
  statusEl.hidden = true;

  try {
    const data = new FormData(form);
    data.append("_subject", "פנייה מאפליקציית טהרת אסתר");
    const res = await fetch("https://formsubmit.co/ajax/lgolds311@gmail.com", {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: data,
    });
    if (!res.ok) throw new Error();
    statusEl.textContent = "הפנייה נשלחה בהצלחה! נחזור אליכם בהקדם.";
    statusEl.className   = "contact-status contact-status--ok";
    form.reset();
  } catch {
    statusEl.textContent = "שגיאה בשליחה. אפשר לנסות שוב, או לפנות ישירות ל-lgolds311@gmail.com";
    statusEl.className   = "contact-status contact-status--err";
  } finally {
    statusEl.hidden  = false;
    btn.disabled     = false;
    btn.textContent  = "שליחה";
  }
});

// בחירת ערכת נושא
els.themeSelect?.addEventListener("change", (e) => {
  const theme = e.target.value;
  state.settings.theme = theme;
  saveSettings(state.settings);
  applyTheme(theme);
});

// ── QR ──
const qrBtn   = document.querySelector("#qr-btn");
const qrPanel = document.querySelector("#qr-panel");
const qrCanvas = document.querySelector("#qr-canvas");
const qrUrlText = document.querySelector("#qr-url-text");
let qrGenerated = false;

qrBtn?.addEventListener("click", () => {
  if (qrPanel.hidden) {
    qrPanel.hidden = false;
    qrBtn.textContent = "הסתר QR";
    if (!qrGenerated) {
      const url = location.origin + location.pathname.replace(/\/$/, "");
      if (qrUrlText) qrUrlText.textContent = url;
      if (window.QRCode && qrCanvas) {
        new QRCode(qrCanvas, {
          text: url,
          width: 180,
          height: 180,
          colorDark: "#4c1d95",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });
        qrGenerated = true;
      }
    }
  } else {
    qrPanel.hidden = true;
    qrBtn.textContent = "הצג QR";
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
const savedView = loadJson(STORAGE.view, null);
if (savedView?.hYear && savedView?.hMonth) {
  state.viewHYear  = savedView.hYear;
  state.viewHMonth = savedView.hMonth;
} else {
  const t = todayHebDate();
  if (t) { state.viewHYear = t.year; state.viewHMonth = t.month; }
}

// הפעל טוגלים לפי ההגדרות השמורות
if (els.ozToggle             && state.settings.ozEnabled)            els.ozToggle.setAttribute("aria-checked",            "true");
if (els.day31Toggle          && state.settings.day31Enabled)         els.day31Toggle.setAttribute("aria-checked",         "true");
if (els.fullDayToggle        && state.settings.fullDayEnabled)       els.fullDayToggle.setAttribute("aria-checked",       "true");

// עמימת/הפעלת שורת טווח אור זרוע לפי מצב הטוגל
if (els.ozScopeRow)          els.ozScopeRow.classList.toggle("setting-row--disabled", !state.settings.ozEnabled);
if (els.ozTypeSelect)        els.ozTypeSelect.value = state.settings.ozType || "all";
if (els.fixedHaflagahSelect) els.fixedHaflagahSelect.value = state.settings.fixedHaflagahMethod || "beit_yosef";

// התראות — מציגים כדלוק רק אם גם ההגדרה וגם ההרשאה קיימות
const _notifActive = state.settings.notificationsEnabled
    && "Notification" in window && Notification.permission === "granted";
if (els.notificationsToggle && _notifActive) {
  els.notificationsToggle.setAttribute("aria-checked", "true");
} else if (state.settings.notificationsEnabled) {
  // ההגדרה דלוקה אך ההרשאה בוטלה בדפדפן — מכבים אוטומטית
  state.settings.notificationsEnabled = false;
  saveSettings(state.settings);
}
// עמימת/הפעלת קבוצת הגדרות התראות
if (els.notifSub) els.notifSub.classList.toggle("settings-group--dimmed", !_notifActive);
if (els.notif1Name)     els.notif1Name.value      = state.settings.notif1Name    || "";
if (els.notif1Min)      els.notif1Min.value       = state.settings.reminderStartMin ?? 0;
if (els.notif2Name)     els.notif2Name.value      = state.settings.notif2Name    || "";
if (els.notif2Min)       els.notif2Min.value       = state.settings.reminderEndMin ?? 30;
if (els.notif1FixedTime) els.notif1FixedTime.value = state.settings.notif1FixedTime || "";
if (els.notif2FixedTime) els.notif2FixedTime.value = state.settings.notif2FixedTime || "";
// צליל — סנכרון select ושורת קובץ
if (els.notifSoundSelect) {
  els.notifSoundSelect.value = state.settings.notifSound || "default";
}
if (els.notifSoundFileRow) {
  els.notifSoundFileRow.hidden = (state.settings.notifSound !== "custom");
}
if (els.notifSoundFileName && state.settings.notifSound === "custom") {
  const stored = localStorage.getItem(STORAGE.soundData);
  els.notifSoundFileName.textContent = stored ? "קובץ נטען" : "לא נבחר קובץ";
}

// הפסק טהרה — סנכרון UI
if (els.hefsekMinDay)       els.hefsekMinDay.value        = String(state.settings.hefsekMinDay ?? 4);
if (els.hefsekReminderMin)  els.hefsekReminderMin.value   = state.settings.hefsekReminderMin ?? 30;
if (els.hefsekReminderTime) els.hefsekReminderTime.value  = state.settings.hefsekReminderTime || "";
if (els.hefsekMorningMin)   els.hefsekMorningMin.value    = state.settings.hefsekMorningMin ?? 0;
if (els.hefsekMorningTime)  els.hefsekMorningTime.value   = state.settings.hefsekMorningTime || "07:00";
if (els.hefsekEveningMin)   els.hefsekEveningMin.value    = state.settings.hefsekEveningMin ?? 30;
if (els.hefsekEveningTime)  els.hefsekEveningTime.value   = state.settings.hefsekEveningTime || "";
if (els.hefsekMikvehToggle) {
  const on = state.settings.hefsekMikvehReminder !== false;
  els.hefsekMikvehToggle.setAttribute("aria-checked", String(on));
  if (els.hefsekMikvehTimeRow) els.hefsekMikvehTimeRow.classList.toggle("settings-group--dimmed", !on);
}
if (els.hefsekMikvehTime) els.hefsekMikvehTime.value = state.settings.hefsekMikvehTime || "";

// החל ערכת נושא שמורה
applyTheme(state.settings.theme || "light");
if (els.themeSelect) els.themeSelect.value = state.settings.theme || "light";

// הצג סטטוס מיקום
const initLoc = loadLocation();
renderLocationStatus(initLoc?.name || DEFAULT_LOC.name);

// סמן עיר בבחירה אם תואמת עיר מוגדרת מראש
if (els.citySelect && initLoc) {
  for (const opt of els.citySelect.options) {
    if (!opt.value) continue;
    const [la, lo] = opt.value.split(",").map(Number);
    if (Math.abs(la - initLoc.lat) < 0.01 && Math.abs(lo - initLoc.lng) < 0.01) {
      els.citySelect.value = opt.value; break;
    }
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

renderMonth();
checkDailyNotifications();
