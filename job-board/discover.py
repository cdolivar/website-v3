import re, json, urllib.request, urllib.parse, concurrent.futures as cf, time, sys
rows=json.load(open(sys.argv[1])); OUT=sys.argv[2]
UA={"User-Agent":"Mozilla/5.0 (job-dashboard discovery)"}
def req(u,t=12,limit=None):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t)
        b=r.read(limit) if limit else r.read()
        return r.geturl(), b.decode("utf-8","ignore")
    except Exception: return None,None
def jget(u,t=15):
    f,b=req(u,t)
    if b is None: return None
    try: return json.loads(b)
    except Exception: return None
BAD={"embed","v1","boards","jobs","job_board","job_app","api","static","assets","www","widget","careers","postings","j"}
SC={"gh":[r"greenhouse\.io/(?:v1/boards/|embed/job_board(?:/js)?\?for=|embed/job_app\?for=)?([A-Za-z0-9_\-]+)"],
    "lever":[r"jobs\.(?:eu\.)?lever\.co/([A-Za-z0-9_.\-]+)",r"api\.lever\.co/v0/postings/([A-Za-z0-9_.\-]+)"],
    "ashby":[r"jobs\.ashbyhq\.com/([A-Za-z0-9_.%\-]+)",r"posting-api/job-board/([A-Za-z0-9_.%\-]+)"]}
def scrape(text):
    out={}
    for ats,pats in SC.items():
        for p in pats:
            for m in re.finditer(p,text):
                s=m.group(1)
                if s.lower() not in BAD and len(s)>1: out.setdefault(ats,s); break
            if ats in out: break
    return out
def norm(s): return re.sub(r"[^a-z0-9]","",s.lower())
def domain_label(url):
    h=urllib.parse.urlparse(url).netloc.lower().replace("www.","")
    p=h.split("."); return p[-2] if len(p)>=2 else h
def guesses(r):
    t=r["title"]; g=[r["file"],norm(t),re.sub(r"[^a-z0-9]+","-",t.lower()).strip("-"),domain_label(r.get("website","http://x.com"))]
    seen=[]; [seen.append(x) for x in g if x and x not in seen]; return seen[:4]
def list_jobs(ats,slug):
    if ats=="gh":
        d=jget(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"); return d.get("jobs") if isinstance(d,dict) else None
    if ats=="ashby":
        d=jget(f"https://api.ashbyhq.com/posting-api/job-board/{slug}"); return d.get("jobs") if isinstance(d,dict) else None
    if ats=="lever":
        d=jget(f"https://api.lever.co/v0/postings/{slug}?mode=json"); return d if isinstance(d,list) else None
def valid(r,ats,slug,jobs):
    t=norm(r["title"]); tl=r["title"].lower()
    if ats=="gh":
        d=jget(f"https://boards-api.greenhouse.io/v1/boards/{slug}")
        n=norm((d or {}).get("name","")) if isinstance(d,dict) else ""
        return bool(n) and len(t)>=3 and (n==t or (len(n)>=4 and n in t) or (len(t)>=4 and t in n))
    sample=" ".join(((j.get("descriptionPlain") or "")[:4000]) for j in jobs[:8]).lower()
    return len(tl)>=3 and tl in sample
def work(r):
    found={}; res=[]
    blob=""
    for u in [r.get("careers_url",""),r.get("website","")]:
        if u:
            f,txt=req(u); blob+=" "+(f or "")+" "+(txt or "")
    for ats,slug in scrape(blob).items(): found[(ats,slug)]="scrape"
    for s in guesses(r):
        for ats in ("gh","ashby","lever"): found.setdefault((ats,s),"guess")
    for (ats,slug),src in found.items():
        jobs=list_jobs(ats,slug)
        if not jobs: continue
        if src=="guess" and not valid(r,ats,slug,jobs): continue
        res.append(dict(ats=ats,slug=slug,src=src,n=len(jobs)))
    return r,res
out=[]; t0=time.time()
with cf.ThreadPoolExecutor(28) as ex:
    for i,(r,res) in enumerate(ex.map(work,rows),1):
        if res:
            best=sorted(res,key=lambda x:(x["src"]!="scrape",-x["n"]))[0]
            out.append(dict(title=r["title"],file=r["file"],website=r.get("website",""),careers=r.get("careers_url",""),size=r.get("company_size"),policy=r.get("remote_policy"),region=r.get("region"),tech=r.get("technologies"),**best))
        if i%100==0: print(i,len(out),round(time.time()-t0),"s",flush=True)
# dedupe by (ats,slug)
seen=set(); fin=[]
for o in out:
    k=(o["ats"],o["slug"].lower())
    if k in seen: continue
    seen.add(k); fin.append(o)
json.dump(fin,open(OUT,"w"),indent=0)
print("DONE",len(rows),"companies ->",len(fin),"with a live feed;",sum(1 for o in fin if o["src"]=="scrape"),"from page scrape")
