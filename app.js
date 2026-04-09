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
  exportIcs:      document.querySelector("#export-ics"),
  clearAll:       document.querySelector("#clear-all"),
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
  themeSelect:          document.querySelector("#theme-select"),
  notificationsToggle:  document.querySelector("#notifications-toggle"),
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
const DEFAULT_SETTINGS = { ozEnabled: false, day31Enabled: false, fullDayEnabled: false, theme: "dark", notificationsEnabled: false };

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

/** בדיקת התראות יומית — מופעלת פעם אחת בעליית האפליקציה */
function checkDailyNotifications() {
  // בדפדפנים שלא תומכים ב-Notifications — יציאה שקטה
  if (!("Notification" in window)) return;
  if (!state.settings?.notificationsEnabled) return;
  if (Notification.permission !== "granted") return;

  const todayKey = isoKey(new Date());
  const lastSent = localStorage.getItem(STORAGE.lastNotification);

  // כבר שלחנו היום — לא שולחים שוב
  if (lastSent === todayKey) return;

  const { marks } = computeMarks();
  const todayMarks = marks[todayKey];
  if (!todayMarks || !todayMarks.length) return;

  const body = "היום יש עונת פרישה: " + todayMarks.join(", ");
  try {
    new Notification("טהרת אסתר - תזכורת", {
      body,
      icon: "./icon.svg",
      lang: "he",
      dir: "rtl",
    });
    localStorage.setItem(STORAGE.lastNotification, todayKey);
  } catch {
    // Notification נכשל (למשל iOS Safari ללא PWA) — יציאה שקטה
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

function openPopover({ title, bodyText, actions, anchorRect }) {
  els.popoverTitle.textContent = title || "";
  els.popoverBody.textContent  = bodyText || "";
  els.popoverActions.innerHTML = "";
  popoverAnchorRect = anchorRect || null;
  for (const a of actions || []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = a.className || "btn";
    btn.textContent = a.label;
    btn.addEventListener("click", () => { closePopover(); a.onClick?.(); });
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
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}
function adjustForNight(date, tod) {
  return tod !== "night" ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculations (marks + summary)
// ─────────────────────────────────────────────────────────────────────────────
/** מחזיר תאריך גרגוריאני יום אחד לפני — עבור חישוב אור זרוע */
function prevDay(greg) {
  return new Date(greg.getFullYear(), greg.getMonth(), greg.getDate() - 1);
}

function computeMarks() {
  if (!HDateCtor) return { marks: {}, summary: "כדי לראות חישובים יש לאפשר טעינת הספרייה (CDN)." };
  const [current, previous] = getSortedEntries();
  if (!current) return { marks: {}, summary: "לחצי על תאריך כדי לרשום יום/לילה." };

  const oz       = state.settings?.ozEnabled;
  const day31    = state.settings?.day31Enabled;
  const fullDay  = state.settings?.fullDayEnabled;

  const currHd  = new HDateCtor(current.date);

  const rule1 = currHd.add(29, "d");   // עונה בינונית (יום 30)

  // וסת החודש — אותו יום עברי בחודש הבא, בניה מפורשת
  // מקרה קצה: אם החודש הבא חסר ואין בו את היום הדרוש → א' של החודש שאחריו
  const nextMonth  = addHebMonths(currHd.getFullYear(), currHd.getMonth(), 1);
  const daysInNext = getHebDaysInMonth(nextMonth.year, nextMonth.month);
  let rule2;
  if (currHd.getDate() > daysInNext) {
    const skipMonth = addHebMonths(nextMonth.year, nextMonth.month, 1);
    rule2 = new HDateCtor(1, skipMonth.month, skipMonth.year);
  } else {
    rule2 = new HDateCtor(currHd.getDate(), nextMonth.month, nextMonth.year);
  }

  const marks = {};
  const mark = (iso, label) => { marks[iso] = (marks[iso] || []).concat([label]); };

  // ── עונה בינונית ──
  // fullDay: מסמנת גם את הלילה שלפני (= היום הגרגוריאני הקודם)
  if (fullDay) {
    mark(isoKey(prevDay(rule1.greg())), "עונה בינונית");
  }
  mark(isoKey(rule1.greg()), "עונה בינונית");

  // ── חומרת יום ל״א ──
  if (day31) {
    const rule1_31 = currHd.add(30, "d");   // יום 31
    if (fullDay) {
      mark(isoKey(prevDay(rule1_31.greg())), "עונה בינונית (ל״א)");
    }
    mark(isoKey(rule1_31.greg()), "עונה בינונית (ל״א)");

    if (oz) {
      mark(isoKey(prevDay(rule1_31.greg())), "אור זרוע (ל״א)");
    }
  }

  // ── וסת החודש ──
  mark(isoKey(rule2.greg()), "וסת החודש");

  // ── סיכום טקסט ──
  let sum = `רשומה אחרונה: ${hebFullGem(current.date)} — ${current.tod === "night" ? "לילה" : "יום"}`;
  sum += `\nעונה בינונית: ${hebFullGem(rule1.greg())}`;
  if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule1.greg()))})`;
  if (day31) {
    const rule1_31 = currHd.add(30, "d");
    sum += `\nחומרת יום ל״א: ${hebFullGem(rule1_31.greg())}`;
    if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule1_31.greg()))})`;
  }
  sum += `\nוסת החודש: ${hebFullGem(rule2.greg())}`;

  // ── אור זרוע ──
  if (oz) {
    // אור זרוע = יום אחד לפני תאריך הפרישה הגרגוריאני
    const oz1 = prevDay(rule1.greg());
    const oz2 = prevDay(rule2.greg());
    mark(isoKey(oz1), "אור זרוע (בינונית)");
    mark(isoKey(oz2), "אור זרוע (חודש)");
    sum += `\nאור זרוע (בינונית): ${hebFullGem(oz1)}`;
    sum += `\nאור זרוע (חודש): ${hebFullGem(oz2)}`;
  }

  // ── וסת ההפלגה ──
  if (previous) {
    const prevHd   = new HDateCtor(previous.date);
    const interval = Math.abs(currHd.abs() - prevHd.abs()) + 1;
    const rule3    = currHd.add(Math.max(0, interval - 1), "d");

    if (fullDay) {
      mark(isoKey(prevDay(rule3.greg())), "וסת ההפלגה");
    }
    mark(isoKey(rule3.greg()), "וסת ההפלגה");

    sum += `\nרשומה קודמת: ${hebFullGem(previous.date)} — ${previous.tod === "night" ? "לילה" : "יום"}`;
    sum += `\nוסת ההפלגה: ${interval} ימים → ${hebFullGem(rule3.greg())}`;
    if (fullDay) sum += ` (+ לילה מוקדם: ${hebFullGem(prevDay(rule3.greg()))})`;

    if (oz) {
      const oz3 = prevDay(rule3.greg());
      mark(isoKey(oz3), "אור זרוע (הפלגה)");
      sum += `\nאור זרוע (הפלגה): ${hebFullGem(oz3)}`;
    }
  } else {
    sum += `\nוסת ההפלגה: הוסיפי גם רשומה קודמת כדי לחשב.`;
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
    : "לחצי על יום כדי לבחור.";

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

  if (cellMarks.length) {
    const mk = document.createElement("div");
    mk.className   = "cell__mark";
    mk.textContent = cellMarks.join(", ");
    cell.appendChild(mk);
  }

  if (status === "day" || status === "night") {
    const st = document.createElement("div");
    st.className   = "cell__status cell__status--" + status;
    st.textContent = status === "night" ? "לילה" : "יום";
    cell.appendChild(st);
  }

  cell.addEventListener("click", (e) => {
    e.stopPropagation();
    state.selectedIso = key;
    const existing = state.entries[key]?.tod || null;
    const title    = hebFullGem(date);
    const anchor   = cell.getBoundingClientRect();

    if (existing) {
      // ── מחיקה ──
      openPopover({
        title: "מחיקה",
        bodyText: `${title}\nמסומן כ־${existing === "night" ? "לילה" : "יום"}.\nלמחוק את הרישום?`,
        actions: [
          {
            label: "כן, למחוק", className: "btn btn--danger",
            onClick: () => {
              delete state.entries[key];
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "לא", className: "btn",
            onClick: () => renderMonth(),
          },
        ],
        anchorRect: anchor,
      });
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

      openPopover({
        title,
        bodyText: `☀️ זריחה: ${srStr}   🌇 שקיעה: ${ssStr}\n\nאיך לסמן?`,
        actions: [
          {
            label: "יום ☀️", className: dayClass,
            onClick: () => {
              state.entries[key] = { tod: "day", updatedAt: Date.now() };
              saveJson(STORAGE.entries, state.entries);
              renderMonth();
            },
          },
          {
            label: "לילה 🌙", className: nightClass,
            onClick: () => {
              state.entries[key] = { tod: "night", updatedAt: Date.now() };
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
  if (!confirm("לנקות את כל הנתונים?")) return;
  state.entries = {}; state.selectedIso = null;
  saveJson(STORAGE.entries, state.entries);
  renderMonth();
}

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
    return;
  }

  // הדלקה — בדפדפנים שלא תומכים ב-Notifications
  if (!("Notification" in window)) {
    alert("הדפדפן שלך אינו תומך בהתראות. נסי להוסיף את האפליקציה למסך הבית (PWA).");
    return;
  }

  // אם ההרשאה כבר ניתנה — מדליקים ישירות
  if (Notification.permission === "granted") {
    els.notificationsToggle.setAttribute("aria-checked", "true");
    state.settings.notificationsEnabled = true;
    saveSettings(state.settings);
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
  } else {
    els.notificationsToggle.setAttribute("aria-checked", "false");
    state.settings.notificationsEnabled = false;
    saveSettings(state.settings);
    alert("לא ניתנה הרשאה להתראות.\nכדי להפעיל — אשרי הרשאות התראות לאתר זה בהגדרות הדפדפן.");
  }
});

// בחירת ערכת נושא
els.themeSelect?.addEventListener("change", (e) => {
  const theme = e.target.value;
  state.settings.theme = theme;
  saveSettings(state.settings);
  applyTheme(theme);
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
// התראות — מציגים כדלוק רק אם גם ההגדרה וגם ההרשאה קיימות
if (els.notificationsToggle  && state.settings.notificationsEnabled
    && "Notification" in window && Notification.permission === "granted") {
  els.notificationsToggle.setAttribute("aria-checked", "true");
} else if (state.settings.notificationsEnabled) {
  // ההגדרה דלוקה אך ההרשאה בוטלה בדפדפן — מכבים אוטומטית
  state.settings.notificationsEnabled = false;
  saveSettings(state.settings);
}

// החל ערכת נושא שמורה
applyTheme(state.settings.theme || "dark");
if (els.themeSelect) els.themeSelect.value = state.settings.theme || "dark";

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
