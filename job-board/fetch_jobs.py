# Fetches open roles from public Greenhouse/Ashby boards, extracts salary bands,
# remote/US eligibility and a resume-match score. Writes jobs.json.
import sys, json, re, html, urllib.request, concurrent.futures as cf
GH={"GitLab":"gitlab","Grafana Labs":"grafanalabs","Dropbox":"dropbox","Customer.io":"customerio","Huntress":"huntress","Bitwarden":"bitwarden","Brave Software":"brave","Affirm":"affirm","Canonical":"canonical","Vercel":"vercel","Nearform":"nearform"}
AB={"Zapier":"zapier","Supabase":"supabase","PostHog":"posthog","RevenueCat":"revenuecat","Kit (formerly ConvertKit)":"kit","Ashby":"ashby","Camunda":"camunda","Circle (circle.so)":"circle","Close":"close","Tremendous":"tremendous","Deel":"deel","Buffer":"buffer","1Password":"1password","Linear":"linear","Docker":"docker"}

# ---- Resume profile (Charles Olivar): React/TypeScript product frontend, growth experiments, a11y, ~7 yrs ----
TITLE_PTS=[(r"front.?end|\bui\b|web (engineer|developer)|react|javascript|typescript|design engineer",42),
           (r"full.?stack|product engineer|growth|experimentation|web platform",34),
           (r"software (engineer|developer)|\bengineer\b|developer",18)]
TITLE_NEG=[(r"ios|android|mobile",-22),(r"devops|\bsre\b|reliability|infrastructure|platform eng|security|detection|cloud",-18),
           (r"data (scien|eng|analy)|machine learning|\bml\b|\bai research|research",-20),(r"embedded|kernel|firmware|systems|database|\bdba\b|compiler",-25),
           (r"back.?end",-10),(r"\brust\b|\bgolang\b|\bgo\b|c\+\+|\bjava\b|\.net|\bphp\b|\bruby\b|python|elixir|scala|kotlin|swift",-12),
           (r"sales|solutions|support|customer|success|recruit|marketing|finance|legal|people|account|partner|counsel|program|product manager|designer|writer",-60)]
SENIOR=[(r"\bsenior\b|\bsr\.?\b",10,"Senior level"),(r"\bstaff\b",5,"Staff level"),(r"principal|distinguished",-4,None),(r"intern|junior|\bjr\b|associate|graduate|entry",-18,None),(r"manager|director|\bhead\b|\bvp\b|chief",-25,None)]
GAPS=[("Python",r"\bpython\b"),("Ruby",r"\bruby\b"),("Rust",r"\brust\b"),("Java",r"\bjava\b"),("Go",r"\bgolang\b"),("Kubernetes",r"kubernetes"),("AWS",r"\baws\b"),("SQL/Postgres",r"postgres|\bsql\b"),("Elixir",r"elixir"),("GraphQL",r"graphql")]
KW=[("React",r"\breact(\.js|js)?\b",8),("TypeScript",r"typescript",8),("JavaScript",r"javascript",3),("Next.js",r"next\.?js",3),("Node",r"node(\.js|js)?\b",2),
    ("Tailwind",r"tailwind",2),("Accessibility",r"accessib|wcag|\ba11y\b",5),("A/B testing",r"a/b test|experimentation|split test|feature flag",5),
    ("Design systems",r"design system|component librar",3),("Jest/Cypress",r"jest|cypress|playwright|testing library",1),("GraphQL",r"graphql",1)]
KW_NEG=[(r"\brust\b.{0,40}(required|must|experience)",-6),(r"\bc\+\+\b",-4),(r"\bkotlin\b|\bswift\b",-3)]

FULLY_REMOTE={"GitLab","Zapier","Supabase","Grafana Labs","PostHog","RevenueCat","Kit (formerly ConvertKit)","Customer.io","Ashby","Camunda","Huntress","Circle (circle.so)","Close","Tremendous","Deel","Buffer","Nearform","Linear","Bitwarden","Canonical","Docker"}
ONSITE=re.compile(r"hybrid|on-?site|in.office|office",re.I)
US=re.compile(r"\bamer\b|united states|\busa?\b|\bu\.s\.|namer|north america|americas|, (A[LKZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])\b|new york|san francisco|seattle|austin|boston|chicago|denver",re.I)
ANY=re.compile(r"anywhere|worldwide|global",re.I)
SAL=re.compile(r"\$\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])\s*(?:USD)?\s*(?:-|–|—|to|and)\s*\$?\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])")
def num(s):
    s=s.replace(",","").strip().lower()
    return float(s[:-1].strip())*1000 if s.endswith("k") else float(s)
def salary_from_text(t):
    best=None
    for m in SAL.finditer(t):
        a,b=num(m.group(1)),num(m.group(2))
        if 40000<=a<=700000 and a<=b<=900000:
            best=(int(a),int(b)); 
            if re.search(r"united states|\bus\b|usd|base|salary",t[max(0,m.start()-250):m.start()],re.I): return best
    return best
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"job-dashboard"}),timeout=90))
def strip(h): return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",html.unescape(html.unescape(h or ""))))
def score(title,dept,desc):
    t=title.lower(); why=[]; pts=0
    tp=0
    for r,p in TITLE_PTS:
        if re.search(r,t): tp=p; break
    pts+=tp
    if tp>=34: why.append("Frontend/product title")
    elif tp: why.append("Engineering title")
    for r,p in TITLE_NEG: 
        if re.search(r,t): pts+=p
    for r,p,lab in SENIOR:
        if re.search(r,t):
            pts+=p
            if lab: why.append(lab)
    d=desc.lower()
    hits=[]
    for n,r,p in KW:
        if re.search(r,d): pts+=p; hits.append(n)
    for r,p in KW_NEG:
        if re.search(r,d): pts+=p
    why+=hits[:4]
    gaps=[n for n,r in GAPS if re.search(r,d)][:4]
    return max(0,min(100,round(pts*100/80))), list(dict.fromkeys(why))[:5], gaps
def finish(c,title,loc,dept,url,posted,remote,desc,sal,country="",extra=""):
    ltxt=loc+" "+country+" "+extra
    rem=remote or bool(re.search(r"remote|home.?based|work from home|anywhere",loc,re.I)) or (c in FULLY_REMOTE and not ONSITE.search(loc))
    us=2 if US.search(ltxt) else 1 if ANY.search(ltxt) else 3 if re.fullmatch(r"\W*(remote|home.?based|remote.?first)?\W*",loc,re.I) else 0
    if not sal: sal=salary_from_text(desc)
    m,w,g=score(title,dept,desc)
    return dict(c=c,t=title,l=loc,d=dept,u=url,p=posted,rm=int(rem),us=us,sal=list(sal) if sal else None,m=m,w=w,g=g)
def gh(n,s):
    out=[]
    for j in get(f"https://boards-api.greenhouse.io/v1/boards/{s}/jobs?content=true")["jobs"]:
        desc=strip(j.get("content")); sal=None
        for r in j.get("pay_input_ranges") or []:
            if r.get("currency_type","USD")=="USD" and r.get("min_cents") and r.get("max_cents"):
                a,b=r["min_cents"]//100,r["max_cents"]//100
                if not sal or b>sal[1]: sal=(a,b)
        loc=(j.get("location") or {}).get("name","")
        out.append(finish(n,j["title"],loc,", ".join(x["name"] for x in j.get("departments",[])),j["absolute_url"],(j.get("first_published") or j.get("updated_at") or "")[:10],False,desc,sal))
    return out
def ab(n,s):
    out=[]
    for j in get(f"https://api.ashbyhq.com/posting-api/job-board/{s}?includeCompensation=true")["jobs"]:
        if j.get("isListed") is False: continue
        sal=None
        for c in ((j.get("compensation") or {}).get("summaryComponents") or []):
            if c.get("compensationType")=="Salary" and c.get("currencyCode","USD")=="USD" and c.get("minValue") and c.get("maxValue") and "YEAR" in str(c.get("interval","YEAR")).upper():
                sal=(int(c["minValue"]),int(c["maxValue"]))
        loc=j.get("location") or ""
        sec=" ".join(x if isinstance(x,str) else x.get("location","") for x in (j.get("secondaryLocations") or []))
        country=((j.get("address") or {}).get("postalAddress") or {}).get("addressCountry","") or ""
        remote=bool(j.get("isRemote")) or str(j.get("workplaceType","")).lower()=="remote"
        out.append(finish(n,j["title"],loc,j.get("department") or j.get("team") or "",j["jobUrl"],(j.get("publishedAt") or "")[:10],remote,j.get("descriptionPlain") or strip(j.get("descriptionHtml")),sal,country,sec))
    return out
jobs=[]
with cf.ThreadPoolExecutor(8) as ex:
    fs={ex.submit(gh,n,s):n for n,s in GH.items()}; fs.update({ex.submit(ab,n,s):n for n,s in AB.items()})
    for f,n in fs.items():
        try: r=f.result(); jobs+=r; print(n,len(r))
        except Exception as e: print("ERR",n,e)
if len(jobs)>=500: json.dump(jobs,open("jobs.json","w"),separators=(",",":"),ensure_ascii=False)
print(len(jobs),"jobs;",sum(1 for j in jobs if j["sal"]),"with salary;",sum(1 for j in jobs if j["rm"]),"remote;",sum(1 for j in jobs if j["us"]),"US/any/unclear")

if len(jobs)<500:  # a broken feed must never overwrite a good page
    sys.exit("Only %d jobs fetched; refusing to publish"%len(jobs))
