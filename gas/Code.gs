/**
 * موقع شعبة التربية الإسلامية — ثانوية أحمد الربعي للبنين
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
const SHEET_VIS = "الزيارات";
const SHEET_SUBS = "الاحتياط";
const SHEET_PLAN = "خطة الزيارات";
const SHEET_SCHOOL = "جدول المدرسة";
const SHEET_SWAP = "التبديلات";
const SHEET_STU = "متابعة الطلاب";
const SHEET_ROSTER = "كشوف الطلاب";
// نائب رئيس الشعبة: له صلاحية ركن الاحتياط مع رئيس الشعبة
const DEPUTY = "حمد عماد حمد العون";

const ST_PENDING = "بانتظار الصياغة";

// التنبيهات بالإيميل (تصل لرئيس الشعبة فقط)
const HEAD_EMAIL = "mazyadalqassar@gmail.com";
const SITE_URL = "https://mazyadalqassar.github.io/islamic-dept/";
const ST_READY = "جاهز";

// المعلمون وفصولهم (الجدول العام للشعبة). s = علمي، l = أدبي
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

// الحسابات التجريبية: تجرّب كل شيء، وبياناتها معزولة ولا تظهر في أي تقرير أو متابعة
const DEMOS = { "تجريبي ١": ["11s-1", "12s-2"], "تجريبي ٢": ["10-1", "11l-1"] };
const DEMO_MINUTE = "demo-minute";
function isDemo_(name) { return Object.prototype.hasOwnProperty.call(DEMOS, name); }
function demoPrefix_(me) { return me.isDemo ? "DEMO|" + me.name + "|" : ""; }

function doGet() {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("شعبة التربية الإسلامية · ثانوية أحمد الربعي")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// ======================= واجهة الموقع الخارجي (GitHub Pages) =======================
// الصفحة المستضافة خارج جوجل ترسل الطلبات هنا، فلا يتأثر المعلم بتعدد حسابات جوجل في متصفحه.
const API = { login, saveEntry, headData, submitAchievement, myAchievements, deleteAchievement, allAchievements, saveReport,
  getPhoto, listMinutes, getMinute, saveMinute, deleteMinute, signMinute, mySignature, saveFileToDrive, demoAccounts, demoAction,
  saveVisit, listVisits, getVisit, signVisit, deleteVisit, subsList, saveAbsence, deleteAbsence, visitPlan, schoolTable, importSchool, saveSwap, listSwaps, deleteSwap,
  listStudents, saveStudent, addFollow, deleteFollow, setStudentStatus, setStudentRec, deleteStudent, wipeStudents, myRoster, importRoster };

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
    codes.appendRow(["المعلم", "الرمز", "رئيس الشعبة", "ملاحظة"]);
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
  sheet_(SHEET_VIS, ["المعرف", "المعلم", "الفصل", "البطاقة", "التاريخ", "الحصة", "رقم الوحدة", "المجال", "رقم الدرس", "عنوان الدرس / السورة والآيات",
    "رقم الزيارة", "التقييمات", "التوصيات", "توقيع رئيس الشعبة", "تاريخ الإنشاء", "توقيع المعلم", "وقت توقيع المعلم", "نوع الزيارة", "الملاحظات"], true);
  sheet_(SHEET_SUBS, ["الغياب", "التاريخ", "المعلم الغائب", "الحصة", "الفصل", "المعلم البديل", "سجّله", "وقت التسجيل"], true);
  sheet_(SHEET_SCHOOL, ["المعلم", "الشعبة", "الجدول (اليوم والحصة ← الفصل والمادة)"], true);
  sheet_(SHEET_SWAP, ["المعرف", "وقت الطلب", "المعلم", "مادته", "الفصل", "تاريخ حصته", "حصته", "المعلم الثاني", "شعبته", "مادته", "تاريخ حصة الثاني", "حصة الثاني", "اسم المعلم في جدول المدرسة"], true);
  sheet_(SHEET_STU, STU_HEAD_, true);
  sheet_(SHEET_ROSTER, ["الفصل", "م", "اسم الطالب"], true);
  sheet_(SHEET_PLAN, ["الأسبوع", "التاريخ", "اليوم", "الحصة", "المعلم", "الفصل", "ملاحظة"], true);
  const existing = codes.getRange(1, 1, Math.max(codes.getLastRow(), 1), 1).getDisplayValues().map(r => r[0]);
  Object.keys(DEMOS).forEach(n => { if (existing.indexOf(n) === -1) { codes.appendRow([n, newCode_(), "", "تجريبي"]); } });
  codes.getRange("B:B").setNumberFormat("@");
  ensureDemoMinute_();
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
  const f = DriveApp.createFolder("موقع شعبة التربية الإسلامية - الملفات");
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
      if (isDemo_(name)) {
        if (String(rows[i][3]).indexOf("موقوف") !== -1) throw new Error("هذا الحساب التجريبي موقوف.");
        return { name, classes: DEMOS[name], isHead: false, isDemo: true };
      }
      const t = TEACHERS.find(x => x[0] === name);
      if (!t) throw new Error("الاسم في ورقة الرموز لا يطابق قائمة المعلمين.");
      return { name, classes: t[1], isHead: String(rows[i][2]).trim() === "نعم", isDemo: false };
    }
  }
  Utilities.sleep(800); // يبطّئ محاولات التخمين
  throw new Error("الرمز غير صحيح.");
}
function head_(code) {
  const me = who_(code);
  if (!me.isHead) throw new Error("هذه الصلاحية لرئيس الشعبة فقط.");
  return me;
}

// ======================= ما قطع من المنهج =======================

/** prefix فارغ = بيانات الشعبة الرسمية فقط، وإلا بيانات حساب تجريبي واحد */
function readEntries_(prefix) {
  prefix = prefix || "";
  const rows = sh_(SHEET_DATA).getDataRange().getValues();
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const k = String(r[0] || "");
    if (!k) continue;
    if (prefix ? k.indexOf(prefix) !== 0 : k.indexOf("DEMO|") === 0) continue;
    out[k.slice(prefix.length)] = { done: Number(r[4]), note: String(r[6] || ""), teacher: String(r[3]), updatedAt: r[7] ? new Date(r[7]).toISOString() : null };
  }
  return out;
}

function login(code) {
  const me = who_(code);
  const all = readEntries_(demoPrefix_(me));
  const mine = {};
  me.classes.forEach(c => ["ie", "qr"].forEach(s => { const k = c + "__" + s; if (all[k]) mine[k] = all[k]; }));
  return { name: me.name, classes: me.classes, isHead: me.isHead, isDemo: me.isDemo, canSubs: !me.isDemo && (me.isHead || me.name === DEPUTY), entries: mine, all: me.isHead ? all : null };
}

function saveEntry(code, classId, subject, done, note, label) {
  const me = who_(code);
  if (me.classes.indexOf(classId) === -1) throw new Error("هذا الفصل ليس من فصولك.");
  if (!MAX_DONE[subject]) throw new Error("المادة غير معروفة.");
  done = Math.floor(Number(done));
  if (!(done >= 0 && done <= MAX_DONE[subject])) throw new Error("قيمة غير صحيحة.");
  note = String(note || "").slice(0, 300);
  label = String(label || "").slice(0, 200);
  const key = demoPrefix_(me) + classId + "__" + subject;
  return withLock_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_DATA);
    const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().map(r => r[0]);
    const now = new Date();
    const row = [key, classId, subject === "ie" ? "التربية الإسلامية" : "القرآن الكريم", me.name, done, label, note, now];
    const idx = keys.indexOf(key);
    if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    if (!me.isDemo) ss.getSheetByName(SHEET_LOG).appendRow([now, me.name, classId, row[2], done, note]);
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
  const blobs = [];
  const ids = photos.map((b64, i) => {
    const blob = Utilities.newBlob(Utilities.base64Decode(String(b64).replace(/^data:image\/\w+;base64,/, "")), "image/jpeg", `${id}-${i + 1}.jpg`);
    blobs.push(blob);
    return folder.createFile(blob).getId();
  });
  const row = [id, me.name, String(a.date || "").slice(0, 10), String(a.type || "").slice(0, 60), title,
    String(a.target || "").slice(0, 150), desc, ids.join(","), ST_PENDING, "", nowText_(), ""];
  withLock_(() => appendText_(sh_(SHEET_ACH), row));
  notify_(me, `إنجاز جديد: ${title} — أ. ${me.name}`, `
    <p>رفع <b>أ. ${esc_(me.name)}</b> إنجازًا جديدًا في موقع الشعبة، وهو بانتظار الصياغة.</p>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #e6e1db">
      <tr><td style="background:#fbeee3"><b>العنوان</b></td><td>${esc_(title)}</td></tr>
      <tr><td style="background:#fbeee3"><b>النوع</b></td><td>${esc_(row[3])}</td></tr>
      <tr><td style="background:#fbeee3"><b>التاريخ</b></td><td>${esc_(row[2])}</td></tr>
      <tr><td style="background:#fbeee3"><b>الفئة المستهدفة</b></td><td>${esc_(row[5] || "—")}</td></tr>
    </table>
    <p><b>وصف المعلم:</b><br>${esc_(desc).replace(/\n/g, "<br>")}</p>
    <p>عدد الصور: ${ids.length} (مرفقة بهذه الرسالة).</p>`, blobs);
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

/** لرئيس الشعبة: كل الإنجازات مع التقارير */
function allAchievements(code) {
  head_(code);
  return rows_(SHEET_ACH).slice(1).filter(r => r[0] && !isDemo_(r[1])).map(r => achObj_(r, true)).reverse();
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

/** يعيد صورة إنجاز: لصاحب الإنجاز أو رئيس الشعبة فقط */
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
  return rows_(SHEET_MIN).slice(1).filter(r => r[0] && (me.isDemo ? r[0] === DEMO_MINUTE : r[0] !== DEMO_MINUTE)).map(r => {
    const m = minObj_(r);
    const mine = sigs.find(s => s[0] === m.id && s[1] === me.name);
    return { id: m.id, title: m.title, date: m.date, attendees: m.attendees,
      signedCount: sigs.filter(s => s[0] === m.id).length, mySignedAt: mine ? mine[2] : "" };
  }).reverse();
}

/** المحضر كاملًا. رئيس الشعبة يرى صور كل التواقيع، والمعلم يرى توقيعه فقط */
function getMinute(code, id) {
  const me = who_(code);
  const r = rows_(SHEET_MIN).slice(1).find(x => x[0] === id);
  if (!r || (me.isDemo !== (id === DEMO_MINUTE))) throw new Error("المحضر غير موجود.");
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
    // عند اكتمال توقيع جميع الحضور يصل إيميل لرئيس الشعبة
    const m = minObj_(r), signed = vals.slice(1).filter(v => v[0] === id).map(v => [v[1], v[2]]).concat([[me.name, at]]);
    if (m.attendees.every(n => signed.some(x => x[0] === n))) {
      notify_(me, `اكتمل التوقيع على محضر: ${m.title}`, `
        <p>وقّع جميع الحضور (${m.attendees.length}) على محضر <b>${esc_(m.title)}</b> بتاريخ ${esc_(m.date)}.</p>
        <ul>${signed.map(x => `<li>${esc_(x[0])} — ${esc_(x[1])}</li>`).join("")}</ul>
        <p>يمكنك الآن تنزيل المحضر وورد بالتواقيع من ركن «محاضر الاجتماعات».</p>`);
    }
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

// ======================= الحسابات التجريبية =======================

function ensureDemoMinute_() {
  const sh = sh_(SHEET_MIN);
  if (findRow_(sh, 1, DEMO_MINUTE) > 0) return;
  appendText_(sh, [DEMO_MINUTE, "محضر تجريبي للعرض", Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd"), "الحصة الخامسة", "غرفة شعبة التربية الإسلامية",
    JSON.stringify(Object.keys(DEMOS)), "مثال على بند من جدول الأعمال\nمثال على بند ثانٍ",
    "هذا محضر تجريبي يوضح طريقة الاطلاع على المحاضر والتوقيع عليها إلكترونيًا.", "مثال على توصية\nمثال على توصية ثانية", nowText_()]);
}

/** لرئيس الشعبة: حالة الحسابات التجريبية */
function demoAccounts(code) {
  head_(code);
  const rows = sh_(SHEET_CODES).getDataRange().getDisplayValues();
  const entries = sh_(SHEET_DATA).getRange(1, 1, Math.max(sh_(SHEET_DATA).getLastRow(), 1), 1).getDisplayValues().map(r => r[0]);
  const ach = rows_(SHEET_ACH).slice(1), sigs = sigRows_();
  return Object.keys(DEMOS).map(n => {
    const r = rows.find(x => x[0] === n) || [];
    return { name: n, code: r[1] || "", active: String(r[3] || "").indexOf("موقوف") === -1,
      entries: entries.filter(k => k.indexOf("DEMO|" + n + "|") === 0).length,
      achievements: ach.filter(a => a[1] === n).length, signatures: sigs.filter(x => x[1] === n).length };
  });
}

/** action: toggle (إيقاف/تفعيل) · wipe (مسح بياناته) · newcode (رمز جديد) */
function demoAction(code, name, action) {
  head_(code);
  if (!isDemo_(name)) throw new Error("ليس حسابًا تجريبيًا.");
  return withLock_(() => {
    const codes = sh_(SHEET_CODES), row = findRow_(codes, 1, name);
    if (row < 0) throw new Error("الحساب غير موجود. شغّل setup.");
    if (action === "toggle") {
      const note = codes.getRange(row, 4).getDisplayValue();
      codes.getRange(row, 4).setValue(note.indexOf("موقوف") !== -1 ? "تجريبي" : "تجريبي - موقوف");
    } else if (action === "newcode") {
      codes.getRange(row, 2).setNumberFormat("@").setValue(newCode_());
    } else if (action === "wipe") {
      const data = sh_(SHEET_DATA), dv = data.getDataRange().getDisplayValues();
      for (let i = dv.length - 1; i >= 1; i--) if (dv[i][0].indexOf("DEMO|" + name + "|") === 0) data.deleteRow(i + 1);
      const ach = sh_(SHEET_ACH), av = ach.getDataRange().getDisplayValues();
      for (let i = av.length - 1; i >= 1; i--) if (av[i][1] === name) {
        (av[i][7] || "").split(",").filter(Boolean).forEach(fid => { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} });
        ach.deleteRow(i + 1);
      }
      const vis = sh_(SHEET_VIS), vv = vis.getDataRange().getDisplayValues();
      for (let i = vv.length - 1; i >= 1; i--) if (vv[i][1] === name) vis.deleteRow(i + 1);
      [SHEET_SIG, SHEET_MYSIG].forEach((sn, j) => {
        const sh = sh_(sn), v = sh.getDataRange().getDisplayValues();
        for (let i = v.length - 1; i >= 1; i--) if (v[i][j === 0 ? 1 : 0] === name) sh.deleteRow(i + 1);
      });
    } else throw new Error("إجراء غير معروف.");
    return true;
  });
}

// ======================= التنبيهات بالإيميل =======================

function esc_(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/** يرسل تنبيهًا لرئيس الشعبة. الحسابات التجريبية تصل بعلامة [تجريبي]. لا يوقف العملية إن فشل الإرسال */
function notify_(me, subject, html, attachments) {
  try {
    const demo = me && me.isDemo;
    MailApp.sendEmail({
      to: HEAD_EMAIL,
      subject: (demo ? "[تجريبي] " : "") + subject,
      name: "موقع شعبة التربية الإسلامية",
      htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8;color:#2b2b2b">
        ${demo ? '<p style="background:#fff4d6;padding:6px 10px;border-radius:6px">هذا تنبيه من <b>حساب تجريبي</b>، ولا يظهر في التقارير الرسمية.</p>' : ""}
        ${html}
        <p><a href="${SITE_URL}" style="color:#c8641c">فتح موقع الشعبة</a></p></div>`,
      attachments: attachments || []
    });
  } catch (e) { console.error("notify failed: " + e); }
}

/** لتجربة الإيميل من المحرر */
function testEmail() { notify_(null, "تجربة تنبيهات موقع الشعبة", "<p>وصلتك هذه الرسالة، يعني التنبيهات تعمل.</p>"); }

// ======================= الزيارات الصفية =======================
// أعمدة الزيارات: 0 المعرف | 1 المعلم | 2 الفصل | 3 البطاقة (ie | qr | tl) | 4 التاريخ | 5 الحصة | 6 رقم الوحدة | 7 المجال
// 8 رقم الدرس | 9 عنوان الدرس أو السورة والآيات | 10 رقم الزيارة | 11 التقييمات (JSON: [[المستوى، الملاحظة], ...])
// 12 التوصيات | 13 توقيع رئيس الشعبة | 14 تاريخ الإنشاء | 15 توقيع المعلم | 16 وقت توقيع المعلم
const VISIT_CARDS = { ie: "التربية الإسلامية", qr: "القرآن الكريم", tl: "حصة تلاوة" };
const VISIT_TYPES = ["استطلاعية", "توجيهية", "تقويمية"];
const VIS_COLS = 19; // 17 نوع الزيارة | 18 الملاحظات

function visObj_(r, withImages) {
  let ratings = [];
  try { ratings = JSON.parse(r[11] || "[]"); } catch (e) {}
  const o = { id: r[0], teacher: r[1], classId: r[2], card: r[3], date: r[4], period: r[5], unit: r[6], domain: r[7], lessonNo: r[8], lesson: r[9],
    number: r[10], ratings, recommendations: r[12], createdAt: r[14], teacherSignedAt: r[16], type: r[17] || "", notes: r[18] || "", demo: isDemo_(r[1]) };
  if (withImages) { o.headSig = r[13]; o.teacherSig = r[15]; }
  return o;
}
function visRows_() { return rows_(SHEET_VIS).slice(1).filter(r => r[0]); }
function validSig_(img) { return /^data:image\/png;base64,/.test(img) && img.length <= 48000; }

/** لرئيس الشعبة: إنشاء زيارة أو تعديلها (قبل توقيع المعلم) */
function saveVisit(code, v) {
  const me = head_(code);
  const teacher = String(v.teacher || "");
  const t = TEACHERS.find(x => x[0] === teacher);
  const classes = t ? t[1] : (isDemo_(teacher) ? DEMOS[teacher] : null);
  if (!classes) throw new Error("اختر المعلم.");
  if (classes.indexOf(v.classId) === -1) throw new Error("هذا الفصل ليس من فصول المعلم.");
  if (!VISIT_CARDS[v.card]) throw new Error("اختر نوع البطاقة.");
  if (VISIT_TYPES.indexOf(v.type) === -1) throw new Error("اختر نوع الزيارة.");
  const ratings = (Array.isArray(v.ratings) ? v.ratings : []).slice(0, 40).map(x => [String((x && x[0]) || "").slice(0, 30), String((x && x[1]) || "").slice(0, 300)]);
  const headSig = String(v.headSig || "");
  if (headSig && !validSig_(headSig)) throw new Error("توقيعك غير صالح، ارسمه مرة أخرى.");
  return withLock_(() => {
    const sh = sh_(SHEET_VIS);
    const row = v.id ? findRow_(sh, 1, v.id) : -1;
    let old = null;
    if (v.id) {
      if (row < 0) throw new Error("الزيارة غير موجودة.");
      old = sh.getRange(row, 1, 1, VIS_COLS).getDisplayValues()[0];
      if (old[16]) throw new Error("وقّع المعلم على هذه الزيارة، فلا يمكن تعديلها.");
    }
    const number = old ? old[10] : String(visRows_().filter(r => r[1] === teacher).length + 1);
    const values = [old ? old[0] : newId_(), teacher, v.classId, v.card, String(v.date || "").slice(0, 10), String(v.period || "").slice(0, 10),
      String(v.unit || "").slice(0, 40), String(v.domain || "").slice(0, 60), String(v.lessonNo || "").slice(0, 20), String(v.lesson || "").slice(0, 200),
      number, JSON.stringify(ratings), String(v.recommendations || "").slice(0, 3000), headSig || (old ? old[13] : ""), old ? old[14] : nowText_(), "", "",
      v.type, String(v.notes || "").slice(0, 3000)];
    if (row > 0) writeRow_(sh, row, values); else appendText_(sh, values);
    if (headSig) {
      const my = sh_(SHEET_MYSIG), r2 = findRow_(my, 1, me.name);
      if (r2 > 0) writeRow_(my, r2, [me.name, headSig, nowText_()]); else appendText_(my, [me.name, headSig, nowText_()]);
    }
    return { id: values[0], number };
  });
}

/** رئيس الشعبة يرى كل الزيارات، والمعلم يرى زياراته فقط */
function listVisits(code) {
  const me = who_(code);
  return visRows_().filter(r => me.isHead || r[1] === me.name).map(r => visObj_(r, false)).reverse();
}

function getVisit(code, id) {
  const me = who_(code);
  const r = visRows_().find(x => x[0] === id);
  if (!r || (!me.isHead && r[1] !== me.name)) throw new Error("الزيارة غير موجودة.");
  return visObj_(r, true);
}

/** توقيع المعلم على أنه اطّلع على زيارته */
function signVisit(code, id, image) {
  const me = who_(code);
  image = String(image || "");
  if (!validSig_(image)) throw new Error("التوقيع غير صالح، ارسمه مرة أخرى.");
  return withLock_(() => {
    const sh = sh_(SHEET_VIS), row = findRow_(sh, 1, id);
    if (row < 0) throw new Error("الزيارة غير موجودة.");
    const r = sh.getRange(row, 1, 1, VIS_COLS).getDisplayValues()[0];
    if (r[1] !== me.name) throw new Error("هذه الزيارة ليست لك.");
    if (r[16]) throw new Error("وقّعت على هذه الزيارة من قبل.");
    const at = nowText_();
    r[15] = image; r[16] = at;
    writeRow_(sh, row, r);
    const my = sh_(SHEET_MYSIG), r2 = findRow_(my, 1, me.name);
    if (r2 > 0) writeRow_(my, r2, [me.name, image, at]); else appendText_(my, [me.name, image, at]);
    notify_(me, `وقّع أ. ${me.name} على الزيارة الصفية رقم ${r[10]}`, `
      <p>اطّلع <b>أ. ${esc_(me.name)}</b> على الزيارة الصفية ${esc_(r[17] || "")} رقم ${esc_(r[10])} (${esc_(VISIT_CARDS[r[3]] || "")}) بتاريخ ${esc_(r[4])}، ووقّع عليها في ${esc_(at)}.</p>
      <p>يمكنك تنزيل بطاقة الزيارة موقّعة من ركن «الزيارات الصفية».</p>`);
    return { signedAt: at };
  });
}

function deleteVisit(code, id) {
  head_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_VIS), row = findRow_(sh, 1, id);
    if (row > 0) sh.deleteRow(row);
    return true;
  });
}


// ======================= الاحتياط (رئيس الشعبة ونائبه) =======================
function staff_(code) {
  const me = who_(code);
  if (me.isDemo || !(me.isHead || me.name === DEPUTY)) throw new Error("هذه الصلاحية لرئيس الشعبة ونائبه فقط.");
  return me;
}
function subsRows_() { const sh = sh_(SHEET_SUBS); return sh ? rows_(SHEET_SUBS).slice(1).filter(r => r[0]) : []; }
function subObj_(r) { return { absence: r[0], date: r[1], teacher: r[2], period: Number(r[3]), classId: r[4], sub: r[5], by: r[6], at: r[7] }; }

/** كل سجلات الاحتياط */
function subsList(code) { staff_(code); return subsRows_().map(subObj_); }

/** تسجيل غياب معلم في يوم: يستبدل سجل اليوم نفسه لهذا المعلم إن وُجد */
function saveAbsence(code, a) {
  const me = staff_(code);
  a = a || {};
  const date = String(a.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("التاريخ غير صحيح.");
  const names = TEACHERS.map(t => t[0]);
  if (names.indexOf(a.teacher) === -1) throw new Error("اختر المعلم الغائب.");
  const items = (Array.isArray(a.items) ? a.items : []).slice(0, 7).map(x => ({ period: Number(x && x.period), classId: String((x && x.classId) || "").slice(0, 20), sub: String((x && x.sub) || "") }));
  if (!items.length) throw new Error("لا توجد حصص لهذا المعلم في هذا اليوم.");
  items.forEach(x => {
    if (!(x.period >= 1 && x.period <= 7)) throw new Error("رقم الحصة غير صحيح.");
    if (x.sub && (names.indexOf(x.sub) === -1 || x.sub === a.teacher)) throw new Error("المعلم البديل غير صحيح.");
  });
  const id = date + "|" + a.teacher;
  return withLock_(() => {
    const sh = sh_(SHEET_SUBS);
    const all = sh.getDataRange().getDisplayValues();
    // لا يُكلَّف معلم بحصتين في الوقت نفسه
    items.forEach(x => {
      if (!x.sub) return;
      const clash = all.slice(1).find(r => r[1] === date && r[0] !== id && Number(r[3]) === x.period && r[5] === x.sub);
      if (clash) throw new Error("أ. " + x.sub + " مكلّف بالحصة " + x.period + " بدل أ. " + clash[2] + ".");
    });
    for (let i = all.length - 1; i >= 1; i--) if (all[i][0] === id) sh.deleteRow(i + 1);
    const now = nowText_();
    items.forEach(x => appendText_(sh, [id, date, a.teacher, x.period, x.classId, x.sub, me.name, now]));
    return subsRows_().map(subObj_);
  });
}

function deleteAbsence(code, date, teacher) {
  staff_(code);
  const id = String(date) + "|" + String(teacher);
  return withLock_(() => {
    const sh = sh_(SHEET_SUBS);
    const all = sh.getDataRange().getDisplayValues();
    for (let i = all.length - 1; i >= 1; i--) if (all[i][0] === id) sh.deleteRow(i + 1);
    return subsRows_().map(subObj_);
  });
}

// ======================= خطة الزيارات (رئيس الشعبة) =======================
function visitPlan(code) {
  head_(code);
  const sh = sh_(SHEET_PLAN);
  if (!sh) return [];
  return rows_(SHEET_PLAN).slice(1).filter(r => r[1]).map(r => ({ week: Number(r[0]), date: r[1], day: r[2], period: Number(r[3]), teacher: r[4], classId: r[5], note: r[6] }));
}

// ======================= جدول المدرسة (لتبديل الحصص) =======================
/** جدول المدرسة كاملًا لأي مستخدم مسجّل: [{name, dept, slots: {"<يوم><حصة>": [الفصول, المادة]}}] */
function schoolTable(code) {
  who_(code);
  const sh = sh_(SHEET_SCHOOL);
  if (!sh) return [];
  return rows_(SHEET_SCHOOL).slice(1).filter(r => r[0]).map(r => {
    let slots = {}; try { slots = JSON.parse(r[2] || "{}"); } catch (e) {}
    return { name: r[0], dept: r[1], slots };
  });
}

/** لرئيس الشعبة: استيراد جدول المدرسة (JSON مضغوط gzip بترميز base64: [[المعلم، الشعبة، الجدول]]) */
function importSchool(code, b64) {
  head_(code);
  const json = Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(b64), "application/x-gzip")).getDataAsString("UTF-8");
  const rows = JSON.parse(json);
  if (!Array.isArray(rows) || !rows.length) throw new Error("بيانات الجدول غير صالحة.");
  return withLock_(() => {
    const sh = sheet_(SHEET_SCHOOL, ["المعلم", "الشعبة", "الجدول (اليوم والحصة ← الفصل والمادة)"], true);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
    const rg = sh.getRange(2, 1, rows.length, 3);
    rg.setNumberFormat("@");
    rg.setValues(rows.map(r => [String(r[0]), String(r[1]), String(r[2])]));
    return rows.length;
  });
}

// ======================= التبديلات =======================
const ORD_ = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"];
const DAYS_ = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function swapObj_(r) { return { id: r[0], at: r[1], teacher: r[2], subject: r[3], classes: r[4], date: r[5], period: Number(r[6]),
  other: r[7], otherDept: r[8], otherSubject: r[9], otherDate: r[10], otherPeriod: Number(r[11]), schoolName: r[12], demo: isDemo_(r[2]) }; }
function swapSheet_() { return sh_(SHEET_SWAP) || sheet_(SHEET_SWAP, ["المعرف", "وقت الطلب", "المعلم", "مادته", "الفصل", "تاريخ حصته", "حصته", "المعلم الثاني", "شعبته", "مادته", "تاريخ حصة الثاني", "حصة الثاني", "اسم المعلم في جدول المدرسة"], true); }
function dayOf_(iso) { const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? DAYS_[new Date(+m[1], +m[2] - 1, +m[3]).getDay()] : ""; }
function dmy_(iso) { const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : iso; }

/** يسجّل طلب تبديل ويرسل إيميلًا لرئيس الشعبة مع النموذج (وورد) */
function saveSwap(code, s, docB64) {
  const me = who_(code);
  s = s || {};
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(s.date) || !iso.test(s.otherDate)) throw new Error("التاريخ غير صحيح.");
  const p1 = Number(s.period), p2 = Number(s.otherPeriod);
  if (!(p1 >= 1 && p1 <= 7 && p2 >= 1 && p2 <= 7)) throw new Error("رقم الحصة غير صحيح.");
  const clip = (v, n) => String(v || "").slice(0, n);
  const row = [newId_(), nowText_(), me.name, clip(s.subject, 60), clip(s.classes, 60), s.date, p1, clip(s.other, 80), clip(s.otherDept, 80), clip(s.otherSubject, 60), s.otherDate, p2, clip(s.schoolName, 80)];
  withLock_(() => appendText_(swapSheet_(), row));
  const o = swapObj_(row.map(String));
  let att = [];
  if (docB64 && String(docB64).length < 2000000) {
    try { att = [Utilities.newBlob(Utilities.base64Decode(String(docB64).replace(/^data:[^,]+,/, "")), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", `نموذج طلب تبديل الحصة - ${me.name}.docx`)]; } catch (e) {}
  }
  notify_(me, `طلب تبديل حصة: أ. ${me.name} مع أ. ${o.other}`, `
    <p>سجّل <b>أ. ${esc_(me.name)}</b> طلب تبديل حصة مع <b>أ. ${esc_(o.other)}</b> (${esc_(o.otherDept)}) في الفصل ${esc_(clip(s.classLabel, 60) || o.classes)}:</p>
    <table style="border-collapse:collapse" cellpadding="6" border="1">
      <tr style="background:#fbeee3"><th>المعلم</th><th>المادة</th><th>من الحصة</th><th>إلى الحصة</th><th>اليوم والتاريخ</th></tr>
      <tr><td>أ. ${esc_(me.name)}</td><td>${esc_(o.subject)}</td><td>${ORD_[p1]}</td><td>${ORD_[p2]}</td><td>${dayOf_(o.date)} ${dmy_(o.date)}${o.date !== o.otherDate ? " ← " + dayOf_(o.otherDate) + " " + dmy_(o.otherDate) : ""}</td></tr>
      <tr><td>أ. ${esc_(o.other)}</td><td>${esc_(o.otherSubject)}</td><td>${ORD_[p2]}</td><td>${ORD_[p1]}</td><td>${dayOf_(o.otherDate)} ${dmy_(o.otherDate)}${o.date !== o.otherDate ? " ← " + dayOf_(o.date) + " " + dmy_(o.date) : ""}</td></tr>
    </table><p>النموذج مرفق بصيغة وورد للطباعة والتوقيع، وتجده أيضًا في الموقع: بدّل حصتي ← سجل التبديلات.</p>`, att);
  return o;
}

/** رئيس الشعبة: كل التبديلات (التجريبية معلّمة) · المعلم: تبديلاته فقط */
function listSwaps(code) {
  const me = who_(code);
  const sh = sh_(SHEET_SWAP); if (!sh) return [];
  return rows_(SHEET_SWAP).slice(1).filter(r => r[0] && (me.isHead || r[2] === me.name)).map(swapObj_).reverse();
}
function deleteSwap(code, id) {
  const me = who_(code);
  return withLock_(() => {
    const sh = swapSheet_(), row = findRow_(sh, 1, String(id));
    if (row < 0) throw new Error("الطلب غير موجود.");
    const owner = sh.getRange(row, 3).getDisplayValue();
    if (!me.isHead && owner !== me.name) throw new Error("لا يمكن حذف هذا الطلب.");
    sh.deleteRow(row);
    return true;
  });
}


// ======================= متابعة الطلاب (المتعثرون والفائقون) =======================
// الخصوصية: المعلم يرى تقاريره فقط، ورئيس الشعبة يرى الكل. لا صلاحية خاصة لنائب رئيس الشعبة هنا.
// البيانات: اسم الطالب وفصله ودرجاته فقط (لا رقم مدني ولا هاتف ولا بيانات صحية أو أسرية).
// الأعمدة: 0 المعرف | 1 النوع (weak|top) | 2 المعلم | 3 الطالب | 4 الفصل | 5 المادة | 6 تاريخ التقرير | 7 الدرجات JSON [ق1، ف1، ق2، ف2]
// 8 المظاهر JSON | 9 الوصف | 10 الإجراءات JSON | 11 التوصيات | 12 المتابعة JSON [{sem,date,action,result,by,at}] | 13 الحالة | 14 وقت الإنشاء | 15 آخر تحديث
const STU_HEAD_ = ["المعرف", "النوع", "المعلم", "الطالب", "الفصل", "المادة", "تاريخ التقرير", "الدرجات", "المظاهر", "الوصف", "الإجراءات", "التوصيات", "المتابعة", "الحالة", "وقت الإنشاء", "آخر تحديث"];
const STU_STATUS_ = ["قيد المتابعة", "تحسّن", "لم يتحسّن", "مغلق"];
function stuSheet_() { return sh_(SHEET_STU) || sheet_(SHEET_STU, STU_HEAD_, true); }
function json_(s, d) { try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }
function stuObj_(r) {
  return { id: r[0], kind: r[1], teacher: r[2], student: r[3], classId: r[4], subject: r[5], date: r[6], grades: json_(r[7], ["", "", "", ""]),
    signs: json_(r[8], []), desc: r[9], actions: json_(r[10], []), rec: r[11], follow: json_(r[12], []), status: r[13], createdAt: r[14], updatedAt: r[15], demo: isDemo_(r[2]) };
}
function stuRows_() { const sh = sh_(SHEET_STU); return sh ? rows_(SHEET_STU).slice(1).filter(r => r[0]) : []; }
function canSee_(me, o) { return me.isHead || o.teacher === me.name; }
/** يعيد الصف (رقمه وكائنه) بعد التحقق من الصلاحية */
function stuGet_(me, sh, id) {
  const row = findRow_(sh, 1, String(id));
  if (row < 0) throw new Error("التقرير غير موجود.");
  const o = stuObj_(sh.getRange(row, 1, 1, STU_HEAD_.length).getDisplayValues()[0]);
  if (!canSee_(me, o)) throw new Error("لا يمكنك الوصول إلى هذا التقرير.");
  return { row, o };
}
function stuWrite_(sh, row, o) {
  const v = [o.id, o.kind, o.teacher, o.student, o.classId, o.subject, o.date, JSON.stringify(o.grades), JSON.stringify(o.signs), o.desc, JSON.stringify(o.actions), o.rec,
    JSON.stringify(o.follow), o.status, o.createdAt, nowText_()];
  const rg = sh.getRange(row, 1, 1, v.length); rg.setNumberFormat("@"); rg.setValues([v.map(String)]);
}

/** رئيس الشعبة: كل التقارير (التجريبية معلّمة) · المعلم: تقاريره فقط */
function listStudents(code) {
  const me = who_(code);
  return stuRows_().map(stuObj_).filter(o => canSee_(me, o)).reverse();
}

/** إنشاء تقرير أو تعديله (صاحب التقرير فقط). عند الإنشاء يصل رئيس الشعبة إيميل مرفق فيه التقرير وورد */
function saveStudent(code, s, docB64) {
  const me = who_(code);
  s = s || {};
  const clip = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const list = (a, n) => (Array.isArray(a) ? a : []).slice(0, 20).map(x => clip(x, n)).filter(Boolean);
  const kind = s.kind === "top" ? "top" : s.kind === "weak" ? "weak" : "";
  if (!kind) throw new Error("اختر نوع التقرير.");
  const student = clip(s.student, 80);
  if (student.length < 3) throw new Error("اكتب اسم الطالب.");
  if (me.classes.indexOf(s.classId) === -1) throw new Error("هذا الفصل ليس من فصولك.");
  if (["ie", "qr"].indexOf(s.subject) === -1) throw new Error("اختر المادة.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s.date || ""))) throw new Error("التاريخ غير صحيح.");
  const grades = [0, 1, 2, 3].map(i => clip((s.grades || [])[i], 20));
  const o = { kind, teacher: me.name, student, classId: s.classId, subject: s.subject, date: s.date, grades, signs: list(s.signs, 120), desc: clip(s.desc, 2000),
    actions: list(s.actions, 160) };
  if (!o.signs.length) throw new Error(kind === "weak" ? "اختر مظهرًا واحدًا على الأقل من مظاهر التعثر." : "اختر مظهرًا واحدًا على الأقل من مظاهر التفوق.");
  if (!o.actions.length) throw new Error(kind === "weak" ? "اختر إجراءً علاجيًا واحدًا على الأقل." : "اختر نشاطًا إثرائيًا واحدًا على الأقل.");
  const isNew = !s.id;
  const saved = withLock_(() => {
    const sh = stuSheet_();
    if (isNew) {
      Object.assign(o, { id: newId_(), rec: "", follow: [], status: kind === "weak" ? STU_STATUS_[0] : "", createdAt: nowText_() });
      stuWrite_(sh, sh.getLastRow() + 1, o);
      return o;
    }
    const cur = stuGet_(me, sh, s.id);
    if (cur.o.teacher !== me.name) throw new Error("يعدّل التقرير معلم المادة فقط.");
    const merged = Object.assign({}, cur.o, o, { id: cur.o.id, teacher: cur.o.teacher, rec: cur.o.rec, follow: cur.o.follow, status: cur.o.status, createdAt: cur.o.createdAt });
    if (merged.kind !== "weak") merged.status = "";
    else if (!merged.status) merged.status = STU_STATUS_[0];
    stuWrite_(sh, cur.row, merged);
    return merged;
  });
  if (isNew) {
    let att = [];
    if (docB64 && String(docB64).length < 4000000) {
      try { att = [Utilities.newBlob(Utilities.base64Decode(String(docB64).replace(/^data:[^,]+,/, "")), "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        `${kind === "weak" ? "تقرير طالب متعثر" : "تقرير طالب فائق"} - ${student}.docx`)]; } catch (e) {}
    }
    notify_(me, `${kind === "weak" ? "تقرير طالب متعثر" : "تقرير طالب فائق"}: ${student}`, `
      <p>رفع <b>أ. ${esc_(me.name)}</b> ${kind === "weak" ? "تقرير متابعة طالب متعثر" : "تقرير طالب فائق"}:</p>
      <p>الطالب: <b>${esc_(student)}</b><br>الفصل: ${esc_(clip(s.classLabel, 40) || s.classId)} · المادة: ${s.subject === "qr" ? "القرآن الكريم" : "التربية الإسلامية"}</p>
      <p>التقرير مرفق بصيغة وورد للطباعة والحفظ في السجل، وتتابعه في الموقع: متابعة الطلاب.</p>
      <p style="color:#77736e;font-size:12px">سري · لأغراض المتابعة التربوية فقط.</p>`, att);
  }
  return saved;
}

/** إضافة متابعة في أحد الفصلين الدراسيين (رئيس الشعبة أو معلم المادة) */
function addFollow(code, id, f) {
  const me = who_(code);
  f = f || {};
  const sem = Number(f.sem) === 2 ? 2 : 1;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(f.date || ""))) throw new Error("التاريخ غير صحيح.");
  const action = String(f.action || "").trim().slice(0, 400), result = String(f.result || "").trim().slice(0, 300);
  if (!action) throw new Error("اكتب الإجراء.");
  return withLock_(() => {
    const sh = stuSheet_(), cur = stuGet_(me, sh, id);
    cur.o.follow.push({ sem, date: f.date, action, result, by: me.name, head: me.isHead, at: nowText_() });
    if (f.status && STU_STATUS_.indexOf(f.status) !== -1 && cur.o.kind === "weak") cur.o.status = f.status;
    stuWrite_(sh, cur.row, cur.o);
    return cur.o;
  });
}
function deleteFollow(code, id, idx) {
  const me = who_(code);
  return withLock_(() => {
    const sh = stuSheet_(), cur = stuGet_(me, sh, id), e = cur.o.follow[Number(idx)];
    if (!e) throw new Error("المتابعة غير موجودة.");
    if (!me.isHead && e.by !== me.name) throw new Error("يحذف المتابعة من كتبها فقط.");
    cur.o.follow.splice(Number(idx), 1);
    stuWrite_(sh, cur.row, cur.o);
    return cur.o;
  });
}
/** توصيات رئيس الشعبة: يكتبها رئيس الشعبة فقط، وتظهر في التقرير للجميع */
function setStudentRec(code, id, rec) {
  const me = head_(code);
  return withLock_(() => {
    const sh = stuSheet_(), cur = stuGet_(me, sh, id);
    cur.o.rec = String(rec || "").trim().slice(0, 1500); stuWrite_(sh, cur.row, cur.o);
    return cur.o;
  });
}
function setStudentStatus(code, id, status) {
  const me = who_(code);
  if (STU_STATUS_.indexOf(status) === -1) throw new Error("الحالة غير معروفة.");
  return withLock_(() => {
    const sh = stuSheet_(), cur = stuGet_(me, sh, id);
    if (cur.o.kind !== "weak") throw new Error("الحالة لتقارير المتعثرين فقط.");
    cur.o.status = status; stuWrite_(sh, cur.row, cur.o);
    return cur.o;
  });
}
function deleteStudent(code, id) {
  const me = who_(code);
  return withLock_(() => {
    const sh = stuSheet_(), cur = stuGet_(me, sh, id);
    sh.deleteRow(cur.row);
    return true;
  });
}
/** رئيس الشعبة: مسح كل تقارير الطلاب نهاية العام (لا رجعة فيه) */
function wipeStudents(code, confirm) {
  head_(code);
  if (String(confirm || "").trim() !== "مسح") throw new Error("اكتب كلمة «مسح» للتأكيد.");
  return withLock_(() => {
    const sh = stuSheet_(), n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
    return Math.max(n, 0);
  });
}


// ======================= كشوف الطلاب =======================
// الاسم الكامل والفصل فقط (بلا رقم مدني). المعلم يستلم طلاب فصوله، ورئيس الشعبة كل الفصول، والحسابات التجريبية أسماء وهمية.
function myRoster(code) {
  const me = who_(code);
  const out = {};
  if (me.isDemo) { me.classes.forEach(c => { out[c] = [1, 2, 3, 4, 5, 6].map(i => "طالب تجريبي " + i); }); return out; }
  const sh = sh_(SHEET_ROSTER); if (!sh) return out;
  rows_(SHEET_ROSTER).slice(1).forEach(r => {
    if (!r[0] || !r[2]) return;
    if (!me.isHead && me.classes.indexOf(r[0]) === -1) return;
    (out[r[0]] = out[r[0]] || []).push([Number(r[1]), r[2]]);
  });
  Object.keys(out).forEach(k => { out[k] = out[k].sort((a, b) => a[0] - b[0]).map(x => x[1]); });
  return out;
}
/** لرئيس الشعبة: استيراد الكشوف (JSON مضغوط gzip بترميز base64: [[الفصل، م، الاسم]]) ويستبدل القديم */
function importRoster(code, b64) {
  head_(code);
  const rows = JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(b64), "application/x-gzip")).getDataAsString("UTF-8"));
  if (!Array.isArray(rows) || !rows.length) throw new Error("بيانات الكشوف غير صالحة.");
  rows.forEach(r => { if (/\d{8,}/.test(String(r[2]))) throw new Error("الكشف فيه أرقام مدنية."); });
  return withLock_(() => {
    const sh = sheet_(SHEET_ROSTER, ["الفصل", "م", "اسم الطالب"], true);
    if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
    const rg = sh.getRange(2, 1, rows.length, 3);
    rg.setNumberFormat("@");
    rg.setValues(rows.map(r => [String(r[0]), String(r[1]), String(r[2])]));
    return rows.length;
  });
}
