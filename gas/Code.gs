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
const SHEET_LEAVE = "الاستئذانات";
const SHEET_EMAIL = "إيميلات المعلمين";
const SHEET_DUTY = "المراقبة";
const SHEET_GRADES = "درجات الأعمال";
const SHEET_CIRC = "التعاميم";
const SHEET_DEV = "الأجهزة";
const SHEET_PLEDGE = "التعهدات";
const SHEET_PHONES = "جوالات المعلمين"; // لا تُرفع إلى GitHub؛ لرئيس الشعبة فقط
const SHEET_CIRC_SIG = "تواقيع التعاميم";
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
  ["محمد فهد محمد الفيلكاوي", ["12s-2", "12s-7", "12l-1"]],
  ["حمد عماد حمد العون", ["12s-4", "12s-5"]],
  ["ممدوح صديق ابوالحسن", ["12l-2"]]
];
const MAX_DONE = { ie: 26, qr: 13 };

// الحسابات التجريبية: تجرّب كل شيء، وبياناتها معزولة ولا تظهر في أي تقرير أو متابعة
const DEMOS = { "تجريبي ١": ["11s-1", "12s-2"], "تجريبي ٢": ["10-1", "11l-1"], "مشاري بدر العبد الهادي": ["10-3", "11s-2", "12l-1"] };
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
  getPhoto, listMinutes, getMinute, minuteFile, saveMinute, deleteMinute, signMinute, mySignature, saveFileToDrive, demoAccounts, demoAction,
  saveVisit, listVisits, getVisit, signVisit, deleteVisit, subsList, saveAbsence, deleteAbsence, visitPlan, schoolTable, importSchool, saveSwap, listSwaps, deleteSwap,
  listStudents, saveStudent, addFollow, deleteFollow, setStudentStatus, setStudentRec, deleteStudent, wipeStudents, myRoster, importRoster,
  setMyEmail, listLeaves, saveLeave, decideLeave, deleteLeave, setLeaveActual, listDuties, importDuties, leavesDayPdf, leavesRecent, leavesPickPdf,
  gradesGet, gradesSave, gradesApprove, gradesOverview,
  listCirculars, getCircular, circularFile, saveCircular, deleteCircular, signCircular, remindCircular,
  listDevices, resetDevice, signPledge, listPledges, requestDeviceCode, verifyDeviceCode, markInviteSent,
  notifyAbsence, subsOpen, claimSub, unclaimSub, removeSub, headNews, markSeen };

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
  sheet_(SHEET_MIN, ["المعرف", "العنوان", "التاريخ", "الوقت", "المكان", "الحضور", "جدول الأعمال", "ما دار في الاجتماع", "التوصيات", "تاريخ الإنشاء", "ملف المحضر", "اسم الملف", "نوع الملف"], true);
  minFileHeaders_(sh_(SHEET_MIN));
  sheet_(SHEET_SIG, ["المحضر", "المعلم", "وقت التوقيع", "التوقيع"], true);
  sheet_(SHEET_MYSIG, ["المعلم", "التوقيع", "آخر تحديث"], true);
  sheet_(SHEET_VIS, ["المعرف", "المعلم", "الفصل", "البطاقة", "التاريخ", "الحصة", "رقم الوحدة", "المجال", "رقم الدرس", "عنوان الدرس / السورة والآيات",
    "رقم الزيارة", "التقييمات", "التوصيات", "توقيع رئيس الشعبة", "تاريخ الإنشاء", "توقيع المعلم", "وقت توقيع المعلم", "نوع الزيارة", "الملاحظات"], true);
  sheet_(SHEET_SUBS, ["الغياب", "التاريخ", "المعلم الغائب", "الحصة", "الفصل", "المعلم البديل", "سجّله", "وقت التسجيل"], true);
  sheet_(SHEET_SCHOOL, ["المعلم", "الشعبة", "الجدول (اليوم والحصة ← الفصل والمادة)"], true);
  sheet_(SHEET_SWAP, ["المعرف", "وقت الطلب", "المعلم", "مادته", "الفصل", "تاريخ حصته", "حصته", "المعلم الثاني", "شعبته", "مادته", "تاريخ حصة الثاني", "حصة الثاني", "اسم المعلم في جدول المدرسة"], true);
  sheet_(SHEET_STU, STU_HEAD_, true);
  sheet_(SHEET_ROSTER, ["الفصل", "م", "اسم الطالب"], true);
  sheet_(SHEET_LEAVE, LEAVE_HEAD_, true);
  sheet_(SHEET_EMAIL, ["المعلم", "الإيميل", "آخر تحديث"], true);
  sheet_(SHEET_DUTY, DUTY_HEAD_, true);
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
/** هوية المستخدم مع التحقق من الجهاز، ثم اشتراط الإيميل والتعهد لكل العمليات */
function who_(code) {
  const me = whoBase_(code);
  if (!me.isDemo && !me.isHead) {
    if (!gateInfo_().emails[me.name]) throw new Error("EMAIL_REQ|سجّل إيميلك أولًا ثم أعد المحاولة.");
    if (!gateInfo_().pledged[me.name]) throw new Error("PLEDGE_REQ|وقّع تعهد المحافظة على السرية أولًا.");
  }
  return me;
}
/** الهوية مع التحقق من الجهاز فقط (للدخول وتسجيل الإيميل وتوقيع التعهد) */
function whoBase_(code) {
  const parts = String(code || "").trim().toUpperCase().split("~");
  const me = whoCode_(parts[0]);
  if (!me.isDemo) checkDevice_(me, parts[1] || "", parts[2] === "C" ? "C" : "M");
  return me;
}
/** من سجّل إيميله ومن وقّع التعهد (مخزّن مؤقتًا لتسريع الطلبات) */
function gateInfo_() {
  const c = devCache_(), hit = c && c.get("gate");
  if (hit) return JSON.parse(hit);
  const emails = {}, pledged = {};
  if (sh_(SHEET_EMAIL)) rows_(SHEET_EMAIL).slice(1).forEach(r => { if (r[0] && r[1]) emails[r[0]] = 1; });
  const ps = sh_(SHEET_PLEDGE);
  if (ps && ps.getLastRow() > 1) ps.getRange(2, 1, ps.getLastRow() - 1, 1).getDisplayValues().forEach(r => { if (r[0]) pledged[r[0]] = 1; });
  const o = { emails, pledged };
  if (c) c.put("gate", JSON.stringify(o), 600);
  return o;
}
function gateReset_() { const c = devCache_(); if (c) c.remove("gate"); }
function whoCode_(code) {
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
  const me = whoBase_(code);
  const all = readEntries_(demoPrefix_(me));
  const mine = {};
  me.classes.forEach(c => ["ie", "qr"].forEach(s => { const k = c + "__" + s; if (all[k]) mine[k] = all[k]; }));
  return { pledged: me.isHead || !!pledgeMap_()[me.name], name: me.name, classes: me.classes, isHead: me.isHead, isDemo: me.isDemo, canSubs: !me.isDemo && me.isHead, email: me.isDemo ? "" : (emailOf_(me.name) || (me.isHead ? HEAD_EMAIL : "")), entries: mine, all: me.isHead ? all : null };
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
    <p>رفع <b>أ. ${esc_(me.name)}</b> إنجازًا جديدًا في موقع الشعبة، ويستطيع تنزيل تقريره بصياغته مباشرة. ويمكنك تعديل الصياغة من ركن الإنجازات متى شئت.</p>
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
  return rows_(SHEET_ACH).slice(1).filter(r => r[0] && r[1] === me.name).map(r => achObj_(r, true)).reverse();
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
  const required = r[0] === DEMO_MINUTE ? Object.keys(DEMOS) : TEACHERS.filter(t => !t[2]).map(t => t[0]);
  return { id: r[0], title: r[1], date: r[2], time: r[3], place: r[4], attendees: att, required, agenda: r[6], discussion: r[7], decisions: r[8], createdAt: r[9],
    fileId: r[10] || "", fileName: r[11] || "", mime: r[12] || "", hasFile: !!r[10] };
}
const MIN_FILE_HEAD_ = ["ملف المحضر", "اسم الملف", "نوع الملف"];
function minFileHeaders_(sh) { if (!sh.getRange(1, 11).getDisplayValue()) sh.getRange(1, 11, 1, 3).setValues([MIN_FILE_HEAD_]); }
function sigRows_() { return rows_(SHEET_SIG).slice(1).filter(r => r[0]); }

function listMinutes(code) {
  const me = who_(code);
  const sigs = sigRows_();
  return rows_(SHEET_MIN).slice(1).filter(r => r[0] && (me.isDemo ? r[0] === DEMO_MINUTE : r[0] !== DEMO_MINUTE)).map(r => {
    const m = minObj_(r);
    const mine = sigs.find(s => s[0] === m.id && s[1] === me.name);
    return { id: m.id, title: m.title, date: m.date, attendees: m.attendees, required: m.required, hasFile: m.hasFile,
      signedCount: sigs.filter(s => s[0] === m.id && m.required.indexOf(s[1]) !== -1).length, mySignedAt: mine ? mine[2] : "" };
  }).reverse();
}

/** المحضر كاملًا. رئيس الشعبة يرى صور كل التواقيع، والمعلم يرى توقيعه فقط */
function getMinute(code, id) {
  const me = who_(code);
  const r = rows_(SHEET_MIN).slice(1).find(x => x[0] === id);
  if (!r || (me.isDemo !== (id === DEMO_MINUTE))) throw new Error("المحضر غير موجود.");
  const m = minObj_(r);
  m.signatures = sigRows_().filter(s => s[0] === id).map(s => ({ teacher: s[1], signedAt: s[2], image: (me.isHead || s[1] === me.name) ? s[3] : "" }));
  delete m.fileId;
  return m;
}

/** ملف المحضر المرفق كما رفعه رئيس الشعبة (PDF أو صورة) */
function minuteFile(code, id) {
  const me = who_(code);
  const r = rows_(SHEET_MIN).slice(1).find(x => x[0] === id);
  if (!r || (me.isDemo !== (id === DEMO_MINUTE))) throw new Error("المحضر غير موجود.");
  const m = minObj_(r);
  if (!m.fileId) throw new Error("لا يوجد ملف مرفق بهذا المحضر.");
  const b = DriveApp.getFileById(m.fileId).getBlob();
  return { name: m.fileName, mime: m.mime || b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}

function saveMinute(code, m) {
  head_(code);
  const title = String(m.title || "").trim().slice(0, 150);
  if (!title) throw new Error("اكتب عنوان الاجتماع.");
  const names = TEACHERS.map(t => t[0]);
  const att = (m.attendees || []).filter(n => names.indexOf(n) !== -1);
  // ملف المحضر الجاهز (اختياري): PDF أو صورة، يُحفظ في Drive كما هو
  const file = String(m.file || "");
  let fm = null;
  if (file) {
    fm = file.match(/^data:(application\/pdf|image\/jpeg|image\/png);base64,(.+)$/);
    if (!fm) throw new Error("ملف المحضر يجب أن يكون PDF أو صورة.");
    if (fm[2].length > 11000000) throw new Error("حجم الملف كبير (الحد ٨ ميجابايت).");
  }
  const saved = withLock_(() => {
    const sh = sh_(SHEET_MIN);
    minFileHeaders_(sh);
    const id = m.id || newId_();
    const row = m.id ? findRow_(sh, 1, m.id) : -1;
    const old = row > 0 ? sh.getRange(row, 1, 1, 13).getDisplayValues()[0] : [];
    const created = row > 0 ? old[9] : nowText_();
    let fileId = old[10] || "", fileName = old[11] || "", mime = old[12] || "";
    if (fm || m.removeFile) {
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {} }
      fileId = ""; fileName = ""; mime = "";
    }
    if (fm) {
      mime = fm[1];
      fileName = String(m.fileName || "").replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || ("محضر." + (mime === "application/pdf" ? "pdf" : "jpg"));
      fileId = folder_().createFile(Utilities.newBlob(Utilities.base64Decode(fm[2]), mime, `محضر-${id}-${fileName}`)).getId();
    }
    const values = [id, title, String(m.date || "").slice(0, 10), String(m.time || "").slice(0, 20), String(m.place || "").slice(0, 100),
      JSON.stringify(att), String(m.agenda || "").slice(0, 5000), String(m.discussion || "").slice(0, 15000), String(m.decisions || "").slice(0, 8000), created,
      fileId, fileName, mime];
    if (row > 0) writeRow_(sh, row, values); else appendText_(sh, values);
    return { id, isNew: row < 0 };
  });
  if (saved.isNew) {
    const date = String(m.date || "").slice(0, 10);
    TEACHERS.filter(t => !t[2]).forEach(t => notifyTeacher_(t[0], `محضر اجتماع جديد: ${title}`, `
      <p>الأستاذ الفاضل/ ${esc_(t[0])} المحترم،</p>
      <p>نُشر في موقع شعبة التربية الإسلامية <b>محضر اجتماع جديد</b>، يرجى الاطلاع عليه و${att.indexOf(t[0]) === -1 ? "التوقيع بالعلم" : "التوقيع عليه"}.</p>
      <p style="background:#fbeee3;padding:8px 12px;border-radius:8px"><b>${esc_(title)}</b>${date ? `<br>${dayOf_(date)} ${dmy_(date)}` : ""}</p>
      <p>تجده في ركن «محاضر الاجتماعات».</p><p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`));
  }
  return { id: saved.id };
}

function deleteMinute(code, id) {
  head_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_MIN), row = findRow_(sh, 1, id);
    if (row > 0) {
      const fid = sh.getRange(row, 11).getDisplayValue();
      if (fid) { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} }
      sh.deleteRow(row);
    }
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
  if (minObj_(r).required.indexOf(me.name) === -1) throw new Error("هذا المحضر لا يتطلب توقيعك.");
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
    if (m.required.every(n => signed.some(x => x[0] === n))) {
      notify_(me, `اكتمل التوقيع على محضر: ${m.title}`, `
        <p>وقّع جميع المعلمين (${m.required.length}) على محضر <b>${esc_(m.title)}</b> بتاريخ ${esc_(m.date)}، من حضر منهم ومن وقّع بالعلم.</p>
        <ul>${signed.map(x => `<li>${esc_(x[0])} — ${esc_(x[1])}</li>`).join("")}</ul>
        <p>يمكنك الآن تنزيل المحضر PDF بالتواقيع من ركن «محاضر الاجتماعات».</p>`);
    }
    return { signedAt: at };
  });
}

function mySignature(code) {
  const me = whoBase_(code);
  const r = rows_(SHEET_MYSIG).slice(1).find(x => x[0] === me.name);
  return r ? r[1] : "";
}

// ======================= حفظ الملفات في Drive =======================

const DOCX_MIME_ = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
function docMime_(d) { return /^data:application\/pdf/.test(String(d)) ? "application/pdf" : DOCX_MIME_; }
function docExt_(d) { return docMime_(d) === "application/pdf" ? "pdf" : "docx"; }
function saveFileToDrive(code, name, b64) {
  head_(code);
  name = String(name || "ملف.pdf").replace(/[\\/:*?"<>|]/g, "-").slice(0, 150);
  const blob = Utilities.newBlob(Utilities.base64Decode(String(b64).replace(/^data:[^,]+,/, "")), docMime_(b64), name);
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
  const saved = withLock_(() => {
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
    return { id: values[0], number, isNew: !old };
  });
  if (saved.isNew) notifyTeacher_(teacher, `زيارة صفية جديدة · ${dmy_(String(v.date || "").slice(0, 10))}`, `
    <p>الأستاذ الفاضل/ ${esc_(teacher)} المحترم،</p>
    <p>سجّل رئيس الشعبة <b>زيارة صفية ${esc_(v.type)}</b> لك (رقم ${esc_(saved.number)})، يرجى الاطلاع عليها والتوقيع.</p>
    <p style="background:#fbeee3;padding:8px 12px;border-radius:8px">${esc_(VISIT_CARDS[v.card])} · ${esc_(grLabel_(v.classId))}<br>${dayOf_(String(v.date || "").slice(0, 10))} ${dmy_(String(v.date || "").slice(0, 10))}${v.period ? " · الحصة " + esc_(v.period) : ""}</p>
    <p>تجدها في ركن «الزيارات الصفية».</p><p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`);
  return { id: saved.id, number: saved.number };
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


// ======================= الاحتياط (رئيس الشعبة فقط؛ أُلغيت صلاحية نائب رئيس الشعبة ٢٣/١٠/٢٠٢٦) =======================
function staff_(code) {
  const me = who_(code);
  if (me.isDemo || !me.isHead) throw new Error("هذه الصلاحية لرئيس الشعبة فقط.");
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
    // الصيغة المختصرة: "11s-1" = فصل (المادة من القسم)، "*Q" اجتماع القسم، "*B" اجتماع مجلس الإدارة، "*نص" نشاط آخر
    const subj = String(r[1] || "").replace(/^قسم\s+/, "");
    Object.keys(slots).forEach(k => { const v = slots[k]; if (typeof v === "string")
      slots[k] = v === "*Q" ? ["", "اجتماع القسم وتنمية مهنية"] : v === "*B" ? ["", "اجتماع مجلس الإدارة"] : v.charAt(0) === "*" ? ["", v.slice(1)] : [v, subj]; });
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

/** يسجّل طلب تبديل ويرسل إيميلًا لرئيس الشعبة مع النموذج (PDF) */
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
    try { att = [Utilities.newBlob(Utilities.base64Decode(String(docB64).replace(/^data:[^,]+,/, "")), docMime_(docB64), `نموذج طلب تبديل الحصة - ${me.name}.${docExt_(docB64)}`)]; } catch (e) {}
  }
  notify_(me, `طلب تبديل حصة: أ. ${me.name} مع أ. ${o.other}`, `
    <p>سجّل <b>أ. ${esc_(me.name)}</b> طلب تبديل حصة مع <b>أ. ${esc_(o.other)}</b> (${esc_(o.otherDept)}) في الفصل ${esc_(clip(s.classLabel, 60) || o.classes)}:</p>
    <table style="border-collapse:collapse" cellpadding="6" border="1">
      <tr style="background:#fbeee3"><th>المعلم</th><th>المادة</th><th>من الحصة</th><th>إلى الحصة</th><th>اليوم والتاريخ</th></tr>
      <tr><td>أ. ${esc_(me.name)}</td><td>${esc_(o.subject)}</td><td>${ORD_[p1]}</td><td>${ORD_[p2]}</td><td>${dayOf_(o.date)} ${dmy_(o.date)}${o.date !== o.otherDate ? " ← " + dayOf_(o.otherDate) + " " + dmy_(o.otherDate) : ""}</td></tr>
      <tr><td>أ. ${esc_(o.other)}</td><td>${esc_(o.otherSubject)}</td><td>${ORD_[p2]}</td><td>${ORD_[p1]}</td><td>${dayOf_(o.otherDate)} ${dmy_(o.otherDate)}${o.date !== o.otherDate ? " ← " + dayOf_(o.date) + " " + dmy_(o.date) : ""}</td></tr>
    </table><p>النموذج مرفق بصيغة PDF للطباعة والتوقيع، وتجده أيضًا في الموقع: بدّل حصتي ← سجل التبديلات.</p>`, att);
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

/** إنشاء تقرير أو تعديله (صاحب التقرير فقط). عند الإنشاء يصل رئيس الشعبة إيميل مرفق فيه التقرير PDF */
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
      try { att = [Utilities.newBlob(Utilities.base64Decode(String(docB64).replace(/^data:[^,]+,/, "")), docMime_(docB64),
        `${kind === "weak" ? "تقرير طالب متعثر" : "تقرير طالب فائق"} - ${student}.${docExt_(docB64)}`)]; } catch (e) {}
    }
    notify_(me, `${kind === "weak" ? "تقرير طالب متعثر" : "تقرير طالب فائق"}: ${student}`, `
      <p>رفع <b>أ. ${esc_(me.name)}</b> ${kind === "weak" ? "تقرير متابعة طالب متعثر" : "تقرير طالب فائق"}:</p>
      <p>الطالب: <b>${esc_(student)}</b><br>الفصل: ${esc_(clip(s.classLabel, 40) || s.classId)} · المادة: ${s.subject === "qr" ? "القرآن الكريم" : "التربية الإسلامية"}</p>
      <p>التقرير مرفق بصيغة PDF للطباعة والحفظ في السجل، وتتابعه في الموقع: متابعة الفائقين والمتعثرين.</p>
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


// ======================= إيميلات المعلمين (للإشعارات) =======================
function emailOf_(name) {
  const sh = sh_(SHEET_EMAIL); if (!sh) return "";
  const r = rows_(SHEET_EMAIL).slice(1).find(x => x[0] === name);
  return r ? String(r[1] || "") : "";
}
function setMyEmail(code, email) {
  const me = whoBase_(code);
  if (me.isDemo) throw new Error("الحساب التجريبي لا يحتاج إيميلًا.");
  email = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) throw new Error("اكتب إيميلًا صحيحًا.");
  withLock_(() => {
    const sh = sh_(SHEET_EMAIL) || sheet_(SHEET_EMAIL, ["المعلم", "الإيميل", "آخر تحديث"], true);
    const row = findRow_(sh, 1, me.name);
    writeRow_(sh, row > 0 ? row : sh.getLastRow() + 1, [me.name, email, nowText_()]);
  });
  gateReset_();
  return email;
}
/** يرسل إشعارًا لمعلم على إيميله المسجّل (لا يُرسل للحسابات التجريبية ولا لمن لم يسجّل إيميله) */
function notifyTeacher_(name, subject, html) {
  if (isDemo_(name)) return false;
  const to = emailOf_(name); if (!to) return false;
  try {
    MailApp.sendEmail({ to, subject, name: "موقع شعبة التربية الإسلامية",
      htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8;color:#2b2b2b">${html}
        <p><a href="${SITE_URL}" style="color:#c8641c">فتح موقع الشعبة</a></p></div>` });
    return true;
  } catch (e) { console.error("notifyTeacher failed: " + e); return false; }
}

// ======================= الاستئذانات =======================
// المعلم يرى استئذاناته فقط، ورئيس الشعبة يرى الكل. الخطوات: طلب ← موافقة رئيس الشعبة (والمعلم يقدّم الإذن في الديوان بنفسه).
// المعلم لا يحدد الدقيقة مسبقًا: الموقع يحسب «الوقت المطلوب» من التزاماته (حصص ومراقبات)، وبعد البصمة يسجّل وقته الفعلي.
// الأعمدة: 0 المعرف | 1 المعلم | 2 النوع | 3 التاريخ | 4 بداية الفترة (للخروج أثناء الدوام) | 5 الوقت المطلوب | 6 السبب
// (E و F: الأوقات التقريبية التي كتبها المعلم: الخروج/الانصراف والحضور/العودة)
// 7 الالتزامات التي سيفوّتها والبدلاء JSON [{kind, label, time, sub}] | 8 الحالة | 9 ملاحظة رئيس الشعبة | 10 وقت الطلب
// 11 وقت قرار رئيس الشعبة | 12 وقت قرار المدير | 13 سجّل قرار المدير | 14 وقت البصمة الفعلي | 15 تواصل مع البدلاء
const LEAVE_HEAD_ = ["المعرف", "المعلم", "النوع", "التاريخ", "بداية الفترة", "الوقت المطلوب", "السبب", "الالتزامات والبدلاء", "الحالة", "ملاحظة رئيس الشعبة", "وقت الطلب", "وقت قرار رئيس الشعبة", "وقت قرار المدير", "سجّل قرار المدير", "وقت البصمة الفعلي", "تواصل مع البدلاء"];
const DAY_MIN_ = "07:10", DAY_MAX_ = "14:05";
const LV_TYPES_ = ["بداية الدوام", "أثناء الدوام", "نهاية الدوام"];
const LV_ST_ = { pending: "بانتظار موافقة رئيس الشعبة", ok: "موافقة رئيس الشعبة", no: "غير موافق عليه" };
// حالات قديمة من مرحلة «اعتماد المدير» (أُلغيت ٢٥/١٠/٢٠٢٦) تُعرض كلها «موافقة رئيس الشعبة»
const LV_OLD_OK_ = ["موافقة مبدئية · بانتظار اعتماد المدير", "معتمد من المدير", "لم يعتمده المدير"];
function leaveSheet_() { return sh_(SHEET_LEAVE) || sheet_(SHEET_LEAVE, LEAVE_HEAD_, true); }
function leaveObj_(r) { return { id: r[0], teacher: r[1], type: r[2], date: r[3], from: r[4], to: r[5], reason: r[6], periods: json_(r[7], []), status: LV_OLD_OK_.indexOf(r[8]) !== -1 ? LV_ST_.ok : r[8], note: r[9],
  createdAt: r[10], decidedAt: r[11], finalAt: r[12], finalBy: r[13], actual: r[14], contacted: r[15] === "نعم", demo: isDemo_(r[1]) }; }
function leaveRow_(o) { return [o.id, o.teacher, o.type, o.date, o.from, o.to, o.reason, JSON.stringify(o.periods || []), o.status, o.note || "", o.createdAt, o.decidedAt || "", o.finalAt || "", o.finalBy || "", o.actual || "", o.contacted ? "نعم" : ""]; }
function leaveGet_(me, sh, id) {
  const row = findRow_(sh, 1, String(id));
  if (row < 0) throw new Error("الاستئذان غير موجود.");
  const o = leaveObj_(sh.getRange(row, 1, 1, LEAVE_HEAD_.length).getDisplayValues()[0]);
  if (!me.isHead && o.teacher !== me.name) throw new Error("لا يمكنك الوصول إلى هذا الاستئذان.");
  return { row, o };
}
function lvWhen_(o) {
  const need = o.type === LV_TYPES_[0] ? " · الحضور تقريبًا " + o.to : o.type === LV_TYPES_[2] ? " · الانصراف تقريبًا " + o.from : ` · من ${o.from} إلى ${o.to} تقريبًا`;
  return `${dayOf_(o.date)} ${dmy_(o.date)}${need}${o.actual ? " · وقت البصمة " + o.actual : ""}`;
}
function lvTable_(o) {
  return o.periods.length ? `<table style="border-collapse:collapse" cellpadding="6" border="1"><tr style="background:#fbeee3"><th>الالتزام</th><th>الوقت</th><th>البديل</th></tr>
    ${o.periods.map(x => `<tr><td>${esc_(x.label)}</td><td>${esc_(x.time || "")}</td><td>${esc_(x.sub)}</td></tr>`).join("")}</table>${o.contacted ? "<p>أكّد المعلم أنه تواصل مع البدلاء.</p>" : ""}` : "<p>لن يفوّت أي حصة أو مراقبة.</p>";
}

function listLeaves(code) {
  const me = who_(code);
  const sh = sh_(SHEET_LEAVE); if (!sh) return [];
  return rows_(SHEET_LEAVE).slice(1).filter(r => r[0] && (me.isHead || r[1] === me.name)).map(leaveObj_).reverse();
}

function saveLeave(code, l) {
  const me = who_(code);
  l = l || {};
  const type = LV_TYPES_.indexOf(l.type) !== -1 ? l.type : "";
  if (!type) throw new Error("اختر نوع الاستئذان.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(l.date || ""))) throw new Error("التاريخ غير صحيح.");
  const hm = /^\d{2}:\d{2}$/, inDay = v => !v || (hm.test(v) && v >= DAY_MIN_ && v <= DAY_MAX_);
  l.from = String(l.from || ""); l.to = String(l.to || "");
  if (!inDay(l.from) || !inDay(l.to) || (l.from && l.to && l.from >= l.to)) throw new Error("الوقت يجب أن يكون أثناء الدوام (٧:١٠ – ٢:٠٥).");
  if (type === LV_TYPES_[0]) { l.from = ""; if (!l.to) throw new Error("اكتب الوقت المتوقع للحضور."); }
  if (type === LV_TYPES_[2]) { l.to = ""; if (!l.from) throw new Error("اكتب الوقت المتوقع للانصراف."); }
  if (type === LV_TYPES_[1] && (!l.from || !l.to)) throw new Error("اكتب وقت الخروج ووقت العودة.");
  const d = new Date(l.date + "T12:00:00").getDay(); if (d === 5 || d === 6) throw new Error("اختر يوم دوام.");
  const reason = String(l.reason || "").trim().slice(0, 500);
  if (reason.length < 3) throw new Error("اكتب سبب الاستئذان.");
  const periods = (Array.isArray(l.periods) ? l.periods : []).slice(0, 12).map(x => ({ kind: String((x && x.kind) || "").slice(0, 20), label: String((x && x.label) || "").slice(0, 80), time: String((x && x.time) || "").slice(0, 20), sub: String((x && x.sub) || "").trim().slice(0, 80) }));
  periods.forEach(x => { if (x.sub.length < 3) throw new Error(`اكتب اسم البديل: ${x.label}.`); });
  if (periods.length && !l.contacted) throw new Error("أكّد أنك تواصلت مع البدلاء.");
  // رئيس الشعبة يقدّم الاستئذان عن المعلم، فيُعتمد مباشرة
  let teacher = me.name;
  if (me.isHead && l.teacher && l.teacher !== me.name) {
    if (!TEACHERS.some(t => t[0] === l.teacher)) throw new Error("اختر المعلم من القائمة.");
    teacher = l.teacher;
  }
  const o = { id: newId_(), teacher, type, date: l.date, from: l.from, to: l.to, reason, periods,
    status: me.isHead ? LV_ST_.ok : LV_ST_.pending, note: "", createdAt: nowText_(), decidedAt: me.isHead ? nowText_() : "", contacted: !!(periods.length && l.contacted) };
  withLock_(() => appendText_(leaveSheet_(), leaveRow_(o)));
  if (teacher !== me.name) notifyTeacher_(teacher, `استئذان معتمد: ${type} · ${dmy_(o.date)}`, `
    <p>الأستاذ الفاضل/ ${esc_(teacher)} المحترم،</p>
    <p>سجّل رئيس الشعبة عنك <b>${esc_(type)}</b> بحالة <b>${esc_(LV_ST_.ok)}</b>:</p>
    <p>${esc_(lvWhen_(o))}<br>السبب: ${esc_(reason)}</p>${lvTable_(o)}
    <p>لا تنسَ تقديم الإذن عن طريق الديوان، وبعد البصمة سجّل وقتها في الموقع (الاستئذانات).</p>`);
  if (!me.isHead) notify_(me, `طلب استئذان: أ. ${me.name} · ${type} · ${dmy_(o.date)}`, `
    <p>قدّم <b>أ. ${esc_(me.name)}</b> طلب <b>${esc_(type)}</b>:</p>
    <p>${esc_(lvWhen_(o))}<br>السبب: ${esc_(reason)}</p>${lvTable_(o)}
    <p>افتح الموقع: الاستئذانات، للموافقة أو عدم الموافقة.</p>`);
  return leaveObj_(leaveRow_(o).map(String));
}

/** رئيس الشعبة: موافقة أو عدم موافقة، ويصل المعلم إيميل */
function decideLeave(code, id, approve, note) {
  const me = head_(code);
  const o = withLock_(() => {
    const sh = leaveSheet_(), cur = leaveGet_(me, sh, id);
    if (cur.o.status !== LV_ST_.pending) throw new Error("تم البت في هذا الاستئذان.");
    cur.o.status = approve ? LV_ST_.ok : LV_ST_.no; cur.o.note = String(note || "").trim().slice(0, 400); cur.o.decidedAt = nowText_();
    writeRow_(sh, cur.row, leaveRow_(cur.o));
    return cur.o;
  });
  const sent = notifyTeacher_(o.teacher, approve ? `وافق رئيس الشعبة على استئذانك · ${dmy_(o.date)}` : `لم تتم الموافقة على استئذانك · ${dmy_(o.date)}`, approve ? `
    <p>الأستاذ ${esc_(o.teacher)}،</p><p>وافق رئيس الشعبة على طلبك (${esc_(o.type)}): ${esc_(lvWhen_(o))}.</p>
    ${o.note ? `<p>ملاحظة رئيس الشعبة: ${esc_(o.note)}</p>` : ""}` : `
    <p>الأستاذ ${esc_(o.teacher)}،</p><p>لم يوافق رئيس الشعبة على طلبك (${esc_(o.type)}): ${esc_(lvWhen_(o))}.</p>${o.note ? `<p>الملاحظة: ${esc_(o.note)}</p>` : ""}`);
  o.emailed = sent;
  return o;
}

/** الحذف: المعلم يلغي طلبه ما دام بانتظار رئيس الشعبة، ورئيس الشعبة يحذف أي استئذان */
function deleteLeave(code, id) {
  const me = who_(code);
  return withLock_(() => {
    const sh = leaveSheet_(), cur = leaveGet_(me, sh, id);
    if (!me.isHead && cur.o.status !== LV_ST_.pending) throw new Error("لا يمكن إلغاء الاستئذان بعد البت فيه. راجع رئيس الشعبة.");
    sh.deleteRow(cur.row);
    return true;
  });
}

/** وقت البصمة الفعلي بعد الاستئذان (صاحب الاستئذان أو رئيس الشعبة) */
function setLeaveActual(code, id, time) {
  const me = who_(code);
  time = String(time || "");
  if (!/^\d{2}:\d{2}$/.test(time) || time < DAY_MIN_ || time > DAY_MAX_) throw new Error("وقت البصمة يجب أن يكون أثناء الدوام (٧:١٠ – ٢:٠٥).");
  return withLock_(() => {
    const sh = leaveSheet_(), cur = leaveGet_(me, sh, id);
    if (cur.o.status === LV_ST_.no) throw new Error("هذا الاستئذان غير موافق عليه.");
    cur.o.actual = time; writeRow_(sh, cur.row, leaveRow_(cur.o));
    return cur.o;
  });
}

// ======================= جدول المراقبة =======================
// أعمدة: 0 التاريخ | 1 المعلم | 2 المهمة (مراقبة الفرصة الأولى، مراقبة فرصة الصلاة، مراقبة اختبار…) | 3 من | 4 إلى (اختياريان؛ يُحسبان من التوقيت للفرص)
const DUTY_HEAD_ = ["التاريخ", "المعلم", "المهمة", "من", "إلى"];
function listDuties(code) {
  const me = who_(code);
  const sh = sh_(SHEET_DUTY); if (!sh) return [];
  return rows_(SHEET_DUTY).slice(1).filter(r => r[0] && r[1] && (me.isHead || r[1] === me.name)).map(r => ({ date: r[0], teacher: r[1], duty: r[2], from: r[3], to: r[4] }));
}
/** لرئيس الشعبة: إضافة مراقبات (rows: [[التاريخ، المعلم، المهمة، من، إلى]]). replace=true يستبدل مراقبات التواريخ نفسها */
function importDuties(code, rows, replace) {
  head_(code);
  rows = (Array.isArray(rows) ? rows : []).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(String(r[0])) && r[1] && r[2]);
  if (!rows.length) throw new Error("لا توجد مراقبات صالحة.");
  return withLock_(() => {
    const sh = sh_(SHEET_DUTY) || sheet_(SHEET_DUTY, DUTY_HEAD_, true);
    if (replace) {
      const dates = new Set(rows.map(r => String(r[0]))), all = sh.getDataRange().getDisplayValues();
      for (let i = all.length - 1; i >= 1; i--) if (dates.has(all[i][0])) sh.deleteRow(i + 1);
    }
    rows.forEach(r => appendText_(sh, [r[0], r[1], r[2], r[3] || "", r[4] || ""].map(String)));
    return rows.length;
  });
}


// ======================= تقرير الاستئذانات اليومي (PDF لرئيس الشعبة) =======================
// يُرسل كل يوم دوام الساعة ٢ ظهرًا تقريبًا إلى إيميل رئيس الشعبة.
// يشمل الاستئذانات التي قُدّمت في ذلك اليوم (أيًّا كان تاريخ الإذن نفسه)، عدا التجريبية وغير الموافق عليها.
const LOGO_PNG_B64_ = "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";
/** الاستئذانات التي يومها هذا التاريخ (أيًّا كان يوم تقديمها)، عدا غير الموافق عليها */
function leavesOfDay_(date) {
  const sh = sh_(SHEET_LEAVE); if (!sh) return [];
  return rows_(SHEET_LEAVE).slice(1).filter(r => r[0] && String(r[3]).slice(0, 10) === date && !isDemo_(r[1])).map(leaveObj_).filter(o => o.status !== LV_ST_.no)
    .sort((a, b) => a.date.localeCompare(b.date) || LV_TYPES_.indexOf(a.type) - LV_TYPES_.indexOf(b.type) || String(a.createdAt).localeCompare(String(b.createdAt)));
}
function t12_(t) { if (!t) return ""; const h = +t.slice(0, 2); return `${h > 12 ? h - 12 : h}:${t.slice(3, 5)} ${h >= 12 ? "م" : "ص"}`; }
function leavesDayHtml_(date, list) {
  const rows = list.map((o, i) => `<tr><td class="c">${i + 1}</td><td><b>أ. ${esc_(o.teacher)}</b></td><td class="c">${esc_(o.type)}</td><td class="c">${dayOf_(o.date)} ${dmy_(o.date)}</td><td class="c">${esc_(o.status)}</td></tr>`).join("");
  return `<html dir="rtl"><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 14mm; } body { font-family: Arial, Tahoma, sans-serif; color: #2b2b2b; font-size: 12pt; direction: rtl; }
    .lh { width: 100%; border-bottom: 2px solid #c8641c; padding-bottom: 6px; } .lh td { vertical-align: middle; font-size: 10.5pt; line-height: 1.5; }
    .o { color: #c8641c; font-weight: bold; } h1 { text-align: center; font-size: 17pt; margin: 14px 0 4px; } .sub { text-align: center; color: #77736e; margin-bottom: 12px; }
    table.t { width: 100%; border-collapse: collapse; } table.t th { background: #fbeee3; color: #c8641c; padding: 7px; border: 1px solid #e0d6cc; font-size: 11pt; }
    table.t td { padding: 7px 8px; border: 1px solid #e0d6cc; font-size: 11.5pt; } td.c { text-align: center; }
    .sum { margin-top: 10px; font-size: 10.5pt; color: #555; } .sig { width: 100%; margin-top: 36px; text-align: center; font-size: 11pt; }
  </style></head><body>
  <table class="lh"><tr><td><b>دولة الكويت · وزارة التربية</b><br>منطقة حولي التعليمية<br><b>ثانوية أحمد الربعي للبنين</b><br><span class="o">شعبة التربية الإسلامية</span></td>
    <td style="text-align:left"><img src="data:image/png;base64,${LOGO_PNG_B64_}" width="62"></td></tr></table>
  <h1>كشف استئذانات المعلمين</h1><div class="sub">كشف يوم ${dayOf_(date)} ${dmy_(date)}</div>
  <table class="t"><tr><th style="width:6%">م</th><th>اسم المعلم</th><th style="width:16%">نوع الإذن</th><th style="width:22%">يوم الإذن</th><th style="width:20%">الحالة</th></tr>${rows}</table>
  <div class="sum">العدد: ${list.length} · بداية الدوام: ${list.filter(o => o.type === LV_TYPES_[0]).length} · أثناء الدوام: ${list.filter(o => o.type === LV_TYPES_[1]).length} · نهاية الدوام: ${list.filter(o => o.type === LV_TYPES_[2]).length}</div>
  <table class="sig"><tr><td><b>رئيس شعبة التربية الإسلامية</b><br>أ. مزيد حمد القصار<br>${headSigImg_() ? `<img src="${headSigImg_()}" style="max-height:60px;max-width:190px;margin-top:6px">` : "<br>التوقيع: ...................."}</td></tr></table>
  </body></html>`;
}
/** توقيع رئيس الشعبة المحفوظ في الموقع (آخر توقيع وقّع به) — يُطبع تلقائيًا على الكشف */
function headSigImg_() {
  const sh = sh_(SHEET_MYSIG); if (!sh) return "";
  const r = rows_(SHEET_MYSIG).slice(1).find(x => x[0] === CIRC_HEAD_NAME_);
  return r && /^data:image\/png;base64,/.test(r[1]) ? r[1] : "";
}
function leavesPdfBlob_(date, list) {
  return HtmlService.createHtmlOutput(leavesDayHtml_(date, list)).getAs("application/pdf").setName(`كشف استئذانات المعلمين - ${dmy_(date).replace(/\//g, "-")}.pdf`);
}
/** لرئيس الشعبة: الاستئذانات المقدَّمة منذ يوم الدوام السابق حتى اليوم، ليختار منها ما يدخل الكشف */
function leavesRecent(code) {
  head_(code);
  const today = Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd");
  const d = new Date(today + "T12:00:00");
  do { d.setDate(d.getDate() - 1); } while (d.getDay() === 5 || d.getDay() === 6);
  const from = Utilities.formatDate(d, "Asia/Kuwait", "yyyy-MM-dd");
  const sh = sh_(SHEET_LEAVE); if (!sh) return { today, from, list: [] };
  const list = rows_(SHEET_LEAVE).slice(1).filter(r => r[0] && !isDemo_(r[1]) && String(r[10]).slice(0, 10) >= from).map(leaveObj_).filter(o => o.status !== LV_ST_.no)
    .map(o => ({ id: o.id, teacher: o.teacher, type: o.type, date: o.date, from: o.from, to: o.to, status: o.status, createdAt: o.createdAt }))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return { today, from, list };
}
/** لرئيس الشعبة: كشف PDF بالاستئذانات التي اختارها */
function leavesPickPdf(code, ids) {
  head_(code);
  ids = (Array.isArray(ids) ? ids : []).map(String);
  if (!ids.length) throw new Error("اختر استئذانًا واحدًا على الأقل.");
  const date = Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd");
  const list = rows_(SHEET_LEAVE).slice(1).filter(r => ids.indexOf(String(r[0])) !== -1).map(leaveObj_)
    .sort((a, b) => a.date.localeCompare(b.date) || LV_TYPES_.indexOf(a.type) - LV_TYPES_.indexOf(b.type) || String(a.createdAt).localeCompare(String(b.createdAt)));
  const b = leavesPdfBlob_(date, list);
  return { name: b.getName(), count: list.length, b64: Utilities.base64Encode(b.getBytes()) };
}
/** لرئيس الشعبة من الموقع: كشف يوم معيّن PDF (base64) */
function leavesDayPdf(code, date) {
  head_(code);
  date = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? String(date) : Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd");
  const list = leavesOfDay_(date);
  const b = leavesPdfBlob_(date, list);
  return { name: b.getName(), count: list.length, b64: Utilities.base64Encode(b.getBytes()) };
}
/** يعمل تلقائيًا كل يوم ~٢ ظهرًا: يرسل كشف اليوم لرئيس الشعبة (لا يرسل في العطلة أو إذا لم توجد استئذانات) */
function dailyLeavesReport() {
  const date = Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd");
  const wd = new Date(date + "T12:00:00").getDay(); if (wd === 5 || wd === 6) return;
  const list = leavesOfDay_(date); if (!list.length) return;
  MailApp.sendEmail({ to: HEAD_EMAIL, subject: `كشف استئذانات المعلمين · ${dayOf_(date)} ${dmy_(date)} (${list.length})`, name: "موقع شعبة التربية الإسلامية",
    htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8">
      <p>مرفق كشف استئذانات المعلمين ليوم اليوم (${list.length})، لإرساله إلى المدير. ولاختيار استئذانات أخرى (مثل المقدَّمة اليوم لباكر) استخدم زر «كشف الاستئذانات» في الموقع.</p>
      <p>${list.map(o => `أ. ${esc_(o.teacher)} · ${esc_(o.type)} · ${dayOf_(o.date)} ${dmy_(o.date)}`).join("<br>")}</p></div>`,
    attachments: [leavesPdfBlob_(date, list)] });
}
/** يُشغَّل مرة واحدة من المحرر (بعد موافقة رئيس الشعبة على الصلاحية): ينشئ المهمة اليومية الساعة ٢ ظهرًا بتوقيت الكويت */
function installDailyLeaves() { return installTriggers(); }
/** يثبّت المهام التلقائية: كشف الاستئذانات يوميًا الساعة ٢ ظهرًا، والنسخة الاحتياطية كل خميس الساعة ١٠ مساءً */
function installTriggers() {
  ScriptApp.getProjectTriggers().filter(tr => ["dailyLeavesReport", "weeklyBackup"].indexOf(tr.getHandlerFunction()) !== -1).forEach(tr => ScriptApp.deleteTrigger(tr));
  ScriptApp.newTrigger("dailyLeavesReport").timeBased().everyDays(1).atHour(14).nearMinute(0).inTimezone("Asia/Kuwait").create();
  ScriptApp.newTrigger("weeklyBackup").timeBased().onWeekDay(ScriptApp.WeekDay.THURSDAY).atHour(22).inTimezone("Asia/Kuwait").create();
  return "تم";
}

// ======================= النسخة الاحتياطية الأسبوعية =======================
// كل خميس تُحفظ نسخة كاملة من ملف البيانات في مجلد «نسخ احتياطية - موقع الشعبة»، ويُحتفظ بآخر ٣٠ نسخة.
const BACKUP_KEEP_ = 30;
function backupFolder_() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty("BACKUP_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("نسخ احتياطية - موقع الشعبة");
  props.setProperty("BACKUP_FOLDER_ID", f.getId());
  return f;
}
function weeklyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), folder = backupFolder_();
  const name = "نسخة احتياطية - " + Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd HH:mm");
  DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  const files = []; const it = folder.getFiles(); while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(BACKUP_KEEP_).forEach(f => { try { f.setTrashed(true); } catch (e) {} });
  return name;
}


// ======================= كشف درجات الأعمال (التقييم البنائي ٤٠) =======================
// كشف لكل (فصل دراسي، فصل، مادة). المعلم يرى فصوله فقط، ورئيس الشعبة يرى الكل.
// يعتمد رئيس الشعبة الكشف متى شاء (غالبًا آخر الفصل)، وبعد الاعتماد يُقفل الكشف على المعلم: اطلاع فقط. ولرئيس الشعبة إلغاء الاعتماد.
// الأعمدة: 0 المفتاح (sem|class|subject) | 1 المعلم | 2 الفصل الدراسي | 3 الفصل | 4 المادة | 5 الدرجات JSON {اسم الطالب: {...}} | 6 وقت الاعتماد | 7 اعتمده | 8 عُدّل بعد الاعتماد | 9 آخر تحديث
const GRADES_HEAD_ = ["المفتاح", "المعلم", "الفصل الدراسي", "الفصل", "المادة", "الدرجات", "وقت الاعتماد", "اعتمده", "عُدّل بعد الاعتماد", "آخر تحديث"];
// البنود: السلوك ٣ · تسميع ½ + ½ · مشاركة ٢ · واجبات ٣ · مشروع ٣٫٥ (لكل قسم) · الاختبار القصير ١٥
const GR_MAX_ = { b1: 3, r11: .5, r12: .5, p1: 2, h1: 3, j1: 3.5, b2: 3, r21: .5, r22: .5, p2: 2, h2: 3, j2: 3.5, q: 15 };
const SHEET_GRLOG = "سجل تعديلات الدرجات";
const GR_LBL_ = { b1: "السلوك ق١", r11: "تسميع ١ ق١", r12: "تسميع ٢ ق١", p1: "المشاركة ق١", h1: "الواجبات ق١", j1: "المشروع ق١",
  b2: "السلوك ق٢", r21: "تسميع ١ ق٢", r22: "تسميع ٢ ق٢", p2: "المشاركة ق٢", h2: "الواجبات ق٢", j2: "المشروع ق٢", q: "الاختبار القصير" };
/** يسجّل كل تغيير في الدرجات: من عدّل ومتى، والدرجة قبل وبعد */
function grLog_(me, sem, cls, subj, student, before, after) {
  const ch = Object.keys(GR_MAX_).filter(k => before[k] !== after[k]).map(k => `${GR_LBL_[k]}: ${before[k] === undefined ? "–" : before[k]} ← ${after[k] === undefined ? "–" : after[k]}`);
  if (!ch.length) return;
  const sh = sh_(SHEET_GRLOG) || sheet_(SHEET_GRLOG, ["الوقت", "المعلم", "الفصل الدراسي", "الفصل", "المادة", "الطالب", "التغييرات"], true);
  appendText_(sh, [nowText_(), me.name, sem, grLabel_(cls), subj === "qr" ? "القرآن الكريم" : "التربية الإسلامية", student, ch.join(" · ")]);
}
function gradesSheet_() { return sh_(SHEET_GRADES) || sheet_(SHEET_GRADES, GRADES_HEAD_, true); }
function grKey_(sem, cls, subj) { return `${sem}|${cls}|${subj}`; }
function grCheck_(me, sem, cls, subj) {
  if (["1", "2"].indexOf(String(sem)) === -1) throw new Error("الفصل الدراسي غير صحيح.");
  if (["ie", "qr"].indexOf(subj) === -1) throw new Error("المادة غير صحيحة.");
  if (!me.isHead && me.classes.indexOf(cls) === -1) throw new Error("هذا الفصل ليس من فصولك.");
  if (me.isHead && !me.isDemo && !TEACHERS.some(t => t[1].indexOf(cls) !== -1)) throw new Error("الفصل غير معروف.");
}
function grLabel_(id) { const m = String(id).match(/^(\d+)([sl]?)-(\d+)$/); return !m ? id : m[2] ? `${m[1]} ${m[2] === "s" ? "علمي" : "أدبي"} ${m[3]}` : `${m[1]}/${m[3]}`; }
function grTeacherOf_(cls) { const t = TEACHERS.find(x => x[1].indexOf(cls) !== -1); return t ? t[0] : ""; }
function grNames_(me, cls) {
  if (me.isDemo) return [1, 2, 3, 4, 5, 6].map(i => "طالب تجريبي " + i);
  const sh = sh_(SHEET_ROSTER); if (!sh) return [];
  return rows_(SHEET_ROSTER).slice(1).filter(r => r[0] === cls && r[2]).sort((a, b) => Number(a[1]) - Number(b[1])).map(r => r[2]);
}
function grRow_(sh, key) { const row = findRow_(sh, 1, key); return row > 0 ? { row, r: sh.getRange(row, 1, 1, GRADES_HEAD_.length).getDisplayValues()[0] } : null; }
function grObj_(r) { return r ? { grades: json_(r[5], {}), approvedAt: r[6], approvedBy: r[7], editedAfter: r[8] === "نعم", updatedAt: r[9] } : { grades: {}, approvedAt: "", approvedBy: "", editedAfter: false, updatedAt: "" }; }

function gradesGet(code, sem, cls, subj) {
  const me = who_(code); sem = String(sem); grCheck_(me, sem, cls, subj);
  const key = (me.isDemo ? "DEMO:" + me.name + "|" : "") + grKey_(sem, cls, subj);
  const sh = sh_(SHEET_GRADES), cur = sh ? grRow_(sh, key) : null;
  return Object.assign({ names: grNames_(me, cls), teacher: me.isDemo ? me.name : grTeacherOf_(cls) }, grObj_(cur && cur.r));
}

/** حفظ درجات طالب واحد (قيم فارغة = لم تُرصد) */
function gradesSave(code, sem, cls, subj, student, vals) {
  const me = who_(code); sem = String(sem); grCheck_(me, sem, cls, subj);
  if (me.classes.indexOf(cls) === -1) throw new Error("رصد الدرجات وتعديلها لمعلم الفصل فقط.");
  student = String(student || "");
  if (grNames_(me, cls).indexOf(student) === -1) throw new Error("الطالب غير موجود في كشف الفصل.");
  const clean = {};
  Object.keys(GR_MAX_).forEach(k => {
    const v = vals && vals[k];
    if (v === "" || v == null) return;
    const n = Number(v);
    if (!(n >= 0 && n <= GR_MAX_[k] && Math.round(n * 2) === n * 2)) throw new Error("درجة غير صحيحة.");
    clean[k] = n;
  });
  const key = (me.isDemo ? "DEMO:" + me.name + "|" : "") + grKey_(sem, cls, subj);
  return withLock_(() => {
    const sh = gradesSheet_(), cur = grRow_(sh, key);
    const o = grObj_(cur && cur.r);
    if (o.approvedAt) throw new Error("اعتمد رئيس الشعبة هذا الكشف، فهو للاطلاع فقط ولا يمكن تعديله.");
    const before = o.grades[student] || {};
    if (Object.keys(clean).length) o.grades[student] = clean; else delete o.grades[student];
    if (!me.isDemo) grLog_(me, sem, cls, subj, student, before, clean);
    const row = [key, me.isDemo ? me.name : grTeacherOf_(cls), sem, cls, subj, JSON.stringify(o.grades), o.approvedAt, o.approvedBy, o.editedAfter ? "نعم" : "", nowText_()];
    writeRow_(sh, cur ? cur.row : sh.getLastRow() + 1, row);
    return o;
  });
}

/** رئيس الشعبة: اعتماد الكشف (يُقفل على المعلم) أو إلغاء اعتماده */
function gradesApprove(code, sem, cls, subj, on) {
  const me = head_(code); sem = String(sem); grCheck_(me, sem, cls, subj);
  const key = grKey_(sem, cls, subj);
  return withLock_(() => {
    const sh = gradesSheet_(), cur = grRow_(sh, key), o = grObj_(cur && cur.r);
    o.approvedAt = on ? nowText_() : ""; o.approvedBy = on ? me.name : ""; o.editedAfter = false;
    writeRow_(sh, cur ? cur.row : sh.getLastRow() + 1, [key, grTeacherOf_(cls), sem, cls, subj, JSON.stringify(o.grades), o.approvedAt, o.approvedBy, "", nowText_()]);
    return o;
  });
}

/** رئيس الشعبة: ملخص كل الكشوف لفصل دراسي: [{classId, subject, teacher, filled, total, approvedAt, editedAfter}] */
function gradesOverview(code, sem) {
  head_(code); sem = String(sem);
  const sh = sh_(SHEET_GRADES), rows = sh ? rows_(SHEET_GRADES).slice(1) : [];
  const counts = {}; if (sh_(SHEET_ROSTER)) rows_(SHEET_ROSTER).slice(1).forEach(r => { if (r[0]) counts[r[0]] = (counts[r[0]] || 0) + 1; });
  const out = [];
  TEACHERS.forEach(t => t[1].forEach(cls => ["ie", "qr"].forEach(subj => {
    const r = rows.find(x => x[0] === grKey_(sem, cls, subj)), g = r ? json_(r[5], {}) : {};
    const full = Object.values(g).filter(v => Object.keys(GR_MAX_).every(k => v[k] !== undefined)).length;
    out.push({ classId: cls, subject: subj, teacher: t[0], filled: full, started: Object.keys(g).length, total: counts[cls] || 0, approvedAt: r ? r[6] : "", editedAfter: r ? r[8] === "نعم" : false });
  })));
  return out;
}


// ======================= النشرات والتعاميم =======================
// رئيس الشعبة ينشر التعميم (عنوان ونص و/أو ملف PDF أو صورة)، فيصل كل معلم تنبيه بالإيميل،
// ويطّلع عليه في الموقع ويوقّع بالعلم. رئيس الشعبة يتابع من وقّع ومن لم يوقّع.
// التعاميم: 0 المعرف | 1 العنوان | 2 الرقم | 3 التاريخ | 4 جهة الإصدار | 5 النص | 6 معرف الملف | 7 اسم الملف | 8 نوع الملف | 9 تاريخ النشر | 10 المطلوب توقيعهم JSON
const CIRC_HEAD_ = ["المعرف", "العنوان", "الرقم", "التاريخ", "جهة الإصدار", "النص", "معرف الملف", "اسم الملف", "نوع الملف", "تاريخ النشر", "المطلوب توقيعهم"];
const DEMO_CIRC_ = "DEMO-CIRC";
const CIRC_HEAD_NAME_ = (TEACHERS.find(t => t[2]) || [""])[0];
function circSheet_() { return sh_(SHEET_CIRC) || sheet_(SHEET_CIRC, CIRC_HEAD_, true); }
function circSigSheet_() { return sh_(SHEET_CIRC_SIG) || sheet_(SHEET_CIRC_SIG, ["المعرف", "المعلم", "وقت التوقيع", "التوقيع"], true); }
function circObj_(r) { return { id: r[0], title: r[1], number: r[2], date: r[3], source: r[4], text: r[5], fileId: r[6], fileName: r[7], mime: r[8], createdAt: r[9], targets: json_(r[10], []) }; }
function circSigs_() { const sh = sh_(SHEET_CIRC_SIG); return sh ? rows_(SHEET_CIRC_SIG).slice(1).filter(r => r[0]) : []; }
function circTargets_() { return TEACHERS.filter(t => !t[2]).map(t => t[0]); }
function ensureDemoCirc_() {
  const sh = circSheet_(); if (findRow_(sh, 1, DEMO_CIRC_) > 0) return;
  appendText_(sh, [DEMO_CIRC_, "تعميم تجريبي للعرض", "١/٢٠٢٦", Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd"), "رئيس الشعبة",
    "هذا تعميم تجريبي يوضح طريقة الاطلاع على التعاميم والتوقيع بالعلم إلكترونيًا.", "", "", "", nowText_(), JSON.stringify(Object.keys(DEMOS))]);
}
function circVisible_(me, c) { return me.isDemo ? c.id === DEMO_CIRC_ : c.id !== DEMO_CIRC_; }
function circFind_(me, id) {
  if (me.isDemo) ensureDemoCirc_();
  const sh = sh_(SHEET_CIRC); const r = sh ? rows_(SHEET_CIRC).slice(1).find(x => x[0] === id) : null;
  const c = r && circObj_(r);
  if (!c || !circVisible_(me, c)) throw new Error("التعميم غير موجود.");
  return c;
}

function listCirculars(code) {
  const me = who_(code);
  if (me.isDemo) ensureDemoCirc_();
  const sh = sh_(SHEET_CIRC); if (!sh) return [];
  const sigs = circSigs_();
  return rows_(SHEET_CIRC).slice(1).filter(r => r[0]).map(circObj_).filter(c => circVisible_(me, c)).map(c => {
    const mine = sigs.find(s => s[0] === c.id && s[1] === me.name);
    return { id: c.id, title: c.title, number: c.number, date: c.date, source: c.source, createdAt: c.createdAt, hasFile: !!c.fileId,
      mustSign: c.targets.indexOf(me.name) !== -1, mySignedAt: mine ? mine[2] : "",
      signedCount: sigs.filter(s => s[0] === c.id && c.targets.indexOf(s[1]) !== -1).length, total: c.targets.length };
  }).reverse();
}

/** التعميم كاملًا. رئيس الشعبة يرى حالة توقيع الجميع، والمعلم يرى توقيعه فقط */
function getCircular(code, id) {
  const me = who_(code), c = circFind_(me, id), sigs = circSigs_().filter(s => s[0] === id);
  const out = { id: c.id, title: c.title, number: c.number, date: c.date, source: c.source, text: c.text, fileName: c.fileName, mime: c.mime, hasFile: !!c.fileId, createdAt: c.createdAt,
    mustSign: c.targets.indexOf(me.name) !== -1 };
  const mine = sigs.find(s => s[1] === me.name);
  out.mine = mine ? { signedAt: mine[2], image: mine[3] } : null;
  if (me.isHead || me.isDemo) out.status = c.targets.map(n => { const s = sigs.find(x => x[1] === n); return { teacher: n, signedAt: s ? s[2] : "", image: me.isHead && s ? s[3] : "" }; });
  return out;
}

function circularFile(code, id) {
  const me = who_(code), c = circFind_(me, id);
  if (!c.fileId) throw new Error("لا يوجد ملف مرفق بهذا التعميم.");
  const b = DriveApp.getFileById(c.fileId).getBlob();
  return { name: c.fileName, mime: c.mime || b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}

/** رئيس الشعبة: نشر تعميم جديد وإرسال تنبيه لكل معلم */
function saveCircular(code, c) {
  const me = head_(code);
  const title = String(c.title || "").trim().slice(0, 200);
  if (!title) throw new Error("اكتب عنوان التعميم.");
  const text = String(c.text || "").trim().slice(0, 8000);
  const file = String(c.file || "");
  if (!file && text.length < 5) throw new Error("أرفق ملف التعميم أو اكتب نصه.");
  let fileId = "", fileName = "", mime = "";
  const id = newId_();
  if (file) {
    const m = file.match(/^data:(application\/pdf|image\/jpeg|image\/png);base64,(.+)$/);
    if (!m) throw new Error("الملف يجب أن يكون PDF أو صورة.");
    if (m[2].length > 11000000) throw new Error("حجم الملف كبير (الحد ٨ ميجابايت).");
    mime = m[1];
    fileName = String(c.fileName || "").replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || ("تعميم." + (mime === "application/pdf" ? "pdf" : "jpg"));
    fileId = folder_().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), mime, `تعميم-${id}-${fileName}`)).getId();
  }
  const targets = circTargets_();
  const row = [id, title, String(c.number || "").trim().slice(0, 60), String(c.date || "").slice(0, 10), String(c.source || "").trim().slice(0, 80), text,
    fileId, fileName, mime, nowText_(), JSON.stringify(targets)];
  withLock_(() => appendText_(circSheet_(), row));
  let sent = 0, noEmail = [];
  targets.forEach(n => {
    const ok = notifyTeacher_(n, `تعميم مهم: ${title}`, `
      <p>الأستاذ الفاضل/ ${esc_(n)} المحترم،</p>
      <p>وصل <b>تعميم مهم</b> في موقع شعبة التربية الإسلامية، <b>يرجى الاطلاع عليه والتوقيع بالعلم</b>.</p>
      <p style="background:#fbeee3;padding:8px 12px;border-radius:8px"><b>${esc_(title)}</b>${row[2] ? `<br>رقم التعميم: ${esc_(row[2])}` : ""}${row[4] ? `<br>جهة الإصدار: ${esc_(row[4])}` : ""}</p>
      <p>تجده في ركن «النشرات والتعاميم».</p><p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`);
    if (ok) sent++; else noEmail.push(n);
  });
  return { id, sent, noEmail };
}

function deleteCircular(code, id) {
  head_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_CIRC), row = sh ? findRow_(sh, 1, id) : -1;
    if (row > 0) {
      const fid = sh.getRange(row, 7).getDisplayValue();
      if (fid) { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} }
      sh.deleteRow(row);
    }
    const sig = sh_(SHEET_CIRC_SIG);
    if (sig) { const vals = sig.getDataRange().getDisplayValues(); for (let i = vals.length - 1; i >= 1; i--) if (vals[i][0] === id) sig.deleteRow(i + 1); }
    return true;
  });
}

function signCircular(code, id, image) {
  const me = who_(code);
  image = String(image || "");
  if (!/^data:image\/png;base64,/.test(image) || image.length > 48000) throw new Error("التوقيع غير صالح، ارسمه مرة أخرى.");
  const c = circFind_(me, id);
  if (c.targets.indexOf(me.name) === -1) throw new Error("هذا التعميم لا يتطلب توقيعك.");
  return withLock_(() => {
    const sh = circSigSheet_(), vals = sh.getDataRange().getDisplayValues();
    for (let i = 1; i < vals.length; i++) if (vals[i][0] === id && vals[i][1] === me.name) throw new Error("وقّعت على هذا التعميم من قبل.");
    const at = nowText_();
    appendText_(sh, [id, me.name, at, image]);
    if (!me.isDemo) {
      const my = sh_(SHEET_MYSIG), row = findRow_(my, 1, me.name);
      if (row > 0) writeRow_(my, row, [me.name, image, at]); else appendText_(my, [me.name, image, at]);
    }
    const signed = vals.slice(1).filter(v => v[0] === id).map(v => v[1]).concat([me.name]);
    if (c.targets.every(n => signed.indexOf(n) !== -1))
      notify_(me, `اكتمل التوقيع بالعلم على تعميم: ${c.title}`, `<p>وقّع جميع المعلمين (${c.targets.length}) بالعلم على تعميم <b>${esc_(c.title)}</b>.</p>`);
    return { signedAt: at };
  });
}

/** رئيس الشعبة: تذكير من لم يوقّع */
function remindCircular(code, id) {
  const me = head_(code), c = circFind_(me, id), sigs = circSigs_().filter(s => s[0] === id).map(s => s[1]);
  const left = c.targets.filter(n => sigs.indexOf(n) === -1);
  let sent = 0;
  left.forEach(n => { if (notifyTeacher_(n, `تذكير: تعميم بانتظار توقيعك — ${c.title}`, `
    <p>الأستاذ الفاضل/ ${esc_(n)} المحترم،</p><p>نذكّركم بالاطلاع على تعميم <b>${esc_(c.title)}</b> والتوقيع بالعلم في موقع الشعبة (ركن «النشرات والتعاميم»).</p>
    <p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`)) sent++; });
  return { left: left.length, sent };
}


// ======================= ربط الحساب بجهاز واحد =======================
// كل معلم يُربط حسابه بأول جهاز يدخل منه، ويُرفض أي جهاز آخر (ويصل رئيس الشعبة تنبيه).
// رئيس الشعبة: حتى ٣ أجهزة. إعادة التعيين من لوحة «الأجهزة والتعهدات».
const DEV_MAX_HEAD_ = 3;
function devCache_() { try { return CacheService.getScriptCache(); } catch (e) { return null; } }
function devMap_() {
  const c = devCache_(), hit = c && c.get("devmap");
  if (hit) return JSON.parse(hit);
  const sh = sh_(SHEET_DEV), map = {};
  if (sh) rows_(SHEET_DEV).slice(1).forEach(r => { if (r[0]) map[r[0]] = json_(r[1], []); });
  if (c) c.put("devmap", JSON.stringify(map), 600);
  return map;
}
function devSave_(name, list) {
  const sh = sh_(SHEET_DEV) || sheet_(SHEET_DEV, ["المعلم", "الأجهزة", "آخر تحديث"], true);
  const row = findRow_(sh, 1, name);
  writeRow_(sh, row > 0 ? row : sh.getLastRow() + 1, [name, JSON.stringify(list), nowText_()]);
  const c = devCache_(); if (c) c.remove("devmap");
}
// المعلم: جوال واحد + كمبيوتر واحد (kind: M جوال/جهاز لوحي، C كمبيوتر). رئيس الشعبة: حتى ٣ أجهزة من أي نوع.
function devAllowed_(me, list, kind) {
  if (me.isHead) return list.length < DEV_MAX_HEAD_;
  return list.length < 2 && !list.some(d => d.kind === kind);
}
function checkDevice_(me, dev, kind) {
  if (!/^[A-Z0-9]{16,40}$/.test(dev)) throw new Error("حدّث الصفحة ثم ادخل مرة أخرى.");
  const list = devMap_()[me.name] || [];
  const hit = list.find(d => d.id === dev);
  if (hit) { if (!hit.kind) withLock_(() => devSave_(me.name, (devMap_()[me.name] || []).map(d => d.id === dev ? Object.assign({}, d, { kind }) : d))); return; }
  if (devAllowed_(me, list, kind)) {
    withLock_(() => { const cur = (devMap_()[me.name] || []); if (!cur.some(d => d.id === dev) && devAllowed_(me, cur, kind)) devSave_(me.name, cur.concat([{ id: dev, kind, at: nowText_() }])); });
    return;
  }
  // جهاز جديد: يتحقق المعلم بكود يصله على إيميله (requestDeviceCode ثم verifyDeviceCode)
  throw new Error(`DEVICE_NEW|هذا ${kind === "C" ? "كمبيوتر" : "جوال"} جديد لحسابك. للتحقق نرسل كودًا إلى إيميلك.`);
}
/** رئيس الشعبة: حالة الأجهزة والتعهدات لكل معلم */
function listDevices(code) {
  head_(code);
  const map = devMap_(), pl = pledgeMap_(), ph = {}, codes = {};
  if (sh_(SHEET_PHONES)) rows_(SHEET_PHONES).slice(1).forEach(r => { if (r[0]) ph[r[0]] = { phone: String(r[1] || "").replace(/\D/g, ""), sent: r[2] }; });
  rows_(SHEET_CODES).slice(1).forEach(r => { if (r[0]) codes[String(r[0]).trim()] = String(r[1]).trim(); });
  return TEACHERS.map(t => ({ teacher: t[0], isHead: !!t[2], devices: (map[t[0]] || []).length, kinds: (map[t[0]] || []).map(d => d.kind || ""), boundAt: ((map[t[0]] || [])[0] || {}).at || "", pledgeAt: (pl[t[0]] || {}).at || "",
    phone: t[2] ? "" : ((ph[t[0]] || {}).phone || ""), code: t[2] ? "" : (codes[t[0]] || ""), sentAt: (ph[t[0]] || {}).sent || "" }));
}
function resetDevice(code, teacher) {
  head_(code);
  if (!TEACHERS.some(t => t[0] === teacher)) throw new Error("المعلم غير موجود.");
  withLock_(() => devSave_(teacher, []));
  return true;
}

// ======================= تعهد المحافظة على السرية =======================
function pledgeMap_() {
  const sh = sh_(SHEET_PLEDGE), map = {};
  if (sh) rows_(SHEET_PLEDGE).slice(1).forEach(r => { if (r[0]) map[r[0]] = { at: r[2], image: r[1] }; });
  return map;
}
function signPledge(code, image) {
  const me = whoBase_(code);
  image = String(image || "");
  if (!/^data:image\/png;base64,/.test(image) || image.length > 48000) throw new Error("التوقيع غير صالح، ارسمه مرة أخرى.");
  if (me.isDemo) return { at: nowText_() }; // الحساب التجريبي لا يُحفظ له تعهد
  return withLock_(() => {
    const sh = sh_(SHEET_PLEDGE) || sheet_(SHEET_PLEDGE, ["المعلم", "التوقيع", "وقت التوقيع"], true);
    const row = findRow_(sh, 1, me.name), at = nowText_();
    writeRow_(sh, row > 0 ? row : sh.getLastRow() + 1, [me.name, image, at]);
    const my = sh_(SHEET_MYSIG), r2 = findRow_(my, 1, me.name);
    if (r2 > 0) writeRow_(my, r2, [me.name, image, at]); else appendText_(my, [me.name, image, at]);
    gateReset_();
    return { at };
  });
}
/** رئيس الشعبة: التعهدات الموقّعة مع صور التواقيع (لتنزيلها PDF) */
function listPledges(code) {
  head_(code);
  const pl = pledgeMap_();
  return TEACHERS.filter(t => !t[2]).map(t => ({ teacher: t[0], at: (pl[t[0]] || {}).at || "", image: (pl[t[0]] || {}).image || "" }));
}

// ---------- نقل الحساب إلى جهاز جديد بكود على الإيميل ----------
function devStore_() { const c = devCache_(); return { get: k => c ? c.get(k) : PropertiesService.getScriptProperties().getProperty(k), put: (k, v, s) => c ? c.put(k, v, s) : PropertiesService.getScriptProperties().setProperty(k, v), del: k => c ? c.remove(k) : PropertiesService.getScriptProperties().setProperty(k, "") }; }
function devParts_(code) { const p = String(code || "").trim().toUpperCase().split("~"); const me = whoCode_(p[0]); const dev = p[1] || "", kind = p[2] === "C" ? "C" : "M";
  if (!/^[A-Z0-9]{16,40}$/.test(dev)) throw new Error("حدّث الصفحة ثم ادخل مرة أخرى."); return { me, dev, kind }; }
function requestDeviceCode(code) {
  const { me, dev, kind } = devParts_(code);
  if (me.isDemo) throw new Error("الحساب التجريبي لا يحتاج تحققًا.");
  const st = devStore_(), key = "devcode:" + me.name, old = json_(st.get(key), null);
  if (old && old.dev === dev && Date.now() - old.sent < 60000) throw new Error("أُرسل الكود قبل قليل، تفقّد إيميلك (وصندوق الرسائل غير المرغوب فيها).");
  const to = emailOf_(me.name) || (me.isHead ? HEAD_EMAIL : "");
  if (!to) throw new Error("لا يوجد إيميل مسجّل لك. راجع رئيس الشعبة.");
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  st.put(key, JSON.stringify({ pin, dev, tries: 0, sent: Date.now(), exp: Date.now() + 600000 }), 600);
  MailApp.sendEmail({ to, subject: `كود التحقق: ${pin} · موقع شعبة التربية الإسلامية`, name: "موقع شعبة التربية الإسلامية",
    htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.8;color:#2b2b2b">
      <p>أ. ${esc_(me.name)}،</p><p>كود التحقق لنقل حسابك إلى جهاز جديد:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#c8641c">${pin}</p>
      <p>الكود صالح لمدة ١٠ دقائق. بعد إدخاله يخرج حسابك من ${kind === "C" ? "الكمبيوتر" : "الجوال"} السابق، ويبقى ${kind === "C" ? "جوالك" : "كمبيوترك"} كما هو.</p>
      <p style="color:#b23a22">إذا لم تطلب هذا الكود فلا تشاركه مع أحد، وأبلغ رئيس الشعبة؛ فهناك من يحاول الدخول برمزك.</p></div>` });
  return { sentTo: to.replace(/^(.{2}).*(@.*)$/, "$1•••$2") };
}
function verifyDeviceCode(code, pin) {
  const { me, dev, kind } = devParts_(code);
  const st = devStore_(), key = "devcode:" + me.name, o = json_(st.get(key), null);
  if (!o || o.dev !== dev || Date.now() > o.exp) throw new Error("انتهت صلاحية الكود، اطلب كودًا جديدًا.");
  if (String(pin || "").replace(/\D/g, "") !== o.pin) {
    o.tries++; if (o.tries >= 5) { st.del(key); throw new Error("محاولات كثيرة خاطئة. اطلب كودًا جديدًا."); }
    st.put(key, JSON.stringify(o), 600); throw new Error("الكود غير صحيح.");
  }
  st.del(key);
  withLock_(() => { const cur = (devMap_()[me.name] || []).filter(d => d.id !== dev);
    // يحلّ الجهاز الجديد محل الجهاز القديم من النوع نفسه فقط (الجوال بدل الجوال، والكمبيوتر بدل الكمبيوتر)
    let keep = me.isHead ? cur.slice(-(DEV_MAX_HEAD_ - 1)) : cur.filter(d => d.kind && d.kind !== kind).slice(-1);
    devSave_(me.name, keep.concat([{ id: dev, kind, at: nowText_() }])); });
  return true;
}

/** رئيس الشعبة: تسجيل أن رمز المعلم أُرسل بالواتساب */
function markInviteSent(code, teacher) {
  head_(code);
  return withLock_(() => {
    const sh = sh_(SHEET_PHONES); if (!sh) throw new Error("ورقة الجوالات غير موجودة.");
    const row = findRow_(sh, 1, teacher); if (row < 0) throw new Error("لا يوجد رقم لهذا المعلم.");
    const at = nowText_(); sh.getRange(row, 3).setNumberFormat("@").setValue(at); return at;
  });
}


// ======================= الاحتياط: يختار المعلمون الحصص بأنفسهم =======================
// جدول حصص معلمي الشعبة (نسخة من جدول الموقع): اليوم (0 الأحد … 4 الخميس) ← الحصة ← الفصل
const TT_ = {"مزيد حمد خليفة القصار": {"2": {"4": "11s-1"}, "1": {"3": "11s-1"}, "0": {"4": "11s-1"}}, "عبدالله طارق محمد الخليفي": {"4": {"2": "11s-4"}, "3": {"7": "11s-4", "1": "10-1"}, "2": {"7": "10-1"}, "1": {"6": "11s-4"}, "0": {"2": "10-1"}}, "عبدالمحسن عايض عبدالله المطيري": {"4": {"6": "10-9", "3": "10-2"}, "3": {"7": "10-9"}, "2": {"2": "10-2"}, "1": {"5": "10-9"}, "0": {"7": "10-2"}}, "خالد أحمد علي الخالدي": {"4": {"3": "10-6"}, "3": {"7": "10-5"}, "2": {"6": "10-6"}, "1": {"1": "10-5"}, "0": {"7": "10-6", "4": "10-5"}}, "سعد عبدالله سعد الحربي": {"4": {"2": "10-4"}, "3": {"6": "10-4", "4": "10-3"}, "2": {"7": "10-3"}, "1": {"7": "10-4"}, "0": {"2": "10-3"}}, "عبدالرحمن خالد عبدالكريم الاصقه": {"4": {"6": "10-8"}, "3": {"7": "10-7", "5": "10-8"}, "2": {"5": "10-7"}, "1": {"7": "10-8"}, "0": {"2": "10-7"}}, "عبدالله جاسم محمد المجيبل": {"4": {"7": "11s-2"}, "3": {"2": "11s-2"}, "2": {"2": "11s-3"}, "1": {"7": "11s-3"}, "0": {"6": "11s-2", "4": "11s-3"}}, "سعد احمد سعد العازمي": {"4": {"7": "11l-1"}, "3": {"1": "11s-5"}, "2": {"6": "11s-5"}, "1": {"7": "11s-5", "2": "11l-1"}, "0": {"6": "11l-1"}}, "عثمان حسين علي الاثري": {"4": {"7": "11s-6"}, "3": {"7": "11s-6", "5": "11l-2"}, "2": {"4": "11l-2"}, "1": {"4": "11l-2"}, "0": {"1": "11s-6"}}, "أحمد ياسر إبراهيم الشطي": {"4": {"7": "11s-7", "5": "12s-6"}, "3": {"6": "12s-6", "2": "11s-8"}, "2": {"7": "11s-8"}, "1": {"2": "12s-6", "1": "11s-7"}, "0": {"6": "11s-8", "4": "11s-7"}}, "ممدوح صديق ابوالحسن": {"4": {"2": "12l-2"}, "2": {"2": "12l-2"}, "1": {"2": "12l-2"}}, "محمد فهد محمد الفيلكاوي": {"4": {"6": "12s-2", "4": "12s-7", "1": "12l-1"}, "3": {"1": "12s-2"}, "2": {"3": "12s-7"}, "1": {"7": "12s-2", "4": "12l-1"}, "0": {"7": "12s-7", "2": "12l-1"}}, "مصطفى احمد ابراهيم على": {"4": {"1": "12s-1"}, "3": {"7": "12s-1"}, "2": {"7": "12s-3"}, "1": {"5": "12s-3"}, "0": {"3": "12s-3", "1": "12s-1"}}, "حمد عماد حمد العون": {"4": {"5": "12s-4"}, "3": {"1": "12s-5"}, "2": {"6": "12s-5"}, "1": {"1": "12s-4"}, "0": {"3": "12s-4", "1": "12s-5"}}};
const TT_BUSY_ = {"*": {"0": {"5": "اجتماع الشعبة"}}, "مزيد حمد خليفة القصار": {"0": {"3": "اجتماع مجلس الإدارة"}}};
function ttAt_(name, d, p) { return ((TT_[name] || {})[d] || {})[p] || ((TT_BUSY_["*"] || {})[d] || {})[p] || ((TT_BUSY_[name] || {})[d] || {})[p] || ""; }
function dayIdx_(iso) { const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12).getDay() : -1; }
function todayISO_() { return Utilities.formatDate(new Date(), "Asia/Kuwait", "yyyy-MM-dd"); }
const AR_ORD_ = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"];
function arLabel_(id) { const m = String(id).match(/^(\d+)([sl]?)-(\d+)$/); if (!m) return id; const a = s => String(s).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]); return m[2] ? `${a(m[1])} ${m[2] === "s" ? "علمي" : "أدبي"} ${a(m[3])}` : `${a(m[1])}/${a(m[3])}`; }
const DAYS_AR_ = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** رئيس الشعبة: إرسال حصص الغائب لكل معلمي الشعبة ليختاروا */
function notifyAbsence(code, date, teacher) {
  staff_(code);
  const rs = subsRows_().map(subObj_).filter(r => r.date === date && r.teacher === teacher && !r.sub).sort((a, b) => a.period - b.period);
  if (!rs.length) throw new Error("لا توجد حصص بلا بديل لهذا الغياب.");
  const d = dayIdx_(date), list = rs.map(r => `<li>الحصة ${AR_ORD_[r.period]} · ${esc_(arLabel_(r.classId))}</li>`).join("");
  let sent = 0;
  TEACHERS.filter(t => !t[2] && t[0] !== teacher).forEach(t => {
    if (notifyTeacher_(t[0], `احتياط: أ. ${teacher} غائب يوم ${DAYS_AR_[d]}`, `
      <p>الأستاذ الفاضل/ ${esc_(t[0])} المحترم،</p>
      <p><b>أ. ${esc_(teacher)}</b> غائب يوم <b>${DAYS_AR_[d]} ${esc_(date)}</b>، وحصصه:</p><ul>${list}</ul>
      <p>ادخل الموقع ← ركن «الاحتياط»، واختر الحصة التي تستطيع أخذها. تُحجز الحصة لأول من يختارها.</p>
      <p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`)) sent++;
  });
  return { sent };
}
/** المعلم: حصص الاحتياط المفتوحة من اليوم فصاعدًا */
function subsOpen(code) {
  const me = who_(code);
  if (me.isDemo) return [];
  const today = todayISO_(), all = subsRows_().map(subObj_);
  const absentOn = {}; all.forEach(r => { (absentOn[r.date] = absentOn[r.date] || {})[r.teacher] = 1; });
  const by = {};
  all.filter(r => r.date >= today).forEach(r => { (by[r.absence] = by[r.absence] || { absence: r.absence, date: r.date, teacher: r.teacher, periods: [] }).periods.push(r); });
  return Object.values(by).sort((a, b) => a.date < b.date ? -1 : 1).map(g => {
    const d = dayIdx_(g.date);
    return { absence: g.absence, date: g.date, teacher: g.teacher, mineAbsent: g.teacher === me.name,
      periods: g.periods.sort((a, b) => a.period - b.period).map(r => ({ period: r.period, classId: r.classId, sub: r.sub, mine: r.sub === me.name,
        free: !r.sub && g.teacher !== me.name && !(absentOn[g.date] || {})[me.name] && !ttAt_(me.name, d, r.period) && !all.some(x => x.date === g.date && x.period === r.period && x.sub === me.name) })) };
  });
}
function claimSub(code, absence, period) {
  const me = who_(code);
  if (me.isDemo) throw new Error("غير متاح للحساب التجريبي.");
  period = Number(period);
  let covered = null;
  withLock_(() => {
    const sh = sh_(SHEET_SUBS), all = sh.getDataRange().getDisplayValues();
    const i = all.findIndex((r, k) => k > 0 && r[0] === absence && Number(r[3]) === period);
    if (i < 1) throw new Error("الحصة غير موجودة.");
    const r = all[i], d = dayIdx_(r[1]);
    if (r[1] < todayISO_()) throw new Error("انتهى يوم هذه الحصة.");
    if (r[5]) throw new Error(r[5] === me.name ? "أخذت هذه الحصة من قبل." : `سبقك إليها أ. ${r[5]}.`);
    if (r[2] === me.name) throw new Error("هذه حصتك.");
    if (all.some((x, k) => k > 0 && x[1] === r[1] && x[2] === me.name)) throw new Error("أنت مسجّل غائبًا في هذا اليوم.");
    if (ttAt_(me.name, d, period)) throw new Error("لديك حصة أو التزام في هذا الوقت.");
    if (all.some((x, k) => k > 0 && x[1] === r[1] && Number(x[3]) === period && x[5] === me.name)) throw new Error("أخذت احتياطًا آخر في الوقت نفسه.");
    sh.getRange(i + 1, 6, 1, 3).setNumberFormat("@").setValues([[me.name, me.name, nowText_()]]);
    const rest = all.filter((x, k) => k > 0 && k !== i && x[0] === absence && !x[5]);
    if (!rest.length) covered = { teacher: r[2], date: r[1], rows: all.filter((x, k) => k > 0 && x[0] === absence).map(x => x === r ? [x[3], me.name] : [x[3], x[5]]) };
  });
  if (covered) notify_(me, `تمت تغطية احتياط أ. ${covered.teacher}`, `<p>تمت تغطية جميع حصص <b>أ. ${esc_(covered.teacher)}</b> يوم ${DAYS_AR_[dayIdx_(covered.date)]} ${esc_(covered.date)}:</p>
    <ul>${covered.rows.sort((a, b) => a[0] - b[0]).map(x => `<li>الحصة ${AR_ORD_[Number(x[0])]}: أ. ${esc_(x[1])}</li>`).join("")}</ul>`);
  return subsOpen(code);
}
/** رئيس الشعبة: إلغاء معلم من حصة احتياط أخذها، فتعود الحصة مفتوحة للمعلمين، ويصل المعلم إيميل بذلك */
function removeSub(code, absence, period) {
  const me = staff_(code);
  period = Number(period);
  const r = withLock_(() => {
    const sh = sh_(SHEET_SUBS), all = sh.getDataRange().getDisplayValues();
    const i = all.findIndex((x, k) => k > 0 && x[0] === absence && Number(x[3]) === period);
    if (i < 1) throw new Error("الحصة غير موجودة.");
    if (!all[i][5]) throw new Error("لا يوجد معلم في هذه الحصة.");
    const row = all[i].slice();
    sh.getRange(i + 1, 6, 1, 3).setNumberFormat("@").setValues([["", me.name, nowText_()]]);
    return row;
  });
  const d = dayIdx_(r[1]);
  notifyTeacher_(r[5], `أُلغيت حصة احتياط · ${DAYS_AR_[d]} ${r[1]}`, `
    <p>الأستاذ الفاضل/ ${esc_(r[5])} المحترم،</p>
    <p>نعتذر إليكم، فقد أُلغي تكليفكم بحصة الاحتياط <b>الحصة ${AR_ORD_[period]} · ${esc_(arLabel_(r[4]))}</b> يوم ${DAYS_AR_[d]} ${esc_(r[1])} (بدلًا من أ. ${esc_(r[2])})، لتغيير في ترتيب الاحتياط. شكرًا لتعاونكم.</p>
    <p>رئيس الشعبة<br>أ. ${esc_(CIRC_HEAD_NAME_)}</p>`);
  return subsRows_().map(subObj_);
}
function unclaimSub(code, absence, period) {
  const me = who_(code);
  period = Number(period);
  withLock_(() => {
    const sh = sh_(SHEET_SUBS), all = sh.getDataRange().getDisplayValues();
    const i = all.findIndex((r, k) => k > 0 && r[0] === absence && Number(r[3]) === period);
    if (i < 1 || all[i][5] !== me.name) throw new Error("هذه الحصة ليست محجوزة باسمك.");
    if (all[i][1] < todayISO_()) throw new Error("انتهى يوم هذه الحصة.");
    sh.getRange(i + 1, 6, 1, 3).setNumberFormat("@").setValues([["", me.name, nowText_()]]);
  });
  return subsOpen(code);
}

// ======================= الجديد لرئيس الشعبة (اللمبات الحمراء) =======================
function seenKey_(me) { return "seen:" + me.name; }
function headNews(code) {
  const me = head_(code), props = PropertiesService.getScriptProperties();
  let seen = json_(props.getProperty(seenKey_(me)), null);
  const now = nowText_();
  const SECS = ["min", "circ", "vis", "curr", "ach", "lv", "swap", "stu", "subs", "grd"];
  if (!seen) { seen = {}; SECS.forEach(s => seen[s] = now); props.setProperty(seenKey_(me), JSON.stringify(seen)); }
  const items = {}; SECS.forEach(s => items[s] = []);
  const add = (s, at, id, tch) => { if (at && at > (seen[s] || "") && tch !== me.name && !isDemo_(tch)) items[s].push({ id, t: tch, at }); };
  if (sh_(SHEET_SIG)) rows_(SHEET_SIG).slice(1).forEach(r => { if (r[0] !== DEMO_MINUTE) add("min", r[2], r[0], r[1]); });
  if (sh_(SHEET_CIRC_SIG)) rows_(SHEET_CIRC_SIG).slice(1).forEach(r => { if (r[0] !== DEMO_CIRC_) add("circ", r[2], r[0], r[1]); });
  if (sh_(SHEET_VIS)) rows_(SHEET_VIS).slice(1).forEach(r => add("vis", r[16], r[0], r[1]));
  const dsh = sh_(SHEET_DATA);
  if (dsh && dsh.getLastRow() > 1) dsh.getRange(2, 1, dsh.getLastRow() - 1, 8).getValues().forEach(r => {
    if (String(r[0]).indexOf("DEMO|") === 0 || !(r[7] instanceof Date)) return;
    add("curr", Utilities.formatDate(r[7], "Asia/Kuwait", "yyyy-MM-dd HH:mm"), String(r[0]), r[3]); });
  if (sh_(SHEET_ACH)) rows_(SHEET_ACH).slice(1).forEach(r => add("ach", r[10], r[0], r[1]));
  if (sh_(SHEET_LEAVE)) rows_(SHEET_LEAVE).slice(1).forEach(r => add("lv", [r[10], r[14]].sort().pop(), r[0], r[1]));
  if (sh_(SHEET_SWAP)) rows_(SHEET_SWAP).slice(1).forEach(r => add("swap", r[1], r[0], r[2]));
  if (sh_(SHEET_STU)) rows_(SHEET_STU).slice(1).forEach(r => add("stu", [r[14], r[15]].sort().pop(), r[0], r[2]));
  if (sh_(SHEET_SUBS)) rows_(SHEET_SUBS).slice(1).forEach(r => { if (r[5] && r[6] === r[5]) add("subs", r[7], r[0], r[5]); });
  if (sh_(SHEET_GRADES)) rows_(SHEET_GRADES).slice(1).forEach(r => { if (String(r[0]).indexOf("DEMO:") !== 0) add("grd", r[9], r[3] + "|" + r[4], r[1]); });
  return items;
}
function markSeen(code, sec) {
  const me = head_(code), props = PropertiesService.getScriptProperties();
  const seen = json_(props.getProperty(seenKey_(me)), {}); seen[String(sec)] = nowText_();
  props.setProperty(seenKey_(me), JSON.stringify(seen)); return true;
}

/** تغيير اسم معلم في كل أوراق الشيت (يُشغَّل مرة واحدة من المحرر بعد تعديل الاسم في الكود) */
function renameTeacherOnce() {
  const OLD = "محمد فهد محمد فيلكاوي", NEW = "محمد فهد محمد الفيلكاوي";
  let n = 0;
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(sh => {
    n += sh.createTextFinder(OLD).matchEntireCell(false).matchCase(true).replaceAllWith(NEW);
  });
  const c = devCache_(); if (c) c.removeAll(["gate", "devmap"]);
  console.log("تم تعديل " + n + " خلية");
  return n;
}
