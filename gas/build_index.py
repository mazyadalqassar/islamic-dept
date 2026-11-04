#!/usr/bin/env python3
"""يبني gas/Index.html (نسخة الموقع التي يقدّمها Apps Script على حساب الوزارة) من index.html.

لماذا؟ HtmlService يعالج نص السكربتات المضمّنة قبل تقديمها فيُفسد بعضها
(مثل كسر "https://" داخل النصوص)، فنضع السكربت الرئيسي مرمّزًا بـ base64
ويُفكّ ويُشغَّل في المتصفح كما هو حرفيًّا.

الاستخدام:  python3 gas/build_index.py   ثم انسخ gas/Index.html إلى ملف Index في المشروع.
"""
import base64, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
s = (root / "index.html").read_text(encoding="utf-8")

# 1) لا حاجة لرابط الخادم الخارجي: الصفحة تتصل عبر google.script.run
s = s.replace('<script src="config.js"></script>\n', "")

# 2) فاحص التحديثات خاص بـ GitHub Pages
old = "if (!meta || !/^https?:/.test(location.protocol)) return;"
if old in s:
    s = s.replace(old, "if (!meta || !/^https?:/.test(location.protocol) || (window.google && google.script && google.script.run)) return;")

# 3) السكربت الرئيسي (الذي يبدأ بـ MOE_B64) يُرمَّز بـ base64
m = s.index("const MOE_B64")
st = s.rindex("<script>", 0, m)
en = s.index("</script>", m)
code = s[st + len("<script>"):en]
b64 = base64.b64encode(code.encode("utf-8")).decode("ascii")
loader = ('<script>(function(){var b="' + b64 + '";var bin=atob(b),u=new Uint8Array(bin.length);'
          'for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);var s=document.createElement("script");'
          's.text=new TextDecoder("utf-8").decode(u);document.body.appendChild(s);})();')
s = s[:st] + loader + s[en:]

out = root / "gas" / "Index.html"
out.write_text(s, encoding="utf-8")
print(f"wrote {out} ({len(s):,} chars)")
