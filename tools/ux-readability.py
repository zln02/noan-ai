# 가독성 측정 — 글자 크기·줄 간격·한 줄 글자 수·대비·keep-all·제목 외톨이 글자·누름 영역·스크린샷 축소율
# 사용: PYTHONUTF8=1 py tools/ux-readability.py <out_dir> [page ...]
# 로컬 정적 서버로 띄워 브라우저 하나로 차례대로 잰다 (동시 실행 없음).
import sys, json, os, threading, http.server, socketserver, functools, glob
from playwright.sync_api import sync_playwright
ROOT = os.environ.get("NOAN_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]
PAGES = sys.argv[2:] or ["index.html", "iamodu/index.html", "terms/index.html", "start/index.html",
  "training/index.html", "library/index.html", "library/approval.html",
  "library/rules.html", "contest/index.html", "about/index.html", "class/index.html",
  "showcase/index.html", "studio/index.html", "ai/index.html", "how-ai-answers/index.html",
  "guide/index.html", "404.html"]
VPS = {"p360": (360, 780), "p390": (390, 844), "t768": (768, 1024), "d1366": (1366, 768), "d1440": (1440, 900)}
SHOTS = os.environ.get("SHOTS", "")  # 예: "p390,d1440"
_ax = glob.glob(r"C:\Users\User\Downloads\teacher-studio\shared\vendor\axe-core\axe*.min.js")
AXE = open(_ax[0], encoding="utf8").read() if _ax else None
os.makedirs(OUT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=ROOT))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{port}/"

JS = r"""() => {
function rgb(s){const m=s.match(/[\d.]+/g);if(!m)return null;return [ +m[0], +m[1], +m[2], m.length>3? +m[3]:1 ];}
function lum(c){const a=c.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
function bgOf(el){let layers=[];let e=el;while(e&&e.nodeType===1){const cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage!=='none'&&/url\(/.test(cs.backgroundImage))return null;const c=rgb(cs.backgroundColor);if(c&&c[3]>0){layers.push(c);if(c[3]>=1)break;}e=e.parentElement;}
 let out=[255,255,255];for(let i=layers.length-1;i>=0;i--){const c=layers[i];out=[0,1,2].map(k=>c[k]*c[3]+out[k]*(1-c[3]));}return out;}
function contrast(fg,bg){const f=fg[3]<1?[0,1,2].map(k=>fg[k]*fg[3]+bg[k]*(1-fg[3])):fg;const a=lum(f),b=lum(bg);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);}
function vis(el){const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05;}
function sel(el){let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;else if(el.className&&typeof el.className==='string')s+='.'+el.className.trim().split(/\s+/).slice(0,2).join('.');return s;}
const HANG=/[\uac00-\ud7a3]/g;
const blocks=[];const seen=new Set();
const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
let n;while(n=tw.nextNode()){const t=n.nodeValue.replace(/\s+/g,' ').trim();if(t.length<2)continue;let el=n.parentElement;if(!el||el.closest('script,style,noscript,svg,[aria-hidden=true],.sr-only,.skip'))continue;
 const blk=el.closest('p,li,dd,dt,td,th,figcaption,blockquote,h1,h2,h3,h4,h5,h6,summary,label,button,a,small,span,b,strong,div')||el;
 if(seen.has(el))continue;seen.add(el);if(!vis(el))continue;
 const cs=getComputedStyle(el);const fs=parseFloat(cs.fontSize);const lh=cs.lineHeight==='normal'?fs*1.2:parseFloat(cs.lineHeight);
 const fg=rgb(cs.color);const bg=bgOf(el);const cr=bg?contrast(fg,bg):null;
 const isHead=!!el.closest('h1,h2,h3,h4,h5,h6');const isUI=!!el.closest('button,a,nav,label,summary,.btn,[role=button],input,select');
 blocks.push({t:t.slice(0,40),len:t.length,ko:(t.match(HANG)||[]).length,fs,lh:lh/fs,cr,bold:+cs.fontWeight>=600,head:isHead,ui:isUI,wb:cs.wordBreak,sel:sel(el)});}
// line length: paragraph-like blocks
const para=[];document.querySelectorAll('p,li,dd,blockquote,figcaption,td').forEach(el=>{if(!vis(el)||el.closest('nav,header,footer,[aria-hidden=true]'))return;const t=el.innerText.replace(/\s+/g,' ').trim();if((t.match(HANG)||[]).length<15)return;
 const cs=getComputedStyle(el);const fs=parseFloat(cs.fontSize);const lh=cs.lineHeight==='normal'?fs*1.2:parseFloat(cs.lineHeight);
 const w=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const h=el.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);const lines=Math.max(1,Math.round(h/lh));
 para.push({sel:sel(el),fs,lh:lh/fs,em:w/fs,lines,cpl:lines>1?t.length/lines:null,t:t.slice(0,30)});});
// tap targets
const taps=[];document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[tabindex="0"],wa-details').forEach(el=>{if(!vis(el))return;const r=el.getBoundingClientRect();
 const p=el.parentElement;const inline=el.tagName==='A'&&getComputedStyle(el).display==='inline'&&p&&p.closest('p,li,span,small,dd')&&p.innerText.trim().length>el.innerText.trim().length+4;
 if(r.height<44||r.width<44)taps.push({sel:sel(el),t:(el.innerText||el.getAttribute('aria-label')||el.tagName).trim().slice(0,18),w:Math.round(r.width),h:Math.round(r.height),inline});});
// heading orphans (last line holds a single Hangul syllable)
const orph=[];document.querySelectorAll('h1,h2,h3,h4,.card-title,summary,dt').forEach(h=>{if(!vis(h))return;const txt=h.innerText.trim();if(txt.length<4)return;const r=document.createRange();const nodes=[];const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let x;while(x=w.nextNode()){if(x.parentElement.closest('[aria-hidden=true],.sr-only'))continue;nodes.push(x);}
 const chars=[];nodes.forEach(nd=>{for(let i=0;i<nd.length;i++){if(/\S/.test(nd.nodeValue[i])){r.setStart(nd,i);r.setEnd(nd,i+1);const rc=r.getClientRects()[0];if(rc)chars.push({c:nd.nodeValue[i],y:Math.round(rc.top)})}}});
 if(chars.length<4)return;const lastY=chars[chars.length-1].y;const ys=new Set(chars.map(c=>c.y));if(ys.size<2)return;const onLast=chars.filter(c=>Math.abs(c.y-lastY)<4);
 const ko=onLast.filter(c=>/[\uac00-\ud7a3]/.test(c.c));if(ko.length===1&&onLast.length<=2)orph.push({sel:sel(h),t:txt.slice(0,30)});});
// images (screenshots)
const imgs=[];document.querySelectorAll('img').forEach(im=>{if(!vis(im)||!im.naturalWidth)return;const r=im.getBoundingClientRect();if(r.width<120)return;const src=im.getAttribute('src')||'';if(/logo|icon|hero/.test(src))return;
 imgs.push({src:src.split('/').slice(-2).join('/'),nw:im.naturalWidth,dw:Math.round(r.width),scale:+(r.width/im.naturalWidth).toFixed(2),zoom:!!(im.closest('a,button,[data-zoom],.zoomable')||im.style.cursor==='zoom-in'||getComputedStyle(im).cursor==='zoom-in')});});
return {blocks,para,taps,orph,imgs,ovf:document.documentElement.scrollWidth-document.documentElement.clientWidth,bodyWB:getComputedStyle(document.body).wordBreak};}"""

def summarize(m):
    B = m["blocks"]
    body = [b for b in B if not b["head"] and not b["ui"] and b["ko"] >= 6]
    tot = sum(b["len"] for b in body) or 1
    def wmed(vals):
        vals = sorted(vals); acc = 0; half = sum(w for _, w in vals) / 2
        for v, w in vals:
            acc += w
            if acc >= half: return v
        return None
    fsmed = wmed([(b["fs"], b["len"]) for b in body]) if body else None
    lt16 = sum(b["len"] for b in body if b["fs"] < 15.5) / tot
    lt14 = [b for b in B if b["fs"] < 13.5 and b["ko"] >= 4]
    lhs = [round(b["lh"], 2) for b in body]
    lhbad = sum(b["len"] for b in body if b["lh"] < 1.45 or b["lh"] > 1.85) / tot
    lowc = []
    for b in B:
        if b["cr"] is None: continue
        large = b["fs"] >= 24 or (b["fs"] >= 18.66 and b["bold"])
        need = 3 if large else 4.5
        if b["cr"] < need: lowc.append(dict(t=b["t"][:20], sel=b["sel"], cr=round(b["cr"], 2), fs=b["fs"]))
    nokeep = sum(b["len"] for b in B if b["ko"] >= 4 and b["wb"] != "keep-all") / (sum(b["len"] for b in B if b["ko"] >= 4) or 1)
    P = m["para"]; cpls = sorted(p["cpl"] for p in P if p["cpl"])
    ems = sorted(p["em"] for p in P)
    def pct(a, q): return round(a[min(len(a) - 1, int(len(a) * q))], 1) if a else None
    taps = [t for t in m["taps"] if not t["inline"]]
    return dict(fs_med=fsmed, pct_lt16=round(lt16 * 100, 1), n_lt14=len(lt14), lt14=[dict(t=b["t"][:18], sel=b["sel"], fs=b["fs"]) for b in lt14[:6]],
        lh_min=min(lhs) if lhs else None, lh_max=max(lhs) if lhs else None, pct_lh_off=round(lhbad * 100, 1),
        cpl_med=pct(cpls, .5), cpl_p90=pct(cpls, .9), em_p90=pct(ems, .9), em_max=round(ems[-1], 1) if ems else None,
        n_lowc=len(lowc), lowc=lowc[:6], pct_nokeep=round(nokeep * 100, 1), n_orph=len(m["orph"]), orph=m["orph"][:6],
        n_tap=len(taps), taps=taps[:8], imgs=m["imgs"][:10], ovf=m["ovf"])

res = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--mute-audio"])
    for vp, (w, h) in VPS.items():
        mob = w < 768
        ctx = b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob, service_workers="block", reduced_motion="reduce")
        for pg in PAGES:
            page = ctx.new_page(); ext = []
            page.on("request", lambda r: ext.append(r.url) if not (r.url.startswith(base) or r.url.startswith("data:") or r.url.startswith("blob:")) else None)
            try: page.goto(base + pg, wait_until="load", timeout=20000)
            except Exception as e: print("GOTO", pg, e)
            page.wait_for_timeout(600)
            m = page.evaluate(JS)
            s = summarize(m); s["ext"] = ext
            if AXE and vp in ("p390", "d1440"):
                page.evaluate(AXE)
                s["axe"] = page.evaluate("axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length})))")
            if vp in SHOTS.split(","):
                page.screenshot(path=f"{OUT}/{pg.replace('/', '_').replace('.html', '')}-{vp}.png", full_page=True)
            res[f"{pg}|{vp}"] = s
            page.close()
        ctx.close()
    b.close()
json.dump(res, open(f"{OUT}/readability.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{'page|vp':34} fs  <16% <14 lh(min-max) off% cpl50 cpl90 em90 lowC nokeep orph tap ovf ext axe-serious")
for k, s in res.items():
    ax = sum(a["n"] for a in s.get("axe") or [] if a["impact"] in ("serious", "critical"))
    print(f"{k:34} {s['fs_med']} {s['pct_lt16']:5} {s['n_lt14']:3} {s['lh_min']}-{s['lh_max']} {s['pct_lh_off']:5} {s['cpl_med']} {s['cpl_p90']} {s['em_p90']} {s['n_lowc']:3} {s['pct_nokeep']:5} {s['n_orph']:3} {s['n_tap']:3} {s['ovf']} {len(s['ext'])} {ax if 'axe' in s else '-'}")
