# Usage: python3 fetch_jobs.py && python3 build.py  -> writes index.html
import csv, json, datetime, sys
rows=list(csv.reader(open("companies.csv",encoding="utf-8")))
hdr=rows[0]; cos=[]
jobs=json.load(open("jobs.json"))
have={j["c"] for j in jobs}
for r in rows[1:]:
    if not r or not r[0].strip(): continue
    d=dict(zip(hdr,r))
    cos.append(dict(n=d["Company"],cat=d["Category"],model=d["Remote model"],site=d["Career site"],stack=d["What they build / stack"],notes=d["Hiring regions & notes"],feed=d["Company"] in have,grp="added" if d["Source"].startswith("Public job feed") else "orig",sz=(d.get("Size") or "").strip()))
html=open("template.html",encoding="utf-8").read()
html=html.replace("/*JOBS*/[]",json.dumps(jobs,separators=(",",":"),ensure_ascii=True).replace("</","<\\/"))
html=html.replace("/*COMPANIES*/[]",json.dumps(cos,separators=(",",":"),ensure_ascii=True).replace("</","<\\/"))
html=html.replace("__DATE__",datetime.date.today().isoformat())
html="".join(c if ord(c)<128 else "&#%d;"%ord(c) for c in html) if False else html
a=html.index("<script>")
head,tail=html[:a],html[a:]
head="".join(c if ord(c)<128 else "&#x%x;"%ord(c) for c in head)
tail="".join(c if ord(c)<128 else ("\\u%04x"%ord(c) if ord(c)<0x10000 else "\\u%04x\\u%04x"%(0xd800+((ord(c)-0x10000)>>10),0xdc00+((ord(c)-0x10000)&0x3ff))) for c in tail)
html=head+tail
if "--standalone" in sys.argv:
    # Wrap for hosting outside the artifact viewer: real head, noindex, and the small reset the viewer normally adds.
    k=html.index('<div class="wrap">')
    html=("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
          "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n"
          "<meta name=\"robots\" content=\"noindex, nofollow\">\n"
          "<style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}[hidden]{display:none!important}</style>\n"
          +html[:k]+"\n</head>\n<body>\n"+html[k:]+"\n</body>\n</html>\n")
open("index.html","w",encoding="utf-8").write(html)
print(len(jobs),"jobs",len(cos),"companies")
