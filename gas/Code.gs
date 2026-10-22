/**
 * موقع قسم التربية الإسلامية — ثانوية أحمد الربعي للبنين
 * الأركان: ما قطع من المنهج · إنجازات المعلمين · محاضر الاجتماعات
 * بعد أي تحديث للكود: شغّل setup مرة واحدة، ثم حدّث النشر (Manage deployments ← New version).
 */

const SHEET_CODES = "الرموز";
const SHEET_DATA = "الإدخالات";
const SHEET_LOG = "السجل";
const SHEET_ACH = "الإنجازات";
const SHEET_MIN = "المحاضر";
const SHEET_SIG = "التواقيع";
const SHEET_MYSIG = "توقيعات المعلمين";

const ST_PENDING = "بانتظار الصياغة";
const ST_READY = "جاهز";

// المعلمون وفصولهم (الجدول العام للقسم). s = علمي، l = أدبي
const TEACHERS = [
  ["مزيد حمد خليفة القصار", ["11s-1"], true],
  ["عبدالله طارق محمد الخليفي", ["10-1", "11s-4"]],
  ["عبدالمحسن عايض عبدالله المطيري", ["10-2", "10-9"]],
  ["سعد عبدالله سعد الحربي", ["10-3", "10-4"]],
  ["خالد أحمد علي الخالدي", ["10-5", "10-6"]],
  ["عبدالرحمن خالد عبدالكريم الاصقه", ["10-7", "10-8"]],
  ["عبدالله جاسم محمد المجيبل", ["11s-2", "11s-3"]],
  ["سعد احمد سعد العازمي", ["11s-5", "11l-1"]],
  ["عثمان حسين علي الاثري", ["11s-6", "11l-2"]],
  ["أحمد ياسر إبراهيم الشطي", ["11s-7", "11s-8", "12s-6"]],
  ["مصطفى احمد ابراهيم على", ["12s-1", "12s-3"]],
  ["محمد فهد محمد فيلكاوي", ["12s-2", "12s-7", "12l-2"]],
  ["حمد عماد حمد العون", ["12s-4", "12s-5"]],
  ["ممدوح صديق ابوالحسن", ["12l-1"]]
];
const MAX_DONE = { ie: 26, qr: 13 };

function doGet() {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("قسم التربية الإسلامية · ثانوية أحمد الربعي")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// ======================= واجهة الموقع الخارجي (GitHub Pages) =======================
// الصفحة المستضافة خارج جوجل ترسل الطلبات هنا، فلا يتأثر المعلم بتعدد حسابات جوجل في متصفحه.
const API = { login, saveEntry, headData, submitAchievement, myAchievements, deleteAchievement, allAchievements, saveReport,
  getPhoto, listMinutes, getMinute, saveMinute, deleteMinute, signMinute, mySignature, saveFileToDrive };

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    const f = Object.prototype.hasOwnProperty.call(API, req.fn) ? API[req.fn] : null;
    if (!f) throw new Error("طلب غير معروف.");
    out = { ok: true, result: f.apply(null, Array.isArray(req.args) ? req.args : []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ======================= الإعداد =======================

/** يُشغَّل بعد كل تحديث للكود. لا يحذف شيئًا، يضيف الناقص فقط */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let codes = ss.getSheetByName(SHEET_CODES);
  if (!codes) {
    codes = ss.insertSheet(SHEET_CODES);
    codes.appendRow(["المعلم", "الرمز", "رئيس القسم", "ملاحظة"]);
    TEACHERS.forEach(t => codes.appendRow([t[0], newCode_(), t[2] ? "نعم" : "", ""]));
    codes.setRightToLeft(true);
    codes.getRange("B:B").setNumberFormat("@");
    codes.setFrozenRows(1);
    codes.autoResizeColumns(1, 4);
  }
  sheet_(SHEET_DATA, ["المفتاح", "الفصل", "المادة", "المعلم", "الحصص المنجزة", "آخر ما أُنجز", "ملاحظة", "آخر تحديث"], false);
  sheet_(SHEET_LOG, ["الوقت", "المعلم", "الفصل", "المادة", "الحصص المنجزة", "ملاحظة"], false);
  sheet_(SHEET_ACH, ["المعرف", "المعلم", "التاريخ", "النوع", "العنوان", "الفئة المستهدفة", "وصف المعلم", "الصور", "الحالة", "التقرير", "تاريخ الرفع", "تاريخ الصياغة"], true);
  sheet_(SHEET_MIN, ["المعرف", "العنوان", "التاريخ", "الوقت", "المكان", "الحضور", "جدول الأعمال", "ما دار في الاجتماع", "التوصيات", "تاريخ الإنشاء"], true);
  sheet_(SHEET_SIG, ["المحضر", "المعلم", "وقت التوقيع", "التوقيع"], true);
  sheet_(SHEET_MYSIG, ["المعلم", "التوقيع", "آخر تحديث"], true);
  folder_();
  const first = ss.getSheets()[0];
  if (first.getName() !== SHEET_CODES && first.getLastRow() === 0 && ss.getSheets().length > 3) ss.deleteSheet(first);
}

function sheet_(name, headers, asText) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setRightToLeft(true);
    sh.setFrozenRows(1);
    if (asText) sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat("@");
  }
  return sh;
}

/** مجلد Drive لصور الإنجازات والتقارير المحفوظة */
function folder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("موقع قسم التربية الإسلامية - الملفات");
  props.setProperty("FOLDER_ID", f.getId());
  return f;
}

function newCode_() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function newId_() { return Utilities.getUuid().replace(/-/g, "").slice(0, 10); }
function nowText_() { return Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd HH:mm"); }
function sh_(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function rows_(name) { return sh_(name).getDataRange().getDisplayValues(); }

/** يكتب صفًا كنص (حتى لا تحوّل الورقة التواريخ تلقائيًا) */
function writeRow_(sh, rowIndex, values) {
  const rg = sh.getRange(rowIndex, 1, 1, values.length);
  rg.setNumberFormat("@");
  rg.setValues([values.map(v => v == null ? "" : String(v))]);
}
function appendText_(sh, values) { writeRow_(sh, sh.getLastRow() + 1, values); }
function findRow_(sh, col, value) {
  const vals = sh.getRange(1, col, Math.max(sh.getLastRow(), 1), 1).getDisplayValues();
  for (let i = 1; i < vals.length; i++) if (vals[i][0] === value) return i + 1;
  return -1;
}
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/** يتحقق من الرمز ويعيد المعلم، أو يرمي خطأ */
function who_(code) {
  code = String(code || "").trim().toUpperCase();
  if (code.length < 6) throw new Error("الرمز غير صحيح.");
  const rows = sh_(SHEET_CODES).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toUpperCase() === code) {
      const name = String(rows[i][0]).trim();
      const t = TEACHERS.find(x => x[0] === name);
      if (!t) throw new Error("الاسم في ورقة الرموز لا يطابق قائمة المعلمين.");
      return { name, classes: t[1], isHead: String(rows[i][2]).trim() === "نعم" };
    }
  }
  Utilities.sleep(800); // يبطّئ محاولات التخمين
  throw new Error("الرمز غير صحيح.");
}
function head_(code) {
  const me = who_(code);
  if (!me.isHead) throw new Error("هذه الصلاحية لرئيس القسم فقط.");
  return me;
}

// ======================= ما قطع من المنهج =======================

function readEntries_() {
  const rows = sh_(SHEET_DATA).getDataRange().getValues();
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    out[r[0]] = { done: Number(r[4]), note: String(r[6] || ""), teacher: String(r[3]), updatedAt: r[7] ? new Date(r[7]).toISOString() : null };
  }
  return out;
}

function login(code) {
  const me = who_(code);
  const all = readEntries_();
  const mine = {};
  me.classes.forEach(c => ["ie", "qr"].forEach(s => { const k = c + "__" + s; if (all[k]) mine[k] = all[k]; }));
  return { name: me.name, classes: me.classes, isHead: me.isHead, entries: mine, all: me.isHead ? all : null };
}

function saveEntry(code, classId, subject, done, note, label) {
  const me = who_(code);
  if (me.classes.indexOf(classId) === -1) throw new Error("هذا الفصل ليس من فصولك.");
  if (!MAX_DONE[subject]) throw new Error("المادة غير معروفة.");
  done = Math.floor(Number(done));
  if (!(done >= 0 && done <= MAX_DONE[subject])) throw new Error("قيمة غير صحيحة.");
  note = String(note || "").slice(0, 300);
  label = String(label || "").slice(0, 200);
  const key = classId + "__" + subject;
  return withLock_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_DATA);
    const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().map(r => r[0]);
    const now = new Date();
    const row = [key, classId, subject === "ie" ? "التربية الإسلامية" : "القرآن الكريم", me.name, done, label, note, now];
    const idx = keys.indexOf(key);
    if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    ss.getSheetByName(SHEET_LOG).appendRow([now, me.name, classId, row[2], done, note]);
    return { updatedAt: now.toISOString() };
  });
}

function headData(code) { head_(code); return readEntries_(); }

// ======================= إنجازات المعلمين =======================
// أعمدة ورقة الإنجازات:
// 0 المعرف | 1 المعلم | 2 التاريخ | 3 النوع | 4 العنوان | 5 الفئة المستهدفة | 6 وصف المعلم
// 7 الصور (معرفات Drive مفصولة بفاصلة) | 8 الحالة | 9 التقرير | 10 تاريخ الرفع | 11 تاريخ الصياغة

function achObj_(r, withReport) {
  const o = { id: r[0], teacher: r[1], date: r[2], type: r[3], title: r[4], target: r[5], desc: r[6],
    photos: r[7] ? r[7].split(",").filter(Boolean) : [], status: r[8] || ST_PENDING, createdAt: r[10], reportedAt: r[11] };
  if (withReport) o.report = r[9];
  return o;
}

function submitAchievement(code, a) {
  const me = who_(code);
  const title = String(a.title || "").trim().slice(0, 150);
  const desc = String(a.desc || "").trim().slice(0, 3000);
  if (!title) throw new Error("اكتب عنوان النشاط.");
  if (desc.length < 10) throw new Error("اكتب وصفًا للنشاط ولو بسطرين.");
  const photos = (a.photos || []).slice(0, 4);
  const folder = folder_();
  const id = newId_();
  const ids = photos.map((b64, i) => {
    const blob = Utilities.newBlob(Utilities.base64Decode(String(b64).replace(/^data:image\/\w+;base64,/, "")), "image/jpeg", `${id}-${i + 1}.jpg`);
    return folder.createFile(blob).getId();
  });
  withLock_(() => appendText_(sh_(SHEET_ACH), [id, me.name, String(a.date || "").slice(0, 10), String(a.type || "").slice(0, 60), title,
    String(a.target || "").slice(0, 150), desc, ids.join(","), ST_PENDING, "", nowText_(), ""]));
  return { id };
}

/** إنجازات المعلم نفسه — بدون نص التقرير */
function myAchievements(code) {
  const me = who_(code);
  return rows_(SHEET_ACH).slice(1).filter(r => r[0] && r[1] === me.name).map(r => achObj_(r, false)).reverse();
}

function deleteAchievement(code, id) {
  const me = who_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_ACH), row = findRow_(sh, 1, id);
    if (row < 0) throw new Error("الإنجاز غير موجود.");
    const r = sh.getRange(row, 1, 1, 12).getDisplayValues()[0];
    if (!me.isHead && (r[1] !== me.name || r[8] === ST_READY)) throw new Error("لا يمكن حذف هذا الإنجاز.");
    (r[7] || "").split(",").filter(Boolean).forEach(fid => { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} });
    sh.deleteRow(row);
    return true;
  });
}

/** لرئيس القسم: كل الإنجازات مع التقارير */
function allAchievements(code) {
  head_(code);
  return rows_(SHEET_ACH).slice(1).filter(r => r[0]).map(r => achObj_(r, true)).reverse();
}

function saveReport(code, id, text) {
  head_(code);
  text = String(text || "").slice(0, 20000);
  return withLock_(() => {
    const sh = sh_(SHEET_ACH), row = findRow_(sh, 1, id);
    if (row < 0) throw new Error("الإنجاز غير موجود.");
    const r = sh.getRange(row, 1, 1, 12).getDisplayValues()[0];
    r[9] = text; r[8] = text.trim() ? ST_READY : ST_PENDING; r[11] = text.trim() ? nowText_() : "";
    writeRow_(sh, row, r);
    return { status: r[8], reportedAt: r[11] };
  });
}

/** يعيد صورة إنجاز: لصاحب الإنجاز أو رئيس القسم فقط */
function getPhoto(code, fileId) {
  const me = who_(code);
  const r = rows_(SHEET_ACH).slice(1).find(x => (x[7] || "").split(",").indexOf(fileId) !== -1);
  if (!r || (!me.isHead && r[1] !== me.name)) throw new Error("لا تملك صلاحية عرض هذه الصورة.");
  const blob = DriveApp.getFileById(fileId).getBlob();
  return "data:image/jpeg;base64," + Utilities.base64Encode(blob.getBytes());
}

// ======================= محاضر الاجتماعات =======================
// أعمدة المحاضر: 0 المعرف | 1 العنوان | 2 التاريخ | 3 الوقت | 4 المكان | 5 الحضور (JSON)
// 6 جدول الأعمال | 7 ما دار في الاجتماع | 8 التوصيات | 9 تاريخ الإنشاء

function minObj_(r) {
  let att = [];
  try { att = JSON.parse(r[5] || "[]"); } catch (e) {}
  return { id: r[0], title: r[1], date: r[2], time: r[3], place: r[4], attendees: att, agenda: r[6], discussion: r[7], decisions: r[8], createdAt: r[9] };
}
function sigRows_() { return rows_(SHEET_SIG).slice(1).filter(r => r[0]); }

function listMinutes(code) {
  const me = who_(code);
  const sigs = sigRows_();
  return rows_(SHEET_MIN).slice(1).filter(r => r[0]).map(r => {
    const m = minObj_(r);
    const mine = sigs.find(s => s[0] === m.id && s[1] === me.name);
    return { id: m.id, title: m.title, date: m.date, attendees: m.attendees,
      signedCount: sigs.filter(s => s[0] === m.id).length, mySignedAt: mine ? mine[2] : "" };
  }).reverse();
}

/** المحضر كاملًا. رئيس القسم يرى صور كل التواقيع، والمعلم يرى توقيعه فقط */
function getMinute(code, id) {
  const me = who_(code);
  const r = rows_(SHEET_MIN).slice(1).find(x => x[0] === id);
  if (!r) throw new Error("المحضر غير موجود.");
  const m = minObj_(r);
  m.signatures = sigRows_().filter(s => s[0] === id).map(s => ({ teacher: s[1], signedAt: s[2], image: (me.isHead || s[1] === me.name) ? s[3] : "" }));
  return m;
}

function saveMinute(code, m) {
  head_(code);
  const title = String(m.title || "").trim().slice(0, 150);
  if (!title) throw new Error("اكتب عنوان الاجتماع.");
  const names = TEACHERS.map(t => t[0]);
  const att = (m.attendees || []).filter(n => names.indexOf(n) !== -1);
  return withLock_(() => {
    const sh = sh_(SHEET_MIN);
    const id = m.id || newId_();
    const row = m.id ? findRow_(sh, 1, m.id) : -1;
    const created = row > 0 ? sh.getRange(row, 10).getDisplayValue() : nowText_();
    const values = [id, title, String(m.date || "").slice(0, 10), String(m.time || "").slice(0, 20), String(m.place || "").slice(0, 100),
      JSON.stringify(att), String(m.agenda || "").slice(0, 5000), String(m.discussion || "").slice(0, 15000), String(m.decisions || "").slice(0, 8000), created];
    if (row > 0) writeRow_(sh, row, values); else appendText_(sh, values);
    return { id };
  });
}

function deleteMinute(code, id) {
  head_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_MIN), row = findRow_(sh, 1, id);
    if (row > 0) sh.deleteRow(row);
    const sig = sh_(SHEET_SIG), vals = sig.getDataRange().getDisplayValues();
    for (let i = vals.length - 1; i >= 1; i--) if (vals[i][0] === id) sig.deleteRow(i + 1);
    return true;
  });
}

function signMinute(code, id, image) {
  const me = who_(code);
  image = String(image || "");
  if (!/^data:image\/png;base64,/.test(image) || image.length > 48000) throw new Error("التوقيع غير صالح، ارسمه مرة أخرى.");
  const r = rows_(SHEET_MIN).slice(1).find(x => x[0] === id);
  if (!r) throw new Error("المحضر غير موجود.");
  if (minObj_(r).attendees.indexOf(me.name) === -1) throw new Error("اسمك ليس ضمن حضور هذا الاجتماع.");
  return withLock_(() => {
    const sh = sh_(SHEET_SIG), vals = sh.getDataRange().getDisplayValues();
    for (let i = 1; i < vals.length; i++) if (vals[i][0] === id && vals[i][1] === me.name) throw new Error("وقّعت على هذا المحضر من قبل.");
    const at = nowText_();
    appendText_(sh, [id, me.name, at, image]);
    // يحفظ التوقيع ليستخدمه المعلم لاحقًا بضغطة زر
    const my = sh_(SHEET_MYSIG), row = findRow_(my, 1, me.name);
    if (row > 0) writeRow_(my, row, [me.name, image, at]); else appendText_(my, [me.name, image, at]);
    return { signedAt: at };
  });
}

function mySignature(code) {
  const me = who_(code);
  const r = rows_(SHEET_MYSIG).slice(1).find(x => x[0] === me.name);
  return r ? r[1] : "";
}

// ======================= حفظ الملفات في Drive =======================

function saveFileToDrive(code, name, b64) {
  head_(code);
  name = String(name || "ملف.docx").replace(/[\\/:*?"<>|]/g, "-").slice(0, 150);
  const blob = Utilities.newBlob(Utilities.base64Decode(String(b64).replace(/^data:[^,]+,/, "")),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", name);
  const f = folder_().createFile(blob);
  return f.getUrl();
}
