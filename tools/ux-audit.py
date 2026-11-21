import sys, json, os, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
ROOT=os.environ.get("NOAN_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=sys.argv[1]; MODE=sys.argv[2] if len(sys.argv)>2 else "http"
import glob
_ax=glob.glob(r"C:\Users\User\Downloads\teacher-studio\shared\vendor\axe-core\axe*.min.js")
AXE=open(_ax[0],encoding="utf8").read() if _ax else None
os.makedirs(OUT,exist_ok=True)
PAGES=["index.html","training/index.html","training/s1.html","training/s2.html","library/index.html","library/approval.html","library/rules.html","contest/index.html","start/index.html","about/index.html","class/index.html","showcase/index.html","studio/index.html","studio/compat.html","guide/index.html","iamodu/index.html","ai/index.html","terms/index.html","how-ai-answers/index.html","training/s2-deck.html","ops/index.html","ops/log/index.html","ops/sessions/index.html","ops/handover/index.html","404.html"]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
handler=functools.partial(Q,directory=ROOT)
srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),handler); port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{port}/" if MODE=="http" else "file:///"+ROOT.replace("\\","/")+"/"
res={}
JS="""()=>{const out={overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,small:0,smallEx:[],noAlt:0,h1:document.querySelectorAll('h1').length,kw:getComputedStyle(document.body).wordBreak};
document.querySelectorAll('a,button,input,select,summary,[role=button]').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height&&(r.height<40||r.width<40)&&getComputedStyle(e).visibility!='hidden'){out.small++;if(out.smallEx.length<4)out.smallEx.push((e.textContent||e.tagName).trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height))}});
out.noAlt=[...document.images].filter(i=>!i.hasAttribute('alt')).length;
out.brokenImg=[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'));
out.bodyFont=getComputedStyle(document.body).fontSize;return out}"""
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome",args=["--mute-audio"])
    for vp,(w,h) in {"phone":(390,844),"desk":(1440,900)}.items():
        ctx=b.new_context(viewport={"width":w,"height":h},is_mobile=(vp=="phone"),has_touch=(vp=="phone"),service_workers="block")
        for pg in PAGES:
            if vp=="desk" and MODE=="file": continue
            page=ctx.new_page(); errs=[];reqs=[];fails=[]
            page.on("console",lambda m:errs.append(m.text) if m.type=="error" else None)
            page.on("pageerror",lambda e:errs.append("PAGEERR "+str(e)))
            page.on("request",lambda r:reqs.append(r.url))
            page.on("requestfailed",lambda r:fails.append(r.url))
            try: page.goto(base+pg,wait_until="load",timeout=20000)
            except Exception as e: errs.append("GOTO "+str(e)[:100])
            page.wait_for_timeout(700)
            name=pg.replace("/","_").replace(".html","")+"-"+vp
            if MODE=="http": page.screenshot(path=f"{OUT}/{name}.png",full_page=True)
            m=page.evaluate(JS)
            ext=[u for u in reqs if not (u.startswith(base) or u.startswith("data:") or u.startswith("blob:") or u.startswith("file:"))]
            ax=None
            if AXE and MODE=='http':
                page.evaluate(AXE)
                r=page.evaluate("axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length})))")
                ax=r
            res[f"{pg}|{vp}"]=dict(err=errs[:5],ext=ext,failed=[f for f in fails],m=m,axe=ax,nreq=len(reqs))
            page.close()
        ctx.close()
    b.close()
json.dump(res,open(f"{OUT}/audit-{MODE}.json","w",encoding="utf8"),ensure_ascii=False,indent=1)
for k,v in res.items():
    ax=",".join(f"{a['id']}({a['impact'][0]}{a['n']})" for a in (v['axe'] or []))
    print(k,"ERR",len(v['err']),"EXT",len(v['ext']),"FAIL",len(v['failed']),"ovf",v['m']['overflow'],"small",v['m']['small'],"AX",ax, v['err'][:1], v['m'].get('brokenImg'))
